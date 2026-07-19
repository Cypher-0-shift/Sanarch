/**
 * InlineError — DESIGN.md Phase 1
 *
 * Red helper text rendered below a FormField in its error state.
 * Always paired with a visual icon so the error is never conveyed
 * by color alone (DESIGN.md §accessibility).
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

interface InlineErrorProps {
  message: string;
  testID?: string;
}

export default function InlineError({ message, testID }: InlineErrorProps) {
  if (!message) return null;
  return (
    <View style={styles.row} testID={testID} accessibilityRole="alert">
      {/* ⚠ inline text indicator — no icon dependency in Phase 1 */}
      <Text style={styles.icon} accessibilityElementsHidden>{'⚠ '}</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginTop:     4,
    gap:           2,
  },
  icon: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   11,
    color:      COLORS.resultHigh,
    lineHeight: 16,
  },
  text: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   11,
    lineHeight: 16,
    color:      COLORS.resultHigh,
    flexShrink: 1,
  },
});
