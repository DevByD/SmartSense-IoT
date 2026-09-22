# SmartSense IoT — Complete Service Map & Component Inventory

**Phase 12 Service Inventory and Topology Specification**

This document details every service, runtime process, networking port, environment configuration, dependency, and health check across the SmartSense IoT ecosystem.

---

## 1. System Topology Overview

```
                      ┌────────────────────────────────────────┐
                      │             SENSOR SOURCES             │
                      │ 1. Node.js Telemetry Simulator         │
                      │ 2. Raspberry Pi 4B Python Driver (HW)  │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼ [MQTT: smartsense/room1/sensors]
                      ┌────────────────────────────────────────┐
                      │              MQTT BROKER               │
                      │ Aedes Embedded / Mosquitto (Port 1883) │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼ [Raw JSON Streams]
                      ┌────────────────────────────────────────┐
                      │            NODE-RED ENGINE             │
                      │ Stream Processing & Alerts (Port 1880) │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼ [REST / Admin SDK]
                      ┌────────────────────────────────────────┐
                      │            DATABASE LAYER              │
                      │ Firebase RTDB / Local Test Mode (:9000)│
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼ [Internal Data Query]
                      ┌────────────────────────────────────────┐
                      │          EXPRESS BACKEND API           │
                      │ REST API & Controller Layer (Port 5000)│
                      └──────────────┬──────────────────┬──────┘
                                     │                  │
                ┌────────────────────┘                  └──────────────────┐
                ▼                                                          ▼
┌───────────────────────────────┐                          ┌───────────────────────────────┐
│       REACT WEB DASHBOARD     │                          │     EXPO MOBILE APPLICATION   │
│ Vite Development (Port 5173)  │                          │ Metro Web / Native (Port 8081)│
└───────────────────────────────┘                          └───────────────────────────────┘
```

---

## 2. Complete Service Inventory Table

| Service Name | Primary Purpose | Default Port | Working Directory | Startup Command | Dependencies | Health Check Method |
|---|---|---|---|---|---|---|
| **MQTT Broker** | Pub/Sub message broker for telemetry and command channels | `1883` | `simulator/` | `npm run mqtt:broker` | Node.js runtime | TCP port `1883` socket ping or `npm run mqtt:subscribe` |
| **Node-RED Engine** | Ingests MQTT streams, validates contract schemas, executes alert engine rules, and updates database | `1880` | `nodered/` | `npm start` | MQTT Broker (`:1883`), Database (`:9000` or Cloud) | HTTP `GET http://localhost:1880/` (Admin UI) or debug nodes |
| **Sensor Simulator** | Generates realistic multi-sensor telemetry (temperature, humidity, distance, motion, sound, touch) | N/A (client) | `simulator/` | `npm start` | MQTT Broker (`:1883`) | Console output: `[HH:MM:SS] MQTT PUBLISHED Topic: smartsense/room1/sensors` |
| **Raspberry Pi Service** | Python hardware driver polling physical sensors on GPIO and publishing telemetry | N/A (client) | `raspberry-pi/` | `python src/main.py` | MQTT Broker (`:1883`), Physical Raspberry Pi 4B GPIO | Standalone CLI: `python src/main.py --test-all-sensors` |
| **Local Mock Database** | In-memory and REST fallback database for local testing and CI verification | `9000` | `backend/` | Embedded within backend test suite / mock RTDB | Node.js | Backend logs: `[FIREBASE] Running in Local / Test Database Mode` |
| **Express Backend REST API** | Serves REST endpoints for latest telemetry, history, alerts, analytics, device status, and security | `5000` | `backend/` | `npm start` | Database Layer | HTTP `GET http://localhost:5000/api/health` -> `{ success: true, data: { status: "UP" } }` |
| **React Web Dashboard** | Web visualization dashboard with real-time cards, Chart.js time-series, alerts table, and security toggles | `5173` | `frontend/` | `npm run dev` | Express API (`:5000`) | HTTP `GET http://localhost:5173/` -> HTML title "SmartSense IoT" |
| **React Native / Expo Mobile** | Mobile application for iOS, Android, and Metro Web monitoring environmental metrics and alert feeds | `8081` | `mobile/` | `npm run web` | Express API (`:5000`) | HTTP `GET http://localhost:8081/` -> Metro bundler ready |

---

## 3. Detailed Component Specifications

### 1. MQTT Broker
- **Implementation:** Aedes embedded broker (`simulator/src/mqtt/broker.js`) or Mosquitto daemon.
- **Port:** `1883` (standard MQTT)
- **Primary Telemetry Topic:** `smartsense/room1/sensors`
- **Secondary Alert Topic:** `smartsense/room1/alerts`
- **Status Topic:** `smartsense/room1/status`

### 2. Sensor Sources
- **Simulator (`simulator/`):** Publishes valid JSON telemetry payloads every 2,000 ms. Conforms strictly to schema with random walk and scenario triggers (`motion`, `sos`, `temperature`, `object`, `sound`).
- **Raspberry Pi 4B (`raspberry-pi/`):** Python 3 script reading DHT22 (GPIO 4), HC-SR04 (TRIG 23 / ECHO 24), PIR (GPIO 27), Sound (GPIO 22), Touch (GPIO 18).

### 3. Node-RED Stream Processor (`nodered/`)
- **Flow file:** `nodered/flows/smartsense-flows.json`
- **Port:** `1880`
- **Ingestion:** Subscribes to `smartsense/room1/sensors`.
- **Validation:** Enforces contract: non-empty `deviceId`, `room`, numeric `temperature`, `humidity` (0–100), `distance` (>= 0), boolean `motion`, `sound`, `touch`, ISO 8601 `timestamp`.
- **Alert Rules:**
  - `HIGH_TEMPERATURE` (WARNING at >= 32.0°C, CRITICAL at >= 35.0°C)
  - `CLOSE_OBJECT` (WARNING at < 15.0 cm)
  - `MOTION_BREACH` (CRITICAL when PIR triggered and `securityMode === 'ARMED'`)
  - `SOUND_DETECTED` (WARNING when acoustic spike detected)
  - `SOS_ACTIVATED` (CRITICAL when capacitive touch SOS key pressed)
- **Cooldown:** 10,000ms debounce cooldown prevents alert floods.

### 4. Database Layer
- **Modes:**
  - `LOCAL / TEST DATABASE MODE`: Built-in zero-configuration in-memory/mock store operating on `http://localhost:9000` with instant CRUD parity.
  - `CLOUD / PRODUCTION MODE`: Firebase Realtime Database with Firebase Admin SDK authentication via Google Service Account credentials.
- **Data Nodes:**
  - `latest/:deviceId`: Single newest reading + `processedAt`.
  - `readings/:deviceId/:readingId`: Append-only historical time-series.
  - `alerts/:alertId`: Alert instances with severity, timestamp, and `acknowledged` boolean.
  - `devices/:deviceId`: Device metadata (`status`, `lastSeen`, `securityMode`).

### 5. Backend REST API (`backend/`)
- **Port:** `5000`
- **Base URL:** `http://localhost:5000/api`
- **Key Endpoints:**
  - `GET /api/health`: Health status probe.
  - `GET /api/sensors/latest` & `/api/sensors/latest/:deviceId`: Current readings.
  - `GET /api/sensors/history/:deviceId`: Historical readings with limit filtering.
  - `GET /api/alerts`: All alerts (supports `?severity=CRITICAL` and `?acknowledged=false`).
  - `GET /api/alerts/:alertId`: Single alert inspection.
  - `PATCH /api/alerts/:alertId/acknowledge`: Marks alert acknowledged.
  - `GET /api/devices` & `/api/devices/:deviceId`: Device status and metadata.
  - `PATCH /api/devices/:deviceId/security`: Updates security mode (`ARMED` / `DISARMED`).
  - `GET /api/analytics/:deviceId`: Computes aggregate statistics (min, max, average) and event counts across `1h`, `6h`, `24h`, and `7d`.

### 6. React Web Dashboard (`frontend/`)
- **Port:** `5173`
- **Environment:** `VITE_API_BASE_URL=http://localhost:5000/api`, `VITE_DEVICE_ID=smartsense-pi-01`
- **Pages:** Overview / Dashboard, Live Monitoring, Analytics, Alerts, Device Status, Settings, Login.
- **Safety:** Concurrency locking via `isFetchingRef`, automatic error recovery, zero secret leakage.

### 7. React Native + Expo Mobile (`mobile/`)
- **Port:** `8081` (Metro Web) / Mobile Bundles
- **Environment:** `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api`, `EXPO_PUBLIC_DEVICE_ID=smartsense-pi-01`
- **Screens:** Dashboard, Live Monitoring, Analytics, Alerts, Device Status, Settings.
- **Safety:** Uses existing backend REST API exclusively; never connects directly to Firebase Admin or MQTT broker.
