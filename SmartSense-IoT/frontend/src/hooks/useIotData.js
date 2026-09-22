/**
 * SmartSense IoT Telemetry & Device Custom Hook
 * Connects directly to the real Express backend API.
 * Automatically polls real-time sensor telemetry, device heartbeat, and alerts.
 * Enforces single-flight polling to prevent overlapping HTTP requests.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_DEVICE_ID, POLLING_INTERVAL_MS } from '../config/api.config.js';
import sensorsApi from '../services/sensorsApi.js';
import devicesApi from '../services/devicesApi.js';
import alertsApi from '../services/alertsApi.js';

export function useIotData(targetDeviceId = DEFAULT_DEVICE_ID) {
  const [sensors, setSensors] = useState(null);
  const [device, setDevice] = useState({
    deviceId: targetDeviceId,
    room: 'Room 1',
    status: 'OFFLINE',
    securityMode: 'DISARMED',
    lastSeen: null,
    ipAddress: '127.0.0.1',
    mqttBroker: 'mqtt://localhost:1883',
    mqttTopic: 'smartsense/room1/sensors',
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('OFFLINE'); // 'CONNECTED' | 'OFFLINE'

  // Ref to prevent overlapping polling requests
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  /**
   * Fetch latest telemetry, device status, and alerts from backend API.
   */
  const fetchData = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) {
      return; // Skip if previous request is still inflight
    }

    isFetchingRef.current = true;
    if (isInitial) {
      setLoading(true);
    }

    try {
      const [latestReading, deviceData, alertsData] = await Promise.all([
        sensorsApi.getLatest(targetDeviceId).catch((err) => {
          console.warn('[useIotData] Failed to fetch latest sensors:', err.message);
          return null;
        }),
        devicesApi.getDeviceById(targetDeviceId).catch((err) => {
          console.warn('[useIotData] Failed to fetch device:', err.message);
          return null;
        }),
        alertsApi.getAlerts({ limit: 50 }).catch((err) => {
          console.warn('[useIotData] Failed to fetch alerts:', err.message);
          return null;
        }),
      ]);

      if (!isMountedRef.current) return;

      // Determine backend connectivity
      if (latestReading || deviceData || alertsData) {
        setBackendStatus('CONNECTED');
        setError(null);

        if (latestReading) {
          setSensors(latestReading);
        }

        if (deviceData) {
          setDevice((prev) => ({
            ...prev,
            ...deviceData,
          }));
        }

        if (Array.isArray(alertsData)) {
          setAlerts(alertsData);
        }
      } else {
        // All endpoints failed
        setBackendStatus('OFFLINE');
        setError('Unable to connect to SmartSense API.');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setBackendStatus('OFFLINE');
        setError('Unable to connect to SmartSense API.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [targetDeviceId]);

  // Initial fetch and automatic recurring polling
  useEffect(() => {
    isMountedRef.current = true;
    fetchData(true);

    const timer = setInterval(() => {
      fetchData(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchData]);

  /**
   * Toggle or update security mode via PATCH /api/devices/:deviceId/security.
   * Updates state from backend response.
   */
  const setSecurityMode = async (mode) => {
    try {
      const updated = await devicesApi.updateSecurityMode(targetDeviceId, mode);
      if (updated && isMountedRef.current) {
        setDevice((prev) => ({
          ...prev,
          securityMode: updated.securityMode || mode,
        }));
      }
      // Re-fetch device info to ensure sync
      const freshDevice = await devicesApi.getDeviceById(targetDeviceId);
      if (freshDevice && isMountedRef.current) {
        setDevice((prev) => ({
          ...prev,
          ...freshDevice,
        }));
      }
    } catch (err) {
      console.error('[useIotData] Failed to update security mode:', err);
      throw err;
    }
  };

  /**
   * Acknowledge an alert via PATCH /api/alerts/:alertId/acknowledge.
   */
  const acknowledgeAlert = async (alertId) => {
    try {
      const updatedAlert = await alertsApi.acknowledgeAlert(alertId);
      if (isMountedRef.current) {
        setAlerts((prev) =>
          prev.map((a) => {
            const currentId = a.alertId || a.id;
            return currentId === alertId ? { ...a, acknowledged: true, read: true, ...updatedAlert } : a;
          })
        );
      }
      return updatedAlert;
    } catch (err) {
      console.error('[useIotData] Failed to acknowledge alert:', err);
      throw err;
    }
  };

  // Alias for backward compatibility
  const markAlertAsRead = acknowledgeAlert;

  const markAllAlertsAsRead = async () => {
    // Acknowledge all unacknowledged alerts
    const unacked = alerts.filter((a) => !a.acknowledged);
    await Promise.allSettled(unacked.map((a) => acknowledgeAlert(a.alertId || a.id)));
  };

  const unreadAlertCount = alerts.filter((a) => !a.acknowledged).length;

  const [settings, setSettings] = useState({
    tempThreshold: 32.0,
    distanceThreshold: 15.0,
    refreshInterval: POLLING_INTERVAL_MS,
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    sensors,
    device,
    deviceId: targetDeviceId,
    alerts,
    settings,
    updateSettings,
    unreadAlertCount,
    securityMode: device?.securityMode || 'DISARMED',
    setSecurityMode,
    acknowledgeAlert,
    markAlertAsRead,
    markAllAlertsAsRead,
    loading,
    error,
    backendStatus,
    refetch: () => fetchData(true),
  };
}

export default useIotData;
