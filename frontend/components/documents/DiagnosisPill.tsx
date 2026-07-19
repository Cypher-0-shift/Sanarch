/**
 * DiagnosisPill — DESIGN.md Phase 3
 *
 * Inline chip for diagnosis terms. Reused inside TreatmentGroupCard in Phase 5.
 * Kept intentionally minimal — just text in a chip shape.
 *
 * Supports:
 *   - default: ink tint bg, brand text
 *   - outline: transparent bg, ink border
 *   - muted: ink100 bg, ink600 text — for secondary diagnoses / comorbidities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

type DiagnosisPillVariant = 'default' | 'outline' | 'muted';

interface DiagnosisPillProps {
  label:    string;
  variant?: DiagnosisPillVariant;
  style?:   object;
}

export default function DiagnosisPill({
  label,
  variant = 'default',
  style,
}: DiagnosisPillProps) {
  const bg = variant === 'default'
    ? COLORS.brandTint   // #EEF2FF
    : variant === 'outline'
    ? 'transparent'
    : COLORS.ink100;     // #F3F4F6

  const fg = variant === 'muted'
    ? COLORS.ink600
    : COLORS.brandPrimary;

  const border = variant === 'outline'
    ? { borderWidth: 1, borderColor: COLORS.ink300 }
    : {};

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg },
        border,
        style,
      ]}
      accessibilityLabel={`Diagnosis: ${label}`}
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf:         'flex-start',
    paddingHorizontal: SPACING[3],   // 12
    paddingVertical:   SPACING[1],   // 4
    borderRadius:      RADIUS.full,  // pill shape — full radius
  },
  label: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   12,
    lineHeight: 18,
  },
});
