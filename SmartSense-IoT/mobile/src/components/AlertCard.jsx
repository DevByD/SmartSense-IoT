import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import StatusBadge from './StatusBadge.jsx';

export function AlertCard({ alert, onAcknowledge, isAcknowledging = false }) {
  if (!alert) return null;

  const {
    alertId,
    type,
    severity = 'INFO',
    message,
    room = 'Room 1',
    deviceId,
    timestamp,
    acknowledged = false,
  } = alert;

  const normSeverity = severity.toUpperCase();
  let borderColor = colors.border;
  let iconName = 'info';
  let iconColor = colors.primaryLight;

  if (normSeverity === 'CRITICAL') {
    borderColor = colors.danger;
    iconName = 'alert-triangle';
    iconColor = colors.dangerLight;
  } else if (normSeverity === 'WARNING') {
    borderColor = colors.warning;
    iconName = 'alert-circle';
    iconColor = colors.warningLight;
  }

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name={iconName} size={18} color={iconColor} style={styles.titleIcon} />
          <Text style={styles.typeText} numberOfLines={1}>{type || 'SYSTEM_ALERT'}</Text>
        </View>
        <StatusBadge status={severity} size="small" />
      </View>

      <Text style={styles.messageText}>{message}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{room}</Text>
        </View>
        {deviceId ? (
          <View style={styles.metaItem}>
            <Feather name="cpu" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{deviceId}</Text>
          </View>
        ) : null}
        {formattedTime ? (
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{formattedTime}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {acknowledged ? (
          <View style={styles.ackBadge}>
            <Feather name="check-circle" size={14} color={colors.successLight} />
            <Text style={styles.ackText}>ACKNOWLEDGED</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.ackButton}
            onPress={() => onAcknowledge && onAcknowledge(alertId)}
            disabled={isAcknowledging}
            activeOpacity={0.7}
          >
            {isAcknowledging ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  titleIcon: {
    marginRight: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  ackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successLight,
    letterSpacing: 0.5,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  ackButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default AlertCard;
