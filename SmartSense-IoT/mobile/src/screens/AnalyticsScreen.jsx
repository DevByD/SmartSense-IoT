import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import { DEFAULT_DEVICE_ID } from '../config/api.config.js';
import { TIME_RANGES } from '../types/api.js';
import useAnalytics from '../hooks/useAnalytics.js';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

export function AnalyticsScreen() {
  const deviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : DEFAULT_DEVICE_ID;

  const {
    analytics,
    loading,
    error,
    refreshing,
    range,
    setRange,
    refresh,
  } = useAnalytics(deviceId, '24h');

  if (loading && !analytics && !error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Aggregating IoT telemetry analytics..." />
      </SafeAreaView>
    );
  }

  if (error && !analytics) {
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

  const stats = analytics?.statistics || {};
  const totalReadings = analytics?.totalReadings ?? 0;
  const hasReadings = totalReadings > 0;

  const tempStats = stats.temperature || {};
  const humStats = stats.humidity || {};
  const distStats = stats.distance || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primaryLight}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Telemetry Analytics</Text>
          <Text style={styles.subtitle}>Aggregated sensor trends & event counters</Text>
        </View>

        {/* Range Selector */}
        <View style={styles.rangeSelector}>
          {TIME_RANGES.map((r) => {
            const isSelected = range === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.rangeTab, isSelected && styles.rangeTabActive]}
                onPress={() => setRange(r)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeTabText, isSelected && styles.rangeTabTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!hasReadings ? (
          <EmptyState
            icon="bar-chart-2"
            title="No historical data available"
            message={`No telemetry points recorded for device ${deviceId} in the past ${range}.`}
          />
        ) : (
          <>
            {/* Event Summary Counters */}
            <Text style={styles.sectionTitle}>Event Summary ({range})</Text>
            <View style={styles.statsGrid}>
              <View style={styles.counterCard}>
                <Feather name="activity" size={20} color={colors.warningLight} />
                <Text style={styles.counterValue}>{analytics?.motionEvents ?? 0}</Text>
                <Text style={styles.counterLabel}>Motion Events</Text>
              </View>

              <View style={styles.counterCard}>
                <Feather name="volume-2" size={20} color={colors.infoLight} />
                <Text style={styles.counterValue}>{analytics?.soundEvents ?? 0}</Text>
                <Text style={styles.counterLabel}>Sound Triggers</Text>
              </View>

              <View style={styles.counterCard}>
                <Feather name="alert-octagon" size={20} color={colors.dangerLight} />
                <Text style={styles.counterValue}>{analytics?.touchEvents ?? 0}</Text>
                <Text style={styles.counterLabel}>SOS Triggers</Text>
              </View>
            </View>

            {/* Statistical Highlights */}
            <Text style={styles.sectionTitle}>Summary Statistics</Text>

            {/* Temperature Stats Card */}
            <View style={styles.statMetricCard}>
              <View style={styles.statCardHeader}>
                <Feather name="thermometer" size={16} color={colors.dangerLight} />
                <Text style={styles.statCardTitle}>Temperature Statistics</Text>
              </View>
              <View style={styles.statValuesRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MINIMUM</Text>
                  <Text style={styles.statNum}>{tempStats.min !== null ? `${tempStats.min} °C` : '--'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>AVERAGE</Text>
                  <Text style={[styles.statNum, { color: colors.primaryLight }]}>
                    {tempStats.average !== null ? `${tempStats.average} °C` : '--'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MAXIMUM</Text>
                  <Text style={styles.statNum}>{tempStats.max !== null ? `${tempStats.max} °C` : '--'}</Text>
                </View>
              </View>
            </View>

            {/* Humidity Stats Card */}
            <View style={styles.statMetricCard}>
              <View style={styles.statCardHeader}>
                <Feather name="droplet" size={16} color={colors.primaryLight} />
                <Text style={styles.statCardTitle}>Humidity Statistics</Text>
              </View>
              <View style={styles.statValuesRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MINIMUM</Text>
                  <Text style={styles.statNum}>{humStats.min !== null ? `${humStats.min} %` : '--'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>AVERAGE</Text>
                  <Text style={[styles.statNum, { color: colors.primaryLight }]}>
                    {humStats.average !== null ? `${humStats.average} %` : '--'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MAXIMUM</Text>
                  <Text style={styles.statNum}>{humStats.max !== null ? `${humStats.max} %` : '--'}</Text>
                </View>
              </View>
            </View>

            {/* Distance Stats Card */}
            <View style={styles.statMetricCard}>
              <View style={styles.statCardHeader}>
                <Feather name="minimize-2" size={16} color={colors.successLight} />
                <Text style={styles.statCardTitle}>Distance Statistics</Text>
              </View>
              <View style={styles.statValuesRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MINIMUM</Text>
                  <Text style={styles.statNum}>{distStats.min !== null ? `${distStats.min} cm` : '--'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>AVERAGE</Text>
                  <Text style={[styles.statNum, { color: colors.primaryLight }]}>
                    {distStats.average !== null ? `${distStats.average} cm` : '--'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statSubLabel}>MAXIMUM</Text>
                  <Text style={styles.statNum}>{distStats.max !== null ? `${distStats.max} cm` : '--'}</Text>
                </View>
              </View>
            </View>

            {/* Trend Visualizers */}
            <Text style={styles.sectionTitle}>Trend Visualizations</Text>

            <AnalyticsChart
              title="Temperature History"
              data={analytics?.temperature || []}
              unit="°C"
              color="#F87171"
              height={190}
            />

            <AnalyticsChart
              title="Humidity History"
              data={analytics?.humidity || []}
              unit="%"
              color="#60A5FA"
              height={190}
            />

            <AnalyticsChart
              title="Proximity Distance History"
              data={analytics?.distance || []}
              unit="cm"
              color="#34D399"
              height={190}
            />
          </>
        )}
      </ScrollView>
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
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
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
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  rangeTabActive: {
    backgroundColor: colors.primary,
  },
  rangeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rangeTabTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  counterCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  counterLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statMetricCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statSubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
});

export default AnalyticsScreen;
