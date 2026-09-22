import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import { DEFAULT_DEVICE_ID } from '../config/api.config.js';
import useDevice from '../hooks/useDevice.js';
import DeviceCard from '../components/DeviceCard.jsx';
import SecurityToggle from '../components/SecurityToggle.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export function DeviceStatusScreen() {
  const deviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : DEFAULT_DEVICE_ID;

  const {
    device,
    loading,
    error,
    refreshing,
    refresh,
    setSecurityMode,
    isUpdatingSecurity,
    securityError,
  } = useDevice(deviceId);

  const [localFeedback, setLocalFeedback] = useState(null);

  const handleSecurityChange = async (newMode) => {
    setLocalFeedback(null);
    try {
      await setSecurityMode(newMode);
      setLocalFeedback(`Security mode successfully updated to ${newMode}`);
    } catch (err) {
      const errMsg = err.message || `Failed to set security mode to ${newMode}`;
      Alert.alert('Security Update Failed', errMsg);
    }
  };

  if (loading && !device && !error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Loading device diagnostics..." />
      </SafeAreaView>
    );
  }

  if (error && !device) {
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
          <Text style={styles.title}>Device Status</Text>
          <Text style={styles.subtitle}>Hardware diagnostics & security surveillance</Text>
        </View>

        {/* Feedback Banner */}
        {localFeedback ? (
          <View style={styles.successBanner}>
            <Feather name="check-circle" size={16} color={colors.successLight} />
            <Text style={styles.successBannerText}>{localFeedback}</Text>
          </View>
        ) : null}

        {securityError ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.dangerLight} />
            <Text style={styles.errorBannerText}>{securityError}</Text>
          </View>
        ) : null}

        {/* Device Health & Connectivity Card */}
        <DeviceCard device={device} apiConnected={!error} />

        {/* Security Surveillance Controls */}
        <Text style={styles.sectionTitle}>Security Control</Text>
        <SecurityToggle
          currentMode={device?.securityMode || 'DISARMED'}
          onModeChange={handleSecurityChange}
          isUpdating={isUpdatingSecurity}
        />

        {/* Hardware Specifications & Metadata */}
        <Text style={styles.sectionTitle}>Hardware Profile</Text>
        <View style={styles.specCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Controller Board</Text>
            <Text style={styles.specValue}>Raspberry Pi 4B (Phase 14 Ready)</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Primary Pipeline</Text>
            <Text style={styles.specValue}>MQTT -&gt; Node-RED -&gt; Firebase</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Assigned Room</Text>
            <Text style={styles.specValue}>{device?.room || 'Room 1'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Firmware / Driver</Text>
            <Text style={styles.specValue}>Python 3 / Node Telemetry v1.0</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Node Status Source</Text>
            <Text style={styles.specValue}>Cloud Database (Firebase RTDB)</Text>
          </View>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successGlow,
    borderColor: colors.success,
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    fontSize: 12,
    color: colors.successLight,
    fontWeight: '600',
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
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.dangerLight,
    flex: 1,
  },
  specCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  specLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

export default DeviceStatusScreen;
