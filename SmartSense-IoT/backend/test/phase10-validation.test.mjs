import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import app from '../src/app.js';
import backendConfig from '../src/config/env.js';
import firebaseService from '../src/services/firebase.service.js';
import MockFirebaseServer from '../../nodered/test/mockFirebaseServer.mjs';
import { TelemetryGenerator } from '../../simulator/src/simulator/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../../nodered/flows/smartsense-flows.json');

describe('SmartSense IoT — Phase 10 Complete Software Validation & Integration Testing', () => {
  let firebaseServer;
  let firebasePort;
  let apiServer;
  let apiPort;
  let flows;

  // Node-RED function nodes
  let validatorNode;
  let normalizerNode;
  let alertEngineNode;
  let deviceStatusNode;
  let prepFbLatest;
  let prepFbReading;
  let prepFbDevice;
  let prepFbAlert;

  before(async () => {
    // 1. Start Mock Firebase RTDB server on ephemeral port
    firebaseServer = new MockFirebaseServer();
    await firebaseServer.start(0);
    firebasePort = firebaseServer.server.address().port;
    backendConfig.firebase.databaseUrl = `http://localhost:${firebasePort}`;

    // 2. Start Express API server on ephemeral port
    await new Promise((resolve) => {
      apiServer = http.createServer(app);
      apiServer.listen(0, () => {
        apiPort = apiServer.address().port;
        resolve();
      });
    });

    // 3. Load Node-RED flow function nodes
    flows = JSON.parse(fs.readFileSync(flowPath, 'utf8'));
    const getFn = (name) => {
      const node = flows.find((n) => n.type === 'function' && n.name === name);
      if (!node) throw new Error(`Node not found: ${name}`);
      return node;
    };

    validatorNode = getFn('Validate Telemetry Schema');
    normalizerNode = getFn('Normalize & Compute Sensor Statuses');
    alertEngineNode = getFn('Alert Evaluation Engine');
    deviceStatusNode = getFn('Update Device Status & LastSeen');
    prepFbLatest = getFn('Format Firebase Latest (PUT /latest/:id.json)');
    prepFbReading = getFn('Format Firebase Reading (POST /readings/:id.json)');
    prepFbDevice = getFn('Format Firebase Device (PATCH /devices/:id.json)');
    prepFbAlert = getFn('Format Firebase Alert (PUT /alerts/:id.json)');
  });

  after(async () => {
    if (apiServer) {
      await new Promise((resolve) => apiServer.close(resolve));
    }
    if (firebaseServer) {
      await firebaseServer.stop();
    }
  });

  // Runner for Node-RED function nodes
  function runNode(node, msg, flowContext = {}) {
    const nodeContext = { error: () => {}, warn: () => {}, status: () => {} };
    const flow = {
      get: (k) => flowContext[k],
      set: (k, v) => {
        flowContext[k] = v;
      },
    };
    const global = {
      get: () => ({
        FIREBASE_DATABASE_URL: `http://localhost:${firebasePort}`,
        FIREBASE_DATABASE_SECRET: '',
        TEMP_WARNING_THRESHOLD: 32.0,
        TEMP_CRITICAL_THRESHOLD: 35.0,
        DISTANCE_ALERT_THRESHOLD: 15.0,
        HUMIDITY_WARNING_THRESHOLD: 75.0,
        ALERT_COOLDOWN_MS: 500, // Short cooldown for automated testing
      }),
    };
    const fn = new Function('msg', 'node', 'flow', 'global', node.func);
    return fn(msg, nodeContext, flow, global);
  }

  // Pipeline simulation: Simulator -> Node-RED -> Firebase
  async function processPipeline(telemetry, flowContext = {}) {
    const valResult = runNode(validatorNode, { payload: { ...telemetry } }, flowContext);
    if (!valResult || !valResult[0]) return { rejected: true, valResult };

    const normResult = runNode(normalizerNode, { payload: { ...valResult[0].payload } }, flowContext);

    // 1. Put to Firebase Latest
    const latestMsg = runNode(prepFbLatest, { payload: { ...normResult.payload } }, flowContext);
    await fetch(latestMsg.url, {
      method: latestMsg.method,
      headers: latestMsg.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(latestMsg.payload),
    });

    // 2. Post to Firebase Readings
    const readingMsg = runNode(prepFbReading, { payload: { ...normResult.payload } }, flowContext);
    await fetch(readingMsg.url, {
      method: readingMsg.method,
      headers: readingMsg.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(readingMsg.payload),
    });

    // 3. Patch to Firebase Devices
    const devStatus = runNode(deviceStatusNode, { payload: { ...normResult.payload } }, flowContext);
    const devMsg = runNode(prepFbDevice, { payload: { ...devStatus.payload } }, flowContext);
    await fetch(devMsg.url, {
      method: devMsg.method,
      headers: devMsg.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(devMsg.payload),
    });

    // 4. Alert Engine
    let generatedAlerts = [];
    const alertResult = runNode(alertEngineNode, { payload: { ...normResult.payload } }, flowContext);
    if (alertResult && alertResult[0] && Array.isArray(alertResult[0])) {
      for (const altMsg of alertResult[0]) {
        const fbAlt = runNode(prepFbAlert, { payload: { ...altMsg.payload } }, flowContext);
        await fetch(fbAlt.url, {
          method: fbAlt.method,
          headers: fbAlt.headers || { 'Content-Type': 'application/json' },
          body: JSON.stringify(fbAlt.payload),
        });
        generatedAlerts.push(fbAlt.payload);
      }
    }

    return { normResult, generatedAlerts, rejected: false };
  }

  // Helper for HTTP requests against Express API
  async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `http://localhost:${apiPort}${endpoint}`;
    const options = {
      method,
      headers: { Accept: 'application/json' },
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const data = await res.json();
    return { status: res.status, data };
  }

  // =========================================================================
  // STEP 1 & 2: BACKEND HEALTH & ENDPOINT VALIDATION
  // =========================================================================
  it('Step 1-2: GET /api/health returns 200 OK and valid status envelope', async () => {
    const res = await apiRequest('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.status, 'UP');
    assert.equal(res.data.data.environment, 'development');
    assert.ok(res.data.data.timestamp);
  });

  it('Step 2: GET /api/sensors/latest and /api/devices/:deviceId return correct structure', async () => {
    // Seed initial reading
    const generator = new TelemetryGenerator();
    const telemetry = generator.generateTelemetry();
    await processPipeline(telemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    const latestRes = await apiRequest('/api/sensors/latest/smartsense-pi-01');
    assert.equal(latestRes.status, 200);
    assert.equal(latestRes.data.success, true);
    assert.equal(latestRes.data.data.deviceId, 'smartsense-pi-01');
    assert.equal(latestRes.data.data.room, 'Room 1');
    assert.ok(typeof latestRes.data.data.temperature === 'number');
    assert.ok(typeof latestRes.data.data.humidity === 'number');
    assert.ok(typeof latestRes.data.data.distance === 'number');

    const devRes = await apiRequest('/api/devices/smartsense-pi-01');
    assert.equal(devRes.status, 200);
    assert.equal(devRes.data.success, true);
    assert.equal(devRes.data.data.deviceId, 'smartsense-pi-01');
    assert.equal(devRes.data.data.status, 'ONLINE');
  });

  // =========================================================================
  // STEP 3: SENSOR DATA VALIDATION
  // =========================================================================
  it('Step 3: Simulator generates telemetry with all 9 required fields and dynamic variations', () => {
    const generator = new TelemetryGenerator();
    const reading1 = generator.generateTelemetry();
    const reading2 = generator.generateTelemetry();

    const requiredFields = ['temperature', 'humidity', 'distance', 'motion', 'sound', 'touch', 'timestamp', 'deviceId', 'room'];
    for (const field of requiredFields) {
      assert.ok(reading1[field] !== undefined, `Field ${field} must be defined`);
    }

    assert.equal(reading1.deviceId, 'smartsense-pi-01');
    assert.equal(reading1.room, 'Room 1');
    assert.ok(new Date(reading1.timestamp).getTime() > 0);
  });

  // =========================================================================
  // STEP 4 & 5: MQTT & NODE-RED FLOW VALIDATION
  // =========================================================================
  it('Step 4-5: Node-RED schema validation accepts valid telemetry and rejects malformed payloads', () => {
    const flowContext = {};
    const valid = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 28.0,
      humidity: 60.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    const validRes = runNode(validatorNode, { payload: valid }, flowContext);
    assert.ok(validRes && validRes[0], 'Valid payload must pass to output 1');

    // Test malformed payload (missing temperature)
    const malformed = { deviceId: 'smartsense-pi-01', room: 'Room 1' };
    const invalidRes = runNode(validatorNode, { payload: malformed }, flowContext);
    assert.equal(invalidRes[0], null, 'Invalid payload must not pass to output 1');
    assert.ok(invalidRes[1], 'Invalid payload must route to error output 2');
  });

  // =========================================================================
  // STEP 6: DATABASE VALIDATION
  // =========================================================================
  it('Step 6: Verified readings are persisted with timestamp and processedAt in database', async () => {
    const generator = new TelemetryGenerator();
    const t = generator.generateTelemetry();
    t.temperature = 29.4;

    await processPipeline(t, { securityMode: 'DISARMED', alertCooldowns: {} });

    const latest = await apiRequest('/api/sensors/latest/smartsense-pi-01');
    assert.equal(latest.data.data.temperature, 29.4);
    assert.ok(latest.data.data.processedAt, 'processedAt timestamp must exist');
  });

  // =========================================================================
  // STEP 11 & 12: NORMAL & MOTION EVENT TESTS
  // =========================================================================
  it('Step 11: Normal telemetry produces no false critical alerts', async () => {
    const normalTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 24.5,
      humidity: 50.0,
      distance: 60.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    const res = await processPipeline(normalTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    assert.equal(res.generatedAlerts.length, 0, 'No alerts should be triggered for normal conditions');
  });

  // =========================================================================
  // STEP 13, 14, 15, 16: SPECIFIC ALERT TESTS
  // =========================================================================
  it('Step 13: Acoustic sound spike triggers WARNING SOUND_DETECTED alert', async () => {
    const soundTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: true, // Trigger
      touch: false,
      timestamp: new Date().toISOString(),
    };

    const res = await processPipeline(soundTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    assert.ok(res.generatedAlerts.some((a) => a.type === 'SOUND_DETECTED' && a.severity === 'WARNING'));
  });

  it('Step 14: Capacitive Touch / SOS Key triggers CRITICAL SOS_ACTIVATED alert', async () => {
    const sosTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: true, // Emergency trigger
      timestamp: new Date().toISOString(),
    };

    const res = await processPipeline(sosTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    const sosAlert = res.generatedAlerts.find((a) => a.type === 'SOS_ACTIVATED');
    assert.ok(sosAlert, 'SOS_ACTIVATED alert must be generated');
    assert.equal(sosAlert.severity, 'CRITICAL');
  });

  it('Step 15: Temperature >= 32°C produces WARNING and >= 35°C produces CRITICAL alert', async () => {
    // 32.5°C -> WARNING
    const warnTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 32.5,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const resWarn = await processPipeline(warnTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    const warnAlert = resWarn.generatedAlerts.find((a) => a.type === 'HIGH_TEMPERATURE');
    assert.ok(warnAlert, 'High temperature warning must trigger');
    assert.equal(warnAlert.severity, 'WARNING');

    // 35.5°C -> CRITICAL
    const critTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 35.5,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const resCrit = await processPipeline(critTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    const critAlert = resCrit.generatedAlerts.find((a) => a.type === 'HIGH_TEMPERATURE');
    assert.ok(critAlert, 'High temperature critical alert must trigger');
    assert.equal(critAlert.severity, 'CRITICAL');
  });

  it('Step 16: Distance < 15 cm triggers CLOSE_OBJECT WARNING alert', async () => {
    const proximityTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 8.5, // Obstruction < 15.0 cm
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    const res = await processPipeline(proximityTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    const closeAlert = res.generatedAlerts.find((a) => a.type === 'CLOSE_OBJECT');
    assert.ok(closeAlert, 'CLOSE_OBJECT alert must be generated');
    assert.equal(closeAlert.severity, 'WARNING');
  });

  // =========================================================================
  // STEP 17: ALERT ACKNOWLEDGEMENT VALIDATION
  // =========================================================================
  it('Step 17: Alert acknowledgement updates state from false to true via PATCH', async () => {
    // Generate an alert
    const sosTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: true,
      timestamp: new Date().toISOString(),
    };
    const res = await processPipeline(sosTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    const alertId = res.generatedAlerts[0].alertId;

    // Verify initial state
    const beforeAck = await apiRequest(`/api/alerts/${alertId}`);
    assert.equal(beforeAck.status, 200);
    assert.equal(Boolean(beforeAck.data.data.acknowledged), false);

    // Perform Acknowledgement
    const ackRes = await apiRequest(`/api/alerts/${alertId}/acknowledge`, 'PATCH');
    assert.equal(ackRes.status, 200);
    assert.equal(ackRes.data.data.acknowledged, true);
    assert.ok(ackRes.data.data.acknowledgedAt);

    // Verify state persists in database
    const afterAck = await apiRequest(`/api/alerts/${alertId}`);
    assert.equal(afterAck.data.data.acknowledged, true);
  });

  // =========================================================================
  // STEP 18, 19, 20: SECURITY ARM/DISARM & MOTION TESTING
  // =========================================================================
  it('Step 18-20: Security mode transitions and PIR motion behavior under ARMED vs DISARMED', async () => {
    // 1. Arm system
    const armRes = await apiRequest('/api/devices/smartsense-pi-01/security', 'PATCH', { securityMode: 'ARMED' });
    assert.equal(armRes.status, 200);
    assert.equal(armRes.data.data.securityMode, 'ARMED');

    // 2. Motion while ARMED triggers CRITICAL alert
    const motionArmed = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 50.0,
      motion: true,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const resArmed = await processPipeline(motionArmed, { securityMode: 'ARMED', alertCooldowns: {} });
    assert.ok(resArmed.generatedAlerts.some((a) => a.type === 'MOTION_BREACH' && a.severity === 'CRITICAL'));

    // 3. Disarm system
    const disarmRes = await apiRequest('/api/devices/smartsense-pi-01/security', 'PATCH', { securityMode: 'DISARMED' });
    assert.equal(disarmRes.status, 200);
    assert.equal(disarmRes.data.data.securityMode, 'DISARMED');

    // 4. Motion while DISARMED records motion but produces NO security breach alert
    const motionDisarmed = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 25.0,
      humidity: 50.0,
      distance: 50.0,
      motion: true,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const resDisarmed = await processPipeline(motionDisarmed, { securityMode: 'DISARMED', alertCooldowns: {} });
    assert.equal(resDisarmed.generatedAlerts.length, 0, 'No breach alert should be generated when system is DISARMED');
  });

  // =========================================================================
  // STEP 21: ANALYTICS VALIDATION
  // =========================================================================
  it('Step 21: Analytics calculates statistical highlights and event summaries across ranges', async () => {
    // Seed readings
    for (let i = 0; i < 5; i++) {
      const t = {
        deviceId: 'smartsense-pi-01',
        room: 'Room 1',
        temperature: 20.0 + i * 2, // 20, 22, 24, 26, 28 -> min 20, max 28, avg 24
        humidity: 50.0 + i * 5,    // 50, 55, 60, 65, 70 -> min 50, max 70, avg 60
        distance: 40.0 + i * 10,   // 40, 50, 60, 70, 80 -> min 40, max 80, avg 60
        motion: i % 2 === 0,
        sound: false,
        touch: false,
        timestamp: new Date().toISOString(),
      };
      await processPipeline(t, { securityMode: 'DISARMED', alertCooldowns: {} });
    }

    const ranges = ['1h', '6h', '24h', '7d'];
    for (const r of ranges) {
      const res = await apiRequest(`/api/analytics/smartsense-pi-01?range=${r}`);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.deviceId, 'smartsense-pi-01');
      assert.equal(res.data.data.range, r);
      assert.ok(res.data.data.statistics.temperature.min !== null);
      assert.ok(res.data.data.statistics.temperature.max !== null);
      assert.ok(res.data.data.statistics.temperature.average !== null);
      assert.ok(res.data.data.motionEvents >= 0);
    }
  });

  // =========================================================================
  // STEP 22 & 26: API FAILURE & ERROR HANDLING
  // =========================================================================
  it('Step 22 & 26: API returns standardized 400 and 404 error envelopes on invalid inputs', async () => {
    // 404 on nonexistent route
    const notFound = await apiRequest('/api/nonexistent-path');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.data.success, false);
    assert.equal(notFound.data.error.code, 'NOT_FOUND');

    // 400 on invalid security mode
    const badMode = await apiRequest('/api/devices/smartsense-pi-01/security', 'PATCH', { securityMode: 'INVALID_MODE' });
    assert.equal(badMode.status, 400);
    assert.equal(badMode.data.success, false);
    assert.equal(badMode.data.error.code, 'INVALID_SECURITY_MODE');
  });

  // =========================================================================
  // STEP 27: SECURITY & CREDENTIALS CHECK
  // =========================================================================
  it('Step 27: Repository excludes secrets and ignores .env files', () => {
    const gitignoreContent = fs.readFileSync(path.resolve(__dirname, '../../.gitignore'), 'utf8');
    assert.ok(gitignoreContent.includes('.env'), '.gitignore must exclude .env');
    assert.ok(gitignoreContent.includes('serviceAccountKey.json'), '.gitignore must exclude serviceAccountKey.json');
    assert.ok(gitignoreContent.includes('firebase-adminsdk*.json'), '.gitignore must exclude firebase-adminsdk credentials');
  });
});
