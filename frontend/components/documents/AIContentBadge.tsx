/**
 * AIContentBadge — DESIGN.md Phase 3
 *
 * "AI Extracted" pill. Brand-tint bg (#EEF2FF), brand-primary icon + text.
 *
 * DESIGN.md spec note: this label is intentionally NOT uppercase.
 * Do not "fix" the casing — it's a deliberate exception to the label-caps pattern
 * because "AI Extracted" is a product feature name, not a category label.
 *
 * Used in DocumentCard (when extracted_data is present), Record Detail header,
 * and any surface that needs to signal AI-processed content.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface AIContentBadgeProps {
  /** Override the label. Default: "AI Extracted" */
  label?: string;
  style?: object;
}

export default function AIContentBadge({
  label = 'AI Extracted',
  style,
}: AIContentBadgeProps) {
  return (
    <View
      style={[styles.badge, style]}
      accessibilityLabel={label}
    >
      {/* Spark icon — simple unicode, no icon library dependency */}
      <Text style={styles.icon} accessibilityElementsHidden>✦</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:    'row',
    alignItems:       'center',
    alignSelf:        'flex-start',
    gap:              4,
    paddingHorizontal: SPACING[2],   // 8
    paddingVertical:   3,
    backgroundColor:  COLORS.brandTint,    // #EEF2FF
    borderRadius:     RADIUS.lg,           // 14
    borderWidth:      1,
    borderColor:      'rgba(67,97,238,0.15)',
  },
  icon: {
    fontSize: 10,
    color:    COLORS.brandPrimary,  // #4361EE
    lineHeight: 16,
  },
  label: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   11,
    lineHeight: 16,
    color:      COLORS.brandPrimary,  // #4361EE
    // NOT uppercase — intentional per DESIGN.md spec note above
  },
});
