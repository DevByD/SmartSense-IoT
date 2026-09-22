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
import useLatestSensors from '../hooks/useLatestSensors.js';
import SensorCard from '../components/SensorCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export function LiveMonitoringScreen({ preloadedData = null }) {
  const deviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : DEFAULT_DEVICE_ID;

  const hook = useLatestSensors(deviceId);
  const sensorData = preloadedData || hook.data;
  const loading = preloadedData ? false : hook.loading;
  const error = hook.error;
  const refreshing = hook.refreshing;
  const refresh = hook.refresh;
  const isPolling = hook.isPolling;
  const togglePolling = hook.togglePolling;

  if (loading && !sensorData && !error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Connecting to live sensor stream..." />
      </SafeAreaView>
    );
  }

  if (error && !sensorData) {
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

  const formattedTimestamp = sensorData?.timestamp
    ? new Date(sensorData.timestamp).toLocaleString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      })
    : '--';

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
        {/* Header with Live Indicator & Controls */}
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <View style={[styles.liveDot, { backgroundColor: isPolling ? colors.success : colors.warning }]} />
              <Text style={styles.title}>Live Monitoring</Text>
            </View>
            <Text style={styles.subtitle}>
              High-refresh telemetry stream (every 2.5s)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.streamControlBtn, !isPolling && styles.streamControlPaused]}
            onPress={togglePolling}
            activeOpacity={0.7}
          >
            <Feather
              name={isPolling ? 'pause' : 'play'}
              size={15}
              color={isPolling ? colors.warningLight : colors.successLight}
            />
            <Text
              style={[
                styles.streamControlText,
                { color: isPolling ? colors.warningLight : colors.successLight },
              ]}
            >
              {isPolling ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Telemetry Status Banner */}
        <View style={styles.statusBar}>
          <View style={styles.statusCol}>
            <Text style={styles.statusLabel}>DEVICE</Text>
            <Text style={styles.statusVal}>{deviceId}</Text>
          </View>
          <View style={styles.statusCol}>
            <Text style={styles.statusLabel}>ROOM</Text>
            <Text style={styles.statusVal}>{sensorData?.room || 'Room 1'}</Text>
          </View>
          <View style={styles.statusCol}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <StatusBadge status={isPolling ? 'ONLINE' : 'INFO'} label={isPolling ? 'STREAMING' : 'PAUSED'} size="small" />
          </View>
        </View>

        {/* Environmental Telemetry */}
        <Text style={styles.sectionHeader}>Environmental Telemetry</Text>

        <View style={styles.row}>
          <SensorCard
            title="Temperature"
            value={sensorData?.temperature}
            unit="°C"
            status={sensorData?.temperatureStatus || (sensorData?.temperature >= 35 ? 'CRITICAL' : sensorData?.temperature >= 32 ? 'WARNING' : 'NORMAL')}
            icon="thermometer"
            timestamp={sensorData?.timestamp}
          />
          <SensorCard
            title="Humidity"
            value={sensorData?.humidity}
            unit="%"
            status={sensorData?.humidityStatus || 'NORMAL'}
            icon="droplet"
            timestamp={sensorData?.timestamp}
          />
        </View>

        <View style={styles.singleRow}>
          <SensorCard
            title="Proximity Distance"
            value={sensorData?.distance}
            unit="cm"
            status={sensorData?.distanceStatus || (sensorData?.distance < 15 ? 'WARNING' : 'NORMAL')}
            icon="minimize-2"
            timestamp={sensorData?.timestamp}
          />
        </View>

        {/* Security Triggers */}
        <Text style={styles.sectionHeader}>Event Triggers</Text>

        <View style={styles.row}>
          <SensorCard
            title="PIR Motion"
            value={sensorData?.motion}
            isBoolean={true}
            booleanActiveText="MOTION DETECTED"
            booleanInactiveText="QUIET"
            status={sensorData?.motion ? 'WARNING' : 'NORMAL'}
            icon="activity"
            timestamp={sensorData?.timestamp}
          />
          <SensorCard
            title="Acoustic / Sound"
            value={sensorData?.sound}
            isBoolean={true}
            booleanActiveText="SOUND DETECTED"
            booleanInactiveText="SILENT"
            status={sensorData?.sound ? 'WARNING' : 'NORMAL'}
            icon="volume-2"
            timestamp={sensorData?.timestamp}
          />
        </View>

        <View style={styles.singleRow}>
          <SensorCard
            title="Touch / SOS Emergency"
            value={sensorData?.touch}
            isBoolean={true}
            booleanActiveText="SOS ACTIVATED"
            booleanInactiveText="SAFE"
            status={sensorData?.touch ? 'CRITICAL' : 'NORMAL'}
            icon="alert-octagon"
            timestamp={sensorData?.timestamp}
          />
        </View>

        {/* Timestamp Footer */}
        <View style={styles.timestampCard}>
          <Feather name="clock" size={14} color={colors.textMuted} />
          <Text style={styles.timestampText}>Telemetry Timestamp: {formattedTimestamp}</Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  streamControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  streamControlPaused: {
    borderColor: colors.success,
  },
  streamControlText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  statusCol: {
    gap: 2,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xs,
  },
  singleRow: {
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xs,
  },
  timestampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  timestampText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default LiveMonitoringScreen;
