import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import { API_BASE_URL, DEFAULT_DEVICE_ID } from '../config/api.config.js';
import { get } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export function SettingsScreen({ navigation }) {
  const [testingConnection, setTestingConnection] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  const deviceId = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEVICE_ID
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : DEFAULT_DEVICE_ID;

  const currentApiUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
    ? process.env.EXPO_PUBLIC_API_BASE_URL
    : API_BASE_URL;

  // Sanitize URL for presentation (no query params or credentials)
  const sanitizedApiUrl = currentApiUrl ? currentApiUrl.split('?')[0] : 'http://localhost:5000/api';

  const testApiHealth = async () => {
    setTestingConnection(true);
    try {
      const res = await get('/health');
      setHealthStatus({
        status: res?.status || 'UP',
        environment: res?.environment || 'development',
        timestamp: res?.timestamp || new Date().toISOString(),
      });
      Alert.alert('API Online', 'SmartSense REST API responded with status UP (200 OK).');
    } catch (err) {
      setHealthStatus({ status: 'UNREACHABLE', error: err.message });
      Alert.alert('API Error', err.message || 'Unable to connect to SmartSense backend.');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>System Settings</Text>
          <Text style={styles.subtitle}>Runtime configuration & network endpoints</Text>
        </View>

        {/* System Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="layers" size={18} color={colors.primaryLight} />
            <Text style={styles.cardTitle}>Application Information</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Application Name</Text>
            <Text style={styles.val}>SmartSense IoT Mobile</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Framework</Text>
            <Text style={styles.val}>React Native + Expo</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.val}>1.0.0 (Phase 9)</Text>
          </View>
        </View>

        {/* Network & Backend Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="server" size={18} color={colors.primaryLight} />
            <Text style={styles.cardTitle}>API Endpoint Configuration</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>API Base URL</Text>
            <Text style={[styles.val, styles.mono]}>{sanitizedApiUrl}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Target Device ID</Text>
            <Text style={[styles.val, styles.mono]}>{deviceId}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Assigned Room</Text>
            <Text style={styles.val}>Room 1</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>API Health</Text>
            <StatusBadge
              status={healthStatus ? healthStatus.status : 'INFO'}
              label={healthStatus ? healthStatus.status : 'NOT TESTED'}
              size="small"
            />
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={testApiHealth}
            disabled={testingConnection}
            activeOpacity={0.8}
          >
            {testingConnection ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="activity" size={16} color="#FFFFFF" />
                <Text style={styles.testButtonText}>TEST API CONNECTION</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Navigation Links */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="sliders" size={18} color={colors.primaryLight} />
            <Text style={styles.cardTitle}>Device & Security Controls</Text>
          </View>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation?.navigate('DeviceStatus')}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <Feather name="shield" size={18} color={colors.dangerLight} />
              <View>
                <Text style={styles.navRowTitle}>Device Diagnostics & Security</Text>
                <Text style={styles.navRowSubtitle}>ARM / DISARM surveillance mode</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Future Push Notifications Architecture Note */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="bell" size={18} color={colors.primaryLight} />
            <Text style={styles.cardTitle}>Push Notifications Architecture</Text>
          </View>
          <Text style={styles.infoText}>
            Production push notifications will route through:
          </Text>
          <View style={styles.pipelineBox}>
            <Text style={styles.pipelineText}>
              Node-RED Alert Engine ➔ Firebase / Express Backend ➔ Notification Service ➔ Mobile Expo Push
            </Text>
          </View>
          <Text style={styles.infoSubtext}>
            Mobile client is fully prepared for future push handler integration.
          </Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mono: {
    fontSize: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  navRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navRowSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pipelineBox: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: 4,
  },
  pipelineText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
    lineHeight: 16,
  },
  infoSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default SettingsScreen;
