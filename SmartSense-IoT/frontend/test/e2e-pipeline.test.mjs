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

describe('End-to-End Pipeline: Simulator -> Node-RED -> Firebase -> Express API -> React Frontend', () => {
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

  // Frontend modules
  let sensorsApi;
  let alertsApi;
  let devicesApi;
  let analyticsApi;
  let SensorCard;
  let AlertCard;
  let DeviceStatus;

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
        process.env.VITE_API_BASE_URL = `http://localhost:${apiPort}/api`;
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

    // 4. Dynamically import frontend services & components with API base URL configured
    sensorsApi = (await import('../src/services/sensorsApi.js')).default;
    alertsApi = (await import('../src/services/alertsApi.js')).default;
    devicesApi = (await import('../src/services/devicesApi.js')).default;
    analyticsApi = (await import('../src/services/analyticsApi.js')).default;

    SensorCard = (await import('../src/components/SensorCard.jsx')).default;
    AlertCard = (await import('../src/components/AlertCard.jsx')).default;
    DeviceStatus = (await import('../src/components/DeviceStatus.jsx')).default;
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

  // TEST 1: Live Telemetry Pipeline
  it('E2E 1: Telemetry generated by Simulator -> Node-RED -> Firebase -> Backend API -> Frontend UI', async () => {
    const rawTelemetry = generateTelemetry();
    rawTelemetry.deviceId = 'smartsense-pi-01';
    rawTelemetry.temperature = 26.4;
    rawTelemetry.humidity = 55.2;
    rawTelemetry.distance = 42.0;
    rawTelemetry.motion = false;
    rawTelemetry.sound = false;
    rawTelemetry.touch = false;

    await simulateTelemetryPipeline(rawTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // Fetch through frontend sensors API service
    const reading = await sensorsApi.getLatest('smartsense-pi-01');
    assert.ok(reading);
    assert.equal(reading.deviceId, 'smartsense-pi-01');
    assert.equal(reading.temperature, 26.4);
    assert.equal(reading.humidity, 55.2);
    assert.equal(reading.distance, 42.0);

    // Render through SensorCard
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(SensorCard, {
        title: 'Temperature',
        value: reading.temperature,
        unit: '°C',
        status: reading.temperatureStatus || 'NORMAL',
        statusLabel: 'OPTIMAL',
      })
    );
    assert.ok(html.includes('26.4'));
    assert.ok(html.includes('OPTIMAL'));
  });

  // TEST 2: Alert Trigger & Acknowledgement Pipeline
  it('E2E 2: SOS Trigger -> Node-RED -> Firebase Alert -> Frontend AlertCard -> Acknowledge PATCH', async () => {
    const rawTelemetry = generateTelemetry();
    rawTelemetry.deviceId = 'smartsense-pi-01';
    rawTelemetry.touch = true; // SOS Panic trigger

    await simulateTelemetryPipeline(rawTelemetry, { securityMode: 'DISARMED', alertCooldowns: {} });

    // Fetch alerts via frontend API service
    const alerts = await alertsApi.getAlerts();
    assert.ok(alerts.length > 0);
    const sosAlert = alerts.find((a) => a.type === 'SOS_ACTIVATED' || a.severity === 'CRITICAL');
    assert.ok(sosAlert, 'SOS Alert must be present');
    assert.equal(sosAlert.acknowledged, false);

    // Verify AlertCard renders Acknowledge button
    const htmlUnacked = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AlertCard, {
        alert: sosAlert,
        onAcknowledge: () => {},
      })
    );
    assert.ok(htmlUnacked.includes('Acknowledge'));

    // Acknowledge through frontend API service
    const ackResult = await alertsApi.acknowledgeAlert(sosAlert.alertId);
    assert.equal(ackResult.acknowledged, true);

    // Verify AlertCard now displays Acknowledged
    const updatedAlerts = await alertsApi.getAlerts();
    const updatedSos = updatedAlerts.find((a) => a.alertId === sosAlert.alertId);
    assert.equal(updatedSos.acknowledged, true);

    const htmlAcked = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AlertCard, {
        alert: updatedSos,
        onAcknowledge: () => {},
      })
    );
    assert.ok(htmlAcked.includes('Acknowledged'));
  });

  // TEST 3: Security Mode Arming & Breach Detection Pipeline
  it('E2E 3: Frontend PATCHes ARMED mode -> Node-RED observes ARMED -> Motion triggers critical alert', async () => {
    // 1. Frontend arms the system
    const armRes = await devicesApi.updateSecurityMode('smartsense-pi-01', 'ARMED');
    assert.equal(armRes.securityMode, 'ARMED');

    // 2. Verify device reflects ARMED
    const dev = await devicesApi.getDeviceById('smartsense-pi-01');
    assert.equal(dev.securityMode, 'ARMED');

    // 3. Motion occurs while ARMED
    const motionTelemetry = generateTelemetry();
    motionTelemetry.deviceId = 'smartsense-pi-01';
    motionTelemetry.motion = true;

    // Node-RED processes with flowContext having ARMED securityMode (read from Firebase)
    await simulateTelemetryPipeline(motionTelemetry, { securityMode: dev.securityMode, alertCooldowns: {} });

    // 4. Verify critical breach alert appears in frontend alerts API
    const alerts = await alertsApi.getAlerts();
    const breachAlert = alerts.find((a) => a.type === 'MOTION_BREACH');
    assert.ok(breachAlert, 'MOTION_BREACH alert should have been recorded');
    assert.equal(breachAlert.severity, 'CRITICAL');
  });

  // TEST 4: Analytics Aggregation Pipeline
  it('E2E 4: Multiple telemetry readings -> Node-RED -> Firebase -> Backend Analytics -> Frontend Analytics', async () => {
    // Inject readings
    for (let i = 0; i < 3; i++) {
      const reading = generateTelemetry();
      reading.deviceId = 'smartsense-pi-01';
      reading.temperature = 25.0 + i;
      reading.humidity = 60.0 + i;
      reading.distance = 40.0 + i;
      await simulateTelemetryPipeline(reading, { securityMode: 'DISARMED', alertCooldowns: {} });
    }

    // Fetch analytics via frontend analytics API service
    const analytics = await analyticsApi.getAnalytics('smartsense-pi-01', '1h');
    assert.ok(analytics);
    assert.equal(analytics.deviceId, 'smartsense-pi-01');
    assert.equal(analytics.range, '1h');
    assert.ok(analytics.temperature.length >= 3);
    assert.ok(analytics.statistics.temperature.average > 0);
    assert.ok(analytics.totalReadings >= 3);
  });
});
