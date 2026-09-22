import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import app from '../../backend/src/app.js';
import backendConfig from '../../backend/src/config/env.js';
import MockFirebaseServer from '../../nodered/test/mockFirebaseServer.mjs';
import { generateTelemetry } from '../../simulator/src/simulator/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const flowPath = path.resolve(__dirname, '../../nodered/flows/smartsense-flows.json');

describe('End-to-End Pipeline: Simulator -> Node-RED -> Firebase -> Express API -> Mobile App', () => {
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

  // Mobile modules
  let sensorsApi;
  let alertsApi;
  let devicesApi;
  let analyticsApi;
  let SensorCard;
  let AlertCard;
  let DeviceCard;
  let SecurityToggle;
  let DashboardScreen;

  before(async () => {
    // 1. Start Mock Firebase RTDB server
    firebaseServer = new MockFirebaseServer();
    await firebaseServer.start(0);
    firebasePort = firebaseServer.server.address().port;
    backendConfig.firebase.databaseUrl = `http://localhost:${firebasePort}`;

    // 2. Start Express API server
    await new Promise((resolve) => {
      apiServer = http.createServer(app);
      apiServer.listen(0, () => {
        apiPort = apiServer.address().port;
        process.env.EXPO_PUBLIC_API_BASE_URL = `http://localhost:${apiPort}/api`;
        process.env.EXPO_PUBLIC_DEVICE_ID = 'smartsense-pi-01';
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

    // 4. Import Mobile services & components
    sensorsApi = (await import('../src/services/sensorsApi.js')).default;
    alertsApi = (await import('../src/services/alertsApi.js')).default;
    devicesApi = (await import('../src/services/devicesApi.js')).default;
    analyticsApi = (await import('../src/services/analyticsApi.js')).default;

    SensorCard = (await import('../src/components/SensorCard.jsx')).default;
    AlertCard = (await import('../src/components/AlertCard.jsx')).default;
    DeviceCard = (await import('../src/components/DeviceCard.jsx')).default;
    SecurityToggle = (await import('../src/components/SecurityToggle.jsx')).default;
    DashboardScreen = (await import('../src/screens/DashboardScreen.jsx')).default;
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
        ALERT_COOLDOWN_MS: 500,
      }),
    };
    const fn = new Function('msg', 'node', 'flow', 'global', node.func);
    return fn(msg, nodeContext, flow, global);
  }

  // Pipeline runner: Simulator -> Node-RED -> Firebase
  async function simulateTelemetryPipeline(telemetry, flowContext = {}) {
    const valResult = runNode(validatorNode, { payload: { ...telemetry } }, flowContext);
    if (!valResult || !valResult[0]) return { rejected: true };

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
    const alertResult = runNode(alertEngineNode, { payload: { ...normResult.payload } }, flowContext);
    if (alertResult && alertResult[0] && Array.isArray(alertResult[0])) {
      for (const altMsg of alertResult[0]) {
        const fbAlt = runNode(prepFbAlert, { payload: { ...altMsg.payload } }, flowContext);
        await fetch(fbAlt.url, {
          method: fbAlt.method,
          headers: fbAlt.headers || { 'Content-Type': 'application/json' },
          body: JSON.stringify(fbAlt.payload),
        });
      }
    }

    return { normResult, alertResult };
  }

  it('E2E Mobile 1: Telemetry generated by Simulator -> Node-RED -> Firebase -> Express API -> Mobile App', async () => {
    // 1. Simulator generates realistic telemetry
    const rawTelemetry = generateTelemetry();
    rawTelemetry.deviceId = 'smartsense-pi-01';
    rawTelemetry.temperature = 26.4;
    rawTelemetry.humidity = 55.2;
    rawTelemetry.distance = 42.0;
    rawTelemetry.motion = false;
    rawTelemetry.sound = false;
    rawTelemetry.touch = false;

    // 2. Node-RED processes and persists to Firebase
    await simulateTelemetryPipeline(rawTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // 3. Mobile consumes real Express API
    const latest = await sensorsApi.getLatest('smartsense-pi-01');

    assert.equal(latest.deviceId, 'smartsense-pi-01');
    assert.equal(latest.temperature, 26.4);
    assert.equal(latest.humidity, 55.2);
    assert.equal(latest.distance, 42.0);

    // 4. Mobile Component renders the fetched values
    const tempCardHtml = ReactDOMServer.renderToString(
      React.createElement(SensorCard, {
        title: 'Temperature',
        value: latest.temperature,
        unit: '°C',
        status: latest.temperatureStatus,
        icon: 'thermometer',
      })
    );
    assert.ok(tempCardHtml.includes('26.4'), 'Rendered SensorCard must display temperature');
    assert.ok(tempCardHtml.includes('°C'));
  });

  it('E2E Mobile 2: SOS Trigger -> Node-RED -> Firebase Alert -> Mobile Alerts -> Acknowledge PATCH', async () => {
    // 1. Simulator triggers emergency SOS touch
    const rawTelemetry = generateTelemetry();
    rawTelemetry.deviceId = 'smartsense-pi-01';
    rawTelemetry.touch = true;

    // 2. Node-RED detects SOS -> writes alert to Firebase
    await simulateTelemetryPipeline(rawTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // 3. Mobile fetches alerts from Express API
    const alerts = await alertsApi.getAlerts();
    assert.ok(alerts.length > 0, 'Express API must return alerts');
    const targetAlert = alerts.find((a) => a.type === 'SOS_ACTIVATED' || a.severity === 'CRITICAL');
    assert.ok(targetAlert, 'Target SOS alert must exist in API response');
    assert.equal(targetAlert.acknowledged, false);

    // 4. Mobile renders AlertCard with ACKNOWLEDGE button
    const cardHtml = ReactDOMServer.renderToString(
      React.createElement(AlertCard, {
        alert: targetAlert,
        onAcknowledge: () => {},
      })
    );
    assert.ok(cardHtml.includes('SOS_ACTIVATED'));
    assert.ok(cardHtml.includes('CRITICAL'));
    assert.ok(cardHtml.includes('ACKNOWLEDGE'));

    // 5. Mobile sends ACKNOWLEDGE request via PATCH
    const ackRes = await alertsApi.acknowledgeAlert(targetAlert.alertId);
    assert.equal(ackRes.acknowledged, true);

    // 6. Verify acknowledged in API
    const updatedAlerts = await alertsApi.getAlerts();
    const updated = updatedAlerts.find((a) => a.alertId === targetAlert.alertId);
    assert.equal(updated.acknowledged, true);
  });

  it('E2E Mobile 3: Mobile PATCHes ARMED mode -> Node-RED observes ARMED -> Motion triggers CRITICAL alert', async () => {
    // 1. Mobile user arms security via PATCH
    const armRes = await devicesApi.updateSecurityMode('smartsense-pi-01', 'ARMED');
    assert.equal(armRes.securityMode, 'ARMED');

    // 2. Verify device reflects ARMED
    const dev = await devicesApi.getDeviceById('smartsense-pi-01');
    assert.equal(dev.securityMode, 'ARMED');

    // 3. Motion occurs while ARMED
    const motionTelemetry = generateTelemetry();
    motionTelemetry.deviceId = 'smartsense-pi-01';
    motionTelemetry.motion = true;

    await simulateTelemetryPipeline(motionTelemetry, { securityMode: 'ARMED', alertCooldowns: {} });

    // 4. Verify critical alert was generated and is visible in Mobile API
    const alerts = await alertsApi.getAlerts({ severity: 'CRITICAL' });
    const motionAlert = alerts.find((a) => a.type === 'MOTION_DETECTED_ARMED' || a.severity === 'CRITICAL');
    assert.ok(motionAlert, 'Critical alert must be returned for motion during ARMED mode');

    // 5. Mobile user disarms system
    const disarmRes = await devicesApi.updateSecurityMode('smartsense-pi-01', 'DISARMED');
    assert.equal(disarmRes.securityMode, 'DISARMED');
  });

  it('E2E Mobile 4: Multiple telemetry readings -> Node-RED -> Firebase -> Backend Analytics -> Mobile Analytics', async () => {
    // Generate several readings
    for (let i = 0; i < 3; i++) {
      const t = generateTelemetry();
      t.deviceId = 'smartsense-pi-01';
      t.room = 'Room 1';
      await simulateTelemetryPipeline(t, { securityMode: 'DISARMED', alertCooldowns: {} });
    }

    // Mobile queries analytics for device
    const analytics = await analyticsApi.getAnalytics('smartsense-pi-01', '1h');
    assert.equal(analytics.deviceId, 'smartsense-pi-01');
    assert.ok(analytics.totalReadings >= 3);
    assert.ok(analytics.temperature.length >= 3);
    assert.ok(typeof analytics.statistics.temperature.average === 'number');
  });
});
