# SmartSense – Architecture & Data Specification

## 1. System Pipeline Overview

```
[Sensor Simulator (Phases 3-13)]       [Physical Raspberry Pi 4B (Phase 14)]
                 │                                        │
                 └──────────────────┬─────────────────────┘
                                    │
                                    ▼
                         [MQTT Topic: smartsense/room1/sensors]
                                    │
                                    ▼
                         [MQTT Broker: localhost:1883]
                                    │
                                    ▼
                        [Node-RED Stream Engine]
                     (Validate, Normalize, Alert Engine)
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[Firebase: latest/]        [Firebase: readings/]       [Firebase: alerts/ & devices/]
(Single newest reading)     (Historical series)         (Alerts and node status)
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                                    ▼
                      [React Website & Mobile App]
```

---

## 2. Sensor Telemetry Schema

Every 2 seconds, the active telemetry generator broadcasts a JSON payload on the sensor topic:

### Topic: `smartsense/room1/sensors`
```json
{
  "deviceId": "smartsense-pi-01",
  "room": "Room 1",
  "temperature": 28.5,
  "humidity": 64.2,
  "distance": 45.6,
  "motion": true,
  "sound": false,
  "touch": false,
  "timestamp": "2026-09-21T10:00:00.000Z"
}
```

### Fields Specification:
| Field | Type | Units / Values | Description |
|---|---|---|---|
| `deviceId` | string | e.g. `"smartsense-pi-01"` | Unique hardware/node identifier |
| `room` | string | e.g. `"Room 1"` | Physical room/zone deployment name |
| `temperature` | number | Celsius (°C) | From DHT22 / Temp sensor |
| `humidity` | number | Percentage (%) | From DHT22 sensor |
| `distance` | number | Centimeters (cm) | Proximity from HC-SR04 ultrasonic sensor |
| `motion` | boolean | `true` / `false` | HC-SR501 PIR sensor state |
| `sound` | boolean | `true` / `false` | Acoustic threshold sensor state |
| `touch` | boolean | `true` / `false` | Capacitive touch sensor / SOS trigger state |
| `timestamp` | string (ISO) | ISO 8601 string | UTC sample timestamp |

---

## 3. Alerts Specification

### Topic: `smartsense/room1/alerts`
```json
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
```

### Severity Levels:
- `INFO`: Normal status changes, system arming/disarming
- `WARNING`: High temperature warnings (>32°C), close proximity alerts (<15cm), acoustic anomalies
- `CRITICAL`: SOS button pressed, unauthorized motion detected while system is ARMED, extreme heat (>35°C)

---

## 4. Device Status Specification

### Topic: `smartsense/room1/status`
```json
{
  "deviceId": "smartsense-pi-01",
  "room": "Room 1",
  "status": "ONLINE",
  "securityMode": "DISARMED",
  "lastSeen": "2026-09-21T10:00:00.000Z"
}
```

---

## 5. Firebase Cloud Realtime Database Schema

```json
{
  "devices": {
    "smartsense-pi-01": {
      "deviceId": "smartsense-pi-01",
      "room": "Room 1",
      "status": "ONLINE",
      "securityMode": "DISARMED",
      "lastSeen": "2026-09-21T10:00:00.000Z"
    }
  },
  "latest": {
    "smartsense-pi-01": {
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
  },
  "readings": {
    "smartsense-pi-01": {
      "-O7xYz8923abc": {
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
  },
  "alerts": {
    "alt-1726912800000-482": {
      "alertId": "alt-1726912800000-482",
      "deviceId": "smartsense-pi-01",
      "room": "Room 1",
      "type": "SOS_ACTIVATED",
      "severity": "CRITICAL",
      "message": "Emergency SOS: Physical touch key activated in Room 1!",
      "timestamp": "2026-09-21T10:00:00.000Z",
      "acknowledged": false
    }
  }
}
```

---

## 6. Timestamp Strategy
- **`timestamp`**: Represents the initial sensor measurement generation time at the edge (simulator or Raspberry Pi). Format: UTC ISO 8601 string.
- **`processedAt`**: Represents the time when Node-RED validated and normalized the telemetry packet before persisting to Firebase.
- **`lastSeen`**: Heartbeat tracker updated on every valid message ingestion under `devices/<deviceId>/lastSeen`.
