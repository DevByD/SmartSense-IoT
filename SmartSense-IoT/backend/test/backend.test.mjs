import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import firebaseService from '../src/services/firebase.service.js';

describe('SmartSense IoT Backend REST API Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start Express app on ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });
  });

  beforeEach(() => {
    // Seed in-memory test database with predictable test state
    const now = new Date().toISOString();
    firebaseService.setMockData({
      devices: {
        'smartsense-pi-01': {
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          status: 'ONLINE',
          securityMode: 'DISARMED',
          lastSeen: now,
        },
      },
      latest: {
        'smartsense-pi-01': {
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          temperature: 28.5,
          humidity: 64.2,
          distance: 45.6,
          motion: false,
          sound: false,
          touch: false,
          timestamp: now,
          processedAt: now,
        },
      },
      readings: {
        'smartsense-pi-01': {
          'read-001': {
            deviceId: 'smartsense-pi-01',
            room: 'Room 1',
            temperature: 27.8,
            humidity: 62.0,
            distance: 48.0,
            motion: false,
            sound: false,
            touch: false,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            processedAt: now,
          },
          'read-002': {
            deviceId: 'smartsense-pi-01',
            room: 'Room 1',
            temperature: 29.2,
            humidity: 66.4,
            distance: 42.0,
            motion: true,
            sound: true,
            touch: false,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            processedAt: now,
          },
          'read-003': {
            deviceId: 'smartsense-pi-01',
            room: 'Room 1',
            temperature: 28.5,
            humidity: 64.2,
            distance: 45.6,
            motion: false,
            sound: false,
            touch: true,
            timestamp: now,
            processedAt: now,
          },
        },
      },
      alerts: {
        'alt-test-01': {
          alertId: 'alt-test-01',
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          type: 'SOS_ACTIVATED',
          severity: 'CRITICAL',
          message: 'Emergency SOS: Physical touch key activated in Room 1!',
          timestamp: now,
          acknowledged: false,
        },
        'alt-test-02': {
          alertId: 'alt-test-02',
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          type: 'HIGH_TEMPERATURE',
          severity: 'WARNING',
          message: 'High temperature warning (33.0°C)',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          acknowledged: true,
        },
      },
    });
  });

  // 1. Health endpoint
  it('1. GET /api/health should return UP status and environment', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'UP');
    assert.equal(typeof body.data.environment, 'string');
    assert.ok(body.data.timestamp);
  });

  // 2. Latest sensor endpoint
  it('2. GET /api/sensors/latest and /latest/:deviceId should return current reading', async () => {
    // Default device
    const res1 = await fetch(`${baseUrl}/api/sensors/latest`);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.success, true);
    assert.equal(body1.data.deviceId, 'smartsense-pi-01');
    assert.equal(body1.data.temperature, 28.5);
    assert.equal(body1.data.humidity, 64.2);

    // Param device
    const res2 = await fetch(`${baseUrl}/api/sensors/latest/smartsense-pi-01`);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.success, true);
    assert.equal(body2.data.deviceId, 'smartsense-pi-01');
  });

  // 3. Device endpoint
  it('3. GET /api/devices and /api/devices/:deviceId should return registered devices', async () => {
    const resAll = await fetch(`${baseUrl}/api/devices`);
    assert.equal(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.equal(bodyAll.success, true);
    assert.ok(Array.isArray(bodyAll.data));
    assert.equal(bodyAll.data.length, 1);
    assert.equal(bodyAll.data[0].deviceId, 'smartsense-pi-01');

    const resSingle = await fetch(`${baseUrl}/api/devices/smartsense-pi-01`);
    assert.equal(resSingle.status, 200);
    const bodySingle = await resSingle.json();
    assert.equal(bodySingle.success, true);
    assert.equal(bodySingle.data.deviceId, 'smartsense-pi-01');
    assert.equal(bodySingle.data.status, 'ONLINE');
    assert.equal(bodySingle.data.securityMode, 'DISARMED');
  });

  // 4. Alerts endpoint
  it('4. GET /api/alerts should return list of alerts and support query filtering', async () => {
    const resAll = await fetch(`${baseUrl}/api/alerts`);
    assert.equal(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.equal(bodyAll.success, true);
    assert.equal(bodyAll.data.length, 2);

    // Filter by severity
    const resCrit = await fetch(`${baseUrl}/api/alerts?severity=CRITICAL`);
    const bodyCrit = await resCrit.json();
    assert.equal(bodyCrit.data.length, 1);
    assert.equal(bodyCrit.data[0].severity, 'CRITICAL');

    // Filter by acknowledged=false
    const resUnack = await fetch(`${baseUrl}/api/alerts?acknowledged=false`);
    const bodyUnack = await resUnack.json();
    assert.equal(bodyUnack.data.length, 1);
    assert.equal(bodyUnack.data[0].acknowledged, false);
  });

  // 5. Alert by ID
  it('5. GET /api/alerts/:alertId should return one alert', async () => {
    const res = await fetch(`${baseUrl}/api/alerts/alt-test-01`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.alertId, 'alt-test-01');
    assert.equal(body.data.type, 'SOS_ACTIVATED');
  });

  // 6. Alert acknowledgement
  it('6. PATCH /api/alerts/:alertId/acknowledge should update acknowledged status to true', async () => {
    const res = await fetch(`${baseUrl}/api/alerts/alt-test-01/acknowledge`, {
      method: 'PATCH',
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.acknowledged, true);
    assert.ok(body.data.acknowledgedAt);

    // Verify subsequent GET reflects acknowledged=true
    const verifyRes = await fetch(`${baseUrl}/api/alerts/alt-test-01`);
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.data.acknowledged, true);
  });

  // 7. Analytics endpoint
  it('7. GET /api/analytics/:deviceId should return Chart.js-compatible time series and stats', async () => {
    const res = await fetch(`${baseUrl}/api/analytics/smartsense-pi-01?range=1h`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.deviceId, 'smartsense-pi-01');
    assert.equal(body.data.range, '1h');
    assert.ok(Array.isArray(body.data.temperature));
    assert.ok(Array.isArray(body.data.humidity));
    assert.ok(Array.isArray(body.data.distance));
    assert.equal(body.data.temperature.length, 3);
    assert.equal(body.data.motionEvents, 1);
    assert.equal(body.data.soundEvents, 1);
    assert.equal(body.data.touchEvents, 1);
    assert.ok(body.data.statistics.temperature.average > 0);
  });

  // 8. Security mode validation
  it('8. PATCH /api/devices/:deviceId/security should validate securityMode and accept ARMED/DISARMED', async () => {
    // Valid update to ARMED
    const resArmed = await fetch(`${baseUrl}/api/devices/smartsense-pi-01/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'ARMED' }),
    });
    assert.equal(resArmed.status, 200);
    const bodyArmed = await resArmed.json();
    assert.equal(bodyArmed.success, true);
    assert.equal(bodyArmed.data.securityMode, 'ARMED');

    // Reject invalid mode
    const resInvalid = await fetch(`${baseUrl}/api/devices/smartsense-pi-01/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ securityMode: 'INVALID_MODE' }),
    });
    assert.equal(resInvalid.status, 400);
    const bodyInvalid = await resInvalid.json();
    assert.equal(bodyInvalid.success, false);
    assert.equal(bodyInvalid.error.code, 'INVALID_SECURITY_MODE');
  });

  // 9. Invalid device ID
  it('9. GET /api/devices/:deviceId should return 404 for unknown device', async () => {
    const res = await fetch(`${baseUrl}/api/devices/nonexistent-device-xyz`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'DEVICE_NOT_FOUND');
  });

  // 10. Invalid query parameters
  it('10. Should reject invalid query parameters with 400 Bad Request', async () => {
    // Invalid severity
    const resSev = await fetch(`${baseUrl}/api/alerts?severity=UNKNOWN_SEV`);
    assert.equal(resSev.status, 400);
    const bodySev = await resSev.json();
    assert.equal(bodySev.error.code, 'INVALID_SEVERITY');

    // Invalid history limit
    const resHist = await fetch(`${baseUrl}/api/sensors/history/smartsense-pi-01?limit=9999`);
    assert.equal(resHist.status, 400);
    const bodyHist = await resHist.json();
    assert.equal(bodyHist.error.code, 'INVALID_LIMIT');

    // Invalid analytics range
    const resRange = await fetch(`${baseUrl}/api/analytics/smartsense-pi-01?range=99days`);
    assert.equal(resRange.status, 400);
    const bodyRange = await resRange.json();
    assert.equal(bodyRange.error.code, 'INVALID_RANGE');
  });

  // 11. 404 route
  it('11. Undefined route should return 404 Not Found in standardized format', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route-404`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  // 12. Error handling & Malformed JSON
  it('12. Malformed JSON payload should return 400 without crashing server', async () => {
    const res = await fetch(`${baseUrl}/api/devices/smartsense-pi-01/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"securityMode": ARMED_WITHOUT_QUOTES}',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INVALID_JSON');
  });
});
