import React, { useCallback } from 'react';
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
import useDevice from '../hooks/useDevice.js';
import SensorCard from '../components/SensorCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export function DashboardScreen({ navigation, preloadedData = null, preloadedDevice = null }) {
  const deviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : DEFAULT_DEVICE_ID;

  const hookSensors = useLatestSensors(deviceId);
  const hookDevice = useDevice(deviceId);

  const sensorData = preloadedData || hookSensors.data;
  const sensorsLoading = preloadedData ? false : hookSensors.loading;
  const sensorsError = hookSensors.error;
  const sensorsRefreshing = hookSensors.refreshing;
  const refreshSensors = hookSensors.refresh;

  const device = preloadedDevice || hookDevice.device;
  const deviceRefreshing = hookDevice.refreshing;
  const refreshDevice = hookDevice.refresh;

  const isRefreshing = sensorsRefreshing || deviceRefreshing;

  const onRefresh = useCallback(() => {
    refreshSensors();
    refreshDevice();
  }, [refreshSensors, refreshDevice]);

  if (sensorsLoading && !sensorData && !sensorsError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Loading SmartSense data..." />
      </SafeAreaView>
    );
  }

  if (sensorsError && !sensorData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          message="Unable to connect to SmartSense API."
          onRetry={onRefresh}
          isRetrying={isRefreshing}
        />
      </SafeAreaView>
    );
  }

  const room = sensorData?.room || device?.room || 'Room 1';
  const deviceStatus = device?.status || 'ONLINE';
  const securityMode = device?.securityMode || 'DISARMED';
  const apiConnected = !sensorsError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryLight}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>SmartSense IoT</Text>
            <View style={styles.deviceMetaRow}>
              <Feather name="cpu" size={13} color={colors.textSecondary} />
              <Text style={styles.deviceMetaText}>{deviceId}</Text>
              <Text style={styles.metaDivider}>•</Text>
              <Feather name="map-pin" size={13} color={colors.textSecondary} />
              <Text style={styles.deviceMetaText}>{room}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshIconButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* System Connection Bar */}
        <View style={styles.systemBar}>
          <View style={styles.systemBarItem}>
            <Text style={styles.systemBarLabel}>API STATUS</Text>
            <StatusBadge
              status={apiConnected ? 'ONLINE' : 'OFFLINE'}
              label={apiConnected ? 'CONNECTED' : 'OFFLINE'}
              size="small"
            />
          </View>
          <View style={styles.systemBarItem}>
            <Text style={styles.systemBarLabel}>DEVICE STATUS</Text>
            <StatusBadge status={deviceStatus} size="small" />
          </View>
          <TouchableOpacity
            style={styles.systemBarItem}
            onPress={() => navigation?.navigate('DeviceStatus')}
            activeOpacity={0.7}
          >
            <Text style={styles.systemBarLabel}>SECURITY</Text>
            <StatusBadge status={securityMode} size="small" />
          </TouchableOpacity>
        </View>

        {/* Quick Navigate Banner */}
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() => navigation?.navigate('Live')}
          activeOpacity={0.8}
        >
          <View style={styles.liveBannerLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveBannerTitle}>Live Telemetry Active</Text>
          </View>
          <View style={styles.liveBannerRight}>
            <Text style={styles.liveBannerAction}>View Stream</Text>
            <Feather name="chevron-right" size={16} color={colors.primaryLight} />
          </View>
        </TouchableOpacity>

        {/* Section: Environmental Sensors */}
        <Text style={styles.sectionTitle}>Environmental Telemetry</Text>
        <View style={styles.cardGrid}>
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

        {/* Section: Spatial Proximity */}
        <View style={styles.singleCardRow}>
          <SensorCard
            title="Ultrasonic Distance"
            value={sensorData?.distance}
            unit="cm"
            status={sensorData?.distanceStatus || (sensorData?.distance < 15 ? 'WARNING' : 'NORMAL')}
            icon="minimize-2"
            timestamp={sensorData?.timestamp}
          />
        </View>

        {/* Section: Security & Event Sensors */}
        <Text style={styles.sectionTitle}>Security & State Triggers</Text>
        <View style={styles.cardGrid}>
          <SensorCard
            title="PIR Motion"
            value={sensorData?.motion}
            isBoolean={true}
            booleanActiveText="MOTION"
            booleanInactiveText="CLEAR"
            status={sensorData?.motion ? 'WARNING' : 'NORMAL'}
            icon="activity"
            timestamp={sensorData?.timestamp}
          />
          <SensorCard
            title="Sound Sensor"
            value={sensorData?.sound}
            isBoolean={true}
            booleanActiveText="DETECTED"
            booleanInactiveText="QUIET"
            status={sensorData?.sound ? 'WARNING' : 'NORMAL'}
            icon="volume-2"
            timestamp={sensorData?.timestamp}
          />
        </View>

        <View style={styles.singleCardRow}>
          <SensorCard
            title="Touch / Emergency SOS"
            value={sensorData?.touch}
            isBoolean={true}
            booleanActiveText="SOS TRIGGERED"
            booleanInactiveText="NORMAL"
            status={sensorData?.touch ? 'CRITICAL' : 'NORMAL'}
            icon="alert-octagon"
            timestamp={sensorData?.timestamp}
          />
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
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  deviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  deviceMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaDivider: {
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  systemBarItem: {
    alignItems: 'center',
    gap: 4,
  },
  systemBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  liveBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  liveBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveBannerAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  cardGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xs,
  },
  singleCardRow: {
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xs,
  },
});

export default DashboardScreen;
