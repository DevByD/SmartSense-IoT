import { firebaseDb, isInitialized } from '../config/firebase.js';
import config from '../config/env.js';

class FirebaseService {
  constructor() {
    this.inMemoryStore = {
      devices: {
        'smartsense-pi-01': {
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          status: 'ONLINE',
          securityMode: 'DISARMED',
          lastSeen: new Date().toISOString(),
        },
      },
      latest: {
        'smartsense-pi-01': {
          deviceId: 'smartsense-pi-01',
          room: 'Room 1',
          temperature: 28.5,
          humidity: 64.2,
          distance: 45.6,
          motion: false,
          sound: false,
          touch: false,
          timestamp: new Date().toISOString(),
          processedAt: new Date().toISOString(),
        },
      },
      readings: {
        'smartsense-pi-01': {},
      },
      alerts: {},
    };
  }

  /**
   * Helper to perform HTTP REST request to Firebase / Mock RTDB
   * @param {string} path 
   * @param {string} method 
   * @param {any} body 
   */
  async _restRequest(path, method = 'GET', body = null) {
    const cleanBase = (config.firebase.databaseUrl || 'http://localhost:9000').replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '').replace(/\.json$/, '');
    const url = `${cleanBase}/${cleanPath}.json`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body !== null && body !== undefined && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Firebase REST request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      // If REST server is unreachable (e.g. offline testing without mock server), fallback to inMemoryStore
      return null;
    }
  }

  // ==========================================
  // DEVICES
  // ==========================================

  async getAllDevices() {
    if (isInitialized && firebaseDb) {
      const snapshot = await firebaseDb.ref('devices').once('value');
      const val = snapshot.val();
      return val ? Object.values(val) : [];
    }

    // Try REST
    const restData = await this._restRequest('devices');
    if (restData) {
      return Object.values(restData);
    }

    return Object.values(this.inMemoryStore.devices);
  }

  async getDeviceById(deviceId) {
    if (!deviceId) return null;

    if (isInitialized && firebaseDb) {
      const snapshot = await firebaseDb.ref(`devices/${deviceId}`).once('value');
      return snapshot.val() || null;
    }

    const restData = await this._restRequest(`devices/${deviceId}`);
    if (restData !== null && restData !== undefined) {
      return restData;
    }

    return this.inMemoryStore.devices[deviceId] || null;
  }

  async updateDeviceSecurityMode(deviceId, securityMode) {
    if (isInitialized && firebaseDb) {
      const ref = firebaseDb.ref(`devices/${deviceId}`);
      await ref.update({
        securityMode,
        lastSeen: new Date().toISOString(),
      });
      const snapshot = await ref.once('value');
      return snapshot.val();
    }

    // REST update
    const restUpdate = await this._restRequest(`devices/${deviceId}`, 'PATCH', {
      securityMode,
      lastSeen: new Date().toISOString(),
    });

    if (restUpdate) {
      // Also sync in-memory
      if (!this.inMemoryStore.devices[deviceId]) {
        this.inMemoryStore.devices[deviceId] = {
          deviceId,
          room: 'Room 1',
          status: 'ONLINE',
          securityMode,
          lastSeen: new Date().toISOString(),
        };
      } else {
        this.inMemoryStore.devices[deviceId].securityMode = securityMode;
        this.inMemoryStore.devices[deviceId].lastSeen = new Date().toISOString();
      }
      return restUpdate;
    }

    // In-memory fallback
    if (!this.inMemoryStore.devices[deviceId]) {
      this.inMemoryStore.devices[deviceId] = {
        deviceId,
        room: 'Room 1',
        status: 'ONLINE',
        securityMode,
        lastSeen: new Date().toISOString(),
      };
    } else {
      this.inMemoryStore.devices[deviceId].securityMode = securityMode;
      this.inMemoryStore.devices[deviceId].lastSeen = new Date().toISOString();
    }
    return this.inMemoryStore.devices[deviceId];
  }

  // ==========================================
  // SENSORS - LATEST
  // ==========================================

  async getLatestSensorReading(deviceId = config.defaultDeviceId) {
    if (!deviceId) deviceId = config.defaultDeviceId;

    if (isInitialized && firebaseDb) {
      const snapshot = await firebaseDb.ref(`latest/${deviceId}`).once('value');
      return snapshot.val() || null;
    }

    const restData = await this._restRequest(`latest/${deviceId}`);
    if (restData !== null && restData !== undefined) {
      return restData;
    }

    return this.inMemoryStore.latest[deviceId] || null;
  }

  // ==========================================
  // SENSORS - HISTORY
  // ==========================================

  async getSensorHistory(deviceId, { limit = 50, start = null, end = null } = {}) {
    let readingsObj = null;

    if (isInitialized && firebaseDb) {
      let query = firebaseDb.ref(`readings/${deviceId}`).orderByChild('timestamp');
      if (start) query = query.startAt(start);
      if (end) query = query.endAt(end);
      query = query.limitToLast(limit);

      const snapshot = await query.once('value');
      readingsObj = snapshot.val();
    } else {
      readingsObj = await this._restRequest(`readings/${deviceId}`);
      if (!readingsObj) {
        readingsObj = this.inMemoryStore.readings[deviceId] || {};
      }
    }

    if (!readingsObj) return [];

    let list = Object.entries(readingsObj).map(([id, val]) => ({
      readingId: id,
      ...val,
    }));

    // Filter in-memory if REST didn't apply range
    if (start) {
      const startTime = new Date(start).getTime();
      if (!isNaN(startTime)) {
        list = list.filter((r) => new Date(r.timestamp).getTime() >= startTime);
      }
    }

    if (end) {
      const endTime = new Date(end).getTime();
      if (!isNaN(endTime)) {
        list = list.filter((r) => new Date(r.timestamp).getTime() <= endTime);
      }
    }

    // Sort chronologically ascending
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (list.length > limit) {
      list = list.slice(list.length - limit);
    }

    return list;
  }

  // ==========================================
  // ALERTS
  // ==========================================

  async getAlerts({ limit = 50, severity = null, acknowledged = null, deviceId = null } = {}) {
    let alertsObj = null;

    if (isInitialized && firebaseDb) {
      const snapshot = await firebaseDb.ref('alerts').once('value');
      alertsObj = snapshot.val();
    } else {
      alertsObj = await this._restRequest('alerts');
      if (!alertsObj) {
        alertsObj = this.inMemoryStore.alerts || {};
      }
    }

    if (!alertsObj) return [];

    let list = Object.entries(alertsObj).map(([id, val]) => ({
      alertId: id,
      ...val,
    }));

    if (deviceId) {
      list = list.filter((a) => a.deviceId === deviceId);
    }

    if (severity) {
      const upperSev = severity.toUpperCase();
      list = list.filter((a) => a.severity && a.severity.toUpperCase() === upperSev);
    }

    if (acknowledged !== null && acknowledged !== undefined) {
      const boolAck = String(acknowledged).toLowerCase() === 'true';
      list = list.filter((a) => Boolean(a.acknowledged) === boolAck);
    }

    // Sort newest first (descending timestamp)
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (list.length > limit) {
      list = list.slice(0, limit);
    }

    return list;
  }

  async getAlertById(alertId) {
    if (!alertId) return null;

    if (isInitialized && firebaseDb) {
      const snapshot = await firebaseDb.ref(`alerts/${alertId}`).once('value');
      return snapshot.val() || null;
    }

    const restData = await this._restRequest(`alerts/${alertId}`);
    if (restData) {
      return restData;
    }

    return this.inMemoryStore.alerts[alertId] || null;
  }

  async acknowledgeAlert(alertId) {
    if (!alertId) return null;

    const existing = await this.getAlertById(alertId);
    if (!existing) return null;

    const ackPayload = {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    };

    if (isInitialized && firebaseDb) {
      const ref = firebaseDb.ref(`alerts/${alertId}`);
      await ref.update(ackPayload);
      const snapshot = await ref.once('value');
      return snapshot.val();
    }

    const restUpdated = await this._restRequest(`alerts/${alertId}`, 'PATCH', ackPayload);
    if (restUpdated) {
      if (this.inMemoryStore.alerts[alertId]) {
        this.inMemoryStore.alerts[alertId] = {
          ...this.inMemoryStore.alerts[alertId],
          ...ackPayload,
        };
      }
      return restUpdated;
    }

    // In-memory update
    if (this.inMemoryStore.alerts[alertId]) {
      this.inMemoryStore.alerts[alertId] = {
        ...this.inMemoryStore.alerts[alertId],
        ...ackPayload,
      };
      return this.inMemoryStore.alerts[alertId];
    }

    return {
      ...existing,
      ...ackPayload,
    };
  }

  // ==========================================
  // TEST / MOCK HELPERS
  // ==========================================

  setMockData(data = {}) {
    if (data.devices) this.inMemoryStore.devices = { ...data.devices };
    if (data.latest) this.inMemoryStore.latest = { ...data.latest };
    if (data.readings) this.inMemoryStore.readings = { ...data.readings };
    if (data.alerts) this.inMemoryStore.alerts = { ...data.alerts };
  }

  clearMockData() {
    this.inMemoryStore = {
      devices: {},
      latest: {},
      readings: {},
      alerts: {},
    };
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
