/**
 * Hero — Phase 2 / DESIGN.md
 *
 * Exactly 3 pages, vertical swipe (FlatList pagingEnabled + vertical).
 * Swipe affordance: animated chevron-down indicator (not just dots) because
 * vertical swipe is non-default on tall screens.
 *
 * Fixed across ALL pages:
 *   "Get Started" CTA — bottom, never gated to last page
 *   "Skip" link — top-right, routes straight to Login
 *
 * Pages:
 *   1. "Your complete health history. In your pocket." — brand intro
 *   2. "Upload any document. Our AI reads it for you." — upload/extraction
 *   3. "Share with your doctor in 10 seconds." — QR visual
 *
 * Background: dark-950 throughout (dark surface = authority per DESIGN.md §1).
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { DURATION, SPRING } from '../../constants/motion';
import BrandLogo from '../../components/foundation/BrandLogo';
import PrimaryButton from '../../components/buttons/PrimaryButton';

const { width: W, height: H } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Page data — exactly 3, per spec
// ─────────────────────────────────────────────

const PAGES = [
  {
    id: '0',
    eyebrow:  'Welcome to Sanarch',
    headline: 'Your complete health\nhistory. In your pocket.',
    sub:      'All your medical records, prescriptions, and reports — organised and searchable.',
    visual:   'brand',
  },
  {
    id: '1',
    eyebrow:  'Document Intelligence',
    headline: 'Upload any document.\nOur AI reads it for you.',
    sub:      'Snap a photo or upload a PDF. We extract diagnoses, medications, and lab values automatically.',
    visual:   'upload',
  },
  {
    id: '2',
    eyebrow:  'Instant Sharing',
    headline: 'Share with your doctor\nin 10 seconds.',
    sub:      'Generate a secure QR code. Your doctor scans it and sees exactly what they need.',
    visual:   'qr',
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<typeof PAGES[0]>);

// ─────────────────────────────────────────────
// Swipe affordance — bouncing chevron arrow
// ─────────────────────────────────────────────

function SwipeAffordance({ visible }: { visible: boolean }) {
  const nudge = useSharedValue(0);

  React.useEffect(() => {
    if (!visible) { nudge.value = 0; return; }
    nudge.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 600 }),
        withTiming(0,  { duration: 600 }),
      ),
      -1,
      false,
    );
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform:  [{ translateY: nudge.value }],
    opacity:    interpolate(nudge.value, [0, 10], [0.5, 0.9], Extrapolation.CLAMP),
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.affordance, style]} pointerEvents="none">
      <Text style={styles.affordanceIcon}>↓</Text>
      <Text style={styles.affordanceLabel}>Swipe down</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Page visuals
// ─────────────────────────────────────────────

function BrandVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={styles.visualGlow} />
      <BrandLogo size={96} variant="icon" color="light" />
    </View>
  );
}

function UploadVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={[styles.visualCard, { backgroundColor: COLORS.dark800 }]}>
        <View style={styles.visualDocRow}>
          {['📋', '🔬', '💊'].map((icon, i) => (
            <View key={i} style={[styles.docChip, { opacity: 1 - i * 0.2 }]}>
              <Text style={styles.docChipIcon}>{icon}</Text>
            </View>
          ))}
        </View>
        <View style={styles.aiScanLine} />
        <View style={[styles.aiResultBadge]}>
          <View style={[styles.aiBadgeDot, { backgroundColor: COLORS.resultNormal }]} />
          <Text style={styles.aiBadgeText}>Extracted 12 values</Text>
        </View>
      </View>
    </View>
  );
}

function QRVisual() {
  return (
    <View style={styles.visualContainer}>
      <View style={[styles.visualCard, styles.qrCard]}>
        {/* QR placeholder grid */}
        <View style={styles.qrGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View
              key={i}
              style={[styles.qrCell, { opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.3 }]}
            />
          ))}
        </View>
        <Text style={styles.qrExpiry}>Expires in 10:00</Text>
      </View>
    </View>
  );
}

function PageVisual({ type }: { type: string }) {
  switch (type) {
    case 'upload': return <UploadVisual />;
    case 'qr':     return <QRVisual />;
    default:       return <BrandVisual />;
  }
}

// ─────────────────────────────────────────────
// Single page
// ─────────────────────────────────────────────

function HeroPage({ item, index, scrollY }: {
  item: typeof PAGES[0];
  index: number;
  scrollY: SharedValue<number>;
}) {
  const pageStart = index * H;
  const pageEnd   = (index + 1) * H;

  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [pageStart - H * 0.3, pageStart, pageStart + H * 0.3],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollY.value,
      [pageStart - H * 0.3, pageStart],
      [24, 0],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageContent, contentStyle]}>
        {/* Visual */}
        <PageVisual type={item.visual} />

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>{item.eyebrow}</Text>
          <Text style={styles.headline}>{item.headline}</Text>
          <Text style={styles.sub}>{item.sub}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Dot indicators (minimal, vertical)
// ─────────────────────────────────────────────

function DotIndicators({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function HeroScreen() {
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollY     = useSharedValue(0);
  const listRef     = useRef<FlatList>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems[0]?.index != null) {
        setActiveIdx(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const isLastPage = activeIdx === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark950} />

      {/* Skip — fixed top-right, every page */}
      <Pressable
        style={[styles.skip, { top: insets.top + 16 }]}
        onPress={() => router.replace('/auth/login')}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Skip to login"
      >
        <Text style={styles.skipLabel}>Skip</Text>
      </Pressable>

      {/* Dot indicators — left side */}
      <View style={[styles.dotsWrap, { top: insets.top + H * 0.3 }]}>
        <DotIndicators count={PAGES.length} activeIndex={activeIdx} />
      </View>

      {/* Vertical pager */}
      <AnimatedFlatList
        ref={listRef as any}
        data={PAGES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <HeroPage item={item} index={index} scrollY={scrollY} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Swipe affordance — hidden on last page */}
      <SwipeAffordance visible={!isLastPage} />

      {/* Fixed CTA — every page, per spec */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <PrimaryButton
          label="Get Started"
          onPress={() => router.push('/auth/login')}
          fullWidth
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.dark950,
  },

  // Skip
  skip: {
    position:    'absolute',
    right:       SPACING[5],
    zIndex:      10,
  },
  skipLabel: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   14,
    color:      'rgba(255,255,255,0.55)',
  },

  // Dots
  dotsWrap: {
    position: 'absolute',
    left:     SPACING[4],
    zIndex:   5,
  },
  dots: {
    gap: SPACING[2],
  },
  dot: {
    width:         4,
    height:        4,
    borderRadius:  2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    height:          16,
    borderRadius:    2,
    backgroundColor: COLORS.brandGlow,
  },

  // Pages
  page: {
    width:  W,
    height: H,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
    paddingTop:     80,
    paddingBottom:  160,
  },
  pageContent: {
    alignItems: 'center',
    gap:        SPACING[8],
    width:      '100%',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    gap:        SPACING[3],
  },
  eyebrow: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      11,
    color:         COLORS.brandGlow,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily:    FONTS.jakartaExtraBold,
    fontSize:      28,
    lineHeight:    36,
    color:         COLORS.surface,
    textAlign:     'center',
    letterSpacing: -0.56, // DESIGN.md: ≥20px → negative tracking
  },
  sub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   14,
    lineHeight: 22,
    color:      'rgba(255,255,255,0.55)',
    textAlign:  'center',
    maxWidth:   300,
  },

  // Visuals
  visualContainer: {
    width:          220,
    height:         200,
    alignItems:     'center',
    justifyContent: 'center',
  },
  visualGlow: {
    position:        'absolute',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: 'rgba(67,97,238,0.12)',
  },
  visualCard: {
    width:        200,
    height:       160,
    borderRadius: RADIUS['2xl'],
    padding:      SPACING[4],
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
  },
  visualDocRow: {
    flexDirection: 'row',
    gap:           SPACING[2],
  },
  docChip: {
    width:           44,
    height:          44,
    borderRadius:    RADIUS.icon,
    backgroundColor: COLORS.dark700,
    alignItems:      'center',
    justifyContent:  'center',
  },
  docChipIcon: { fontSize: 20 },
  aiScanLine: {
    height:          2,
    backgroundColor: COLORS.brandGlow,
    opacity:         0.6,
    borderRadius:    1,
  },
  aiResultBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: COLORS.dark700,
    borderRadius:    RADIUS.lg,
    paddingHorizontal: SPACING[3],
    paddingVertical:   SPACING[1],
    alignSelf:       'flex-start',
  },
  aiBadgeDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  aiBadgeText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   11,
    color:      'rgba(255,255,255,0.7)',
  },
  qrCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING[3],
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    width:          90,
    gap:             4,
  },
  qrCell: {
    width:           26,
    height:          26,
    borderRadius:    4,
    backgroundColor: COLORS.brandGlow,
  },
  qrExpiry: {
    fontFamily: FONTS.monoRegular,
    fontSize:   11,
    color:      'rgba(255,255,255,0.4)',
  },

  // Swipe affordance
  affordance: {
    position:  'absolute',
    bottom:    130,
    alignSelf: 'center',
    alignItems: 'center',
    gap:        2,
  },
  affordanceIcon: {
    fontSize:   18,
    color:      'rgba(255,255,255,0.4)',
    fontFamily: FONTS.jakartaRegular,
  },
  affordanceLabel: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   10,
    color:      'rgba(255,255,255,0.3)',
  },

  // CTA
  ctaContainer: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: SPACING[6],
    paddingTop:        SPACING[4],
    backgroundColor:   'rgba(13,17,23,0.85)',
  },
});
