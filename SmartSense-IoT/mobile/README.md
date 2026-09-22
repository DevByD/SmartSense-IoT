# SmartSense IoT — Mobile Application (React Native + Expo)

The **SmartSense IoT Mobile Application** is a cross-platform mobile client built with **React Native** and **Expo**. It provides real-time environmental telemetry monitoring, instant security surveillance management (ARMED / DISARMED), and interactive incident response for the SmartSense IoT ecosystem.

The mobile application acts as a strict client to the existing **Node.js Express REST API** and never communicates directly with MQTT, Node-RED, or physical hardware.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────┐
│ Sensor Simulator / Raspberry Pi │
└────────────────┬────────────────┘
                 │ (MQTT telemetry JSON)
                 ▼
┌─────────────────────────────────┐
│     MQTT Broker (Mosquitto)     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│         Node-RED Engine         │
│  (Data validation, Alert logic) │
└────────────────┬────────────────┘
                 │ (REST write)
                 ▼
┌─────────────────────────────────┐
│   Firebase Realtime Database    │
│   (latest, readings, alerts)    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Express Backend REST API      │
│     (http://localhost:5000)     │
└───────────────┬─────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
 🌐 React Web App   📱 React Native Mobile App (Expo)
```

### Protocol & Responsibility Separation
- **❌ MQTT / Node-RED / Hardware**: Mobile app does **NOT** connect to MQTT or run Node-RED flows.
- **❌ Firebase Admin SDK**: Mobile app contains **NO** Firebase admin credentials, service accounts, or private keys.
- **✅ Express REST API**: Mobile app communicates **strictly** with the Express backend REST API endpoints over HTTP.

---

## 🚀 Key Features

- **🏠 Comprehensive IoT Dashboard**: High-level status bar with clear separation between API Connectivity, Hardware Node Status, and Security Mode.
- **📡 Live Telemetry Stream**: 2.5-second live telemetry polling with non-overlapping requests, pause/resume capability, and automatic timer cleanup.
- **🚨 Verified Alert Management**: Real-time alert feed (INFO, WARNING, CRITICAL) with verified server-side acknowledgement via `PATCH /api/alerts/:alertId/acknowledge`.
- **🛡️ Hardware Security Control**: Instant ARMED / DISARMED toggle via `PATCH /api/devices/:deviceId/security` with immediate backend state synchronization.
- **📊 Historical Analytics & Charts**: Interactive multi-range trend charts (1h, 6h, 24h, 7d) and statistical metrics (min, max, average) using real API data.
- **⚙️ Diagnostic Settings**: API health testing, endpoint configuration inspection, and zero secrets exposure.

---

## 📱 Available Screens

| Tab / Screen | Description | Primary Endpoints Consumed |
|---|---|---|
| **🏠 Dashboard** (`DashboardScreen`) | Real-time sensor cards, system connection bar, security status badge | `GET /api/sensors/latest/:deviceId`<br>`GET /api/devices/:deviceId` |
| **📡 Live Stream** (`LiveMonitoringScreen`) | High-refresh (2.5s) telemetry stream with pause/resume controls | `GET /api/sensors/latest/:deviceId` |
| **🚨 System Alerts** (`AlertsScreen`) | Incident feed with severity filters (Critical, Pending, Acknowledged) and single-tap acknowledge action | `GET /api/alerts`<br>`PATCH /api/alerts/:alertId/acknowledge` |
| **📊 Analytics** (`AnalyticsScreen`) | Historical time-series charts, statistics (min, max, avg), and event counters for 1h, 6h, 24h, 7d | `GET /api/analytics/:deviceId?range=...` |
| **⚙️ Settings** (`SettingsScreen`) | API endpoint diagnostics, health check trigger, hardware profile, and push roadmap | `GET /api/health` |
| **🛡️ Device Diagnostics** (`DeviceStatusScreen`) | Detailed hardware health, IP address, CPU temperature, and ARMED/DISARMED security surveillance control | `GET /api/devices/:deviceId`<br>`PATCH /api/devices/:deviceId/security` |

---

## 📦 Project Structure

```
SmartSense-IoT/mobile/
├── src/
│   ├── components/
│   │   ├── AlertCard.jsx          # Severity-coded incident card with acknowledge button
│   │   ├── AnalyticsChart.jsx     # Responsive SVG telemetry line chart
│   │   ├── DeviceCard.jsx         # Separated API and hardware connectivity card
│   │   ├── EmptyState.jsx         # Clean placeholder for empty queries
│   │   ├── ErrorState.jsx         # Network failure view with Retry action
│   │   ├── LoadingState.jsx       # Themed activity indicator
│   │   ├── SecurityToggle.jsx     # ARMED / DISARMED surveillance mode switch
│   │   ├── SensorCard.jsx         # Numeric and boolean telemetry reading card
│   │   └── StatusBadge.jsx        # Standardized status and severity pill
│   ├── config/
│   │   └── api.config.js          # API URL normalization, defaults, and polling intervals
│   ├── hooks/
│   │   ├── useAlerts.js           # Alert polling and verified acknowledgement hook
│   │   ├── useAnalytics.js        # Range-based analytics query hook
│   │   ├── useDevice.js           # Device metadata and security mode toggle hook
│   │   └── useLatestSensors.js    # 2.5s polling with timer cleanup and overlap prevention
│   ├── navigation/
│   │   └── AppNavigator.jsx       # Bottom Tabs + Native Stack navigator
│   ├── screens/
│   │   ├── AlertsScreen.jsx       # Real-time alert list and acknowledgement
│   │   ├── AnalyticsScreen.jsx    # Statistical summaries and trends
│   │   ├── DashboardScreen.jsx    # Primary IoT overview
│   │   ├── DeviceStatusScreen.jsx # Hardware diagnostics & security switch
│   │   ├── LiveMonitoringScreen.jsx # High-frequency telemetry stream
│   │   └── SettingsScreen.jsx     # Diagnostic settings and health verification
│   ├── services/
│   │   ├── alertsApi.js           # Alerts REST endpoints
│   │   ├── analyticsApi.js        # Analytics REST endpoints
│   │   ├── api.js                 # Centralized HTTP client (GET, PATCH, POST)
│   │   ├── devicesApi.js          # Devices and security REST endpoints
│   │   └── sensorsApi.js          # Sensor readings REST endpoints
│   ├── theme/
│   │   └── theme.js               # Dark IoT color tokens, spacing, and typography
│   └── types/
│       └── api.js                 # Severity, sensor definition, and status constants
├── test/
│   ├── mocks/                     # Node.js test doubles for React Native & vector icons
│   ├── e2e-pipeline.test.mjs      # Full Simulator -> Node-RED -> Firebase -> API -> Mobile test
│   ├── jsx-loader.mjs             # Module resolver and JSX loader
│   ├── mobile.test.mjs            # Unit and component integration tests (14 tests)
│   └── register-jsx.mjs           # ESM loader registration
├── .env.example                   # Environment configuration template
├── app.json                       # Expo application metadata
├── App.js                         # Root React application wrapper
├── index.js                       # Expo entry point
├── package.json                   # Dependencies and npm scripts
└── README.md                      # Complete mobile documentation
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.x or later (developed and verified on Node.js v24)
- **npm**: v9.x or later
- **Expo Go App**: Installed on physical Android or iOS device (optional for hardware testing)

### 2. Install Dependencies
Navigate to the mobile directory and install all required packages:
```bash
cd SmartSense-IoT/mobile
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your API endpoint:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_DEVICE_ID=smartsense-pi-01
```

> **IMPORTANT SECURITY NOTE:**
> Never store private keys, service account JSON files, or backend database secrets in the mobile repository. Variables prefixed with `EXPO_PUBLIC_` are bundled into the client application code and are publicly visible.

---

## 🌐 Network Configuration Guide

Selecting the correct `EXPO_PUBLIC_API_BASE_URL` depends on your testing environment:

### A. Web Browser Preview
When running `npm run web`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### B. Android Emulator (Standard Android Studio AVD)
The Android emulator runs inside a virtual network where `10.0.2.2` aliases the development host machine:
```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api
```

### C. iOS Simulator (macOS Xcode)
iOS Simulator shares the host machine's loopback interface:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### D. Physical Smartphone (Android or iPhone via Expo Go)
A physical phone **cannot** resolve `localhost`.
1. Ensure your phone and development computer are connected to the **same Wi-Fi network**.
2. Find your computer's local area network (LAN) IP:
   - **Windows**: Run `ipconfig` in PowerShell (look for `IPv4 Address`, e.g. `192.168.1.50`).
   - **macOS / Linux**: Run `ifconfig` or `ip a` (look for `inet 192.168.x.x`).
3. Set in `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:5000/api
   ```
4. Ensure your computer's firewall allows inbound connections on port 5000.

---

## 🏃 Running the Application

From `SmartSense-IoT/mobile/`:

| Command | Action |
|---|---|
| `npm start` | Starts the Expo development server and displays an interactive QR code. |
| `npm run android` | Starts Expo and attempts to launch the connected Android emulator/device. |
| `npm run ios` | Starts Expo and attempts to launch the iOS Simulator (macOS only). |
| `npm run web` | Launches the React Native Web bundler in your default browser. |
| `npm test` | Runs all 18 automated unit, component, and E2E pipeline tests. |

### Running on a Physical Phone via Expo Go
1. Start the Expo development server:
   ```bash
   npx expo start
   ```
2. Open the **Expo Go** app on your phone.
3. **Android**: Scan the QR code displayed in the terminal using Expo Go.
4. **iOS**: Scan the QR code using the built-in Camera app, then tap the prompt to open in Expo Go.

---

## 🤖 Android Emulator Testing Status

### Host Diagnostic Result
- `adb`: Not installed in host PATH.
- `emulator`: Not installed in host PATH.
- Android SDK path (`%LOCALAPPDATA%\Android\Sdk`): Not present on this machine.

### How to Run on Android when Android Studio is Installed:
1. Install **Android Studio** and the **Android SDK Platform-Tools**.
2. Create an Android Virtual Device (AVD) using Device Manager (e.g. Pixel 8, API 34).
3. Start the emulator:
   ```bash
   emulator -avd <YOUR_AVD_NAME>
   ```
4. In `SmartSense-IoT/mobile/`, run:
   ```bash
   npm run android
   ```

---

## 🔄 Live Polling & Concurrency Architecture

The mobile app implements resilient polling via `src/hooks/useLatestSensors.js`:
- **Cadence**: 2.5 seconds (2500ms).
- **Overlap Prevention**: Employs an `isFetchingRef` guard. If a request is in flight when the interval fires, the tick is gracefully skipped, preventing network queue congestion.
- **Leak-Free Teardown**: Cleans up all `setInterval` timers on component unmount via `useEffect` cleanup handlers.
- **Manual Overrides**: Supports immediate pull-to-refresh and a pause/resume toggle for stream control.

---

## 🔔 Alerts & Security Architecture

### Alert Pipeline
```
Sensor Reading ➔ Node-RED Engine ➔ Firebase /alerts/:id ➔ Express Backend ➔ Mobile AlertsScreen
```
1. Alerts originate exclusively from the server-side Node-RED alert evaluation engine.
2. The mobile app never synthesizes local alerts.
3. When the user taps **ACKNOWLEDGE**, the app dispatches `PATCH /api/alerts/:alertId/acknowledge`.
4. The UI status updates to **ACKNOWLEDGED** only upon receiving `{ "success": true, "data": { "acknowledged": true } }`.

### Security Mode Surveillance (ARMED / DISARMED)
- Toggling the security mode sends:
  ```json
  PATCH /api/devices/:deviceId/security
  {
    "securityMode": "ARMED"
  }
  ```
- The backend writes the new security mode directly to Firebase RTDB (`devices/:deviceId/securityMode`).
- Node-RED monitors this mode:
  - **DISARMED**: Motion events are recorded as normal telemetry.
  - **ARMED**: Any PIR motion detection immediately raises a **CRITICAL** `MOTION_DETECTED_ARMED` security alert.

---

## 🔮 Future Push Notifications Architecture

Phase 9 lays the architectural foundation for future cloud push notifications. Production push delivery will follow this pipeline:

```
[Node-RED / Sensor Alert Trigger]
               │
               ▼
   [Express Backend Service]
               │
               ▼
   [Notification Delivery Service (Expo Push / FCM / APNs)]
               │
               ▼
[Mobile Client (expo-notifications)]
```

- When Node-RED writes a CRITICAL alert to Firebase, a cloud webhook triggers the backend notification worker.
- The worker uses the Expo Push API (`https://exp.host/--/api/v2/push/send`) to dispatch native notifications to registered mobile push tokens.

---

## 🧪 Testing & Verification

The mobile project includes a complete Node.js-native automated test suite testing both unit logic and full end-to-end integration:

```bash
cd SmartSense-IoT/mobile
npm test
```

### Verified Test Cases (18 Passed, 0 Failed):
1. **Dashboard Renders**: App title, device identifiers, and separated API/device statuses render cleanly.
2. **Sensor Values Render**: Numeric telemetry (temperature, humidity, distance) and boolean indicators render accurately.
3. **Loading State**: Displays loading message and spinner without showing fake data.
4. **Error State**: Displays API connection error and provides a functioning Retry trigger.
5. **Alerts Render**: Severity levels (CRITICAL, WARNING, INFO), messages, rooms, and timestamps render properly.
6. **Alert Acknowledgement**: Calls `PATCH /api/alerts/:alertId/acknowledge` and updates acknowledged state.
7. **Device Status**: Displays hardware metadata and explicitly separates API connectivity from device online status.
8. **Security ARM Call**: Dispatches `PATCH` with `{ "securityMode": "ARMED" }`.
9. **Security DISARM Call**: Dispatches `PATCH` with `{ "securityMode": "DISARMED" }`.
10. **Analytics Renders**: Statistical highlights (min, max, avg), event counts, and trend charts render without fabricated data.
11. **Analytics Range Selection**: Correctly queries `1h`, `6h`, `24h`, and `7d` parameters.
12. **Retry Behavior**: Recovers from network errors and executes user retry requests.
13. **Live Monitoring Screen**: Telemetry cards render with sub-second timestamps and streaming controls.
14. **Settings Screen**: Sanitized API base URL, health check test, and push roadmap render.
15. **E2E 1 - Telemetry Pipeline**: Simulator ➔ Node-RED ➔ Firebase ➔ Express API ➔ Mobile UI.
16. **E2E 2 - SOS Alert Pipeline**: Emergency Touch ➔ Node-RED ➔ Firebase Alert ➔ Mobile ➔ Acknowledge PATCH.
17. **E2E 3 - Security Mode Pipeline**: Mobile ARM ➔ Node-RED ARMED state ➔ Motion Breach ➔ CRITICAL alert.
18. **E2E 4 - Analytics Pipeline**: Telemetry stream ➔ Firebase historical readings ➔ Backend analytics ➔ Mobile trend charts.

---

## ❓ Troubleshooting

| Issue | Likely Cause | Resolution |
|---|---|---|
| `Unable to connect to SmartSense API` on physical phone | Mobile phone cannot resolve `localhost` | Update `EXPO_PUBLIC_API_BASE_URL` in `.env` to your PC's LAN IP (e.g. `http://192.168.1.50:5000/api`). |
| `Unable to connect to SmartSense API` in Android Emulator | Android emulator uses loopback isolation | Set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api`. |
| Backend returns CORS error | Express backend rejecting origin | Verify backend `app.js` is running in development mode (development allows all origins, and mobile fetch has no origin header). |
| Values not updating every 2-3s in Live screen | Stream is paused or simulator is offline | Ensure the simulator is running (`cd simulator && npm start`) and check that stream control shows `STREAMING`. |
| Port 5000 already in use | Stale backend instance running | Kill the process occupying port 5000: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`. |
