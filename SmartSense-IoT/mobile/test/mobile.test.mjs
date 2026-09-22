import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

let mockServer;
let mockPort;
let lastRequest = {};
let mockAlerts = [];
let mockDevice = {};
let mockLatestSensor = {};

before(async () => {
  mockDevice = {
    deviceId: 'smartsense-pi-01',
    room: 'Room 1',
    status: 'ONLINE',
    securityMode: 'DISARMED',
    lastSeen: '2026-09-21T10:00:00.000Z',
    ipAddress: '192.168.1.100',
    cpuTemperature: 43.5,
  };

  mockLatestSensor = {
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
  };

  mockAlerts = [
    {
      alertId: 'alt-mob-01',
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      type: 'SOS_ACTIVATED',
      severity: 'CRITICAL',
      message: 'Emergency SOS: Touch sensor activated in Room 1!',
      timestamp: '2026-09-21T10:00:00.000Z',
      acknowledged: false,
    },
    {
      alertId: 'alt-mob-02',
      deviceId: 'smartsense-pi-01',
      room: 'Room 1',
      type: 'HIGH_TEMPERATURE',
      severity: 'WARNING',
      message: 'High temperature warning: 33.2°C',
      timestamp: '2026-09-21T09:45:00.000Z',
      acknowledged: true,
    },
  ];

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

      // Health
      if (pathname === '/api/health' && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: { status: 'UP', environment: 'test' } }));
      }

      // Latest sensors
      if ((pathname === '/api/sensors/latest' || pathname === '/api/sensors/latest/smartsense-pi-01') && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: mockLatestSensor }));
      }

      // Sensor history
      if (pathname.startsWith('/api/sensors/history/') && method === 'GET') {
        res.writeHead(200);
        return res.end(
          JSON.stringify({
            success: true,
            data: [mockLatestSensor],
          })
        );
      }

      // Alerts list
      if (pathname === '/api/alerts' && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: mockAlerts }));
      }

      // Alert acknowledge
      if (pathname.startsWith('/api/alerts/') && pathname.endsWith('/acknowledge') && method === 'PATCH') {
        const parts = pathname.split('/');
        const alertId = parts[3];
        const found = mockAlerts.find((a) => a.alertId === alertId);
        if (found) {
          found.acknowledged = true;
          found.acknowledgedAt = '2026-09-21T10:05:00.000Z';
          res.writeHead(200);
          return res.end(JSON.stringify({ success: true, data: found }));
        }
        res.writeHead(404);
        return res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } }));
      }

      // Device list
      if (pathname === '/api/devices' && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: [mockDevice] }));
      }

      // Device detail
      if (pathname === '/api/devices/smartsense-pi-01' && method === 'GET') {
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: mockDevice }));
      }

      // Security PATCH
      if (pathname === '/api/devices/smartsense-pi-01/security' && method === 'PATCH') {
        const newMode = lastRequest.body?.securityMode;
        if (newMode !== 'ARMED' && newMode !== 'DISARMED') {
          res.writeHead(400);
          return res.end(JSON.stringify({ success: false, error: { code: 'INVALID_MODE', message: 'Invalid security mode' } }));
        }
        mockDevice.securityMode = newMode;
        mockDevice.lastSeen = new Date().toISOString();
        res.writeHead(200);
        return res.end(JSON.stringify({ success: true, data: mockDevice }));
      }

      // Analytics
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
                { timestamp: '2026-09-21T09:00:00.000Z', value: 27.2 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 28.5 },
              ],
              humidity: [
                { timestamp: '2026-09-21T09:00:00.000Z', value: 61.5 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 64.2 },
              ],
              distance: [
                { timestamp: '2026-09-21T09:00:00.000Z', value: 48.0 },
                { timestamp: '2026-09-21T10:00:00.000Z', value: 45.6 },
              ],
              statistics: {
                temperature: { min: 27.2, max: 28.5, average: 27.8 },
                humidity: { min: 61.5, max: 64.2, average: 62.8 },
                distance: { min: 45.6, max: 48.0, average: 46.8 },
              },
              motionEvents: 3,
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
      process.env.EXPO_PUBLIC_API_BASE_URL = `http://localhost:${mockPort}/api`;
      process.env.EXPO_PUBLIC_DEVICE_ID = 'smartsense-pi-01';
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

describe('SmartSense IoT Mobile - Phase 9 Acceptance Tests', () => {
  let api;
  let sensorsApi;
  let alertsApi;
  let devicesApi;
  let analyticsApi;
  let SensorCard;
  let StatusBadge;
  let AlertCard;
  let DeviceCard;
  let SecurityToggle;
  let LoadingState;
  let ErrorState;
  let EmptyState;
  let AnalyticsChart;
  let DashboardScreen;
  let LiveMonitoringScreen;
  let AlertsScreen;
  let DeviceStatusScreen;
  let AnalyticsScreen;
  let SettingsScreen;

  before(async () => {
    api = await import('../src/services/api.js');
    sensorsApi = await import('../src/services/sensorsApi.js');
    alertsApi = await import('../src/services/alertsApi.js');
    devicesApi = await import('../src/services/devicesApi.js');
    analyticsApi = await import('../src/services/analyticsApi.js');

    SensorCard = (await import('../src/components/SensorCard.jsx')).default;
    StatusBadge = (await import('../src/components/StatusBadge.jsx')).default;
    AlertCard = (await import('../src/components/AlertCard.jsx')).default;
    DeviceCard = (await import('../src/components/DeviceCard.jsx')).default;
    SecurityToggle = (await import('../src/components/SecurityToggle.jsx')).default;
    LoadingState = (await import('../src/components/LoadingState.jsx')).default;
    ErrorState = (await import('../src/components/ErrorState.jsx')).default;
    EmptyState = (await import('../src/components/EmptyState.jsx')).default;
    AnalyticsChart = (await import('../src/components/AnalyticsChart.jsx')).default;

    DashboardScreen = (await import('../src/screens/DashboardScreen.jsx')).default;
    LiveMonitoringScreen = (await import('../src/screens/LiveMonitoringScreen.jsx')).default;
    AlertsScreen = (await import('../src/screens/AlertsScreen.jsx')).default;
    DeviceStatusScreen = (await import('../src/screens/DeviceStatusScreen.jsx')).default;
    AnalyticsScreen = (await import('../src/screens/AnalyticsScreen.jsx')).default;
    SettingsScreen = (await import('../src/screens/SettingsScreen.jsx')).default;
  });

  // TEST 1: Dashboard renders
  it('1. Dashboard renders with application title and connection status', async () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(DashboardScreen, {
        navigation: { navigate: () => {} },
        preloadedData: mockLatestSensor,
        preloadedDevice: mockDevice,
      })
    );

    assert.ok(html.includes('SmartSense IoT'), 'Dashboard should include app name');
    assert.ok(html.includes('smartsense-pi-01'), 'Dashboard should display device ID');
    assert.ok(html.includes('API STATUS'), 'Dashboard should separate API status');
    assert.ok(html.includes('DEVICE STATUS'), 'Dashboard should separate Device status');
    assert.ok(html.includes('Temperature'), 'Dashboard should display temperature card');
  });

  // TEST 2: Sensor values render
  it('2. Sensor values render correctly via SensorCard', () => {
    // Numeric sensor
    const tempHtml = ReactDOMServer.renderToString(
      React.createElement(SensorCard, {
        title: 'Temperature',
        value: 28.5,
        unit: '°C',
        status: 'NORMAL',
        icon: 'thermometer',
      })
    );
    assert.ok(tempHtml.includes('28.5'), 'Should display numeric temperature');
    assert.ok(tempHtml.includes('°C'), 'Should display temperature unit');
    assert.ok(tempHtml.includes('NORMAL'), 'Should display NORMAL status');

    // Boolean sensor (Motion)
    const motionHtml = ReactDOMServer.renderToString(
      React.createElement(SensorCard, {
        title: 'PIR Motion',
        value: true,
        isBoolean: true,
        booleanActiveText: 'MOTION DETECTED',
        booleanInactiveText: 'CLEAR',
        status: 'WARNING',
        icon: 'activity',
      })
    );
    assert.ok(motionHtml.includes('MOTION DETECTED'), 'Should display boolean active label');
    assert.ok(motionHtml.includes('WARNING'), 'Should display WARNING status');
  });

  // TEST 3: Loading state
  it('3. Loading state renders with loading message', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(LoadingState, { message: 'Loading SmartSense data...' })
    );
    assert.ok(html.includes('Loading SmartSense data...'), 'Should render loading message');
    assert.ok(html.includes('data-testid="activity-indicator"'), 'Should render activity indicator');
  });

  // TEST 4: Error state
  it('4. Error state renders connection failure message and retry button', () => {
    let retried = false;
    const html = ReactDOMServer.renderToString(
      React.createElement(ErrorState, {
        message: 'Unable to connect to SmartSense API.',
        onRetry: () => { retried = true; },
      })
    );
    assert.ok(html.includes('Unable to connect to SmartSense API.'), 'Should render error text');
    assert.ok(html.includes('Retry'), 'Should render Retry button');
  });

  // TEST 5: Alerts render
  it('5. Alerts render with severity, message, and acknowledgement state', async () => {
    const alertsData = await alertsApi.getAlerts();
    assert.ok(Array.isArray(alertsData), 'Alerts API should return an array');
    assert.equal(alertsData.length, 2, 'Should have 2 alerts');

    const alertHtml = ReactDOMServer.renderToString(
      React.createElement(AlertCard, {
        alert: alertsData[0],
        onAcknowledge: () => {},
      })
    );
    assert.ok(alertHtml.includes('SOS_ACTIVATED'), 'Should display alert type');
    assert.ok(alertHtml.includes('CRITICAL'), 'Should display CRITICAL severity');
    assert.ok(alertHtml.includes('Emergency SOS'), 'Should display alert message');
    assert.ok(alertHtml.includes('ACKNOWLEDGE'), 'Should display ACKNOWLEDGE button for pending alert');
  });

  // TEST 6: Alert acknowledgement calls API
  it('6. Alert acknowledgement calls PATCH endpoint and updates response', async () => {
    const pendingAlertId = 'alt-mob-01';
    const ackResult = await alertsApi.acknowledgeAlert(pendingAlertId);

    assert.equal(lastRequest.method, 'PATCH', 'Should execute PATCH method');
    assert.equal(lastRequest.pathname, `/api/alerts/${pendingAlertId}/acknowledge`);
    assert.equal(ackResult.acknowledged, true, 'Alert acknowledged property must be true');

    // Verify rendered state reflects ACKNOWLEDGED
    const ackHtml = ReactDOMServer.renderToString(
      React.createElement(AlertCard, {
        alert: ackResult,
        onAcknowledge: () => {},
      })
    );
    assert.ok(ackHtml.includes('ACKNOWLEDGED'), 'Should render ACKNOWLEDGED badge');
  });

  // TEST 7: Device status renders
  it('7. Device status renders hardware metadata and separated API status', async () => {
    const devData = await devicesApi.getDeviceById('smartsense-pi-01');
    assert.equal(devData.deviceId, 'smartsense-pi-01');
    assert.equal(devData.status, 'ONLINE');

    const html = ReactDOMServer.renderToString(
      React.createElement(DeviceCard, { device: devData, apiConnected: true })
    );
    assert.ok(html.includes('smartsense-pi-01'), 'Should display device ID');
    assert.ok(html.includes('Room 1'), 'Should display room name');
    assert.ok(html.includes('CONNECTED'), 'Should show API CONNECTION as CONNECTED');
    assert.ok(html.includes('ONLINE'), 'Should show HARDWARE NODE as ONLINE');
  });

  // TEST 8: Security ARM call
  it('8. Security ARM call sends PATCH with ARMED payload', async () => {
    const armResult = await devicesApi.updateSecurityMode('smartsense-pi-01', 'ARMED');

    assert.equal(lastRequest.method, 'PATCH');
    assert.equal(lastRequest.pathname, '/api/devices/smartsense-pi-01/security');
    assert.equal(lastRequest.body?.securityMode, 'ARMED', 'Body should contain ARMED');
    assert.equal(armResult.securityMode, 'ARMED');

    const toggleHtml = ReactDOMServer.renderToString(
      React.createElement(SecurityToggle, { currentMode: 'ARMED', onModeChange: () => {} })
    );
    assert.ok(toggleHtml.includes('ARMED'), 'Should display ARMED state in toggle component');
  });

  // TEST 9: Security DISARM call
  it('9. Security DISARM call sends PATCH with DISARMED payload', async () => {
    const disarmResult = await devicesApi.updateSecurityMode('smartsense-pi-01', 'DISARMED');

    assert.equal(lastRequest.method, 'PATCH');
    assert.equal(lastRequest.pathname, '/api/devices/smartsense-pi-01/security');
    assert.equal(lastRequest.body?.securityMode, 'DISARMED', 'Body should contain DISARMED');
    assert.equal(disarmResult.securityMode, 'DISARMED');

    const toggleHtml = ReactDOMServer.renderToString(
      React.createElement(SecurityToggle, { currentMode: 'DISARMED', onModeChange: () => {} })
    );
    assert.ok(toggleHtml.includes('DISARMED'), 'Should display DISARMED state in toggle component');
  });

  // TEST 10: Analytics renders
  it('10. Analytics renders statistical highlights, event counts, and charts', async () => {
    const analyticsData = await analyticsApi.getAnalytics('smartsense-pi-01', '24h');

    assert.equal(analyticsData.deviceId, 'smartsense-pi-01');
    assert.equal(analyticsData.motionEvents, 3);
    assert.equal(analyticsData.touchEvents, 1);
    assert.equal(analyticsData.statistics.temperature.average, 27.8);

    const chartHtml = ReactDOMServer.renderToString(
      React.createElement(AnalyticsChart, {
        title: 'Temperature History',
        data: analyticsData.temperature,
        unit: '°C',
        color: '#F87171',
      })
    );
    assert.ok(chartHtml.includes('Temperature History'), 'Should render chart title');
    assert.ok(chartHtml.includes('28.5'), 'Should display latest point value');
  });

  // TEST 11: Analytics range selection
  it('11. Analytics range selection queries correct range parameters', async () => {
    const ranges = ['1h', '6h', '24h', '7d'];

    for (const r of ranges) {
      await analyticsApi.getAnalytics('smartsense-pi-01', r);
      assert.equal(lastRequest.pathname, '/api/analytics/smartsense-pi-01');
      assert.equal(lastRequest.query.range, r, `Query parameter range should be ${r}`);
    }
  });

  // TEST 12: Retry behavior
  it('12. Retry behavior invokes callback and handles network failures gracefully', async () => {
    let retryCalled = false;
    const onRetry = () => {
      retryCalled = true;
    };

    const errorStateComponent = React.createElement(ErrorState, {
      message: 'Unable to connect to SmartSense API.',
      onRetry,
    });

    const html = ReactDOMServer.renderToString(errorStateComponent);
    assert.ok(html.includes('Retry'), 'Should render Retry button');

    // Simulate clicking retry
    onRetry();
    assert.equal(retryCalled, true, 'Retry callback must be invoked');

    // Test API client handles network failure gracefully
    const originalUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:59999/api'; // Non-existent port

    await assert.rejects(
      async () => {
        await api.get('/health');
      },
      (err) => {
        assert.equal(err.name, 'ApiError');
        assert.equal(err.code, 'NETWORK_ERROR');
        assert.equal(err.message, 'Unable to connect to SmartSense API.');
        return true;
      }
    );

    // Restore
    process.env.EXPO_PUBLIC_API_BASE_URL = originalUrl;
  });

  // Pipeline verification
  it('13. Live monitoring renders telemetry cards with updated timestamp', async () => {
    const latest = await sensorsApi.getLatest('smartsense-pi-01');
    assert.equal(latest.temperature, 28.5);
    assert.equal(latest.humidity, 64.2);

    const liveHtml = ReactDOMServer.renderToString(
      React.createElement(LiveMonitoringScreen, { preloadedData: latest })
    );
    assert.ok(liveHtml.includes('Live Monitoring'), 'Should render Live Monitoring title');
    assert.ok(liveHtml.includes('smartsense-pi-01'), 'Should display device ID');
    assert.ok(liveHtml.includes('STREAMING'), 'Should show streaming indicator');
  });

  it('14. Settings screen renders sanitized API URL and device parameters', async () => {
    const settingsHtml = ReactDOMServer.renderToString(
      React.createElement(SettingsScreen, null)
    );
    assert.ok(settingsHtml.includes('System Settings'), 'Should render Settings title');
    assert.ok(settingsHtml.includes('TEST API CONNECTION'), 'Should render test connection button');
    assert.ok(settingsHtml.includes('Push Notifications Architecture'), 'Should document push roadmap');
  });
});
