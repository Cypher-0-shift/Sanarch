/**
 * CollapsibleSection — Phase 5
 *
 * Reusable collapsible section for the Record Detail screen.
 * Used for Lab Results, Medications, Diagnoses.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  hasAlerts?: boolean;
  initiallyExpanded?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  count = 0,
  hasAlerts = false,
  initiallyExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  // If alerts exist and we haven't mounted yet, we might want to auto-expand.
  // The prop `initiallyExpanded` will handle this.
  useEffect(() => {
    setExpanded(initiallyExpanded);
  }, [initiallyExpanded]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  if (count === 0 && !hasAlerts) {
    return null; // Don't render empty sections per standard UX, or could render them disabled
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          
          {count > 0 && (
            <View style={[styles.badge, hasAlerts && styles.badgeAlert]}>
              <Text style={[styles.badgeText, hasAlerts && styles.badgeTextAlert]}>
                {count}
              </Text>
            </View>
          )}

          {hasAlerts && (
            <MaterialCommunityIcons name="alert" size={16} color={COLORS.resultHigh} style={{ marginLeft: 4 }} />
          )}
        </View>

        <MaterialCommunityIcons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color={COLORS.ink400} 
        />
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.ink100,
    marginBottom: SPACING[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    backgroundColor: COLORS.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  title: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
  },
  badgeAlert: {
    backgroundColor: COLORS.resultHighBg,
  },
  badgeText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.ink600,
  },
  badgeTextAlert: {
    color: COLORS.resultHigh,
  },
  content: {
    padding: SPACING[4],
    paddingTop: 0,
    gap: SPACING[3],
  },
});
