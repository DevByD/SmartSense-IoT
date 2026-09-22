/**
 * SmartSense IoT Mobile - useDevice Hook
 * Fetches hardware device metadata and allows toggling security surveillance mode (ARMED/DISARMED).
 * Refreshes device state from the backend upon security updates.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getDeviceById, updateSecurityMode } from '../services/devicesApi.js';
import { POLLING_INTERVALS } from '../config/api.config.js';

export function useDevice(deviceId) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  const fetchDevice = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const result = await getDeviceById(deviceId);
      if (isMountedRef.current) {
        setDevice(result);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Unable to connect to SmartSense API.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManualRefresh) {
          setRefreshing(false);
        }
      }
      isFetchingRef.current = false;
    }
  }, [deviceId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDevice(false);

    timerRef.current = setInterval(() => {
      fetchDevice(false);
    }, POLLING_INTERVALS.DEVICE_STATUS);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchDevice]);

  const refresh = useCallback(() => {
    return fetchDevice(true);
  }, [fetchDevice]);

  const setSecurityMode = useCallback(async (mode) => {
    setIsUpdatingSecurity(true);
    setSecurityError(null);

    try {
      const res = await updateSecurityMode(deviceId, mode);
      if (isMountedRef.current) {
        // Update device state with verified response
        setDevice((prev) => (prev ? { ...prev, securityMode: mode, lastSeen: res?.lastSeen || new Date().toISOString() } : res));
      }
      // Trigger a fresh read to be completely in sync with backend
      await fetchDevice(false);
      return res;
    } catch (err) {
      if (isMountedRef.current) {
        setSecurityError(err.message || `Failed to set security mode to ${mode}`);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdatingSecurity(false);
      }
    }
  }, [deviceId, fetchDevice]);

  return {
    device,
    loading,
    error,
    refreshing,
    refresh,
    setSecurityMode,
    isUpdatingSecurity,
    securityError,
  };
}

export default useDevice;
