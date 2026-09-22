import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import MockFirebaseServer from './mockFirebaseServer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../flows/smartsense-flows.json');

// Read and parse flow JSON
const flowContent = fs.readFileSync(flowPath, 'utf8');
const flows = JSON.parse(flowContent);

// Helper to find function node by name
function getFunctionNode(name) {
  const node = flows.find((n) => n.type === 'function' && n.name === name);
  if (!node) throw new Error(`Node not found: ${name}`);
  return node;
}

// Function execution environment simulator for Node-RED
function executeNodeRedFunction(node, msg, flowContext = {}, globalContext = {}) {
  const nodeContext = {
    error: () => {},
    warn: () => {},
    status: () => {},
  };

  const flow = {
    get: (key) => flowContext[key],
    set: (key, val) => { flowContext[key] = val; },
  };

  const global = {
    get: (key) => globalContext[key] || {
      FIREBASE_DATABASE_URL: 'http://localhost:9005',
      FIREBASE_DATABASE_SECRET: '',
      TEMP_WARNING_THRESHOLD: 32.0,
      TEMP_CRITICAL_THRESHOLD: 35.0,
      DISTANCE_ALERT_THRESHOLD: 15.0,
      HUMIDITY_WARNING_THRESHOLD: 75.0,
      ALERT_COOLDOWN_MS: 10000,
    },
  };

  const fn = new Function('msg', 'node', 'flow', 'global', node.func);
  return fn(msg, nodeContext, flow, global);
}

// Nodes under test
const validatorNode = getFunctionNode('Validate Telemetry Schema');
const normalizerNode = getFunctionNode('Normalize & Compute Sensor Statuses');
const alertEngineNode = getFunctionNode('Alert Evaluation Engine');
const deviceStatusNode = getFunctionNode('Update Device Status & LastSeen');

const prepFbLatestNode = getFunctionNode('Format Firebase Latest (PUT /latest/:id.json)');
const prepFbReadingNode = getFunctionNode('Format Firebase Reading (POST /readings/:id.json)');
const prepFbDeviceNode = getFunctionNode('Format Firebase Device (PATCH /devices/:id.json)');
const prepFbAlertNode = getFunctionNode('Format Firebase Alert (PUT /alerts/:id.json)');

const VALID_SAMPLE = {
  deviceId: 'smartsense-pi-01',
  room: 'Room 1',
  temperature: 28.5,
  humidity: 64.2,
  distance: 45.6,
  motion: false,
  sound: false,
  touch: false,
  timestamp: new Date().toISOString(),
};

test('Flow JSON contains required tabs, brokers, and processing nodes', () => {
  assert.ok(Array.isArray(flows));
  assert.ok(flows.some((n) => n.type === 'tab' && n.id === 'tab_smartsense_core'));
  assert.ok(flows.some((n) => n.type === 'mqtt-broker'));
  assert.ok(flows.some((n) => n.type === 'mqtt in' && n.topic === 'smartsense/room1/sensors'));
  assert.ok(flows.some((n) => n.type === 'mqtt out' && n.topic === 'smartsense/room1/alerts'));
  assert.ok(flows.some((n) => n.type === 'mqtt out' && n.topic === 'smartsense/room1/status'));
  assert.ok(flows.some((n) => n.type === 'http request' && n.name.includes('/latest/')));
  assert.ok(flows.some((n) => n.type === 'http request' && n.name.includes('/readings/')));
  assert.ok(flows.some((n) => n.type === 'http request' && n.name.includes('/devices/')));
  assert.ok(flows.some((n) => n.type === 'http request' && n.name.includes('/alerts/')));
});

test('TEST 1: Normal telemetry is valid, processed successfully with no alerts', () => {
  const valResult = executeNodeRedFunction(validatorNode, { payload: { ...VALID_SAMPLE } });
  assert.ok(valResult[0] !== null);
  assert.strictEqual(valResult[1], null);

  const normResult = executeNodeRedFunction(normalizerNode, valResult[0]);
  assert.strictEqual(normResult.payload.temperatureStatus, 'NORMAL');
  assert.strictEqual(normResult.payload.distanceStatus, 'NORMAL');
  assert.strictEqual(normResult.payload.motionStatus, 'NO_MOTION');
  assert.ok(normResult.payload.receivedAt);

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.strictEqual(alertResult, null);
});

test('TEST 2: Motion while DISARMED records motion but creates no critical security alert', () => {
  const payload = { ...VALID_SAMPLE, motion: true };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });
  assert.strictEqual(normResult.payload.motionStatus, 'MOTION_DETECTED');

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.strictEqual(alertResult, null);
});

test('TEST 3: Motion while ARMED generates CRITICAL security alert', () => {
  const payload = { ...VALID_SAMPLE, motion: true };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'ARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alerts = alertResult[0];
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].payload.type, 'MOTION_BREACH');
  assert.strictEqual(alerts[0].payload.severity, 'CRITICAL');
});

test('TEST 4: Temperature >= 32.0°C generates WARNING alert', () => {
  const payload = { ...VALID_SAMPLE, temperature: 33.2 };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alert = alertResult[0][0].payload;
  assert.strictEqual(alert.type, 'HIGH_TEMPERATURE');
  assert.strictEqual(alert.severity, 'WARNING');
});

test('TEST 5: Temperature >= 35.0°C generates CRITICAL alert', () => {
  const payload = { ...VALID_SAMPLE, temperature: 36.5 };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alert = alertResult[0][0].payload;
  assert.strictEqual(alert.type, 'HIGH_TEMPERATURE');
  assert.strictEqual(alert.severity, 'CRITICAL');
});

test('TEST 6: Ultrasonic Distance < 15 cm generates CLOSE_OBJECT alert', () => {
  const payload = { ...VALID_SAMPLE, distance: 8.4 };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alert = alertResult[0][0].payload;
  assert.strictEqual(alert.type, 'CLOSE_OBJECT');
  assert.strictEqual(alert.severity, 'WARNING');
});

test('TEST 7: Sound = true generates SOUND_DETECTED alert', () => {
  const payload = { ...VALID_SAMPLE, sound: true };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alert = alertResult[0][0].payload;
  assert.strictEqual(alert.type, 'SOUND_DETECTED');
  assert.strictEqual(alert.severity, 'WARNING');
});

test('TEST 8: Touch = true generates CRITICAL SOS_ACTIVATED alert', () => {
  const payload = { ...VALID_SAMPLE, touch: true };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });

  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };
  const alertResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(alertResult !== null);
  const alert = alertResult[0][0].payload;
  assert.strictEqual(alert.type, 'SOS_ACTIVATED');
  assert.strictEqual(alert.severity, 'CRITICAL');
});

test('TEST 9: Malformed payload is rejected to Output 2 and NOT sent to Firebase', () => {
  const malformed = {
    deviceId: 'smartsense-pi-01',
    temperature: 'invalid-string',
    distance: -10,
  };

  const valResult = executeNodeRedFunction(validatorNode, { payload: malformed });
  assert.strictEqual(valResult[0], null, 'Port 1 must be null for invalid telemetry');
  assert.ok(valResult[1] !== null, 'Port 2 must receive rejected error message');
});

test('TEST 10: Repeated identical alert is suppressed by cooldown debounce mechanism', () => {
  const payload = { ...VALID_SAMPLE, touch: true };
  const normResult = executeNodeRedFunction(normalizerNode, { payload });
  const flowContext = { securityMode: 'DISARMED', alertCooldowns: {} };

  const firstResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.ok(firstResult !== null);

  const secondResult = executeNodeRedFunction(alertEngineNode, normResult, flowContext);
  assert.strictEqual(secondResult, null);
});

test('TEST 11: Firebase formatters produce correct URLs, HTTP methods and payloads', () => {
  const telemetryMsg = { payload: { ...VALID_SAMPLE } };

  // 1. Latest (PUT)
  const latestMsg = executeNodeRedFunction(prepFbLatestNode, telemetryMsg);
  assert.strictEqual(latestMsg.method, 'PUT');
  assert.strictEqual(latestMsg.url, 'http://localhost:9005/latest/smartsense-pi-01.json');
  assert.strictEqual(latestMsg.payload.temperature, 28.5);

  // 2. Reading (POST)
  const readingMsg = executeNodeRedFunction(prepFbReadingNode, telemetryMsg);
  assert.strictEqual(readingMsg.method, 'POST');
  assert.strictEqual(readingMsg.url, 'http://localhost:9005/readings/smartsense-pi-01.json');
  assert.strictEqual(readingMsg.payload.humidity, 64.2);

  // 3. Device Status (PATCH)
  const deviceMsg = { payload: { deviceId: 'smartsense-pi-01', room: 'Room 1', status: 'ONLINE', securityMode: 'ARMED', lastSeen: new Date().toISOString() } };
  const devResult = executeNodeRedFunction(prepFbDeviceNode, deviceMsg);
  assert.strictEqual(devResult.method, 'PATCH');
  assert.strictEqual(devResult.url, 'http://localhost:9005/devices/smartsense-pi-01.json');
  assert.strictEqual(devResult.payload.status, 'ONLINE');

  // 4. Alert (PUT)
  const alertMsg = { payload: { alertId: 'alt-test-999', deviceId: 'smartsense-pi-01', room: 'Room 1', type: 'SOS_ACTIVATED', severity: 'CRITICAL', message: 'SOS!', timestamp: new Date().toISOString() } };
  const alertResult = executeNodeRedFunction(prepFbAlertNode, alertMsg);
  assert.strictEqual(alertResult.method, 'PUT');
  assert.strictEqual(alertResult.url, 'http://localhost:9005/alerts/alt-test-999.json');
  assert.strictEqual(alertResult.payload.acknowledged, false);
});

test('TEST 12: End-to-End Firebase Cloud Database REST persistence verification', async () => {
  const mockServer = new MockFirebaseServer();
  await mockServer.start(9005);

  try {
    // 1. Save Latest Telemetry
    const telemetryMsg = { payload: { ...VALID_SAMPLE } };
    const latestMsg = executeNodeRedFunction(prepFbLatestNode, telemetryMsg);
    await fetch(latestMsg.url, {
      method: latestMsg.method,
      headers: latestMsg.headers,
      body: JSON.stringify(latestMsg.payload),
    });

    // 2. Save Historical Reading
    const readingMsg = executeNodeRedFunction(prepFbReadingNode, telemetryMsg);
    await fetch(readingMsg.url, {
      method: readingMsg.method,
      headers: readingMsg.headers,
      body: JSON.stringify(readingMsg.payload),
    });

    // 3. Save Device Status
    const deviceMsg = executeNodeRedFunction(prepFbDeviceNode, {
      payload: { deviceId: 'smartsense-pi-01', room: 'Room 1', status: 'ONLINE', securityMode: 'ARMED', lastSeen: new Date().toISOString() },
    });
    await fetch(deviceMsg.url, {
      method: deviceMsg.method,
      headers: deviceMsg.headers,
      body: JSON.stringify(deviceMsg.payload),
    });

    // 4. Save Alert Record
    const alertMsg = executeNodeRedFunction(prepFbAlertNode, {
      payload: { alertId: 'alt-1001', deviceId: 'smartsense-pi-01', room: 'Room 1', type: 'SOS_ACTIVATED', severity: 'CRITICAL', message: 'Emergency SOS activated!', timestamp: new Date().toISOString() },
    });
    await fetch(alertMsg.url, {
      method: alertMsg.method,
      headers: alertMsg.headers,
      body: JSON.stringify(alertMsg.payload),
    });

    // Verify In-Memory Firebase Tree
    const db = mockServer.getDatabase();

    // Verify Latest
    assert.ok(db.latest['smartsense-pi-01']);
    assert.strictEqual(db.latest['smartsense-pi-01'].temperature, 28.5);
    assert.strictEqual(db.latest['smartsense-pi-01'].humidity, 64.2);

    // Verify Readings (Historical)
    assert.ok(db.readings['smartsense-pi-01']);
    const readingKeys = Object.keys(db.readings['smartsense-pi-01']);
    assert.strictEqual(readingKeys.length, 1);
    assert.strictEqual(db.readings['smartsense-pi-01'][readingKeys[0]].distance, 45.6);

    // Verify Device Status
    assert.ok(db.devices['smartsense-pi-01']);
    assert.strictEqual(db.devices['smartsense-pi-01'].status, 'ONLINE');
    assert.strictEqual(db.devices['smartsense-pi-01'].securityMode, 'ARMED');

    // Verify Alert
    assert.ok(db.alerts['alt-1001']);
    assert.strictEqual(db.alerts['alt-1001'].severity, 'CRITICAL');
    assert.strictEqual(db.alerts['alt-1001'].acknowledged, false);
  } finally {
    await mockServer.stop();
  }
});
