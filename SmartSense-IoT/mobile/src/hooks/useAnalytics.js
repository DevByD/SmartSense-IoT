/**
 * SmartSense IoT Mobile - useAnalytics Hook
 * Fetches historical sensor telemetry and summary metrics for a specified time range.
 * Does NOT poll rapidly; only updates on mount, range selection, or manual refresh.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAnalytics } from '../services/analyticsApi.js';

export function useAnalytics(deviceId, initialRange = '24h') {
  const [range, setRange] = useState(initialRange);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);

  const fetchAnalytics = useCallback(async (selectedRange = range, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getAnalytics(deviceId, selectedRange);
      if (isMountedRef.current) {
        setAnalytics(data);
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
    }
  }, [deviceId, range]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalytics(range, false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAnalytics, range]);

  const changeRange = useCallback((newRange) => {
    setRange(newRange);
  }, []);

  const refresh = useCallback(() => {
    return fetchAnalytics(range, true);
  }, [fetchAnalytics, range]);

  return {
    analytics,
    loading,
    error,
    refreshing,
    range,
    setRange: changeRange,
    refresh,
  };
}

export default useAnalytics;
