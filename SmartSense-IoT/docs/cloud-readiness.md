# SmartSense IoT — Cloud Readiness & Production Deployment Guide

**Phase 12 Cloud Architecture & Hardening Specification**

This document specifies the migration path from local development and test mode to enterprise production cloud deployment.

---

## 1. Current Database & Infrastructure Mode

- **Current Operating Mode:** **LOCAL / TEST DATABASE MODE**
- **Underlying Engine:** Mock Firebase Realtime Database server (`http://localhost:9000`) with in-memory REST parity and automatic failover in `backend/src/services/firebase.service.js`.
- **Status:** Fully functional for offline development, local integration testing, and CI environments without requiring active cloud credentials or network dependencies.
- **Production Cloud Status:** **PENDING CLOUD DEPLOYMENT** (Zero cloud secrets are committed or loaded).

---

## 2. Cloud Database Requirements (Firebase RTDB Production)

To transition from Local / Test Mode to live Google Firebase Cloud Realtime Database:

### Required Cloud Credentials:
1. **Google Cloud Service Account Key (`serviceAccountKey.json`):**
   - Generated via Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.
   - Grants Admin SDK privileges for database manipulation and security rule enforcement.
2. **Environment Variables for Backend:**
   ```ini
   NODE_ENV=production
   USE_MOCK_FIREBASE=false
   FIREBASE_PROJECT_ID=<your-firebase-project-id>
   FIREBASE_DATABASE_URL=https://<your-firebase-project-id>-default-rtdb.firebaseio.com
   FIREBASE_CLIENT_EMAIL=<service-account-email>@<your-project>.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Firebase Realtime Database Security Rules:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "devices": {
      "$deviceId": {
        ".indexOn": ["status", "lastSeen"]
      }
    },
    "latest": {
      "$deviceId": {
        ".indexOn": ["timestamp"]
      }
    },
    "readings": {
      "$deviceId": {
        ".indexOn": ["timestamp"]
      }
    },
    "alerts": {
      ".indexOn": ["deviceId", "severity", "acknowledged", "timestamp"]
    }
  }
}
```

---

## 3. Production MQTT Broker Requirements

In development, the system utilizes an embedded Aedes MQTT broker (`simulator/src/mqtt/broker.js`) or local Mosquitto on port `1883`.

For production deployment:
1. **Broker Options:** Mosquitto Daemon (Linux VM), EMQX Cluster, HiveMQ Cloud, or AWS IoT Core.
2. **TLS / SSL Encryption:** Port `8883` with valid TLS certificates (Let's Encrypt or enterprise CA).
3. **Authentication & Authorization:**
   - Require username and password or X.509 client certificates for all publishers.
   - Access Control Lists (ACLs) restricting Raspberry Pi nodes to publish exclusively to their designated room topic (`smartsense/roomX/sensors`).
   - Node-RED restricted to read access on sensor topics and publish access on alert topics.

---

## 4. Backend Production Deployment Requirements

1. **Host Environment:** Linux Server (Ubuntu 22.04 LTS / Debian 12) or Container Orchestration (Docker / Kubernetes / AWS ECS).
2. **Process Management:**
   - Run via PM2 for auto-restart, cluster mode, and zero-downtime reloads:
     ```bash
     pm2 start src/server.js --name smartsense-api -i max
     ```
3. **Reverse Proxy & SSL:**
   - Nginx reverse proxy routing requests from `https://api.smartsense.yourdomain.com` to `http://localhost:5000`.
   - Automatic HTTPS certificate renewal via Certbot.
4. **CORS Hardening:**
   - Configure `FRONTEND_URL` in `.env` to allow only the production web dashboard origin.

---

## 5. Frontend Production Deployment Requirements

1. **Build Output:**
   - Executed via `npm run build` in `frontend/`.
   - Output bundle generated in `frontend/dist/` (427 KB JS, 12 KB CSS gzip-compressed).
2. **Hosting Provider:**
   - Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront, or Nginx static server.
3. **Build Environment Variables:**
   ```ini
   VITE_API_BASE_URL=https://api.smartsense.yourdomain.com/api
   VITE_DEVICE_ID=smartsense-pi-01
   ```

---

## 6. Mobile Application Production Deployment Requirements

1. **Build Tooling:**
   - Expo Application Services (EAS Build) for standalone native binary creation:
     - Android: `.aab` (Android App Bundle) for Google Play Store.
     - iOS: `.ipa` (iOS App Store Package) for Apple TestFlight / App Store.
2. **Configuration (`eas.json`):**
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_BASE_URL": "https://api.smartsense.yourdomain.com/api",
           "EXPO_PUBLIC_DEVICE_ID": "smartsense-pi-01"
         }
       }
     }
   }
   ```
3. **Security Guarantee:**
   - The mobile application connects exclusively to the Express REST API.
   - Zero Firebase Admin SDK keys or MQTT broker passwords are packaged in client binaries.
