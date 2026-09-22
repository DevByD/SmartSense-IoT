# SmartSense – Node.js & Express REST API Backend

## 1. Backend Purpose
The **SmartSense Backend REST API** acts as the secure query and state coordination layer in the SmartSense IoT ecosystem. It interfaces directly with **Firebase Realtime Database (RTDB)** to serve real-time telemetry, historical trends, alert logs, and device statuses to frontend dashboards (React web application) and mobile clients (React Native + Expo).

### Key Responsibilities:
- **Client REST Gateway**: Exposes structured, consistent JSON endpoints (`/api/*`) for web and mobile clients.
- **Cloud Database Reader**: Queries Firebase Realtime Database using the Firebase Admin SDK (with seamless local test/mock fallbacks).
- **Security & Device State Management**: Manages device security modes (`ARMED` / `DISARMED`), updating the synchronized Firebase state consumed by the Node-RED alert evaluation engine.
- **Alert Acknowledgement**: Handles operator alert triage and lifecycle updates (`acknowledged: true`).
- **Data Aggregation & Analytics**: Formats time-series sensor streams into frontend-friendly datasets optimized for Chart.js.

---

## 2. Architecture & Data Flow

```
[IoT Hardware / Simulator]
          │
      (MQTT Telemetry)
          ▼
   [Local MQTT Broker] (port 1883)
          │
          ▼
     [Node-RED] (Validation, Alert Engine, Status)
          │
     (REST / HTTP PUT & POST)
          ▼
[Firebase Realtime Database] ◄────────────────────────┐
   ├── devices/:deviceId                              │
   ├── latest/:deviceId                               │ (Readings & State Sync)
   ├── readings/:deviceId/:readingId                  │
   └── alerts/:alertId                                │
                                                      ▼
                                           [Express REST API Backend] (port 5000)
                                           ├── Routes / Controllers / Services
                                           ├── Firebase Admin SDK Data Access Layer
                                           ├── Helmet & CORS Protection
                                           └── Standardized JSON Formatters
                                                      ▲
                                                      │ (HTTP REST / JSON)
                                         ┌────────────┴────────────┐
                                         ▼                         ▼
                              [React Dashboard (Vite)]     [React Native Mobile]
                                   (port 5173)                   (Expo)
```

### Directory Structure
```
backend/
├── src/
│   ├── server.js               # Application entrypoint & HTTP server lifecycle
│   ├── app.js                  # Express app setup, middleware, CORS, security, routing
│   ├── config/
│   │   ├── env.js              # Environment variable loading & validation
│   │   └── firebase.js         # Firebase Admin SDK initialization & mode detection
│   ├── routes/
│   │   ├── sensors.routes.js   # Latest & historical sensor telemetry endpoints
│   │   ├── alerts.routes.js    # Alert retrieval & acknowledgement endpoints
│   │   ├── devices.routes.js   # Registered device lists & security mode update
│   │   └── analytics.routes.js # Time-series aggregation & statistical metrics
│   ├── controllers/
│   │   ├── sensors.controller.js
│   │   ├── alerts.controller.js
│   │   ├── devices.controller.js
│   │   └── analytics.controller.js
│   ├── services/
│   │   ├── firebase.service.js # Centralized Firebase RTDB CRUD interface & mock store
│   │   ├── sensors.service.js  # Sensor data retrieval business logic
│   │   ├── alerts.service.js   # Alert filtering & acknowledgement logic
│   │   ├── devices.service.js  # Device status & security mode validation
│   │   └── analytics.service.js# Min/Max/Avg calculations & event counting
│   ├── middleware/
│   │   ├── errorHandler.js     # Centralized error handler & AppError class
│   │   └── notFound.js         # 404 handler for undefined routes
│   └── utils/
│       └── response.js         # Standardized API response formatters
├── test/
│   ├── backend.test.mjs        # 12 comprehensive unit and route tests
│   └── e2e-pipeline.test.mjs   # End-to-end Simulator -> Node-RED -> Firebase -> API tests
├── .env.example                # Environment variable template
├── .env                        # Local development configuration (excluded from Git)
├── .gitignore                  # Git exclusion rules
├── package.json
└── README.md
```

---

## 3. Installation & Quick Start

### Prerequisites
- Node.js >= v18.0.0 (v20+ recommended, tested on v24.15.0)
- npm >= 9.0.0

### Step 1: Install Dependencies
```bash
cd SmartSense-IoT/backend
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `PORT=5000` and `FRONTEND_URL=http://localhost:5173` are configured.

### Step 3: Run the Server
```bash
# Start in production mode:
npm start

# Or start in live-reload development mode:
npm run dev
```

The server will start at: `http://localhost:5000`

---

## 4. Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port for Express HTTP server |
| `NODE_ENV` | String | `development` | Environment mode (`development` or `production`) |
| `DEFAULT_DEVICE_ID` | String | `smartsense-pi-01` | Default device queried when none specified |
| `FRONTEND_URL` | String | `http://localhost:5173` | Allowed origin for CORS headers |
| `FIREBASE_DATABASE_URL` | String | `http://localhost:9000` | URL to Firebase RTDB or local mock |
| `FIREBASE_PROJECT_ID` | String | `smartsense-iot` | Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | String | _(Empty)_ | Firebase Service Account Email |
| `FIREBASE_PRIVATE_KEY` | String | _(Empty)_ | Firebase Service Account Private Key |
| `USE_MOCK_FIREBASE` | Boolean | `true` | When true or credentials absent, uses local mock/REST store |

> [!CAUTION]
> Never commit `.env`, service account JSON keys, or private certificates to Git. Both `.env` and `serviceAccountKey.json` are excluded in `.gitignore`.

---

## 5. Firebase Configuration

The backend supports two operation modes:

1. **Cloud Production Mode (Firebase Admin SDK)**:
   - Provide `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`.
   - Set `FIREBASE_DATABASE_URL=https://<PROJECT-ID>-default-rtdb.firebaseio.com`.
   - The backend initializes the official `firebase-admin` SDK with administrative credentials, bypassing client security rules safely on the server.

2. **Local Development / Offline Mock Mode**:
   - When credentials are not provided or `USE_MOCK_FIREBASE=true`, the backend seamlessly operates against the local `MockFirebaseServer` (HTTP REST) or in-memory fallback.
   - All tests run out of the box without requiring Google Cloud credentials or active internet connections.

---

## 6. Complete REST API Specification

### Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/health` | Server health check and runtime status | None |
| `GET` | `/sensors/latest` | Latest reading for default device | `?deviceId=...` (optional) |
| `GET` | `/sensors/latest/:deviceId` | Latest reading for specific device | `:deviceId` (path param) |
| `GET` | `/sensors/history/:deviceId` | Historical sensor readings | `limit` (1-500), `start` (ISO), `end` (ISO) |
| `GET` | `/alerts` | List alerts with filtering | `limit`, `severity`, `acknowledged`, `deviceId` |
| `GET` | `/alerts/:alertId` | Retrieve single alert by ID | `:alertId` (path param) |
| `PATCH`| `/alerts/:alertId/acknowledge` | Mark an alert as acknowledged | `:alertId` (path param) |
| `GET` | `/devices` | List all registered IoT devices | None |
| `GET` | `/devices/:deviceId` | Retrieve specific device metadata | `:deviceId` (path param) |
| `PATCH`| `/devices/:deviceId/security` | Update device security mode | Body: `{ "securityMode": "ARMED"\|"DISARMED" }` |
| `GET` | `/analytics/:deviceId` | Chart.js time-series & summary stats | `range` (`1h`, `6h`, `24h`, `7d`) |

---

## 7. Request & Response Examples

### Standard Response Envelope
All API responses follow a uniform JSON schema:

**Success Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive message"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error explanation"
  }
}
```

---

### Example 1: Health Check
**Request:**
`GET /api/health`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "environment": "development",
    "timestamp": "2026-09-21T10:00:00.000Z"
  },
  "message": "SmartSense API is running"
}
```

---

### Example 2: Get Latest Sensor Telemetry
**Request:**
`GET /api/sensors/latest/smartsense-pi-01`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "deviceId": "smartsense-pi-01",
    "room": "Room 1",
    "temperature": 28.5,
    "humidity": 64.2,
    "distance": 45.6,
    "motion": false,
    "sound": false,
    "touch": false,
    "timestamp": "2026-09-21T10:00:00.000Z",
    "processedAt": "2026-09-21T10:00:00.015Z"
  }
}
```

---

### Example 3: Query Historical Sensor Readings
**Request:**
`GET /api/sensors/history/smartsense-pi-01?limit=2`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "readingId": "-O7xYz89234abc",
      "deviceId": "smartsense-pi-01",
      "room": "Room 1",
      "temperature": 28.1,
      "humidity": 63.8,
      "distance": 46.2,
      "motion": false,
      "sound": false,
      "touch": false,
      "timestamp": "2026-09-21T09:58:00.000Z"
    },
    {
      "readingId": "-O7xYz89234xyz",
      "deviceId": "smartsense-pi-01",
      "room": "Room 1",
      "temperature": 28.5,
      "humidity": 64.2,
      "distance": 45.6,
      "motion": false,
      "sound": false,
      "touch": false,
      "timestamp": "2026-09-21T10:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

### Example 4: Retrieve Filtered Alerts
**Request:**
`GET /api/alerts?severity=CRITICAL&acknowledged=false`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "alertId": "alt-1726912800000-482",
      "deviceId": "smartsense-pi-01",
      "room": "Room 1",
      "type": "SOS_ACTIVATED",
      "severity": "CRITICAL",
      "message": "Emergency SOS: Physical touch key activated in Room 1!",
      "timestamp": "2026-09-21T10:00:00.000Z",
      "acknowledged": false
    }
  ],
  "count": 1
}
```

---

### Example 5: Acknowledge an Alert
**Request:**
`PATCH /api/alerts/alt-1726912800000-482/acknowledge`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "alertId": "alt-1726912800000-482",
    "deviceId": "smartsense-pi-01",
    "room": "Room 1",
    "type": "SOS_ACTIVATED",
    "severity": "CRITICAL",
    "message": "Emergency SOS: Physical touch key activated in Room 1!",
    "timestamp": "2026-09-21T10:00:00.000Z",
    "acknowledged": true,
    "acknowledgedAt": "2026-09-21T10:02:15.120Z"
  },
  "message": "Alert acknowledged successfully"
}
```

---

### Example 6: Update Device Security Mode
**Request:**
`PATCH /api/devices/smartsense-pi-01/security`
```json
{
  "securityMode": "ARMED"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "deviceId": "smartsense-pi-01",
    "room": "Room 1",
    "status": "ONLINE",
    "securityMode": "ARMED",
    "lastSeen": "2026-09-21T10:05:00.000Z"
  },
  "message": "Device security mode updated to ARMED"
}
```

> [!NOTE]
> **Security Mode State Synchronization**:
> The `devices/:deviceId/securityMode` node in Firebase Realtime Database is shared directly between the Node.js Express backend and the Node-RED alert evaluation engine. When an operator arms or disarms the system via this endpoint, Firebase is updated immediately. On the very next telemetry reading, Node-RED reads this updated mode and evaluates perimeter breach rules accordingly.

---

### Example 7: Aggregate Time-Series Analytics
**Request:**
`GET /api/analytics/smartsense-pi-01?range=24h`

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "deviceId": "smartsense-pi-01",
    "range": "24h",
    "temperature": [
      { "timestamp": "2026-09-21T09:00:00.000Z", "value": 27.8 },
      { "timestamp": "2026-09-21T10:00:00.000Z", "value": 28.5 }
    ],
    "humidity": [
      { "timestamp": "2026-09-21T09:00:00.000Z", "value": 62.0 },
      { "timestamp": "2026-09-21T10:00:00.000Z", "value": 64.2 }
    ],
    "distance": [
      { "timestamp": "2026-09-21T09:00:00.000Z", "value": 48.0 },
      { "timestamp": "2026-09-21T10:00:00.000Z", "value": 45.6 }
    ],
    "statistics": {
      "temperature": { "min": 27.8, "max": 28.5, "average": 28.2 },
      "humidity": { "min": 62.0, "max": 64.2, "average": 63.1 },
      "distance": { "min": 45.6, "max": 48.0, "average": 46.8 }
    },
    "motionEvents": 1,
    "soundEvents": 0,
    "touchEvents": 0,
    "totalReadings": 2
  }
}
```

---

## 8. Error Handling & Validation

All endpoints validate query parameters and request bodies before executing database transactions.

| Error Code | HTTP Status | Cause | Example Error Response |
|---|---|---|---|
| `BAD_REQUEST` | 400 | Invalid general query or body parameter | `{"success": false, "error": {"code": "BAD_REQUEST", ...}}` |
| `INVALID_LIMIT` | 400 | `limit` not integer or out of bounds (1-500) | `{"success": false, "error": {"code": "INVALID_LIMIT", "message": "Limit parameter must be an integer between 1 and 500"}}` |
| `INVALID_SECURITY_MODE` | 400 | Value other than `ARMED` or `DISARMED` | `{"success": false, "error": {"code": "INVALID_SECURITY_MODE", "message": "securityMode must be either 'ARMED' or 'DISARMED'"}}` |
| `INVALID_RANGE` | 400 | Range not in `1h`, `6h`, `24h`, `7d` | `{"success": false, "error": {"code": "INVALID_RANGE", "message": "Range must be one of: 1h, 6h, 24h, 7d"}}` |
| `DEVICE_NOT_FOUND` | 404 | Device ID does not exist | `{"success": false, "error": {"code": "DEVICE_NOT_FOUND", "message": "Device 'xxx' not found"}}` |
| `ALERT_NOT_FOUND` | 404 | Alert ID does not exist | `{"success": false, "error": {"code": "ALERT_NOT_FOUND", "message": "Alert not found with ID: xxx"}}` |
| `NOT_FOUND` | 404 | Unmatched route | `{"success": false, "error": {"code": "NOT_FOUND", "message": "Resource not found: GET /api/xyz"}}` |
| `INVALID_JSON` | 400 | Malformed JSON request body | `{"success": false, "error": {"code": "INVALID_JSON", "message": "Malformed JSON payload in request body"}}` |

---

## 9. Security & CORS Configuration

- **Helmet Protection**: Integrates `helmet` to set secure HTTP headers (XSS filter, Content Security Policy, frameguard, noSniff).
- **CORS Allowlist**: By default in development, allows `http://localhost:5173` (Vite) and `http://localhost:3000`. In production, strictly validates incoming `Origin` against `FRONTEND_URL`.
- **Credential Hygiene**:
  - No secret keys, passwords, or service account details are exposed in endpoints or logs.
  - Server stack traces are suppressed in HTTP error responses to prevent information leakage.
  - Request logging prints only the method, path, status code, and latency (e.g. `[API] GET /api/sensors/latest - 200 (12ms)`).

---

## 10. Running Tests

The test suite runs with zero third-party testing dependencies using Node's native test runner (`node --test`).

```bash
cd SmartSense-IoT/backend

# Run all tests (Unit, Route, and E2E Integration):
npm test
```

### Test Coverage Summary:
1. **`test/backend.test.mjs` (12 Tests)**:
   - Health endpoint (`/api/health`)
   - Latest sensor reading retrieval
   - Device list and single device retrieval
   - Alert retrieval and query parameter filtering (`severity`, `acknowledged`)
   - Single alert retrieval by ID
   - Alert acknowledgement (`PATCH /acknowledge`)
   - Time-series analytics generation
   - Device security mode validation (`ARMED` / `DISARMED`)
   - Unknown device 404 handling
   - Query parameter bounds validation (`limit`, `range`, `severity`)
   - Undefined route 404 formatting
   - Malformed JSON body handling
2. **`test/e2e-pipeline.test.mjs` (5 Integration Tests)**:
   - Simulator telemetry -> Node-RED -> Firebase -> Express API latest reading verification
   - SOS Touch event -> Node-RED alert -> Firebase -> Express API alert retrieval & acknowledgement
   - Multi-sample historical telemetry querying
   - Historical time-series analytics calculation
   - Security mode synchronization: Express API updates mode to `ARMED` -> Node-RED triggers `MOTION_BREACH` on subsequent motion reading -> Express API returns critical alert.

---

## 11. Integration with React & Mobile Applications

### React Dashboard (Phase 8 Preparation)
In Phase 8, the React dashboard's mock data generator will be replaced with an HTTP API client pointing to `http://localhost:5000/api`:
- **Live Monitoring & Dashboard**: Polls or listens to `GET /api/sensors/latest/smartsense-pi-01` every 2 seconds.
- **Analytics Page**: Calls `GET /api/analytics/smartsense-pi-01?range=24h` and renders Chart.js canvases directly from `data.temperature`, `data.humidity`, and `data.distance`.
- **Alerts Page**: Calls `GET /api/alerts` to display active alerts and sends `PATCH /api/alerts/:id/acknowledge` when the operator clicks "Acknowledge".
- **Security Mode Toggle**: Sends `PATCH /api/devices/:id/security` with `{ "securityMode": "ARMED" }` or `{ "securityMode": "DISARMED" }`.

### Mobile Application (React Native + Expo)
The same REST API endpoints are designed to be mobile-friendly:
- Lightweight JSON envelopes reduce cellular data consumption.
- Clean CORS configuration allows native and browser-based React Native clients to query the backend seamlessly.
