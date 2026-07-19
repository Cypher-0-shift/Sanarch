/**
 * StatusDot — DESIGN.md Phase 3
 *
 * A small circular dot used to indicate status in lists or headers.
 * 5 generic variants mapped to theme semantic colors.
 *
 * Variants:
 *   success -> resultNormal (#059669)
 *   error   -> resultHigh   (#DC2626)
 *   warning -> resultLow    (#D97706)
 *   info    -> brandPrimary (#4361EE)
 *   neutral -> ink400       (#9CA3AF)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

export type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusDotProps {
  status?: StatusVariant;
  size?: number;
  style?: ViewStyle | ViewStyle[];
}

const STATUS_COLORS: Record<StatusVariant, string> = {
  success: COLORS.resultNormal,
  error:   COLORS.resultHigh,
  warning: COLORS.resultLow,
  info:    COLORS.brandPrimary,
  neutral: COLORS.ink400,
};

export default function StatusDot({
  status = 'neutral',
  size = 8,
  style,
}: StatusDotProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: STATUS_COLORS[status],
        },
        style,
      ]}
      accessibilityLabel={`Status: ${status}`}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    // base styles (dimensions handled via props)
  },
});
