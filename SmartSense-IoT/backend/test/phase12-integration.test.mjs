import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

import app from '../src/app.js';
import backendConfig from '../src/config/env.js';
import MockFirebaseServer from '../../nodered/test/mockFirebaseServer.mjs';
import { TelemetryGenerator } from '../../simulator/src/simulator/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../../nodered/flows/smartsense-flows.json');

describe('SmartSense IoT — Phase 12 Complete E2E Integration & Production Readiness', () => {
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

  const deviceId = 'smartsense-pi-01';

  before(async () => {
    // 1. Start Mock Firebase RTDB server on an ephemeral port
    firebaseServer = new MockFirebaseServer();
    await firebaseServer.start(0);
    firebasePort = firebaseServer.server.address().port;
    backendConfig.firebase.databaseUrl = `http://localhost:${firebasePort}`;

    // 2. Start Express API server on an ephemeral port
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
    if (apiServer) await new Promise((resolve) => apiServer.close(resolve));
    if (firebaseServer) await firebaseServer.stop();
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
        ALERT_COOLDOWN_MS: 100, // Short cooldown for automated testing
      }),
    };
    const fn = new Function('msg', 'node', 'flow', 'global', node.func);
    return fn(msg, nodeContext, flow, global);
  }

  // Pipeline simulation: Simulator -> Node-RED -> Firebase
  async function processPipeline(telemetry, flowContext = {}) {
    const valResult = runNode(validatorNode, { payload: { ...telemetry } }, flowContext);
    if (!valResult || !valResult[0]) return { rejected: true, valResult, generatedAlerts: [] };

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
    const generatedAlerts = [];
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

  // TEST A: Normal Telemetry Trace
  it('TEST A: Normal telemetry flows through entire pipeline to backend and clients', async () => {
    const telemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.5,
      humidity: 55.0,
      distance: 60.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };

    const { rejected, generatedAlerts } = await processPipeline(telemetry);
    assert.equal(rejected, false);
    assert.equal(generatedAlerts.length, 0);

    const res = await fetch(`http://localhost:${apiPort}/api/sensors/latest/${deviceId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.temperature, 24.5);
    assert.equal(body.data.humidity, 55.0);
    assert.equal(body.data.distance, 60.0);
    assert.equal(body.data.motion, false);
    assert.ok(body.data.processedAt, 'processedAt must be attached');
  });

  // TEST B & TEST G: Motion Event (DISARMED vs ARMED)
  it('TEST B & G: Motion in DISARMED mode alerts nothing; ARMED mode generates CRITICAL MOTION_BREACH', async () => {
    // 1. Motion while DISARMED
    const disarmedTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.0,
      humidity: 50.0,
      distance: 50.0,
      motion: true,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts: disarmedAlerts } = await processPipeline(disarmedTelemetry, { securityMode: 'DISARMED' });
    const breachAlertsDisarmed = disarmedAlerts.filter((a) => a.type === 'MOTION_BREACH');
    assert.equal(breachAlertsDisarmed.length, 0, 'Disarmed motion must not generate security alert');

    // 2. Arm system via Express API
    const armRes = await fetch(`http://localhost:${apiPort}/api/devices/${deviceId}/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'ARMED' }),
    });
    assert.equal(armRes.status, 200);

    // 3. Motion while ARMED
    const armedTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.0,
      humidity: 50.0,
      distance: 50.0,
      motion: true,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts: armedAlerts } = await processPipeline(armedTelemetry, { securityMode: 'ARMED' });
    const breachAlert = armedAlerts.find((a) => a.type === 'MOTION_BREACH');
    assert.ok(breachAlert, 'Armed motion must trigger MOTION_BREACH alert');
    assert.equal(breachAlert.severity, 'CRITICAL');

    // Verify alert appears in Backend API
    const alertRes = await fetch(`http://localhost:${apiPort}/api/alerts?severity=CRITICAL`);
    const alertBody = await alertRes.json();
    assert.ok(alertBody.data.some((a) => a.type === 'MOTION_BREACH'));

    // Disarm system
    await fetch(`http://localhost:${apiPort}/api/devices/${deviceId}/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'DISARMED' }),
    });
  });

  // TEST C: Sound Event
  it('TEST C: Acoustic anomaly triggers WARNING SOUND_DETECTED alert', async () => {
    const soundTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: true,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts } = await processPipeline(soundTelemetry);
    const soundAlert = generatedAlerts.find((a) => a.type === 'SOUND_DETECTED');
    assert.ok(soundAlert, 'Sound event must trigger alert');
    assert.equal(soundAlert.severity, 'WARNING');
  });

  // TEST D: Touch / SOS Event
  it('TEST D: Capacitive Touch / SOS trigger generates CRITICAL SOS_ACTIVATED alert', async () => {
    const sosTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: true,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts } = await processPipeline(sosTelemetry);
    const sosAlert = generatedAlerts.find((a) => a.type === 'SOS_ACTIVATED');
    assert.ok(sosAlert, 'SOS event must trigger alert');
    assert.equal(sosAlert.severity, 'CRITICAL');
  });

  // TEST E: Temperature Threshold Alerts (WARNING and CRITICAL)
  it('TEST E: Temperature thresholds generate WARNING (>=32°C) and CRITICAL (>=35°C) alerts', async () => {
    // 32.5°C -> WARNING
    const warnTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 32.5,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts: warnAlerts } = await processPipeline(warnTelemetry);
    const warnAlert = warnAlerts.find((a) => a.type === 'HIGH_TEMPERATURE');
    assert.ok(warnAlert);
    assert.equal(warnAlert.severity, 'WARNING');

    // Wait past cooldown
    await new Promise((r) => setTimeout(r, 150));

    // 36.0°C -> CRITICAL
    const critTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 36.0,
      humidity: 50.0,
      distance: 50.0,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts: critAlerts } = await processPipeline(critTelemetry);
    const critAlert = critAlerts.find((a) => a.type === 'HIGH_TEMPERATURE');
    assert.ok(critAlert);
    assert.equal(critAlert.severity, 'CRITICAL');
  });

  // TEST F: Close Distance Obstruction Alert
  it('TEST F: Distance < 15.0 cm triggers WARNING CLOSE_OBJECT alert', async () => {
    const distTelemetry = {
      deviceId,
      room: 'Room 1',
      temperature: 24.0,
      humidity: 50.0,
      distance: 11.2,
      motion: false,
      sound: false,
      touch: false,
      timestamp: new Date().toISOString(),
    };
    const { generatedAlerts } = await processPipeline(distTelemetry);
    const distAlert = generatedAlerts.find((a) => a.type === 'CLOSE_OBJECT');
    assert.ok(distAlert);
    assert.equal(distAlert.severity, 'WARNING');
  });

  // TEST H: Alert Acknowledgement Lifecycle
  it('TEST H: Alert acknowledgement transitions acknowledged from false to true', async () => {
    const alertId = `alt-p12-${Date.now()}`;
    await fetch(`http://localhost:${firebasePort}/alerts/${alertId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        alertId,
        deviceId,
        room: 'Room 1',
        type: 'SOS_ACTIVATED',
        severity: 'CRITICAL',
        message: 'Emergency SOS test',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      }),
    });

    // Verify before state
    const getRes = await fetch(`http://localhost:${apiPort}/api/alerts/${alertId}`);
    const getBody = await getRes.json();
    assert.equal(getBody.data.acknowledged, false);

    // PATCH acknowledge
    const patchRes = await fetch(`http://localhost:${apiPort}/api/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
    });
    assert.equal(patchRes.status, 200);

    // Verify after state
    const afterRes = await fetch(`http://localhost:${apiPort}/api/alerts/${alertId}`);
    const afterBody = await afterRes.json();
    assert.equal(afterBody.data.acknowledged, true);
    assert.ok(afterBody.data.acknowledgedAt);
  });

  // TEST I: Analytics Calculation Across All 4 Horizons
  it('TEST I: Analytics calculates accurate aggregate statistics across 1h, 6h, 24h, and 7d', async () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      const ts = new Date(now - i * 300000).toISOString();
      await fetch(`http://localhost:${firebasePort}/readings/${deviceId}.json`, {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          room: 'Room 1',
          temperature: 20.0 + i * 2,
          humidity: 50.0 + i * 5,
          distance: 40.0 + i * 10,
          motion: i % 2 === 1,
          sound: false,
          touch: false,
          timestamp: ts,
        }),
      });
    }

    for (const range of ['1h', '6h', '24h', '7d']) {
      const res = await fetch(`http://localhost:${apiPort}/api/analytics/${deviceId}?range=${range}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.statistics, `Statistics missing for ${range}`);
      assert.ok(body.data.statistics.temperature.average > 0);
      assert.equal(typeof body.data.motionEvents, 'number');
    }
  });

  // TEST J: Website and Mobile Data Consistency
  it('TEST J: Both Web Dashboard and Mobile client models resolve identical source-of-truth telemetry', async () => {
    const res = await fetch(`http://localhost:${apiPort}/api/sensors/latest/${deviceId}`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(typeof body.data.deviceId, 'string');
    assert.equal(typeof body.data.room, 'string');
    assert.equal(typeof body.data.temperature, 'number');
    assert.equal(typeof body.data.humidity, 'number');
    assert.equal(typeof body.data.distance, 'number');
    assert.equal(typeof body.data.motion, 'boolean');
    assert.equal(typeof body.data.sound, 'boolean');
    assert.equal(typeof body.data.touch, 'boolean');
    assert.ok(new Date(body.data.timestamp).getTime() > 0);
  });

  // TEST K: Service Recovery and Error Resilience
  it('TEST K: Backend gracefully rejects malformed queries and handles missing endpoints without crashing', async () => {
    const notFound = await fetch(`http://localhost:${apiPort}/api/nonexistent-endpoint-phase12`);
    assert.equal(notFound.status, 404);
    const notFoundBody = await notFound.json();
    assert.equal(notFoundBody.success, false);

    const badSec = await fetch(`http://localhost:${apiPort}/api/devices/${deviceId}/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'INVALID_MODE' }),
    });
    assert.equal(badSec.status, 400);

    const badRange = await fetch(`http://localhost:${apiPort}/api/analytics/${deviceId}?range=99years`);
    assert.equal(badRange.status, 400);
  });

  // SOAK & PERFORMANCE TEST: Continuous Telemetry Stream & Memory Stability
  it('Soak & Performance Test: Continuous telemetry stream maintains memory stability without leaks', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    const generator = new TelemetryGenerator();

    for (let i = 0; i < 30; i++) {
      const telemetry = generator.generateTelemetry();
      await processPipeline(telemetry);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowthMB = (finalMemory - initialMemory) / (1024 * 1024);

    assert.ok(
      memoryGrowthMB < 30,
      `Uncontrolled memory growth detected: ${memoryGrowthMB.toFixed(2)} MB`
    );
  });

  // STALE DATA TEST: Stale telemetry stops timestamp progression
  it('Stale Data Test: When telemetry ingestion stops, lastSeen timestamp remains constant', async () => {
    const deviceRes = await fetch(`http://localhost:${apiPort}/api/devices/${deviceId}`);
    assert.equal(deviceRes.status, 200);
    const initialDevice = await deviceRes.json();
    const initialLastSeen = initialDevice.data.lastSeen;

    await new Promise((r) => setTimeout(r, 200));

    const checkRes = await fetch(`http://localhost:${apiPort}/api/devices/${deviceId}`);
    const checkDevice = await checkRes.json();
    assert.equal(
      checkDevice.data.lastSeen,
      initialLastSeen,
      'Timestamp must not advance when telemetry is halted'
    );
  });
});
