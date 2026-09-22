/**
 * SmartSense IoT Mobile - Theme and Design System
 * Dark modern IoT aesthetic matching the SmartSense web dashboard.
 */

export const colors = {
  // Backgrounds - Dark Slate Foundation
  background: '#090D16',
  surface: '#0F172A',
  card: '#131D33',
  cardSecondary: '#1E293B',
  overlay: 'rgba(9, 13, 22, 0.85)',

  // Borders & Dividers
  border: '#26354D',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#06B6D4',

  // Typography - High Contrast & Legibility
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverted: '#090D16',

  // Semantic Accents
  primary: '#06B6D4',
  primaryLight: '#22D3EE',
  primaryDark: '#0891B2',
  primaryGlow: 'rgba(6, 182, 212, 0.15)',

  accentBlue: '#3B82F6',
  accentBlueLight: '#60A5FA',
  accentBlueGlow: 'rgba(59, 130, 246, 0.15)',

  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.15)',

  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningGlow: 'rgba(245, 158, 11, 0.15)',

  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',

  info: '#06B6D4',
  infoLight: '#22D3EE',

  // Status & Security
  online: '#10B981',
  offline: '#EF4444',
  armed: '#EF4444',
  disarmed: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400', color: colors.textPrimary },
  bodySecondary: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  badge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  metric: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
};
