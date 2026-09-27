# SmartSense – IoT-Based Smart Environment and Security Monitoring System

SmartSense is a college IoT end-to-end system engineered for real-time environmental telemetry (temperature, humidity, proximity) and multi-layered security monitoring (PIR motion detection, acoustic anomaly detection, and touch/SOS triggers).

---

## 🏛️ System Architecture

### Software-First Phase (Current)
```
[Sensor Simulator (Node.js)]
            │ (JSON payload every 2s)
            ▼
     [MQTT Broker]
      (localhost:1883)
            │
            ▼
     [Node-RED Flows]
  (Data validation, Alert engine)
            │
            ▼
     [Firebase Cloud]
  (Realtime DB: latest, readings, alerts, devices)
            │
            ▼
  [Express Backend REST API]
       (localhost:5000)
       ┌────┴────┐
       ▼         ▼
[Web Dashboard] [Mobile App (Expo)]
 (React + Vite)  (React Native)
```

### Physical Hardware Phase (Phase 14 Swap)
```
[Physical Sensors (DHT22, Ultrasonic, PIR, Sound, Touch)]
            │
            ▼
   [Raspberry Pi 4B GPIO]
            │
            ▼
  [Python Driver + Paho-MQTT]
            │ (Same MQTT Topics & JSON Schema)
            ▼
     [MQTT Broker] ──► [Node-RED] ──► [Firebase] ──► [React Web & Mobile]
```
> **Seamless Decoupling:** The payload structure and topic taxonomy are 100% identical between the Simulator and the Raspberry Pi Python script, ensuring zero modifications to Node-RED, Firebase, the backend, the React web dashboard, or the React Native mobile app when transitioning to real hardware.

---

## 📁 Project Structure

```
SmartSense-IoT/
│
├── frontend/          # React + Vite web dashboard (Chart.js, Firebase, React Router)
├── backend/           # Node.js + Express REST API (controllers, routes, services, config)
├── simulator/         # Node.js realistic multi-sensor telemetry & event generator
├── mobile/            # React Native + Expo cross-platform mobile application
├── nodered/           # Node-RED flow definitions (MQTT ingest, validation, alerts, cloud write)
├── raspberry-pi/      # Python + GPIO hardware driver scripts for Raspberry Pi 4B (Phase 14)
└── docs/              # Comprehensive architecture, MQTT specs, Firebase schemas & API documentation
```

---

## 🧭 Development Phases Roadmap

- [x] **PHASE 1**: Project structure, directory tree, documentation, and configuration templates
- [x] **PHASE 2**: React dashboard UI using realistic mock telemetry data
- [x] **PHASE 3**: Node.js multi-sensor simulator with event triggers
- [x] **PHASE 4**: MQTT communication protocol integration
- [x] **PHASE 5**: Node-RED stream processing and alert logic
- [x] **PHASE 6**: Firebase cloud database integration and security rules
- [x] **PHASE 7**: Modular Node.js + Express backend API
- [x] **PHASE 8**: Connect React dashboard to real backend API
- [x] **PHASE 9**: React Native + Expo cross-platform mobile application
- [x] **PHASE 10**: Complete software validation & integration testing
- [x] **PHASE 11**: Raspberry Pi 4B hardware integration (Python drivers, GPIO pin plan, MQTT telemetry)
- [x] **PHASE 12**: Cloud, end-to-end integration & production readiness


