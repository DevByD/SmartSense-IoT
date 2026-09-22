import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Set environment variable BEFORE importing services
let mockServer;
let mockPort;
let lastRequest = {};

before(async () => {
  mockServer = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${mockPort}`);
    const pathname = url.pathname;
    const method = req.method;

    lastRequest = {
      pathname,
      method,
      query: Object.fromEntries(url.searchParams.entries()),
    };

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (body) {
        try {
          lastRequest.body = JSON.parse(body);
        } catch {
          lastRequest.body = body;
        }
      }

      res.setHeader('Content-Type', 'application/json');

      // 1. Health
      if (pathname === '/api/health' && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: { status: 'UP', environment: 'test' } }));
      }

      // 2. Latest sensors
      if ((pathname === '/api/sensors/latest' || pathname === '/api/sensors/latest/smartsense-pi-01') && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: {
              deviceId: 'smartsense-pi-01',
              room: 'Room 1',
              temperature: 28.5,
              humidity: 64.2,
              distance: 45.6,
              motion: false,
              sound: false,
              touch: false,
              temperatureStatus: 'NORMAL',
              humidityStatus: 'NORMAL',
              distanceStatus: 'NORMAL',
              motionStatus: 'NO_MOTION',
              soundStatus: 'NORMAL',
              touchStatus: 'NORMAL',
              timestamp: '2026-09-21T10:00:00.000Z',
            },
          })
        );
      }

      // 3. Sensor history
      if (pathname.startsWith('/api/sensors/history/') && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: [
              {
                deviceId: 'smartsense-pi-01',
                temperature: 28.5,
                humidity: 64.2,
                distance: 45.6,
                timestamp: '2026-09-21T10:00:00.000Z',
              },
            ],
          })
        );
      }

      // 4. Alerts
      if (pathname === '/api/alerts' && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: [
              {
                alertId: 'alt-101',
                deviceId: 'smartsense-pi-01',
                room: 'Room 1',
                type: 'SOS_ACTIVATED',
                severity: 'CRITICAL',
                message: 'Emergency SOS: Touch sensor activated in Room 1!',
                timestamp: '2026-09-21T10:00:00.000Z',
                acknowledged: false,
              },
              {
                alertId: 'alt-102',
                deviceId: 'smartsense-pi-01',
                room: 'Room 1',
                type: 'HIGH_TEMPERATURE',
                severity: 'WARNING',
                message: 'High temperature warning: 33.5°C',
                timestamp: '2026-09-21T09:50:00.000Z',
                acknowledged: true,
              },
            ],
          })
        );
      }

      // 5. Alert acknowledge
      if (pathname === '/api/alerts/alt-101/acknowledge' && method === 'PATCH') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: {
              alertId: 'alt-101',
              acknowledged: true,
              acknowledgedAt: '2026-09-21T10:05:00.000Z',
            },
          })
        );
      }

      // 6. Devices
      if (pathname === '/api/devices' && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: [
              {
                deviceId: 'smartsense-pi-01',
                room: 'Room 1',
                status: 'ONLINE',
                securityMode: 'DISARMED',
                lastSeen: '2026-09-21T10:00:00.000Z',
              },
            ],
          })
        );
      }

      if (pathname === '/api/devices/smartsense-pi-01' && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: {
              deviceId: 'smartsense-pi-01',
              room: 'Room 1',
              status: 'ONLINE',
              securityMode: 'DISARMED',
              lastSeen: '2026-09-21T10:00:00.000Z',
              ipAddress: '192.168.1.100',
              cpuTemperature: 43.5,
              memoryUsage: 38.2,
            },
          })
        );
      }

      // 7. Security PATCH
      if (pathname === '/api/devices/smartsense-pi-01/security' && method === 'PATCH') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: {
              deviceId: 'smartsense-pi-01',
              securityMode: lastRequest.body?.securityMode || 'ARMED',
              updatedAt: '2026-09-21T10:06:00.000Z',
            },
          })
        );
      }

      // 8. Analytics
      if (pathname === '/api/analytics/smartsense-pi-01' && method === 'GET') {
        const range = url.searchParams.get('range') || '24h';
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: {
              deviceId: 'smartsense-pi-01',
              range,
              temperature: [
                { timestamp: '2026-09-21T09:00:00.000Z', value: 27.5 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 28.5 },
              ],
              humidity: [
                { timestamp: '2026-09-21T09:00:00.000Z', value: 62.0 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 64.2 },
              ],
              distance: [
                { timestamp: '2026-09-21T09:00:00.000Z', value: 48.0 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 45.6 },
              ],
              statistics: {
                temperature: { min: 27.5, max: 28.5, average: 28.0 },
                humidity: { min: 62.0, max: 64.2, average: 63.1 },
                distance: { min: 45.6, max: 48.0, average: 46.8 },
              },
              motionEvents: 2,
              soundEvents: 1,
              touchEvents: 1,
              totalReadings: 2,
            },
          })
        );
      }

      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));
    });
  });

  await new Promise((resolve) => {
    mockServer.listen(0, () => {
      mockPort = mockServer.address().port;
      process.env.VITE_API_BASE_URL = `http://localhost:${mockPort}/api`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    if (mockServer) mockServer.close(resolve);
    else resolve();
  });
});

describe('SmartSense IoT Frontend - Phase 8 Integration Tests', () => {
  let sensorsApi;
  let alertsApi;
  let devicesApi;
  let analyticsApi;
  let SensorCard;
  let LoadingState;
  let ErrorState;
  let AlertCard;
  let DeviceStatus;
  let StatusBadge;

  before(async () => {
    // Dynamic import to pick up the updated process.env.VITE_API_BASE_URL
    sensorsApi = (await import('../src/services/sensorsApi.js')).default;
    alertsApi = (await import('../src/services/alertsApi.js')).default;
    devicesApi = (await import('../src/services/devicesApi.js')).default;
    analyticsApi = (await import('../src/services/analyticsApi.js')).default;

    SensorCard = (await import('../src/components/SensorCard.jsx')).default;
    LoadingState = (await import('../src/components/LoadingState.jsx')).default;
    ErrorState = (await import('../src/components/ErrorState.jsx')).default;
    AlertCard = (await import('../src/components/AlertCard.jsx')).default;
    DeviceStatus = (await import('../src/components/DeviceStatus.jsx')).default;
    StatusBadge = (await import('../src/components/StatusBadge.jsx')).default;
  });

  // 1. API service can fetch latest sensor data
  it('1. API service can fetch latest sensor data', async () => {
    const reading = await sensorsApi.getLatest('smartsense-pi-01');
    assert.ok(reading, 'Reading should not be null');
    assert.equal(reading.deviceId, 'smartsense-pi-01');
    assert.equal(reading.temperature, 28.5);
    assert.equal(reading.humidity, 64.2);
    assert.equal(reading.distance, 45.6);
    assert.equal(reading.motion, false);
    assert.equal(reading.sound, false);
    assert.equal(reading.touch, false);
    assert.equal(lastRequest.pathname, '/api/sensors/latest/smartsense-pi-01');
  });

  // 2. Sensor data renders
  it('2. Sensor data renders via SensorCard', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(SensorCard, {
        title: 'Temperature',
        subtitle: 'DHT22 Digital Sensor',
        value: 28.5,
        unit: '°C',
        status: 'NORMAL',
        statusLabel: 'OPTIMAL',
        stateType: 'normal',
      })
    );
    assert.ok(html.includes('Temperature'), 'Should render title');
    assert.ok(html.includes('28.5'), 'Should render temperature value');
    assert.ok(html.includes('°C'), 'Should render temperature unit');
    assert.ok(html.includes('OPTIMAL'), 'Should render status label');
  });

  // 3. Loading state works
  it('3. Loading state works and renders message', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(LoadingState, {
        message: 'Loading sensor data...',
      })
    );
    assert.ok(html.includes('Loading sensor data...'), 'Should render loading message');
    assert.ok(html.includes('spinner'), 'Should contain loading spinner');
  });

  // 4. Error state works
  it('4. Error state works and renders connection error', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ErrorState, {
        message: 'Unable to connect to SmartSense API.',
        onRetry: () => {},
      })
    );
    assert.ok(html.includes('Unable to connect to SmartSense API.'), 'Should render error message');
    assert.ok(html.includes('Reconnect'), 'Should render reconnect action');
  });

  // 5. Alerts load
  it('5. Alerts load from backend API', async () => {
    const alerts = await alertsApi.getAlerts();
    assert.ok(Array.isArray(alerts), 'Alerts should be an array');
    assert.equal(alerts.length, 2);
    assert.equal(alerts[0].alertId, 'alt-101');
    assert.equal(alerts[0].type, 'SOS_ACTIVATED');
    assert.equal(alerts[0].severity, 'CRITICAL');
    assert.equal(alerts[0].acknowledged, false);
  });

  // 6. Alert acknowledgement calls PATCH
  it('6. Alert acknowledgement calls PATCH endpoint and updates UI', async () => {
    const updated = await alertsApi.acknowledgeAlert('alt-101');
    assert.equal(lastRequest.method, 'PATCH');
    assert.equal(lastRequest.pathname, '/api/alerts/alt-101/acknowledge');
    assert.equal(updated.acknowledged, true);

    // Verify AlertCard renders Acknowledge button when unacknowledged
    const unackedHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AlertCard, {
        alert: {
          alertId: 'alt-101',
          type: 'SOS_ACTIVATED',
          severity: 'CRITICAL',
          message: 'Emergency SOS activated',
          room: 'Room 1',
          timestamp: '2026-09-21T10:00:00.000Z',
          acknowledged: false,
        },
        onAcknowledge: () => {},
      })
    );
    assert.ok(unackedHtml.includes('Acknowledge'), 'Should display Acknowledge button');

    // Verify AlertCard renders Acknowledged indicator when acknowledged
    const ackedHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AlertCard, {
        alert: {
          alertId: 'alt-101',
          type: 'SOS_ACTIVATED',
          severity: 'CRITICAL',
          message: 'Emergency SOS activated',
          room: 'Room 1',
          timestamp: '2026-09-21T10:00:00.000Z',
          acknowledged: true,
        },
        onAcknowledge: () => {},
      })
    );
    assert.ok(ackedHtml.includes('Acknowledged'), 'Should display Acknowledged status');
  });

  // 7. Device data loads
  it('7. Device data loads from backend API', async () => {
    const devices = await devicesApi.getDevices();
    assert.ok(Array.isArray(devices));
    assert.equal(devices.length, 1);

    const device = await devicesApi.getDeviceById('smartsense-pi-01');
    assert.equal(device.deviceId, 'smartsense-pi-01');
    assert.equal(device.room, 'Room 1');
    assert.equal(device.status, 'ONLINE');
    assert.equal(device.securityMode, 'DISARMED');

    // Render DeviceStatus component
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(DeviceStatus, { device })
    );
    assert.ok(html.includes('smartsense-pi-01'), 'Should preserve technical device ID smartsense-pi-01');
    assert.ok(html.includes('SmartRoom-01'), 'Should display SmartRoom-01 as primary device title');
    assert.ok(html.includes('ONLINE'), 'Should render ONLINE status');
  });

  // 8. Security mode calls PATCH
  it('8. Security mode toggle calls PATCH endpoint with ARMED', async () => {
    const result = await devicesApi.updateSecurityMode('smartsense-pi-01', 'ARMED');
    assert.equal(lastRequest.method, 'PATCH');
    assert.equal(lastRequest.pathname, '/api/devices/smartsense-pi-01/security');
    assert.deepEqual(lastRequest.body, { securityMode: 'ARMED' });
    assert.equal(result.securityMode, 'ARMED');
  });

  // 9. Analytics loads
  it('9. Analytics loads aggregate statistics and time series', async () => {
    const analytics = await analyticsApi.getAnalytics('smartsense-pi-01', '24h');
    assert.equal(analytics.deviceId, 'smartsense-pi-01');
    assert.equal(analytics.range, '24h');
    assert.ok(Array.isArray(analytics.temperature));
    assert.ok(Array.isArray(analytics.humidity));
    assert.ok(Array.isArray(analytics.distance));
    assert.equal(analytics.statistics.temperature.average, 28.0);
    assert.equal(analytics.motionEvents, 2);
    assert.equal(analytics.soundEvents, 1);
    assert.equal(analytics.touchEvents, 1);
    assert.equal(analytics.totalReadings, 2);
  });

  // 10. Range selection requests correct range
  it('10. Range selection requests correct range parameter', async () => {
    const ranges = ['1h', '6h', '24h', '7d'];
    for (const r of ranges) {
      await analyticsApi.getAnalytics('smartsense-pi-01', r);
      assert.equal(lastRequest.pathname, '/api/analytics/smartsense-pi-01');
      assert.equal(lastRequest.query.range, r);
    }
  });

  // 11. SmartRoom-01 display name verification
  it('11. Device display-name is SmartRoom-01 while keeping deviceId smartsense-pi-01', () => {
    const mockDevice = {
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      status: 'ONLINE',
      ipAddress: '192.168.1.100',
      cpuTemperature: 43.5,
      memoryUsage: 35.2,
      lastSeen: new Date().toISOString(),
    };
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(DeviceStatus, { device: mockDevice })
    );
    assert.ok(html.includes('SmartRoom-01'), 'Device title MUST display SmartRoom-01');
    assert.ok(html.includes('smartsense-pi-01'), 'Device ID MUST remain smartsense-pi-01');
    assert.ok(html.includes('Room 1'), 'Room must be displayed');
    assert.ok(html.includes('DHT22'), 'DHT22 must be in integrated sensor list');
  });

  // 12. SensorCard selected state and accessibility
  it('12. SensorCard renders selected state and keyboard accessibility attributes', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(SensorCard, {
        title: 'Temperature',
        subtitle: 'DHT22 Sensor',
        value: 28.5,
        unit: '°C',
        status: 'NORMAL',
        statusLabel: 'OPTIMAL',
        selected: true,
        onClick: () => {},
      })
    );
    assert.ok(html.includes('selected'), 'Selected card should have selected CSS class');
    assert.ok(html.includes('role="button"'), 'Clickable card must have role=button');
    assert.ok(html.includes('tabindex="0"'), 'Clickable card must be focusable via tabIndex 0');
    assert.ok(html.includes('aria-pressed="true"'), 'Selected card must have aria-pressed=true');
  });

  // 13. StatusBadge renders appropriate classes
  it('13. StatusBadge renders online, critical, and warning states', () => {
    const onlineHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'ONLINE', label: 'System Online' })
    );
    assert.ok(onlineHtml.includes('badge-online'));
    assert.ok(onlineHtml.includes('System Online'));

    const critHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'CRITICAL', label: 'ARMED' })
    );
    assert.ok(critHtml.includes('badge-critical'));
    assert.ok(critHtml.includes('ARMED'));

    const warnHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'WARNING', label: 'ELEVATED' })
    );
    assert.ok(warnHtml.includes('badge-warning'));
    assert.ok(warnHtml.includes('ELEVATED'));
  });
});
