/**
 * SmartSense IoT Mobile - useAlerts Hook
 * Fetches and polls alerts with acknowledgement capability.
 * Updates UI only after successful backend response.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAlerts, acknowledgeAlert as apiAcknowledge } from '../services/alertsApi.js';
import { POLLING_INTERVALS } from '../config/api.config.js';

export function useAlerts(filters = {}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  const fetchAlerts = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const result = await getAlerts(filters);
      if (isMountedRef.current) {
        setAlerts(Array.isArray(result) ? result : []);
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
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAlerts(false);

    timerRef.current = setInterval(() => {
      fetchAlerts(false);
    }, POLLING_INTERVALS.ALERTS);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchAlerts]);

  const refresh = useCallback(() => {
    return fetchAlerts(true);
  }, [fetchAlerts]);

  const acknowledge = useCallback(async (alertId) => {
    if (!alertId) return;
    setAcknowledgingId(alertId);
    setActionError(null);

    try {
      const updatedAlert = await apiAcknowledge(alertId);
      if (isMountedRef.current) {
        // Update local list with acknowledged state only after successful API call
        setAlerts((prevAlerts) =>
          prevAlerts.map((a) =>
            a.alertId === alertId
              ? { ...a, acknowledged: true, acknowledgedAt: updatedAlert?.acknowledgedAt || new Date().toISOString() }
              : a
          )
        );
      }
      return true;
    } catch (err) {
      if (isMountedRef.current) {
        setActionError(err.message || `Failed to acknowledge alert ${alertId}`);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setAcknowledgingId(null);
      }
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    actionError,
    refreshing,
    refresh,
    acknowledge,
    acknowledgingId,
  };
}

export default useAlerts;
