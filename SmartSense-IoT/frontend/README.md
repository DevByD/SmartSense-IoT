# SmartSense IoT — React Frontend Dashboard (Phase 8)

The SmartSense IoT web dashboard is a modern, responsive single-page application built with React 18 and Vite. In Phase 8, all frontend mock data was removed and the dashboard was fully integrated with the real Express backend REST API (`http://localhost:5000/api`).

---

## 1. API Integration Architecture

The frontend communicates with the backend via a centralized service layer built with native ES `fetch`:

```
React UI Components & Pages
           │
           ▼
    useIotData Hook
           │
           ▼
 API Service Layer (frontend/src/services/)
   ├── api.js (Central request helper with error handling & JSON unwrapping)
   ├── sensorsApi.js (Telemetry endpoints)
   ├── alertsApi.js (Alerts & Acknowledgement)
   ├── devicesApi.js (Device status & Security ARM/DISARM)
   └── analyticsApi.js (Historical aggregations & time-series)
           │
           ▼
  Express Backend REST API (http://localhost:5000/api)
```

- **Clean Decoupling**: Components never execute direct `fetch` calls. All HTTP communication, query parameter serialization, and error transformations are centralized.
- **Single-Flight Polling**: Telemetry is automatically refreshed every 2.5 seconds with overlapping request prevention to eliminate race conditions.
- **Resilient States**: Components gracefully render `<LoadingState />` during initial loads and `<ErrorState />` with reconnection retry handlers during network disconnections.

---

## 2. Environment Variables

The frontend configuration is managed via Vite environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the backend REST API |
| `VITE_DEVICE_ID` | `smartsense-pi-01` | Default IoT gateway hardware identifier |

### Configuration Files
- `.env.example`: Template committed to version control.
- `.env`: Local environment file (gitignored, containing local endpoints).

---

## 3. API Base URL

The API base URL is defined in `src/config/api.config.js`:
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```
No endpoint URL is hard-coded inside components or pages.

---

## 4. Device ID Configuration

The default hardware gateway identifier is configured in `src/config/api.config.js`:
```javascript
export const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'smartsense-pi-01';
```
The application uses this identifier consistently across sensor queries, device monitoring, security arming/disarming, and analytics requests.

---

## 5. Development Setup

### Prerequisites
- Node.js v18+ (tested on Node.js v24.15)
- npm v9+

### Installation
```bash
cd SmartSense-IoT/frontend
npm install
```

Copy the example environment file:
```bash
cp .env.example .env
```

---

## 6. Running the Frontend

### Development Server
Starts the Vite dev server on port `5173` (matching backend CORS configuration):
```bash
npm run dev
```
Open browser at: `http://localhost:5173`

### Production Build
Verifies TypeScript/JSX compilation, bundles assets, and optimizes chunks:
```bash
npm run build
```

### Automated Integration & E2E Tests
Runs the Node.js test runner verifying API contracts, component rendering, and full telemetry pipeline:
```bash
npm test
```

---

## 7. Backend Requirement

The frontend requires the SmartSense Express REST API to be running:

```bash
cd SmartSense-IoT/backend
npm start
```
The backend listens on `http://localhost:5000` and provides:
- `GET /api/health`
- `GET /api/sensors/latest` & `/latest/:deviceId`
- `GET /api/sensors/history/:deviceId`
- `GET /api/alerts` & `/alerts/:alertId`
- `PATCH /api/alerts/:alertId/acknowledge`
- `GET /api/devices` & `/devices/:deviceId`
- `PATCH /api/devices/:deviceId/security`
- `GET /api/analytics/:deviceId`

CORS is pre-configured on the backend to accept requests from `http://localhost:5173`.

---

## 8. Available Pages & Features

### 1. Dashboard Overview (`/dashboard`)
- Real-time 6-sensor status grid (Temperature, Humidity, Ultrasonic Distance, PIR Motion, Sound, SOS Touch Key).
- Backend-computed status badges (`NORMAL`, `WARNING`, `CRITICAL`, `OPTIMAL`, `ELEVATED`, `OBSTACLE`, `BREACH DETECTED`, `CRITICAL SOS`).
- Mini telemetry trend charts for Temperature and Relative Humidity.
- Recent security alerts feed with inline acknowledgement.
- Real-time hardware gateway status tile.
- System-wide security mode toggle (ARMED / DISARMED).

### 2. Live Monitoring (`/live`)
- Dedicated telemetry console streaming live DHT22, HC-SR04, HC-SR501, microphone sound, and TTP223 touch sensor readings.
- Dynamic gauge meters with safety thresholds.
- Display of live timestamp, device ID, and zone location.

### 3. Historical Analytics (`/analytics`)
- High-resolution Chart.js time-series graphs for Temperature drift, Humidity fluctuations, and Obstacle proximity.
- Aggregate summary metrics: Minimum, Maximum, and Average statistics.
- Frequency breakdown of Motion, Sound, and SOS panic events.
- Time range selector: `1H`, `6H`, `24H`, and `7D`.

### 4. System Security & Telemetry Alerts (`/alerts`)
- Real-time alert feed synchronized with Firebase via the Express API.
- Filterable by `ALL`, `UNACKNOWLEDGED`, `CRITICAL`, `WARNING`, and `INFO`.
- KPI counters for total, critical, warning, and pending alerts.
- Single-click alert acknowledgement calling `PATCH /api/alerts/:alertId/acknowledge`.

### 5. Controller Device Status (`/device`)
- Gateway node heartbeat, uptime, and last seen timestamps.
- CPU temperature, RAM usage, and network IP.
- MQTT broker channel mappings.
- Interactive hardware GPIO allocation table for Raspberry Pi 4B.

### 6. Settings (`/settings`)
- Configurable warning limits for temperature and proximity.
- Adjustable telemetry polling cadence.
- Security surveillance policy toggle.

### 7. Login (`/login`)
- Gateway console authentication interface.

---

## 9. Live Telemetry Polling Behavior

- Telemetry is generated by the sensor simulator / Raspberry Pi hardware every 2 seconds.
- The dashboard polls `GET /api/sensors/latest/smartsense-pi-01` every **2500 ms**.
- Requests use an inflight guard (`isFetchingRef`) to ensure slow network connections never generate overlapping or hanging HTTP requests.
- Polling timers are automatically cleared when components unmount.

---

## 10. Alerts & Acknowledgement Flow

1. An anomaly or SOS panic trigger is detected by Node-RED or simulator.
2. Node-RED persists the alert record in Firebase under `/alerts/<alertId>.json`.
3. The frontend fetches the alert list via `GET /api/alerts`.
4. When the user clicks **Acknowledge**, the frontend executes:
   ```http
   PATCH /api/alerts/<alertId>/acknowledge
   ```
5. On success, the alert state updates in-place to `acknowledged: true`, showing the green "Acknowledged" badge.
6. If the request fails, an inline error is displayed without crashing the UI.

---

## 11. Historical Analytics & Time Range Selection

- The analytics page queries `GET /api/analytics/:deviceId?range=<range>`.
- Supported ranges: `1h`, `6h`, `24h`, `7d`.
- When a new range is selected, the page triggers an immediate re-fetch and displays `<LoadingState />`.
- If no historical records exist in the selected window, charts render clean empty states with null-resilient statistics.

---

## 12. Troubleshooting

### Dashboard shows "Unable to connect to SmartSense API"
- Verify that the Express backend is running on `http://localhost:5000`:
  ```bash
  curl http://localhost:5000/api/health
  ```
- Check that `VITE_API_BASE_URL` in `.env` is set to `http://localhost:5000/api`.

### CORS Error in Browser Console
- Ensure the React application is running on port `5173`. If running on another port, verify `FRONTEND_URL` in `SmartSense-IoT/backend/.env`.

### Sensor readings show "--" or values do not change
- Ensure the simulator or Raspberry Pi is actively publishing telemetry:
  ```bash
  cd SmartSense-IoT/simulator
  npm run simulate
  ```
- Ensure the MQTT broker and Node-RED flows are actively routing telemetry into Firebase.

### Build Failures
- Run a clean build check:
  ```bash
  npm run build
  ```
- Verify zero compilation or JSX syntax errors exist.
