/**
 * Skeleton components — DESIGN.md Phase 1
 *
 * All built on ShimmerWrapper from Phase 0.
 * Never render a bare "—" or "0" — always use these for loading states.
 *
 * Exported:
 *   SkeletonText      — text line in short/medium/long variants
 *   SkeletonCard      — full card in document/timeline/profile variants
 *   SkeletonAvatar    — square avatar (DESIGN.md: rounded square, not circle)
 *   CircularSpinner   — animated spinner in white/brand variants
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ShimmerWrapper from '../foundation/ShimmerWrapper';
import { COLORS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { SHIMMER } from '../../constants/motion';

// ─────────────────────────────────────────────
// SkeletonText
// ─────────────────────────────────────────────

type TextSize = 'short' | 'medium' | 'long';

const TEXT_WIDTH: Record<TextSize, number> = {
  short:  40,
  medium: 65,
  long:   90,
};

interface SkeletonTextProps {
  size?:   TextSize;
  height?: number;
  style?:  object;
}

export function SkeletonText({ size = 'medium', height = 14, style }: SkeletonTextProps) {
  return (
    <ShimmerWrapper
      width={`${TEXT_WIDTH[size]}%` as any}
      height={height}
      borderRadius={4}
      style={style}
    />
  );
}

// ─────────────────────────────────────────────
// SkeletonCard
// ─────────────────────────────────────────────

type CardSkeletonVariant = 'document' | 'timeline' | 'profile';

interface SkeletonCardProps {
  variant?: CardSkeletonVariant;
  style?:   object;
}

export function SkeletonCard({ variant = 'document', style }: SkeletonCardProps) {
  if (variant === 'document') {
    return (
      <View style={[skeletonStyles.documentCard, style]}>
        {/* Category dot + title row */}
        <View style={skeletonStyles.row}>
          <ShimmerWrapper width={40} height={40} borderRadius={RADIUS.icon} />
          <View style={skeletonStyles.textBlock}>
            <SkeletonText size="medium" height={14} />
            <SkeletonText size="short"  height={11} style={{ marginTop: 6 }} />
          </View>
        </View>
        {/* Footer row */}
        <View style={[skeletonStyles.row, { marginTop: SPACING[3] }]}>
          <SkeletonText size="short" height={10} />
          <SkeletonText size="short" height={10} />
        </View>
      </View>
    );
  }

  if (variant === 'timeline') {
    return (
      <View style={[skeletonStyles.timelineCard, style]}>
        <View style={skeletonStyles.timelineDot} />
        <View style={skeletonStyles.textBlock}>
          <SkeletonText size="medium" height={13} />
          <SkeletonText size="short"  height={11} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  }

  // profile
  return (
    <View style={[skeletonStyles.profileCard, style]}>
      <ShimmerWrapper width={56} height={56} borderRadius={RADIUS.icon} />
      <View style={skeletonStyles.textBlock}>
        <SkeletonText size="medium" height={16} />
        <SkeletonText size="short"  height={12} style={{ marginTop: 6 }} />
        <SkeletonText size="long"   height={11} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// SkeletonAvatar
// DESIGN.md §5: icon container = rounded square (radius 10), NEVER circle
// ─────────────────────────────────────────────

interface SkeletonAvatarProps {
  size?:   number;
  shape?:  'square' | 'circle'; // circle only allowed for actual avatars, not icon containers
  style?:  object;
}

export function SkeletonAvatar({ size = 40, shape = 'square', style }: SkeletonAvatarProps) {
  return (
    <ShimmerWrapper
      width={size}
      height={size}
      borderRadius={shape === 'circle' ? RADIUS.full : RADIUS.icon}
      style={style}
    />
  );
}

// ─────────────────────────────────────────────
// CircularSpinner
// ─────────────────────────────────────────────

type SpinnerVariant = 'white' | 'brand';

interface CircularSpinnerProps {
  variant?: SpinnerVariant;
  size?:    'sm' | 'md' | 'lg';
}

const SPINNER_SIZE = { sm: 18, md: 24, lg: 36 };

export function CircularSpinner({ variant = 'brand', size = 'md' }: CircularSpinnerProps) {
  return (
    <ActivityIndicator
      size={SPINNER_SIZE[size]}
      color={variant === 'white' ? COLORS.surface : COLORS.brandPrimary}
    />
  );
}

// ─────────────────────────────────────────────
// Shared StyleSheet
// ─────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  documentCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.xl,
    padding:         SPACING[4],
    borderWidth:     1,
    borderColor:     'rgba(17,24,39,0.06)',
    ...ELEVATION_RN[1],
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           SPACING[3],
    paddingVertical: SPACING[3],
  },
  timelineDot: {
    width:           10,
    height:          10,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.ink200,
    marginTop:       4,
    flexShrink:      0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING[4],
    backgroundColor: COLORS.surface,
    borderRadius:  RADIUS.xl,
    padding:       SPACING[4],
    borderWidth:   1,
    borderColor:   'rgba(17,24,39,0.06)',
    ...ELEVATION_RN[1],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING[3],
  },
  textBlock: {
    flex: 1,
    gap:  0,
  },
});
