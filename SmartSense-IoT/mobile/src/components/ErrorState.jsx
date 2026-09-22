import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme.js';

export function ErrorState({
  message = 'Unable to connect to SmartSense API.',
  onRetry,
  isRetrying = false,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="alert-triangle" size={32} color={colors.dangerLight} />
      </View>

      <Text style={styles.title}>Connection Error</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry ? (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
          <Text style={styles.retryText}>{isRetrying ? 'Retrying...' : 'Retry'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
    minHeight: 250,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default ErrorState;
