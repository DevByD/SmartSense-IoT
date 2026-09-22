# SmartSense – Firebase Realtime Database Architecture & Setup Guide

## 1. Overview
SmartSense utilizes **Firebase Realtime Database (RTDB)** as its cloud persistence layer. RTDB provides a low-latency NoSQL JSON tree ideal for live telemetry streaming, sub-second dashboard synchronization, historical analytics queries, and alert propagation.

---

## 2. Cloud Database Tree Structure

```
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
      "-O7xYz89234abc": {
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

## 3. Step-by-Step Google Firebase Setup

1. **Create Project**:
   - Navigate to the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project**, name it `smartsense-iot` (or your preferred name), and disable Google Analytics for simplicity.
2. **Enable Realtime Database**:
   - In the left sidebar, navigate to **Build** -> **Realtime Database**.
   - Click **Create Database**, select a region close to your deployment (e.g. `United States (us-central1)` or `Belgium (europe-west1)`).
   - Start in **Locked Mode** (security rules will be applied via `database.rules.json`).
3. **Obtain Database URL**:
   - Note your database URL format: `https://<PROJECT_ID>-default-rtdb.firebaseio.com`.
4. **Service Account Credentials**:
   - Go to **Project Settings** (gear icon) -> **Service accounts**.
   - Select **Firebase Admin SDK** -> click **Generate new private key**.
   - Store the JSON key securely outside the Git repository.

---

## 4. Environment Configuration

Copy the template in `SmartSense-IoT/nodered/.env.example` to `.env`:
```ini
FIREBASE_DATABASE_URL=https://smartsense-iot-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=smartsense-iot
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@smartsense-iot.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_SECRET=your_database_secret_if_using_legacy_auth
```
> **Security Rule**: Never commit `.env` or service account JSON files to source control. Both are strictly excluded in `.gitignore`.

---

## 5. Security Rules (`database.rules.json`)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "devices": {
      ".read": "auth != null",
      "$deviceId": {
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['deviceId', 'room', 'status', 'lastSeen'])"
      }
    },
    "latest": {
      ".read": "auth != null",
      "$deviceId": {
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['deviceId', 'room', 'temperature', 'humidity', 'distance', 'motion', 'sound', 'touch', 'timestamp'])"
      }
    },
    "readings": {
      ".read": "auth != null",
      "$deviceId": {
        ".write": "auth != null",
        ".indexOn": ["timestamp"],
        "$readingId": {
          ".validate": "newData.hasChildren(['deviceId', 'room', 'temperature', 'humidity', 'distance', 'motion', 'sound', 'touch', 'timestamp'])"
        }
      }
    },
    "alerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["timestamp", "severity", "acknowledged"],
      "$alertId": {
        ".validate": "newData.hasChildren(['alertId', 'deviceId', 'room', 'type', 'severity', 'message', 'timestamp', 'acknowledged'])"
      }
    }
  }
}
```

### Temporary Development Mode (Before Authentication in Phase 11):
If testing without auth tokens, Firebase Realtime Database can be temporarily set to development test mode for 30 days:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> [!WARNING] 
> Open rules are strictly for initial sandbox setup. Production deployments must enforce `auth != null` once Firebase Authentication is integrated in Phase 11.

---

## 6. How Node-RED Interacts with Firebase

Node-RED uses high-performance standard HTTP REST endpoints to synchronize data:

| Node-RED Path | HTTP Method | Target URL Pattern | Effect in Firebase |
|---|---|---|---|
| **Latest Telemetry** | `PUT` | `/latest/<deviceId>.json` | Overwrites to store only the single newest reading |
| **Historical Readings**| `POST` | `/readings/<deviceId>.json` | Generates a monotonic unique push ID (`<readingId>`) and appends reading |
| **Device Status** | `PATCH` | `/devices/<deviceId>.json` | Updates `status: "ONLINE"` and `lastSeen` without wiping device settings |
| **Alert Engine** | `PUT` | `/alerts/<alertId>.json` | Persists unique alert record with `acknowledged: false` |
