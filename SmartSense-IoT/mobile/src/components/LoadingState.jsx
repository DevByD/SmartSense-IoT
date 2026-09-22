import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/theme.js';

export function LoadingState({ message = 'Loading SmartSense data...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryLight} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    minHeight: 220,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoadingState;
