import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import MockFirebaseServer from './mockFirebaseServer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../flows/smartsense-flows.json');

const flows = JSON.parse(fs.readFileSync(flowPath, 'utf8'));

function getFunctionNode(name) {
  const node = flows.find((n) => n.type === 'function' && n.name === name);
  if (!node) throw new Error(`Node not found: ${name}`);
  return node;
}

const firebase = new MockFirebaseServer();
let testPort = 0;

before(async () => {
  await firebase.start(0);
  testPort = firebase.server.address().port;
});

after(async () => {
  await firebase.stop();
});

beforeEach(() => {
  firebase.clearDatabase();
});

function runNode(node, msg, flowContext = {}) {
  const nodeContext = { error: () => {}, warn: () => {}, status: () => {} };
  const flow = {
    get: (k) => flowContext[k],
    set: (k, v) => { flowContext[k] = v; },
  };
  const global = {
    get: (k) => ({
      FIREBASE_DATABASE_URL: `http://localhost:${testPort}`,
      FIREBASE_DATABASE_SECRET: '',
      TEMP_WARNING_THRESHOLD: 32.0,
      TEMP_CRITICAL_THRESHOLD: 35.0,
      DISTANCE_ALERT_THRESHOLD: 15.0,
      HUMIDITY_WARNING_THRESHOLD: 75.0,
      ALERT_COOLDOWN_MS: 10000,
    }),
  };
  const fn = new Function('msg', 'node', 'flow', 'global', node.func);
  return fn(msg, nodeContext, flow, global);
}

const validatorNode = getFunctionNode('Validate Telemetry Schema');
const normalizerNode = getFunctionNode('Normalize & Compute Sensor Statuses');
const alertEngineNode = getFunctionNode('Alert Evaluation Engine');
const deviceStatusNode = getFunctionNode('Update Device Status & LastSeen');
const prepFbLatest = getFunctionNode('Format Firebase Latest (PUT /latest/:id.json)');
const prepFbReading = getFunctionNode('Format Firebase Reading (POST /readings/:id.json)');
const prepFbDevice = getFunctionNode('Format Firebase Device (PATCH /devices/:id.json)');
const prepFbAlert = getFunctionNode('Format Firebase Alert (PUT /alerts/:id.json)');

// Helper: processes a telemetry message through the entire Node-RED pipeline to Firebase
async function processTelemetryPipeline(rawTelemetry, flowContext) {
  // 1. Validate
  const valResult = runNode(validatorNode, { payload: { ...rawTelemetry } }, flowContext);
  if (!valResult[0]) {
    // Malformed/rejected payload -> stops here
    return { rejected: true, reason: valResult[1].errorReason };
  }

  // 2. Normalize
  const normResult = runNode(normalizerNode, { payload: { ...valResult[0].payload } }, flowContext);

  // 3. Persist to Firebase Latest (separate branch)
  const latestReq = runNode(prepFbLatest, { payload: { ...normResult.payload } }, flowContext);
  await fetch(latestReq.url, {
    method: latestReq.method,
    headers: latestReq.headers,
    body: JSON.stringify(latestReq.payload),
  });

  // 4. Persist to Firebase Readings (separate branch)
  const readingReq = runNode(prepFbReading, { payload: { ...normResult.payload } }, flowContext);
  await fetch(readingReq.url, {
    method: readingReq.method,
    headers: readingReq.headers,
    body: JSON.stringify(readingReq.payload),
  });

  // 5. Update Device Status & Persist to Firebase Devices (separate branch)
  const devStatus = runNode(deviceStatusNode, { payload: { ...normResult.payload } }, flowContext);
  const devReq = runNode(prepFbDevice, { payload: { ...devStatus.payload } }, flowContext);
  await fetch(devReq.url, {
    method: devReq.method,
    headers: devReq.headers,
    body: JSON.stringify(devReq.payload),
  });

  // 6. Alert Engine & Persist to Firebase Alerts (separate branch)
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

test('END-TO-END TEST 1: Normal telemetry -> latest/ and readings/ are populated in Firebase', async () => {
  const normalTelemetry = {
    deviceId: 'smartsense-pi-01',
    room: 'Room 1',
    temperature: 27.5,
    humidity: 62.0,
    distance: 55.0,
    motion: false,
    sound: false,
    touch: false,
    timestamp: new Date().toISOString(),
  };

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const res = await processTelemetryPipeline(normalTelemetry, flowContext);
  assert.strictEqual(res.rejected, false);

  const db = firebase.getDatabase();
  assert.ok(db.latest['smartsense-pi-01']);
  assert.strictEqual(db.latest['smartsense-pi-01'].temperature, 27.5);
  assert.strictEqual(db.latest['smartsense-pi-01'].humidity, 62.0);

  const readings = Object.values(db.readings['smartsense-pi-01'] || {});
  assert.strictEqual(readings.length, 1);
  assert.strictEqual(readings[0].temperature, 27.5);

  assert.strictEqual(db.devices['smartsense-pi-01'].status, 'ONLINE');
  assert.strictEqual(Object.keys(db.alerts).length, 0); // No alert generated
});

test('END-TO-END TEST 2: High temperature telemetry -> Node-RED detects alert -> alerts/<alertId> stored', async () => {
  const highTempTelemetry = {
    deviceId: 'smartsense-pi-01',
    room: 'Room 1',
    temperature: 33.5,
    humidity: 58.0,
    distance: 50.0,
    motion: false,
    sound: false,
    touch: false,
    timestamp: new Date().toISOString(),
  };

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  await processTelemetryPipeline(highTempTelemetry, flowContext);

  const db = firebase.getDatabase();
  const alerts = Object.values(db.alerts);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].type, 'HIGH_TEMPERATURE');
  assert.strictEqual(alerts[0].severity, 'WARNING');
  assert.strictEqual(alerts[0].acknowledged, false);
});

test('END-TO-END TEST 3: SOS / Touch telemetry -> Node-RED detects SOS_ACTIVATED (CRITICAL) in alerts/', async () => {
  const sosTelemetry = {
    deviceId: 'smartsense-pi-01',
    room: 'Room 1',
    temperature: 28.0,
    humidity: 61.0,
    distance: 48.0,
    motion: false,
    sound: false,
    touch: true,
    timestamp: new Date().toISOString(),
  };

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  await processTelemetryPipeline(sosTelemetry, flowContext);

  const db = firebase.getDatabase();
  const alerts = Object.values(db.alerts);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].type, 'SOS_ACTIVATED');
  assert.strictEqual(alerts[0].severity, 'CRITICAL');
});

test('END-TO-END TEST 4: Motion with security ARMED -> critical security alert stored in alerts/', async () => {
  const motionTelemetry = {
    deviceId: 'smartsense-pi-01',
    room: 'Room 1',
    temperature: 28.0,
    humidity: 61.0,
    distance: 48.0,
    motion: true,
    sound: false,
    touch: false,
    timestamp: new Date().toISOString(),
  };

  const flowContext = { securityMode: 'ARMED', alertCooldowns: {} };
  await processTelemetryPipeline(motionTelemetry, flowContext);

  const db = firebase.getDatabase();
  const alerts = Object.values(db.alerts);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].type, 'MOTION_BREACH');
  assert.strictEqual(alerts[0].severity, 'CRITICAL');
});

test('END-TO-END TEST 5: Malformed payload is rejected and NEVER written to latest, readings, or alerts', async () => {
  const malformedTelemetry = {
    deviceId: 'smartsense-pi-01',
    // missing room
    temperature: 'invalid',
    distance: -50,
  };

  const flowContext = { securityMode: 'ARMED', alertCooldowns: {} };
  const res = await processTelemetryPipeline(malformedTelemetry, flowContext);
  assert.strictEqual(res.rejected, true);

  const db = firebase.getDatabase();
  assert.strictEqual(Object.keys(db.latest).length, 0, 'latest/ must remain empty');
  assert.strictEqual(Object.keys(db.readings).length, 0, 'readings/ must remain empty');
  assert.strictEqual(Object.keys(db.alerts).length, 0, 'alerts/ must remain empty');
});
