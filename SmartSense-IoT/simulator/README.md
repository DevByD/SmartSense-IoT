# SmartSense – Multi-Sensor Telemetry Simulator & MQTT Gateway

## 1. MQTT Architecture
Phase 4 connects the realistic multi-sensor telemetry generator to an MQTT communication pipeline:

```
[Telemetry Generator] ──(JSON every 2s)──► [MqttPublisher]
                                                  │
                                                  ▼
                                           [MQTT Broker]
                                          (localhost:1883)
                                                  │
                                                  ▼
                                          [MqttSubscriber]
                                           (Test Client)
```

In the software development phase, the Simulator publishes telemetry payloads over MQTT. When transitioning to physical hardware in Phase 14, the Raspberry Pi 4B Python driver will publish the exact same payload to the exact same MQTT topic, requiring zero architectural modifications downstream.

---

## 2. MQTT Broker Options

### Option A: Built-in Development Broker (Zero Setup)
A lightweight embedded MQTT 3.1.1 broker is included in the project for immediate development on Windows / macOS / Linux:
```bash
npm run mqtt:broker
```
Runs on `mqtt://localhost:1883`.

### Option B: Eclipse Mosquitto Broker (Production Grade)

#### Windows Installation:
1. Download the official installer from [mosquitto.org/download](https://mosquitto.org/download/).
2. Run the installer and ensure `mosquitto` is added to your PATH or run as a Windows Service.
3. To start Mosquitto manually from PowerShell / CMD:
   ```powershell
   & "C:\Program Files\mosquitto\mosquitto.exe" -v
   ```
4. Verify port 1883 is listening:
   ```powershell
   netstat -ano | findstr 1883
   ```

#### WSL / Linux (Ubuntu/Debian) Installation:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

#### CLI Verification Commands:
```bash
# Terminal A: Subscribe to sensor topic
mosquitto_sub -h localhost -t smartsense/room1/sensors

# Terminal B: Test publish a dummy packet
mosquitto_pub -h localhost -t smartsense/room1/sensors -m "{\"test\":true}"
```

---

## 3. MQTT Topics Specification

| Topic | Purpose | Payload Type |
|---|---|---|
| `smartsense/room1/sensors` | Primary real-time sensor telemetry stream | Complete 6-sensor JSON snapshot |
| `smartsense/room1/status` | Device connectivity heartbeat & state | Status JSON (`online` / `offline`) |
| `smartsense/room1/alerts` | Alert notifications (Node-RED in Phase 5) | Critical / Warning alert JSON |

---

## 4. Environment Variables (`.env`)

```ini
# Hardware Identification
DEVICE_ID=smartsense-pi-01
ROOM=Room 1

# Telemetry Cadence (ms)
SIMULATION_INTERVAL_MS=2000

# Base Sensor Values
BASE_TEMPERATURE=27.5
TEMP_ALERT_THRESHOLD=32.0
BASE_HUMIDITY=62.0
BASE_DISTANCE=55.0
DISTANCE_ALERT_THRESHOLD=15.0

# MQTT Settings
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_SENSOR_TOPIC=smartsense/room1/sensors
MQTT_ALERT_TOPIC=smartsense/room1/alerts
MQTT_STATUS_TOPIC=smartsense/room1/status
MQTT_CLIENT_ID=smartsense-sim-pi-01
```

---

## 5. Telemetry JSON Contract

Every 2 seconds, the publisher sends:
```json
{
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
```

---

## 6. Verification Walkthrough (3-Terminal Test)

### Step 1: Start Broker (Terminal 1)
```bash
cd SmartSense-IoT/simulator
npm run mqtt:broker
```
*Output: `MQTT Broker is live and ready for publishers/subscribers.`*

### Step 2: Start Subscriber (Terminal 2)
```bash
cd SmartSense-IoT/simulator
npm run mqtt:subscribe
```
*Output: `[MQTT SUBSCRIBER] Subscribed to topic: smartsense/room1/sensors`*

### Step 3: Start Simulator & Publisher (Terminal 3)
```bash
cd SmartSense-IoT/simulator
npm run simulate
```
*Output: `[11:13:25] MQTT PUBLISHED Topic: smartsense/room1/sensors (180 bytes)`*

*Result in Terminal 2:*
```
----------------------------------------------------
[11:13:25] [MQTT RECEIVED]
Topic: smartsense/room1/sensors
Payload:
{
  "deviceId": "smartsense-pi-01",
  "room": "Room 1",
  "temperature": 28.0,
  "humidity": 62.0,
  "distance": 52.4,
  "motion": false,
  "sound": false,
  "touch": false,
  "timestamp": "2026-09-21T05:43:25.000Z"
}
----------------------------------------------------
```

---

## 7. Available Scripts

| Script | Command | Description |
|---|---|---|
| **`simulate`** | `npm run simulate` | Starts telemetry generator + MQTT publisher |
| **`mqtt:broker`** | `npm run mqtt:broker` | Starts built-in local MQTT broker on port 1883 |
| **`mqtt:subscribe`** | `npm run mqtt:subscribe` | Starts test client receiving live telemetry |
| **`simulate:sos`** | `npm run simulate:sos` | Publishes telemetry with forced SOS touch trigger |
| **`simulate:motion`** | `npm run simulate:motion` | Publishes telemetry with forced PIR motion trigger |
| **`simulate:temperature`**| `npm run simulate:temperature`| Publishes telemetry with progressive heat spike |
| **`simulate:object`** | `npm run simulate:object` | Publishes telemetry with close obstacle distance |
| **`simulate:sound`** | `npm run simulate:sound` | Publishes telemetry with sound trigger |
| **`test`** | `npm test` | Runs 12 unit and integration tests |

---

## 8. Resilience & Offline Handling
The `MqttPublisher` class includes non-blocking connection logic:
- If the broker is offline when the simulator starts, a warning is printed once, and the simulator continues logging telemetry to the console without crashing.
- Automatic background reconnection begins immediately and publishes as soon as the broker comes back online.

---

## 9. Future Raspberry Pi Hardware Swap (Phase 14)

```
CURRENT:
Sensor Simulator (Node.js) ──► MQTT (smartsense/room1/sensors) ──► Node-RED

FUTURE:
Raspberry Pi 4B (Python)   ──► MQTT (smartsense/room1/sensors) ──► Node-RED
```
Because the topic name (`smartsense/room1/sensors`) and JSON payload structure are 100% identical, Node-RED, Firebase, the backend, the React website, and the mobile app will function without any code changes when physical hardware is connected.
