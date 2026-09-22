import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import useAlerts from '../hooks/useAlerts.js';
import AlertCard from '../components/AlertCard.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

const FILTERS = ['ALL', 'CRITICAL', 'PENDING', 'ACKNOWLEDGED'];

export function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [uiError, setUiError] = useState(null);

  const {
    alerts,
    loading,
    error,
    actionError,
    refreshing,
    refresh,
    acknowledge,
    acknowledgingId,
  } = useAlerts();

  // Filter alerts locally
  const filteredAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    if (activeFilter === 'CRITICAL') {
      return alerts.filter((a) => (a.severity || '').toUpperCase() === 'CRITICAL');
    }
    if (activeFilter === 'PENDING') {
      return alerts.filter((a) => !a.acknowledged);
    }
    if (activeFilter === 'ACKNOWLEDGED') {
      return alerts.filter((a) => Boolean(a.acknowledged));
    }
    return alerts;
  }, [alerts, activeFilter]);

  const handleAcknowledge = async (alertId) => {
    setUiError(null);
    try {
      await acknowledge(alertId);
    } catch (err) {
      const errMsg = err.message || 'Failed to acknowledge alert. Please verify network connection.';
      setUiError(errMsg);
      Alert.alert('Acknowledgement Failed', errMsg);
    }
  };

  if (loading && alerts.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Loading SmartSense alerts..." />
      </SafeAreaView>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          message="Unable to connect to SmartSense API."
          onRetry={refresh}
          isRetrying={refreshing}
        />
      </SafeAreaView>
    );
  }

  const criticalCount = alerts.filter((a) => (a.severity || '').toUpperCase() === 'CRITICAL' && !a.acknowledged).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>System Alerts</Text>
            <Text style={styles.subtitle}>Real-time incident & anomaly feed</Text>
          </View>
          {criticalCount > 0 ? (
            <View style={styles.criticalBadge}>
              <Feather name="alert-triangle" size={13} color="#FFFFFF" />
              <Text style={styles.criticalBadgeText}>{criticalCount} CRITICAL</Text>
            </View>
          ) : null}
        </View>

        {/* Action Error Banner if acknowledgement failed */}
        {(uiError || actionError) ? (
          <View style={styles.errorBanner}>
            <Feather name="x-circle" size={16} color={colors.dangerLight} />
            <Text style={styles.errorBannerText}>{uiError || actionError}</Text>
          </View>
        ) : null}

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Alerts List */}
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item, index) => item.alertId || `alert-${index}`}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onAcknowledge={handleAcknowledge}
              isAcknowledging={acknowledgingId === item.alertId}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primaryLight}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bell-off"
              title="No alerts available"
              message={
                activeFilter === 'ALL'
                  ? 'All systems nominal. No alerts have been triggered.'
                  : `No ${activeFilter.toLowerCase()} alerts found.`
              }
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerGlow,
    borderColor: colors.danger,
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.dangerLight,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});

export default AlertsScreen;
