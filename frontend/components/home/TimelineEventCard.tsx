/**
 * TimelineEventCard — Phase 4
 *
 * Reusable card for a timeline event (groups documents by condition/visit).
 * Used in Home TimelinePreview and Records Timeline view.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { CATEGORY_CONFIG, normaliseCategory } from '../documents/CategoryBadge';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING, DURATION } from '../../constants/motion';
import { type TimelineEvent } from '../../services/api';

interface TimelineEventCardProps {
  event: TimelineEvent;
  onPress: () => void;
  style?: object;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function TimelineEventCard({ event, onPress, style }: TimelineEventCardProps) {
  const cat = normaliseCategory(event.label);
  const cfg = CATEGORY_CONFIG[cat];

  const pressScale = useSharedValue(1);

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: DURATION.micro });
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, SPRING.buttonReturn);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const dateLabel = formatDate(event.date_start);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.card}
      >
        {/* Left: Icon */}
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
        </View>

        {/* Center: Content */}
        <View style={styles.content}>
          <Text style={styles.condition} numberOfLines={1}>
            {event.condition || 'Medical Event'}
          </Text>
          <View style={styles.metaRow}>
            {event.hospital ? (
              <Text style={styles.hospitalText} numberOfLines={1}>
                {event.hospital}
              </Text>
            ) : null}
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
        </View>

        {/* Right: Document count pill */}
        <View style={styles.countPill}>
          <Text style={styles.countText}>{event.document_count}</Text>
          <MaterialCommunityIcons name="file-document-outline" size={12} color={COLORS.brandPrimary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING[3],
    gap: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.ink100, // Very subtle border
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  condition: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  hospitalText: {
    flex: 1,
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    color: COLORS.ink400,
  },
  dateText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.ink400,
    flexShrink: 0,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  countText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 11,
    color: COLORS.brandPrimary,
  },
});
