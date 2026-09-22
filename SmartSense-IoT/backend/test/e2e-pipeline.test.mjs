import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import config from '../src/config/env.js';
import MockFirebaseServer from '../../nodered/test/mockFirebaseServer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../../nodered/flows/smartsense-flows.json');

describe('Full Pipeline Integration Test: Simulator -> Node-RED -> Firebase -> Express API', () => {
  let firebaseServer;
  let firebasePort;
  let apiServer;
  let apiBaseUrl;
  let flows;

  // Function nodes from Node-RED flow
  let validatorNode;
  let normalizerNode;
  let alertEngineNode;
  let deviceStatusNode;
  let prepFbLatest;
  let prepFbReading;
  let prepFbDevice;
  let prepFbAlert;

  before(async () => {
    // 1. Start Mock Firebase Server (simulating Firebase RTDB)
    firebaseServer = new MockFirebaseServer();
    await firebaseServer.start(0);
    firebasePort = firebaseServer.server.address().port;
    config.firebase.databaseUrl = `http://localhost:${firebasePort}`;

    // 2. Start Express API Server
    await new Promise((resolve) => {
      apiServer = http.createServer(app);
      apiServer.listen(0, () => {
        const port = apiServer.address().port;
        apiBaseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // 3. Load Node-RED flows
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
      set: (k, v) => { flowContext[k] = v; },
    };
    const global = {
      get: () => ({
        FIREBASE_DATABASE_URL: `http://localhost:${firebasePort}`,
        FIREBASE_DATABASE_SECRET: '',
        TEMP_WARNING_THRESHOLD: 32.0,
        TEMP_CRITICAL_THRESHOLD: 35.0,
        DISTANCE_ALERT_THRESHOLD: 15.0,
        HUMIDITY_WARNING_THRESHOLD: 75.0,
        ALERT_COOLDOWN_MS: 1000,
      }),
    };
    const fn = new Function('msg', 'node', 'flow', 'global', node.func);
    return fn(msg, nodeContext, flow, global);
  }

  // Simulate telemetry flowing through Node-RED to Firebase
  async function simulateTelemetryPipeline(telemetry, flowContext = {}) {
    // 1. Validate
    const valResult = runNode(validatorNode, { payload: { ...telemetry } }, flowContext);
    if (!valResult[0]) return { rejected: true };

    // 2. Normalize
    const normResult = runNode(normalizerNode, { payload: { ...valResult[0].payload } }, flowContext);

    // 3. Put to Firebase Latest
    const latestReq = runNode(prepFbLatest, { payload: { ...normResult.payload } }, flowContext);
    await fetch(latestReq.url, {
      method: latestReq.method,
      headers: latestReq.headers,
      body: JSON.stringify(latestReq.payload),
    });

    // 4. Post to Firebase Readings
    const readingReq = runNode(prepFbReading, { payload: { ...normResult.payload } }, flowContext);
    await fetch(readingReq.url, {
      method: readingReq.method,
      headers: readingReq.headers,
      body: JSON.stringify(readingReq.payload),
    });

    // 5. Patch to Firebase Devices
    const devStatus = runNode(deviceStatusNode, { payload: { ...normResult.payload } }, flowContext);
    const devReq = runNode(prepFbDevice, { payload: { ...devStatus.payload } }, flowContext);
    await fetch(devReq.url, {
      method: devReq.method,
      headers: devReq.headers,
      body: JSON.stringify(devReq.payload),
    });

    // 6. Alert Engine -> Firebase Alerts
    const alertResult = runNode(alertEngineNode, { payload: { ...normResult.payload } }, flowContext);
    if (alertResult && alertResult[0]) {
      for (const alertMsg of alertResult[0]) {
        const alertReq = runNode(prepFbAlert, { payload: { ...alertMsg.payload } }, flowContext);
        await fetch(alertReq.url, {
          method: alertReq.method,
          headers: alertReq.headers,
          body: JSON.stringify(alertReq.payload),
        });
      }
    }

    return { rejected: false };
  }

  it('Pipeline Step 1: Normal telemetry -> Node-RED -> Firebase -> Backend GET /api/sensors/latest', async () => {
    const telemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 28.7,
      humidity: 63.4,
      distance: 44.2,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    await simulateTelemetryPipeline(telemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // Query Express API
    const res = await fetch(`${apiBaseUrl}/api/sensors/latest`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.deviceId, 'smartsense-pi-01');
    assert.equal(body.data.temperature, 28.7);
    assert.equal(body.data.humidity, 63.4);
    assert.equal(body.data.distance, 44.2);
  });

  it('Pipeline Step 2: SOS Event -> Node-RED -> Firebase Alert -> Backend GET /api/alerts', async () => {
    const sosTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 28.0,
      humidity: 60.0,
      distance: 40.0,
      motion: false,
      sound: false,
      touch: true, // Trigger SOS
      timestamp: new Date().toISOString(),
    };

    await simulateTelemetryPipeline(sosTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // Query Express API for alerts
    const res = await fetch(`${apiBaseUrl}/api/alerts?severity=CRITICAL`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 1);

    const sosAlert = body.data.find((a) => a.type === 'SOS_ACTIVATED');
    assert.ok(sosAlert);
    assert.equal(sosAlert.severity, 'CRITICAL');
    assert.equal(sosAlert.acknowledged, false);

    // Acknowledge the alert via Express API
    const ackRes = await fetch(`${apiBaseUrl}/api/alerts/${sosAlert.alertId}/acknowledge`, {
      method: 'PATCH',
    });
    assert.equal(ackRes.status, 200);
    const ackBody = await ackRes.json();
    assert.equal(ackBody.data.acknowledged, true);

    // Verify in Firebase directly
    const verifyRes = await fetch(`${apiBaseUrl}/api/alerts/${sosAlert.alertId}`);
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.data.acknowledged, true);
  });

  it('Pipeline Step 3: Multiple readings -> Backend GET /api/sensors/history/smartsense-pi-01', async () => {
    // Generate 3 more readings
    for (let i = 1; i <= 3; i++) {
      const telemetry = {
        deviceId: 'smartsense-pi-01',
        room: 'Room 1',
        temperature: 27.0 + i,
        humidity: 60.0 + i,
        distance: 50.0 - i,
        motion: i === 2,
        sound: false,
        touch: false,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      };
      await simulateTelemetryPipeline(telemetry, { securityMode: 'DISARMED', alertCooldowns: {} });
    }

    const res = await fetch(`${apiBaseUrl}/api/sensors/history/smartsense-pi-01?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 4);
  });

  it('Pipeline Step 4: Historical telemetry -> Backend GET /api/analytics/smartsense-pi-01?range=1h', async () => {
    const res = await fetch(`${apiBaseUrl}/api/analytics/smartsense-pi-01?range=1h`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.deviceId, 'smartsense-pi-01');
    assert.equal(body.data.range, '1h');
    assert.ok(body.data.temperature.length >= 4);
    assert.ok(body.data.humidity.length >= 4);
    assert.ok(body.data.distance.length >= 4);
    assert.ok(body.data.statistics.temperature.average > 0);
    assert.ok(body.data.statistics.humidity.average > 0);
    assert.ok(body.data.totalReadings >= 4);
  });

  it('Pipeline Step 5: Backend updates security mode -> Node-RED uses it for security breach detection', async () => {
    // 1. Arm system via Backend API
    const armRes = await fetch(`${apiBaseUrl}/api/devices/smartsense-pi-01/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'ARMED' }),
    });
    assert.equal(armRes.status, 200);
    const armBody = await armRes.json();
    assert.equal(armBody.data.securityMode, 'ARMED');

    // 2. Motion occurs while ARMED
    const breachTelemetry = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      temperature: 28.0,
      humidity: 62.0,
      distance: 30.0,
      motion: true, // Motion triggered while ARMED
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    await simulateTelemetryPipeline(breachTelemetry, { securityMode: 'ARMED', alertCooldowns: {} });

    // 3. Verify breach alert is returned by API
    const alertRes = await fetch(`${apiBaseUrl}/api/alerts?severity=CRITICAL`);
    assert.equal(alertRes.status, 200);
    const alertBody = await alertRes.json();
    const breachAlert = alertBody.data.find((a) => a.type === 'MOTION_BREACH');
    assert.ok(breachAlert, 'Expected MOTION_BREACH alert to be created');
    assert.equal(breachAlert.severity, 'CRITICAL');
  });
});
