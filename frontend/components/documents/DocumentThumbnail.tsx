/**
 * DocumentThumbnail — DESIGN.md Phase 3
 *
 * 4 states with clearly differentiated visual treatments:
 *
 *   'image'      — renders the actual image from b2_file_url with category icon overlay
 *   'pdf'        — uses a PDF-specific placeholder (document lines visual)
 *   'processing' — animated shimmer with progress ring. DIFFERENT from failed.
 *                  A processing document is alive and working — show movement.
 *   'failed'     — static red-tinted placeholder with retry affordance icon.
 *                  A failed document is dead — no animation, clear error color.
 *
 * Critical UX rule: 'processing' and 'failed' must NEVER look the same.
 * "Processing" = in motion, something is happening.
 * "Failed" = stopped, something went wrong, action required.
 *
 * Standard sizes: sm (40×40) | md (64×64) | lg (80×80)
 */

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { DURATION } from '../../constants/motion';
import ShimmerWrapper from '../foundation/ShimmerWrapper';
import { CATEGORY_CONFIG, normaliseCategory } from './CategoryBadge';
import { useTheme } from '../foundation/ThemeProvider';

export type ThumbnailState = 'image' | 'pdf' | 'processing' | 'failed';
export type ThumbnailSize  = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<ThumbnailSize, number> = { sm: 40, md: 64, lg: 80 };

interface DocumentThumbnailProps {
  state:       ThumbnailState;
  /** Image URI for state='image' */
  imageUri?:   string;
  /** Category for icon overlay (all states) */
  category?:   string;
  size?:       ThumbnailSize;
  /** Processing progress 0–100 for the ring indicator */
  progress?:   number;
  style?:      object;
  onImageError?: () => void;
}

// ─────────────────────────────────────────────
// Processing ring — spins to show active work
// ─────────────────────────────────────────────

function ProcessingRing({ size, progress = 0 }: { size: number; progress: number }) {
  const { isReducedMotion } = useTheme();
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    if (isReducedMotion) return;
    rotate.value = withRepeat(
      withTiming(360, { duration: DURATION.shimmer }),
      -1,
      false,
    );
  }, [isReducedMotion]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const ringSize = size + 6;

  return (
    <Animated.View
      style={[
        spinStyle,
        {
          position:    'absolute',
          width:       ringSize,
          height:      ringSize,
          borderRadius: ringSize / 2,
          borderWidth:  2,
          borderColor:  COLORS.brandPrimary,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          top:         -3,
          left:        -3,
        },
      ]}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────
// PDF placeholder — document lines visual
// ─────────────────────────────────────────────

function PDFPlaceholder({ size, category }: { size: number; category: string }) {
  const cat = normaliseCategory(category);
  const cfg = CATEGORY_CONFIG[cat];
  const lineWidth = size * 0.55;

  return (
    <View
      style={{
        width:           size,
        height:          size,
        borderRadius:    RADIUS.icon,
        backgroundColor: cfg.bg,
        alignItems:      'center',
        justifyContent:  'center',
        gap:             3,
      }}
    >
      {/* PDF lines visual */}
      {[0.75, 0.55, 0.45].map((w, i) => (
        <View
          key={i}
          style={{
            width:           lineWidth * w,
            height:          2,
            borderRadius:    1,
            backgroundColor: cfg.color,
            opacity:         1 - i * 0.25,
          }}
        />
      ))}
      {/* PDF label */}
      <Text style={{ fontSize: 7, fontFamily: 'JetBrainsMono_500Medium', color: cfg.color, marginTop: 2 }}>
        PDF
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function DocumentThumbnail({
  state,
  imageUri,
  category = 'other',
  size     = 'md',
  progress = 0,
  style,
  onImageError,
}: DocumentThumbnailProps) {
  const px  = SIZE_PX[size];
  const cat = normaliseCategory(category);
  const cfg = CATEGORY_CONFIG[cat];

  const containerStyle = [
    styles.container,
    {
      width:        px,
      height:       px,
      borderRadius: RADIUS.icon,  // 10 — rounded square, NEVER circle
    },
    style,
  ];

  // ── Image state ──────────────────────────────────────────────────
  if (state === 'image' && imageUri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.icon }]}
          resizeMode="cover"
          onError={onImageError}
        />
        {/* Category icon overlay — small corner badge */}
        <View style={[styles.overlay, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: px * 0.2 }}>{cfg.icon}</Text>
        </View>
      </View>
    );
  }

  // ── PDF state ────────────────────────────────────────────────────
  if (state === 'pdf') {
    return (
      <View style={containerStyle}>
        <PDFPlaceholder size={px} category={category} />
      </View>
    );
  }

  // ── Processing state — animated, brand colour, movement ─────────
  // MUST look different from failed. Processing = alive, in motion.
  if (state === 'processing') {
    return (
      <View style={[containerStyle, styles.processingOuter]}>
        <ShimmerWrapper
          width={px}
          height={px}
          borderRadius={RADIUS.icon}
        />
        {/* Spinning ring to reinforce "something is happening" */}
        <ProcessingRing size={px} progress={progress} />
        {/* Subtle category icon at reduced opacity */}
        <Text
          style={{
            position:  'absolute',
            fontSize:  px * 0.35,
            opacity:   0.3,
          }}
          pointerEvents="none"
        >
          {cfg.icon}
        </Text>
      </View>
    );
  }

  // ── Failed state — static, red tint, no animation ───────────────
  // MUST look different from processing. Failed = stopped, error, action required.
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: COLORS.resultHighBg,  // #FEF2F2 — red tint
          borderWidth:     1.5,
          borderColor:     'rgba(220,38,38,0.25)',
          alignItems:      'center',
          justifyContent:  'center',
        },
      ]}
    >
      {/* Error symbol — clear visual indicator */}
      <Text style={{ fontSize: px * 0.4, opacity: 0.7 }}>⚠</Text>
      {/* "Failed" micro-label at very small sizes */}
      {size !== 'sm' && (
        <Text style={styles.failedLabel}>FAILED</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position:       'absolute',
    bottom:         2,
    right:          2,
    width:          18,
    height:         18,
    borderRadius:   4,
    alignItems:     'center',
    justifyContent: 'center',
  },
  processingOuter: {
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  failedLabel: {
    fontSize:      7,
    fontFamily:    'JetBrainsMono_500Medium',
    color:         COLORS.resultHigh,
    letterSpacing: 0.5,
    marginTop:     2,
  },
});
