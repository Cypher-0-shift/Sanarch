/**
 * EmptyStateCard — DESIGN.md Phase 1
 *
 * Every empty state in the app uses this component.
 * Rules:
 *   - headline: ≤8 words (enforced via dev warning)
 *   - subtext:  ≤15 words (enforced via dev warning)
 *   - cta: REQUIRED (not optional) — prevents bare "—" or "0" regressions
 *
 * The CTA prop is typed as required. Every callsite MUST provide it.
 * This is a structural decision — empty states with no CTA are useless
 * and create dead ends in the user journey.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONTS, ELEVATION_RN } from '../../constants/theme';
import PrimaryButton from '../buttons/PrimaryButton';

interface EmptyStateCTA {
  label:   string;
  onPress: () => void;
}

interface EmptyStateCardProps {
  /** SVG or image illustration — pass a React element */
  illustration?: React.ReactNode;
  /** Bold headline — MAXIMUM 8 WORDS */
  headline:      string;
  /** Supporting text — MAXIMUM 15 WORDS */
  subtext:       string;
  /** Required CTA — prevents regression to bare empty states */
  cta:           EmptyStateCTA;
  /** Optional secondary ghost action */
  secondaryAction?: EmptyStateCTA;
  style?:        object;
  testID?:       string;
}

// Word count guard — dev only
function warnWordCount(text: string, field: string, max: number) {
  if (__DEV__) {
    const count = text.trim().split(/\s+/).length;
    if (count > max) {
      console.warn(
        `[EmptyStateCard] "${field}" has ${count} words — maximum is ${max}. ` +
        `Trim it: "${text}"`
      );
    }
  }
}

export default function EmptyStateCard({
  illustration,
  headline,
  subtext,
  cta,
  secondaryAction,
  style,
  testID,
}: EmptyStateCardProps) {
  warnWordCount(headline, 'headline', 8);
  warnWordCount(subtext,  'subtext',  15);

  return (
    <View style={[styles.card, style]} testID={testID}>
      {/* Illustration */}
      {illustration && (
        <View style={styles.illustration} accessibilityElementsHidden>
          {illustration}
        </View>
      )}

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.subtext}>{subtext}</Text>
      </View>

      {/* Primary CTA — required */}
      <View style={styles.actions}>
        <PrimaryButton
          label={cta.label}
          onPress={cta.onPress}
          fullWidth
        />

        {/* Secondary ghost action — optional */}
        {secondaryAction && (
          <Text
            style={styles.secondaryLink}
            onPress={secondaryAction.onPress}
            accessibilityRole="button"
          >
            {secondaryAction.label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS['2xl'],   // 24 — slightly larger than standard card
    borderWidth:     1,
    borderColor:     'rgba(17,24,39,0.06)',
    padding:         SPACING[8],     // 32 — generous whitespace
    alignItems:      'center',
    gap:             SPACING[6],     // 24
    ...ELEVATION_RN[1],
  },
  illustration: {
    width:  120,
    height: 120,
    alignItems:     'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap:        SPACING[2],  // 8
  },
  headline: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      20,
    lineHeight:    28,
    color:         COLORS.ink800,
    textAlign:     'center',
    letterSpacing: -0.20,            // DESIGN.md: ≥20px → negative tracking
  },
  subtext: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   14,
    lineHeight: 22,
    color:      COLORS.ink400,
    textAlign:  'center',
  },
  actions: {
    width: '100%',
    gap:   SPACING[3],   // 12
    alignItems: 'center',
  },
  secondaryLink: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   14,
    color:      COLORS.brandPrimary,
    paddingVertical: SPACING[1],  // 4 — tap target padding
  },
});
