import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';

export function SecurityToggle({ currentMode = 'DISARMED', onModeChange, isUpdating = false, disabled = false }) {
  const isArmed = (currentMode || '').toUpperCase() === 'ARMED';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather
            name={isArmed ? 'shield' : 'shield-off'}
            size={22}
            color={isArmed ? colors.dangerLight : colors.successLight}
          />
          <View>
            <Text style={styles.title}>Security Surveillance</Text>
            <Text style={styles.subtitle}>
              Current: <Text style={{ color: isArmed ? colors.dangerLight : colors.successLight, fontWeight: '700' }}>{isArmed ? 'ARMED' : 'DISARMED'}</Text>
            </Text>
          </View>
        </View>

        {isUpdating && <ActivityIndicator size="small" color={colors.primaryLight} />}
      </View>

      <Text style={styles.description}>
        {isArmed
          ? 'PIR motion detection will trigger CRITICAL security alerts immediately.'
          : 'Normal monitoring. PIR motion events will not trigger alarm sirens.'}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isArmed && styles.activeArmedButton,
            (isUpdating || disabled) && styles.disabledButton,
          ]}
          onPress={() => onModeChange && onModeChange('ARMED')}
          disabled={isUpdating || disabled || isArmed}
          activeOpacity={0.8}
        >
          <Feather name="lock" size={16} color={isArmed ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.buttonText, isArmed && styles.activeButtonText]}>ARM SYSTEM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            !isArmed && styles.activeDisarmedButton,
            (isUpdating || disabled) && styles.disabledButton,
          ]}
          onPress={() => onModeChange && onModeChange('DISARMED')}
          disabled={isUpdating || disabled || !isArmed}
          activeOpacity={0.8}
        >
          <Feather name="unlock" size={16} color={!isArmed ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.buttonText, !isArmed && styles.activeButtonText]}>DISARM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
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
    gap: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginVertical: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  activeArmedButton: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerLight,
  },
  activeDisarmedButton: {
    backgroundColor: colors.success,
    borderColor: colors.successLight,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
});

export default SecurityToggle;
