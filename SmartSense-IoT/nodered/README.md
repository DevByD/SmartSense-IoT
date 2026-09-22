# SmartSense – Node-RED Stream Processing & Alert Automation

## 1. Purpose & Role
Node-RED functions as the intermediate stream processing, validation, and alert automation gateway between local MQTT telemetry streams and the cloud:
1. **MQTT Telemetry Ingestion**: Subscribes to raw sensor payloads from `smartsense/room1/sensors`.
2. **Schema & Contract Validation**: Enforces strict typing and boundaries on all 6 sensors, routing invalid payloads to an isolated error inspection path.
3. **Data Normalization**: Augments telemetry with readable state classifications (`NORMAL`, `WARNING`, `CRITICAL`, `NEAR`, `MOTION_DETECTED`, `SOS_ACTIVE`) and processing timestamps.
4. **Alert Engine & Debounce**: Evaluates security intrusion, critical heat, close obstacle, acoustic spikes, and emergency SOS triggers with an intelligent 10-second cooldown mechanism to prevent notification flooding.
5. **Gateway Heartbeat**: Computes and publishes live node connectivity status to `smartsense/room1/status`.
6. **Cloud Preparation**: Prepares clean data structures for Phase 6 Firebase Cloud persistence.

---

## 2. Architecture & Data Flow

```
[Sensor Simulator (Node.js)] 
            │
            │ (MQTT: smartsense/room1/sensors)
            ▼
     [MQTT Broker] (localhost:1883)
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE-RED ENGINE                          │
│                                                             │
│  [MQTT In] ──► [JSON Parse] ──► [Schema Validation]         │
│                                       │                     │
│               ┌───────────────────────┴───────────────────┐ │
│               ▼ [Valid Path]               ▼ [Error Path] │ │
│      [Data Normalization]            [DEBUG: REJECTED]    │ │
│               │                                           │ │
│     ┌─────────┼─────────────────────────┐                 │ │
│     ▼         ▼                         ▼                 │ │
│ [Alerts]  [Device Status]      [Cloud Prep (Phase 6)]     │ │
│  Engine   smartsense/room1/status                         │ │
│     │                                                     │ │
│     ▼                                                     │ │
│ [MQTT Out] smartsense/room1/alerts                        │ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. MQTT Broker & Topics Specification

- **Broker URI**: `mqtt://localhost:1883`
- **Topics**:
  - `smartsense/room1/sensors`: Inbound raw telemetry stream (every 2s).
  - `smartsense/room1/alerts`: Outbound critical / warning alerts published by Node-RED.
  - `smartsense/room1/status`: Outbound gateway heartbeat (`ONLINE` / `OFFLINE`, `lastSeen`).

---

## 4. Flow Organization (`flows/smartsense-flows.json`)

The workspace is structured into 7 modular stages:
1. **MQTT Input**: Subscribes to `smartsense/room1/sensors` with debug hook `[DEBUG] RAW TELEMETRY`.
2. **Validation**: Two-port function node (`Port 1: Valid`, `Port 2: Rejected Error Path`).
3. **Normalization**: Computes sensor status strings based on configurable thresholds.
4. **Alert Engine**: Evaluates rule logic, generates unique alert IDs, applies cooldown, and publishes to `smartsense/room1/alerts`.
5. **Device Status**: Updates device online state and publishes retained message to `smartsense/room1/status`.
6. **Cloud Prep**: Enriches payload with `processedAt` timestamp ready for Phase 6 Firebase writes.
7. **Security Controls & Injectors**: Provides manual UI inject triggers to ARM/DISARM system and reset alert cooldowns.

---

## 5. Configurable Thresholds & Alert Rules

| Rule / Condition | Default Threshold | Severity | Alert Type | Message Format |
|---|---|---|---|---|
| **Security Intrusion** | System `ARMED` + `motion: true` | `CRITICAL` | `MOTION_BREACH` | *"Security Breach: Motion detected in Room 1 while system is ARMED!"* |
| **Emergency Panic** | `touch: true` | `CRITICAL` | `SOS_ACTIVATED` | *"Emergency SOS: Physical touch key activated in Room 1!"* |
| **High Temperature** | `temperature >= 32.0°C` | `WARNING` | `HIGH_TEMPERATURE`| *"High Temperature: 33.2°C exceeds warning threshold (32°C)"* |
| **Critical Heat** | `temperature >= 35.0°C` | `CRITICAL` | `HIGH_TEMPERATURE`| *"Critical Heat: 36.1°C exceeds emergency threshold (35°C)"* |
| **Close Obstacle** | `distance < 15.0 cm` | `WARNING` | `CLOSE_OBJECT` | *"Proximity Warning: Object detected at 8.4 cm (Threshold: 15 cm)"* |
| **Acoustic Spike** | `sound: true` | `WARNING` | `SOUND_DETECTED` | *"Acoustic Alert: Sound event detected in Room 1."* |

### Duplicate Alert Protection:
An integrated 10,000 ms (10-second) cooldown cache (`flow.get('alertCooldowns')`) prevents spamming duplicate alerts when a condition (e.g. prolonged high temperature) persists across consecutive 2-second telemetry cycles.

---

## 6. How to Run Node-RED Locally

### Step 1: Install Dependencies
```bash
cd SmartSense-IoT/nodered
npm install
```

### Step 2: Start Node-RED
```bash
npm start
```
Node-RED will start on **`http://localhost:1880`** and load `flows/smartsense-flows.json` automatically.

---

## 7. Complete End-to-End Test (3-Terminal Sequence)

### Terminal 1: Start MQTT Broker
```bash
cd SmartSense-IoT/simulator
npm run mqtt:broker
```

### Terminal 2: Start Node-RED Engine
```bash
cd SmartSense-IoT/nodered
npm start
```
*Node-RED will log: `[mqtt-broker:Local MQTT Broker] Connected to broker: smartsense-nodered-engine@mqtt://localhost:1883`*

### Terminal 3: Start Sensor Simulator
```bash
cd SmartSense-IoT/simulator
npm run simulate:sos
# Or: npm run simulate:temperature
# Or: npm run simulate
```

### Verified Live Output in Node-RED Console:
```json
[info] [debug:[DEBUG] ALERT GENERATED]
{
  "alertId": "alt-1789970035549-731",
  "deviceId": "smartsense-pi-01",
  "room": "Room 1",
  "type": "SOS_ACTIVATED",
  "severity": "CRITICAL",
  "message": "Emergency SOS: Physical touch key activated in Room 1!",
  "timestamp": "2026-09-21T05:53:55.550Z"
}
```

---

## 8. Automated Unit & Integration Tests

Run the full automated test suite verifying all 10 project tests:
```bash
cd SmartSense-IoT/nodered
npm test
```
### Test Output:
```
✔ Flow JSON contains required tabs, brokers, and processing nodes (1.15ms)
✔ TEST 1: Normal telemetry is valid, processed successfully with no alerts (1.45ms)
✔ TEST 2: Motion while DISARMED records motion but creates no critical security alert (0.43ms)
✔ TEST 3: Motion while ARMED generates CRITICAL security alert (0.31ms)
✔ TEST 4: Temperature >= 32.0°C generates WARNING alert (1.02ms)
✔ TEST 5: Temperature >= 35.0°C generates CRITICAL alert (0.23ms)
✔ TEST 6: Ultrasonic Distance < 15 cm generates CLOSE_OBJECT alert (0.19ms)
✔ TEST 7: Sound = true generates SOUND_DETECTED alert (0.18ms)
✔ TEST 8: Touch = true generates CRITICAL SOS_ACTIVATED alert (0.18ms)
✔ TEST 9: Malformed payload is rejected to Output 2 (Error path) (0.42ms)
✔ TEST 10: Repeated identical alert is suppressed by cooldown debounce mechanism (0.21ms)
✔ Device status node tracks online status and lastSeen timestamp (0.19ms)
ℹ tests 12
ℹ pass 12
ℹ fail 0
```
