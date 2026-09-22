# SmartSense IoT — Comprehensive Troubleshooting Guide

**Phase 12 Diagnosis, Remediation & Incident Response Handbook**

This guide provides targeted diagnostics and concrete resolutions for failures across every subsystem.

---

## 1. MQTT Broker Unavailable (`ECONNREFUSED` / No Connection)

### Symptoms
- Simulator outputs: `[MQTT WARNING] Broker unreachable at mqtt://127.0.0.1:1883 (ECONNREFUSED)`.
- Raspberry Pi outputs: `[WARN] MQTT NOT CONNECTED. Cannot publish`.
- Node-RED logs: `[mqtt-broker] connection lost to localhost:1883`.

### Root Cause
- MQTT broker process is not running, port 1883 is blocked by host firewall, or port conflict exists.

### Remediation
1. Verify if port 1883 is occupied:
   ```powershell
   Get-NetTCPConnection -LocalPort 1883 -ErrorAction SilentlyContinue
   ```
2. Start the built-in development broker:
   ```powershell
   cd "SmartSense-IoT/simulator"
   npm run mqtt:broker
   ```
3. Test broker connectivity:
   ```powershell
   npm run mqtt:subscribe
   ```

---

## 2. Node-RED Unavailable / Flows Not Executing

### Symptoms
- Simulator publishes messages, but backend `/api/sensors/latest` timestamp stops advancing.
- Database records no new historical telemetry.

### Root Cause
- Node-RED process is stopped, flows are disabled, or the MQTT input node is pointing to the wrong topic.

### Remediation
1. Start Node-RED:
   ```powershell
   cd "SmartSense-IoT/nodered"
   npm start
   ```
2. Open `http://localhost:1880/` in a browser.
3. Verify that the MQTT input node is subscribed to `smartsense/room1/sensors` and the broker node status indicates `connected` (green circle).
4. Click **Deploy** to re-commit flow changes if necessary.

---

## 3. Express Backend Unavailable (`NETWORK_ERROR` on Clients)

### Symptoms
- Web dashboard displays: *"Unable to connect to SmartSense API. Please ensure the backend server is running."*
- Mobile app displays connection failure banner with Retry button.
- Browser console logs: `GET http://localhost:5000/api/sensors/latest net::ERR_CONNECTION_REFUSED`.

### Root Cause
- Backend server process halted, port 5000 is occupied, or unhandled exception crashed the process.

### Remediation
1. Probe health check:
   ```powershell
   curl http://localhost:5000/api/health
   ```
2. Start backend server:
   ```powershell
   cd "SmartSense-IoT/backend"
   npm start
   ```
3. Check `backend/src/server.js` logs for startup errors.

---

## 4. Database Layer Unavailable / Stale Persistence

### Symptoms
- API returns: `500 Database unreachable` or `404 Device not found`.
- Node-RED outputs warnings on Firebase write nodes.

### Root Cause
- In Local / Test Mode, mock database server on port 9000 stopped or backend in-memory cache was cleared.
- In Cloud Mode, Firebase private key is malformed or database URL is invalid.

### Remediation
1. In Local / Test Mode, ensure `USE_MOCK_FIREBASE=true` in `backend/.env`.
2. In Cloud Mode, verify `FIREBASE_DATABASE_URL` format: `https://<PROJECT-ID>-default-rtdb.firebaseio.com`.
3. Check `serviceAccountKey.json` permissions in Google Cloud Console.

---

## 5. Website API Error (`CORS` / Bad Origin)

### Symptoms
- Browser console error: `Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy`.

### Root Cause
- Frontend origin (e.g. `http://localhost:5173`) differs from allowed origin in `backend/.env` (`FRONTEND_URL`).

### Remediation
1. Open `backend/.env`.
2. Verify:
   ```ini
   FRONTEND_URL=http://localhost:5173
   ```
3. Restart Express backend server.

---

## 6. Mobile Application API Connection Failure

### Symptoms
- Expo mobile app continuously displays: *"Connecting to SmartSense..."* or *"Unable to reach API"*.

### Root Cause
- Mobile app is targeting `localhost` while running on a physical phone or Android emulator.
- On an Android emulator, `10.0.2.2` must be used instead of `localhost`. On a physical phone, the host machine's LAN IP (e.g. `192.168.1.100`) must be specified.

### Remediation
1. Open `mobile/.env`.
2. When testing in Metro Web preview, `http://localhost:5000/api` works directly.
3. When testing on a physical mobile device via Expo Go:
   ```ini
   EXPO_PUBLIC_API_BASE_URL=http://<YOUR-PC-LAN-IP>:5000/api
   ```
4. Restart Expo: `npm run web -- -c` (clearing cache).

---

## 7. Simulator Not Publishing Telemetry

### Symptoms
- Terminal shows no periodic `[HH:MM:SS] MQTT PUBLISHED` logs.

### Root Cause
- Process exited, scenario ended, or interval timer threw an unhandled error.

### Remediation
1. Restart simulator:
   ```powershell
   cd "SmartSense-IoT/simulator"
   npm start
   ```
2. Trigger continuous random-walk mode (default) rather than a single scenario.

---

## 8. Stale Telemetry Data Detection

### Symptoms
- Sensor cards display static values and timestamp remains unchanged for minutes.

### Root Cause
- Telemetry producer (simulator or Raspberry Pi) has halted while backend serves cached `latest` database node.

### Remediation
1. Check the `timestamp` field in `GET /api/sensors/latest`.
2. Both Web and Mobile compare the telemetry timestamp against the client clock (`new Date() - new Date(timestamp)`). If the delta exceeds 15 seconds, the UI renders an Amber warning banner indicating the sensor source is offline or stale.
3. Restart the simulator or check Raspberry Pi network connectivity.

---

## 9. Alerts Not Appearing on Dashboard or Mobile

### Symptoms
- Temperature exceeds 35°C or motion is triggered, but no alert displays in `/alerts` feed.

### Root Cause
- Cooldown debounce window active: Node-RED enforces a 10,000ms cooldown window per alert type to prevent alert flooding.
- In security motion tests, `securityMode` is set to `DISARMED`. Motion while `DISARMED` only records telemetry; it intentionally produces **no security alerts**.

### Remediation
1. Verify device security mode:
   ```powershell
   curl http://localhost:5000/api/devices/smartsense-pi-01
   ```
2. If testing motion security alerts, arm the device first:
   ```powershell
   curl -X PATCH http://localhost:5000/api/devices/smartsense-pi-01/security -H "Content-Type: application/json" -d "{\"securityMode\":\"ARMED\"}"
   ```
3. Allow at least 10 seconds between repeated trigger tests to clear cooldown.

---

## 10. Analytics Charts Not Updating

### Symptoms
- Analytics tab shows empty charts or flatlines.

### Root Cause
- Insufficient historical readings in the selected time range (`1h`, `6h`, `24h`, `7d`).
- Database `readings/` node is empty.

### Remediation
1. Generate sufficient readings by letting the simulator run for at least 60 seconds (produces ~30 readings).
2. Query the history endpoint directly to verify data volume:
   ```powershell
   curl "http://localhost:5000/api/sensors/history/smartsense-pi-01?limit=20"
   ```
3. Switch between range buttons (`1h` -> `6h`) to trigger fresh API requests.
