import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import StatusBadge from './StatusBadge.jsx';

export function DeviceCard({ device, apiConnected = true }) {
  if (!device) return null;

  const {
    deviceId = 'smartsense-pi-01',
    room = 'Room 1',
    status = 'OFFLINE',
    securityMode = 'DISARMED',
    lastSeen,
    ipAddress,
    cpuTemperature,
  } = device;

  const formattedLastSeen = lastSeen
    ? new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Unknown';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconCircle}>
            <Feather name="cpu" size={20} color={colors.primaryLight} />
          </View>
          <View>
            <Text style={styles.deviceName}>{deviceId}</Text>
            <Text style={styles.deviceRoom}>{room}</Text>
          </View>
        </View>

        <StatusBadge status={status} />
      </View>

      <View style={styles.divider} />

      {/* Connectivity Separation */}
      <View style={styles.statusGrid}>
        <View style={styles.statusCol}>
          <Text style={styles.label}>API CONNECTION</Text>
          <StatusBadge
            status={apiConnected ? 'ONLINE' : 'OFFLINE'}
            label={apiConnected ? 'CONNECTED' : 'UNREACHABLE'}
            size="small"
          />
        </View>
        <View style={styles.statusCol}>
          <Text style={styles.label}>HARDWARE NODE</Text>
          <StatusBadge status={status} size="small" />
        </View>
        <View style={styles.statusCol}>
          <Text style={styles.label}>SECURITY</Text>
          <StatusBadge status={securityMode} size="small" />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={styles.footerText}>Last seen: {formattedLastSeen}</Text>
        </View>
        {ipAddress ? (
          <View style={styles.footerItem}>
            <Feather name="wifi" size={12} color={colors.textMuted} />
            <Text style={styles.footerText}>{ipAddress}</Text>
          </View>
        ) : null}
        {cpuTemperature ? (
          <View style={styles.footerItem}>
            <Feather name="thermometer" size={12} color={colors.textMuted} />
            <Text style={styles.footerText}>{cpuTemperature}°C</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deviceRoom: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCol: {
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default DeviceCard;
