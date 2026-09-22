import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../theme/theme.js';

export function AnalyticsChart({
  data = [],
  title = 'Telemetry Trend',
  unit = '',
  color = colors.primaryLight,
  height = 180,
}) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 64, 280);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.card, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No historical data points for this range</Text>
        </View>
      </View>
    );
  }

  // Filter valid numbers
  const validPoints = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));

  if (validPoints.length === 0) {
    return (
      <View style={[styles.card, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No numerical telemetry recorded</Text>
        </View>
      </View>
    );
  }

  const values = validPoints.map((d) => d.value);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  // If min and max are equal (flat line), pad them so the line is centered
  if (minVal === maxVal) {
    minVal -= 1;
    maxVal += 1;
  } else {
    const padding = (maxVal - minVal) * 0.1;
    minVal -= padding;
    maxVal += padding;
  }

  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getX = (index) => {
    if (validPoints.length === 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (validPoints.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return paddingTop + innerHeight - ratio * innerHeight;
  };

  // Generate SVG Path
  let pathD = '';
  validPoints.forEach((point, i) => {
    const x = getX(i);
    const y = getY(point.value);
    if (i === 0) {
      pathD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });

  const latestPoint = validPoints[validPoints.length - 1];
  const firstTime = validPoints[0]?.timestamp
    ? new Date(validPoints[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const lastTime = latestPoint?.timestamp
    ? new Date(latestPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.currentValue, { color }]}>
          {latestPoint.value.toFixed(1)} {unit}
        </Text>
      </View>

      <Svg width={chartWidth} height={height}>
        {/* Horizontal grid lines */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={chartWidth - paddingRight}
          y2={paddingTop}
          stroke={colors.borderSubtle}
          strokeDasharray="4 4"
        />
        <Line
          x1={paddingLeft}
          y1={paddingTop + innerHeight / 2}
          x2={chartWidth - paddingRight}
          y2={paddingTop + innerHeight / 2}
          stroke={colors.borderSubtle}
          strokeDasharray="4 4"
        />
        <Line
          x1={paddingLeft}
          y1={paddingTop + innerHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + innerHeight}
          stroke={colors.borderSubtle}
        />

        {/* Y Axis Min/Max Labels */}
        <SvgText
          x={paddingLeft - 8}
          y={paddingTop + 4}
          fill={colors.textMuted}
          fontSize="10"
          textAnchor="end"
        >
          {maxVal.toFixed(0)}
        </SvgText>
        <SvgText
          x={paddingLeft - 8}
          y={paddingTop + innerHeight}
          fill={colors.textMuted}
          fontSize="10"
          textAnchor="end"
        >
          {minVal.toFixed(0)}
        </SvgText>

        {/* Data Line */}
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {validPoints.map((pt, idx) => (
          <Circle
            key={`pt-${idx}`}
            cx={getX(idx)}
            cy={getY(pt.value)}
            r={validPoints.length < 15 ? 3.5 : 2}
            fill={colors.card}
            stroke={color}
            strokeWidth="2"
          />
        ))}

        {/* X Axis Time Labels */}
        <SvgText
          x={paddingLeft}
          y={height - 6}
          fill={colors.textMuted}
          fontSize="10"
          textAnchor="start"
        >
          {firstTime}
        </SvgText>
        <SvgText
          x={chartWidth - paddingRight}
          y={height - 6}
          fill={colors.textMuted}
          fontSize="10"
          textAnchor="end"
        >
          {lastTime}
        </SvgText>
      </Svg>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default AnalyticsChart;
