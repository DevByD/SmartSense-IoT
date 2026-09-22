/**
 * SmartSense IoT Mobile - useLatestSensors Hook
 * Polls the latest sensor reading every 2.5 seconds (2-3s cadence).
 * Guarantees timer cleanup on unmount, prevents overlapping fetches,
 * and maintains clean error states without crashing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLatest } from '../services/sensorsApi.js';
import { POLLING_INTERVALS } from '../config/api.config.js';

export function useLatestSensors(deviceId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  const fetchLatest = useCallback(async (isManualRefresh = false) => {
    // Prevent overlapping network requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const reading = await getLatest(deviceId);
      if (isMountedRef.current) {
        setData(reading);
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

  // Initial load and interval setup
  useEffect(() => {
    isMountedRef.current = true;
    fetchLatest(false);

    if (isPolling) {
      timerRef.current = setInterval(() => {
        fetchLatest(false);
      }, POLLING_INTERVALS.LIVE_SENSORS);
    }

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchLatest, isPolling]);

  const refresh = useCallback(() => {
    return fetchLatest(true);
  }, [fetchLatest]);

  const togglePolling = useCallback(() => {
    setIsPolling((prev) => !prev);
  }, []);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    isPolling,
    togglePolling,
  };
}

export default useLatestSensors;
