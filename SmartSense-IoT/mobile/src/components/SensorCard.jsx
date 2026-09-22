import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';
import StatusBadge from './StatusBadge.jsx';

export function SensorCard({
  title,
  value,
  unit = '',
  status = 'NORMAL',
  icon = 'activity',
  isBoolean = false,
  booleanActiveText = 'DETECTED',
  booleanInactiveText = 'CLEAR',
  timestamp,
}) {
  const normStatus = (status || 'NORMAL').toUpperCase();

  // Pick accent color
  let accentColor = colors.primary;
  let iconBgColor = colors.primaryGlow;

  if (normStatus === 'CRITICAL') {
    accentColor = colors.danger;
    iconBgColor = colors.dangerGlow;
  } else if (normStatus === 'WARNING') {
    accentColor = colors.warning;
    iconBgColor = colors.warningGlow;
  } else if (normStatus === 'NORMAL') {
    accentColor = colors.success;
    iconBgColor = colors.successGlow;
  }

  const renderValue = () => {
    if (value === null || value === undefined) {
      return <Text style={styles.valueText}>--</Text>;
    }

    if (isBoolean) {
      const active = Boolean(value);
      return (
        <View style={styles.booleanRow}>
          <Text
            style={[
              styles.valueText,
              { color: active ? colors.dangerLight : colors.successLight, fontSize: 20 },
            ]}
          >
            {active ? booleanActiveText : booleanInactiveText}
          </Text>
        </View>
      );
    }

    const numVal = typeof value === 'number' ? value.toFixed(1) : value;

    return (
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{numVal}</Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Feather name={icon} size={20} color={accentColor} />
        </View>
        <StatusBadge status={status} size="small" />
      </View>

      <Text style={styles.titleText}>{title}</Text>

      <View style={styles.contentContainer}>
        {renderValue()}
      </View>

      {timestamp ? (
        <Text style={styles.timestampText}>
          Updated: {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    flex: 1,
    minWidth: 150,
    margin: spacing.xs,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  contentContainer: {
    marginVertical: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: 4,
  },
  booleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

export default SensorCard;
