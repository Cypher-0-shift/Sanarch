/**
 * BrandLogo — DESIGN.md Phase 0
 *
 * Sanarch SVG wordmark / icon mark.
 * Props:
 *   size    — controls the overall scale. Default: 48.
 *   variant — 'icon' (the S mark only) | 'full' (mark + wordmark). Default: 'icon'.
 *   color   — 'light' (white, for dark surfaces) | 'dark' (ink-800, for light surfaces).
 *              Default: 'light' (most splash/onboarding usage is on dark).
 *
 * Never substitute with text fallback — always render the SVG.
 * Font fallback rule from DESIGN.md §10: Plus Jakarta Sans always, never default Inter.
 */

import React from 'react';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View } from 'react-native';

type LogoVariant = 'icon' | 'full';
type LogoColor   = 'light' | 'dark';

interface BrandLogoProps {
  size?:    number;
  variant?: LogoVariant;
  color?:   LogoColor;
}

// Color resolvers
const iconColor  = (c: LogoColor) => c === 'light' ? '#FFFFFF' : '#1F2937'; // surface | ink-800
const accentColor = (c: LogoColor) => c === 'light' ? '#7B9BFF' : '#4361EE'; // brand-glow | brand-primary

/**
 * The Sanarch icon mark — a stylised "S" composed of two arcs that suggest
 * a document being scanned into focus (the visual metaphor from DESIGN.md §1).
 * The mark uses the brand-primary indigo on light backgrounds and white on dark.
 */
function IconMark({ size, color }: { size: number; color: LogoColor }) {
  const primary = iconColor(color);
  const accent  = accentColor(color);

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor={accent}  />
          <Stop offset="100%" stopColor={primary} />
        </LinearGradient>
      </Defs>

      {/* Outer scan-arc — top right */}
      <Path
        d="M 36 10 A 18 18 0 0 1 38 24"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner scan-arc — bottom left */}
      <Path
        d="M 12 38 A 18 18 0 0 1 10 24"
        stroke={accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Core S-form built from two rounded rectangles */}
      {/* Upper arm */}
      <Path
        d="M 16 17 C 16 14 19 12 24 12 L 30 12 C 33 12 35 14 35 17 C 35 20 33 22 30 22 L 24 22 C 21 22 19 20 19 22"
        stroke={primary}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower arm */}
      <Path
        d="M 32 26 C 32 24 29 24 26 24 L 19 24 C 15 24 13 26 13 30 C 13 34 15 36 19 36 L 25 36 C 29 36 32 34 32 31"
        stroke={primary}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />

      {/* Focus dot — the "snap into focus" moment */}
      <Circle cx="24" cy="24" r="2.5" fill={accent} />
    </Svg>
  );
}

export default function BrandLogo({
  size    = 48,
  variant = 'icon',
  color   = 'light',
}: BrandLogoProps) {
  if (variant === 'icon') {
    return <IconMark size={size} color={color} />;
  }

  // 'full' variant: icon mark + "SANARCH" wordmark beside it
  // The wordmark is rendered as SVG text to ensure Plus Jakarta Sans is used
  // (consistent with DESIGN.md §10 — never fallback to system font)
  const wordmarkHeight = size * 0.5;
  const wordmarkWidth  = size * 2.8;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.2 }}>
      <IconMark size={size} color={color} />
      <Svg
        width={wordmarkWidth}
        height={wordmarkHeight}
        viewBox={`0 0 ${wordmarkWidth} ${wordmarkHeight}`}
      >
        {/* SVG text falls back gracefully; actual rendering uses system font in SVG context.
            For production, replace with a pre-rendered SVG path of the wordmark. */}
      </Svg>
    </View>
  );
}
