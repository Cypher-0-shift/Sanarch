/**
 * Splash — Phase 2 / DESIGN.md
 *
 * Token check runs in parallel with 800ms minimum display.
 * Routing logic (per UX spec):
 *   valid token   → /(tabs)/home
 *   expired token → /auth/login   (skip Hero — returning users skip pitch)
 *   no token      → /auth/hero
 *   network error + cached token → /(tabs)/home + offline toast
 *   any throw     → /auth/login silently (log, no blank screen)
 *
 * Visual: pulsing opacity on BrandLogo only. NO progress bar, NO fake %, NO spinner.
 * Background: dark-950 (#0D1117) — dark surface = authority signal per DESIGN.md §1.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as ExpoSplash from 'expo-splash-screen';
import { COLORS } from '../../constants/theme';
import { DURATION } from '../../constants/motion';
import BrandLogo from '../../components/foundation/BrandLogo';
import { getToken } from '../../services/storage';
import { getMe } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { toast } from '../../components/feedback/toastStore';
import { logger } from '../../utils/logger';

const MIN_DISPLAY_MS = 800; // never stall past this waiting for network

export default function SplashScreen() {
  const router   = useRouter();
  const routed   = useRef(false); // prevent double-navigation

  // ── Pulse animation ─────────────────────────────────────────────
  const pulse = useSharedValue(0.85);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  useEffect(() => {
    // Pulsing opacity only — DESIGN.md spec explicit
    pulse.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 700 }),
        withTiming(0.75, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  // ── Token check + routing ────────────────────────────────────────
  useEffect(() => {
    const start = Date.now();

    async function checkAndRoute() {
      let destination: string = '/auth/hero';
      let isOfflineFallback   = false;

      try {
        const token = await getToken();

        if (!token) {
          // No token — first-time user, show Hero
          destination = '/auth/hero';
        } else {
          // Token exists — try to validate with backend
          try {
            const userData = await getMe();
            // Valid token + successful /me → log in, go Home
            useAuthStore.getState().login(userData as any, token);
            useProfileStore.getState().initProfiles({
              id:            userData.id,
              sanarchId:     userData.sanarch_id,
              name:          userData.full_name,
              relation:      'self',
              isMainAccount: true,
            }, undefined);
            destination = '/(tabs)/home';
          } catch (apiErr: any) {
            const isNetworkErr =
              apiErr.message?.includes('No internet') ||
              apiErr.message?.includes('Network Error') ||
              apiErr.code === 'ECONNABORTED';

            if (isNetworkErr) {
              // Network error + cached token → go Home with offline banner
              logger.warn('[Splash] Offline, using cached token:', apiErr.message);
              destination      = '/(tabs)/home';
              isOfflineFallback = true;
            } else if (apiErr.response?.status === 401) {
              // Expired/invalid token → skip Hero for returning users
              destination = '/auth/login';
            } else {
              // Unknown API error — route to login silently
              logger.error('[Splash] /me failed unexpectedly:', apiErr);
              destination = '/auth/login';
            }
          }
        }
      } catch (err) {
        // Storage read or any other throw — never show blank screen
        logger.error('[Splash] Token check threw:', err);
        destination = '/auth/login';
      }

      // Respect minimum display time so the logo isn't a flash
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

      setTimeout(() => {
        if (routed.current) return;
        routed.current = true;

        // Hide expo-splash-screen before navigating
        ExpoSplash.hideAsync().catch(() => {});

        router.replace(destination as any);

        // Offline toast fires after navigation (Home screen is mounted)
        if (isOfflineFallback) {
          setTimeout(() => {
            toast.warning("You're offline. Showing cached data.");
          }, 400);
        }
      }, remaining);
    }

    checkAndRoute();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark950} />

      {/* Radial glow behind logo — DESIGN.md §8 Sanarch ID card aesthetic reference */}
      <View style={styles.glow} pointerEvents="none" />

      <Animated.View style={[styles.logoWrap, pulseStyle]}>
        <BrandLogo size={72} variant="icon" color="light" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.dark950,  // #0D1117 — dark surface
    alignItems:      'center',
    justifyContent:  'center',
  },
  glow: {
    position:        'absolute',
    width:           280,
    height:          280,
    borderRadius:    140,
    backgroundColor: 'rgba(67,97,238,0.08)', // brand-primary at 8%
  },
  logoWrap: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
