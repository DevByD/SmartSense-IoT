import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../theme/theme.js';

export function StatusBadge({ status, label, size = 'medium' }) {
  const normStatus = (status || '').toUpperCase();

  let bgColor = 'rgba(55, 65, 81, 0.4)';
  let textColor = colors.textSecondary;
  let dotColor = colors.textMuted;
  let displayLabel = label || normStatus;

  switch (normStatus) {
    case 'NORMAL':
    case 'ONLINE':
    case 'DISARMED':
    case 'NO_MOTION':
    case 'QUIET':
    case 'SAFE':
    case 'UP':
      bgColor = colors.successGlow;
      textColor = colors.successLight;
      dotColor = colors.success;
      break;

    case 'WARNING':
    case 'PENDING':
    case 'MOTION':
    case 'MOTION_DETECTED':
    case 'SOUND_DETECTED':
    case 'CLOSE_OBJECT':
      bgColor = colors.warningGlow;
      textColor = colors.warningLight;
      dotColor = colors.warning;
      break;

    case 'CRITICAL':
    case 'OFFLINE':
    case 'ARMED':
    case 'SOS_ACTIVATED':
    case 'EMERGENCY':
    case 'BREACH':
    case 'SECURITY_BREACH':
      bgColor = colors.dangerGlow;
      textColor = colors.dangerLight;
      dotColor = colors.danger;
      break;

    case 'INFO':
    case 'ACKNOWLEDGED':
      bgColor = colors.primaryGlow;
      textColor = colors.primaryLight;
      dotColor = colors.primary;
      break;

    default:
      break;
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        isSmall && styles.badgeSmall,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall && styles.textSmall,
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 10,
  },
});

export default StatusBadge;
