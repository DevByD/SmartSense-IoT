# SmartSense IoT — Operational Runbook & Startup Guide

**Phase 12 Complete System Startup, Execution Order & Health Check Procedures**

Follow this exact sequence to start the SmartSense IoT stack from a cold state.

---

## 1. Startup Sequence Overview

```
Step 1: MQTT Broker (Port 1883)
              ↓
Step 2: Node-RED Stream Engine (Port 1880)
              ↓
Step 3: Sensor Simulator OR Raspberry Pi Hardware
              ↓
Step 4: Express REST API Backend (Port 5000)
              ↓
Step 5: React Web Dashboard (Port 5173)
              ↓
Step 6: React Native + Expo Mobile (Port 8081)
```

---

## 2. Step-by-Step Launch Procedure

### Step 1: Start MQTT Message Broker
- **Directory:** `SmartSense-IoT/simulator`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/simulator"
  npm run mqtt:broker
  ```
- **Port:** `1883`
- **Health Check:**
  Console displays:
  ```
  SMARTSENSE LOCAL MQTT BROKER (DEVELOPMENT)
  Port    : 1883
  Protocol: mqtt://localhost:1883
  MQTT Broker is live and ready for publishers/subscribers.
  ```

---

### Step 2: Start Node-RED Stream Processing Engine
- **Directory:** `SmartSense-IoT/nodered`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/nodered"
  npm start
  ```
- **Port:** `1880`
- **Health Check:**
  Navigate to `http://localhost:1880/` in browser or check terminal logs for:
  ```
  [info] Started flows
  [info] Server now running at http://127.0.0.1:1880/
  [info] [mqtt-broker:Local MQTT Broker] connected to broker: mqtt://localhost:1883
  ```

---

### Step 3: Start Sensor Telemetry Source
Choose **Option A** for software development or **Option B** for physical hardware deployment:

#### Option A: Node.js Multi-Sensor Simulator (Default Software Mode)
- **Directory:** `SmartSense-IoT/simulator`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/simulator"
  npm start
  ```
- **Health Check:**
  Terminal prints telemetry broadcasts every ~2 seconds:
  ```
  [HH:MM:SS] MQTT PUBLISHED Topic: smartsense/room1/sensors (178 bytes)
  ```

#### Option B: Raspberry Pi 4B Python Driver (Physical Hardware Mode)
- **Directory:** `SmartSense-IoT/raspberry-pi`
- **Command:**
  ```bash
  cd SmartSense-IoT/raspberry-pi
  source .venv/bin/activate
  python src/main.py
  ```
- **Health Check:**
  Terminal prints:
  ```
  [HH:MM:SS] DHT22 OK
  [HH:MM:SS] HC-SR04 OK
  [HH:MM:SS] PIR OK
  [HH:MM:SS] SOUND OK
  [HH:MM:SS] TOUCH OK
  [HH:MM:SS] MQTT CONNECTED to localhost:1883
  [HH:MM:SS] TELEMETRY PUBLISHED to smartsense/room1/sensors
  ```

---

### Step 4: Start Node.js Express REST Backend API
- **Directory:** `SmartSense-IoT/backend`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/backend"
  npm start
  ```
- **Port:** `5000`
- **Health Check:**
  Execute probe query in another terminal:
  ```powershell
  curl http://localhost:5000/api/health
  ```
  Expected Response:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "environment": "development"
    },
    "message": "SmartSense API is running"
  }
  ```

---

### Step 5: Start React Web Dashboard
- **Directory:** `SmartSense-IoT/frontend`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/frontend"
  npm run dev
  ```
- **Port:** `5173`
- **Health Check:**
  Open `http://localhost:5173/` in a web browser. Verify live environmental cards (temperature, humidity, proximity) and alert feed load without connection banners.

---

### Step 6: Start Expo Mobile Application
- **Directory:** `SmartSense-IoT/mobile`
- **Command:**
  ```powershell
  cd "SmartSense-IoT/mobile"
  npm run web
  ```
  *(Or `npm run android` / `npm run ios` when targeting native emulators/devices)*
- **Port:** `8081`
- **Health Check:**
  Metro Bundler opens in browser at `http://localhost:8081/`. Tap "Open in web browser" and verify live sensor readings sync with backend.

---

## 3. Orderly Teardown Procedure

To shut down the ecosystem safely:
1. Close clients: Stop `frontend` (Ctrl+C) and `mobile` (Ctrl+C).
2. Stop API: Stop `backend` (Ctrl+C).
3. Stop telemetry: Stop `simulator` (Ctrl+C) or `raspberry-pi` (Ctrl+C triggers GPIO cleanup).
4. Stop processing: Stop `nodered` (Ctrl+C).
5. Stop broker: Stop `mqtt:broker` (Ctrl+C).
