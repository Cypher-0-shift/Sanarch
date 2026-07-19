/**
 * TimelinePreview — Phase 4
 *
 * Displays the 3 most recent events on the Home screen.
 * Handles the empty state (if no events but has documents) and error state locally.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { type TimelineEvent } from '../../services/api';
import TimelineEventCard from './TimelineEventCard';
import { SkeletonCard } from '../loading/Skeletons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { DURATION, safeDuration, useReducedMotion } from '../../constants/motion';

interface TimelinePreviewProps {
  events: TimelineEvent[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewAll: () => void;
  onEventPress: (event: TimelineEvent) => void;
}

export default function TimelinePreview({
  events,
  isLoading,
  isError,
  onRetry,
  onViewAll,
  onEventPress,
}: TimelinePreviewProps) {
  const isReducedMotion = useReducedMotion();
  const enterDuration = safeDuration(DURATION.fast, isReducedMotion);
  const exitDuration = safeDuration(DURATION.fast, isReducedMotion);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {events.length > 0 && !isLoading && !isError && (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        )}
      </View>

      {/* Loading State */}
      {isLoading && (
        <Animated.View 
          style={styles.list} 
          exiting={FadeOut.duration(exitDuration)}
        >
          <SkeletonCard variant="document" />
          <SkeletonCard variant="document" />
          <SkeletonCard variant="document" />
        </Animated.View>
      )}

      {/* Error State — scoped to this component */}
      {!isLoading && isError && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color={COLORS.resultHigh} />
          <Text style={styles.errorText}>Couldn't load your timeline</Text>
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Content State */}
      {!isLoading && !isError && events.length > 0 && (
        <Animated.View 
          style={styles.list}
          entering={FadeIn.duration(enterDuration).delay(enterDuration / 2)}
          exiting={FadeOut.duration(exitDuration)}
        >
          {events.slice(0, 3).map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              onPress={() => onEventPress(event)}
            />
          ))}
        </Animated.View>
      )}
      {!isLoading && !isError && events.length === 0 && (
        <Text style={styles.emptyText}>No recent events to show.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[1],
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  viewAllText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.brandPrimary,
  },
  list: {
    gap: SPACING[3],
  },
  emptyText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    color: COLORS.ink400,
    textAlign: 'center',
    paddingVertical: SPACING[4],
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING[6],
    backgroundColor: COLORS.resultHighBg,
    borderRadius: RADIUS.xl,
    gap: SPACING[2],
  },
  errorText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    color: COLORS.resultHigh,
  },
  retryButton: {
    marginTop: SPACING[2],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.resultHigh,
  },
  retryText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 12,
    color: COLORS.surface,
  },
});
