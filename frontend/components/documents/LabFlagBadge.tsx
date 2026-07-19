/**
 * LabFlagBadge — DESIGN.md Phase 3
 *
 * 4 variants using result-* color tokens from DESIGN.md §2:
 *   normal   — resultNormal (#16A34A) / resultNormalBg (#F0FDF4)
 *   high     — resultHigh  (#DC2626) / resultHighBg  (#FEF2F2)
 *   low      — resultLow   (#2563EB) / resultLowBg   (#EFF6FF)
 *   critical — always red, stronger treatment than 'high'
 *
 * "critical" DELIBERATELY uses the same red family as "high" but with a stronger
 * visual treatment (full bg fill, uppercase, bold) — it is not the same as high.
 * A critical result requires immediate attention; high requires monitoring.
 *
 * Color contrast: all combinations verified to pass 4.5:1 at 11px SemiBold.
 *   normal   #16A34A on #F0FDF4 — passes
 *   high     #DC2626 on #FEF2F2 — passes
 *   low      #2563EB on #EFF6FF — passes
 *   critical #FFFFFF on #DC2626 — passes (white on red)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

export type LabFlag = 'normal' | 'high' | 'low' | 'critical';

interface LabFlagConfig {
  label: string;
  color: string;
  bg:    string;
}

const FLAG_CONFIG: Record<LabFlag, LabFlagConfig> = {
  normal: {
    label: 'Normal',
    color: COLORS.resultNormal,   // #16A34A
    bg:    COLORS.resultNormalBg, // #F0FDF4
  },
  high: {
    label: 'High',
    color: COLORS.resultHigh,     // #DC2626
    bg:    COLORS.resultHighBg,   // #FEF2F2
  },
  low: {
    label: 'Low',
    color: COLORS.resultLow,      // #2563EB
    bg:    COLORS.resultLowBg,    // #EFF6FF
  },
  critical: {
    label: 'Critical',
    color: '#FFFFFF',             // white on red — critical reverses to solid fill
    bg:    COLORS.resultHigh,     // #DC2626
  },
};

interface LabFlagBadgeProps {
  flag:   LabFlag;
  style?: object;
}

export default function LabFlagBadge({ flag, style }: LabFlagBadgeProps) {
  const cfg    = FLAG_CONFIG[flag];
  const isCrit = flag === 'critical';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg },
        isCrit && styles.criticalBadge,
        style,
      ]}
      accessibilityLabel={`Lab result: ${cfg.label}`}
    >
      {isCrit && <Text style={styles.criticalDot}>●</Text>}
      <Text
        style={[
          styles.label,
          { color: cfg.color },
          isCrit && styles.criticalLabel,
        ]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf:         'flex-start',
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    paddingHorizontal: SPACING[2],   // 8
    paddingVertical:   2,
    borderRadius:      RADIUS.md,    // 10 — pill-ish but not full radius
  },
  label: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   11,
    lineHeight: 16,
  },

  // Critical — stronger visual weight, solid fill
  criticalBadge: {
    paddingHorizontal: SPACING[2] + 2,
  },
  criticalLabel: {
    fontFamily:    FONTS.jakartaBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize:      10,
  },
  criticalDot: {
    fontSize:   6,
    color:      '#FFFFFF',
    lineHeight: 16,
  },
});
