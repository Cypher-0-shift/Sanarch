/**
 * BottomSheet — DESIGN.md §9 / Phase 1
 *
 * Base modal container. Every specialized sheet (ProfileSwitcher, FilterSort,
 * CountryPicker, etc.) composes this component.
 *
 * Entry:  translateY 100%→0, 380ms spring(280,28). DESIGN.md §9.
 * Exit:   translateY 0→100%, 280ms ease-in (faster than entry — spec explicit).
 * Backdrop: fades independently at 250ms via BackdropOverlay.
 *
 * Variants:
 *   'partial'     — max-height 60vh, content does not scroll
 *   'scrollable'  — max-height 85vh, content area is ScrollView
 *   'full-height' — 85vh fixed, useful for complex pickers
 *
 * Anatomy:
 *   - Handle bar (40×4, ink-200, radius-full, centered top 12dp)
 *   - Optional header (title + close button)
 *   - Body (children)
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS, ELEVATION_RN } from '../../constants/theme';
import { DURATION, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';
import BackdropOverlay from './BackdropOverlay';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SheetVariant = 'partial' | 'scrollable' | 'full-height';

interface BottomSheetProps {
  visible:              boolean;
  onClose:              () => void;
  variant?:             SheetVariant;
  title?:               string;
  /** Hides the close button (use for sheets that must make a selection to close) */
  hideCloseButton?:     boolean;
  children:             React.ReactNode;
  testID?:              string;
  accessibilityLabel?:  string;
}

const MAX_HEIGHT: Record<SheetVariant, number> = {
  'partial':     SCREEN_HEIGHT * 0.60,
  'scrollable':  SCREEN_HEIGHT * 0.85,
  'full-height': SCREEN_HEIGHT * 0.85,
};

export default function BottomSheet({
  visible,
  onClose,
  variant           = 'partial',
  title,
  hideCloseButton   = false,
  children,
  testID,
  accessibilityLabel,
}: BottomSheetProps) {
  const { isReducedMotion } = useTheme();
  const insets    = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const sheetMax   = MAX_HEIGHT[variant];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animateIn = useCallback(() => {
    translateY.value = withSpring(0, {
      stiffness: SPRING.sheetEnter.stiffness,  // 280
      damping:   SPRING.sheetEnter.damping,    // 28
      mass:      SPRING.sheetEnter.mass,
    });
  }, []);

  const animateOut = useCallback((callback?: () => void) => {
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: safeDuration(DURATION.exit, isReducedMotion), // 280ms ease-in
      easing:   Easing.in(Easing.ease),
    }, () => {
      if (callback) runOnJS(callback)();
    });
  }, [isReducedMotion]);

  useEffect(() => {
    if (visible) {
      if (isReducedMotion) {
        translateY.value = 0;
      } else {
        animateIn();
      }
    } else {
      if (isReducedMotion) {
        translateY.value = SCREEN_HEIGHT;
      } else {
        animateOut();
      }
    }
  }, [visible, isReducedMotion]);

  const Body = variant === 'scrollable'
    ? ScrollView
    : View;

  const bodyProps = variant === 'scrollable'
    ? { bounces: false, showsVerticalScrollIndicator: false }
    : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal
      accessibilityLabel={accessibilityLabel ?? title ?? 'Bottom sheet'}
    >
      {/* Backdrop — independent 250ms fade */}
      <BackdropOverlay visible={visible} onDismiss={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          animStyle,
          { maxHeight: sheetMax, paddingBottom: insets.bottom + SPACING[5] },
          ELEVATION_RN[4],
        ]}
        testID={testID}
      >
        {/* Handle bar */}
        <View style={styles.handleWrap} accessibilityElementsHidden>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        {(title || !hideCloseButton) && (
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title ?? ''}
            </Text>
            {!hideCloseButton && (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Body */}
        {/* @ts-ignore — conditional component type */}
        <Body style={styles.body} {...bodyProps}>
          {children}
        </Body>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius:  RADIUS['3xl'],  // 32
    borderTopRightRadius: RADIUS['3xl'],
    // Bottom corners are flat (sheet sits at device bottom)
    zIndex:          101,
    ...ELEVATION_RN[4],
  },
  handleWrap: {
    alignItems:  'center',
    paddingTop:  SPACING[3],   // 12
    paddingBottom: SPACING[2], // 8
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink200,
    opacity:      0.6,
  },
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: SPACING[5],  // 20
    paddingVertical:   SPACING[3],  // 12
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,24,39,0.05)',
  },
  title: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      16,
    lineHeight:    24,
    color:         COLORS.ink800,
    flex:          1,
  },
  closeBtn: {
    width:           36,
    height:          36,
    minWidth:        44,    // tap target via hitSlop above
    minHeight:       44,
    borderRadius:    RADIUS.md,
    backgroundColor: COLORS.ink100,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      SPACING[3],
  },
  closeIcon: {
    fontSize: 13,
    color:    COLORS.ink600,
  },
  body: {
    paddingHorizontal: SPACING[5],
    paddingTop:        SPACING[4],
  },
});
