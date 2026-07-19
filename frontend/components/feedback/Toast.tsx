/**
 * Toast + ToastContainer — DESIGN.md Phase 1
 *
 * Individual toast item + the container that renders all active toasts.
 * Mount <ToastContainer /> once in app/_layout.tsx (above everything else).
 *
 * Types: success | error | warning | info
 * Entry: slides in from top, fades in simultaneously.
 * Exit:  fades out + slides back up.
 * Auto-dismisses after `duration` ms (default 3500, error 5000).
 *
 * Imperative usage (anywhere in app):
 *   import { toast } from '../feedback/toastStore';
 *   toast.success('Document saved');
 *   toast.error('Upload failed', { action: { label: 'Retry', onPress: retry } });
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS, ELEVATION_RN } from '../../constants/theme';
import { DURATION, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';
import { useToastStore, ToastMessage, ToastType } from './toastStore';

// ─────────────────────────────────────────────
// Per-type visual config
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: COLORS.resultNormalBg, border: COLORS.resultNormal,   icon: '✓' },
  error:   { bg: COLORS.resultHighBg,   border: COLORS.resultHigh,     icon: '✕' },
  warning: { bg: COLORS.resultLowBg,    border: COLORS.resultLow,      icon: '!' },
  info:    { bg: COLORS.brandTint,      border: COLORS.brandPrimary,   icon: 'i' },
};

// ─────────────────────────────────────────────
// Single Toast item
// ─────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { isReducedMotion } = useTheme();
  const opacity     = useSharedValue(0);
  const translateY  = useSharedValue(-16);

  const config = TYPE_CONFIG[toast.type];
  const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3500);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  function dismiss() {
    opacity.value    = withTiming(0, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    translateY.value = withTiming(-12, { duration: safeDuration(DURATION.fast, isReducedMotion) },
      () => runOnJS(onDismiss)(toast.id)
    );
  }

  useEffect(() => {
    // Entry animation
    opacity.value    = withTiming(1, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    translateY.value = withSpring(0, SPRING.buttonReturn);

    // Auto-dismiss
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, borderColor: config.border }, animStyle]}>
      {/* Icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: config.border }]}>
        <Text style={styles.iconText}>{config.icon}</Text>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>

      {/* Action */}
      {toast.action && (
        <Pressable
          onPress={() => { toast.action?.onPress(); dismiss(); }}
          hitSlop={4}
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
        >
          <Text style={[styles.actionLabel, { color: config.border }]}>
            {toast.action.label}
          </Text>
        </Pressable>
      )}

      {/* Dismiss */}
      <Pressable
        onPress={dismiss}
        hitSlop={8}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <Text style={styles.dismissIcon}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// ToastContainer — mount once in _layout.tsx
// ─────────────────────────────────────────────

export function ToastContainer() {
  const insets  = useSafeAreaInsets();
  const toasts  = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + SPACING[3] }]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

export default ToastItem;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    left:      SPACING[4],
    right:     SPACING[4],
    zIndex:    9999,
    gap:       SPACING[2],
  },
  toast: {
    flexDirection:    'row',
    alignItems:       'center',
    borderRadius:     RADIUS.xl,    // 20 — matches card radius
    borderWidth:      1,
    padding:          SPACING[4],  // 16
    gap:              SPACING[3],  // 12
    ...ELEVATION_RN[3],
  },
  iconBadge: {
    width:          28,
    height:         28,
    borderRadius:   RADIUS.icon,  // 10 — rounded square, NEVER circle
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  iconText: {
    fontFamily: FONTS.jakartaBold,
    fontSize:   12,
    color:      COLORS.surface,
  },
  message: {
    flex:       1,
    fontFamily: FONTS.jakartaMedium,
    fontSize:   13,
    lineHeight: 18,
    color:      COLORS.ink800,
  },
  action: {
    flexShrink: 0,
  },
  actionLabel: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   13,
  },
  dismiss: {
    width:          28,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  dismissIcon: {
    fontSize: 11,
    color:    COLORS.ink400,
  },
});
