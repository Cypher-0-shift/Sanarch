/**
 * Auth layout — Phase 2
 *
 * contentStyle backgroundColor matches Splash (dark-950 #0D1117) so there
 * is NO white flash during the expo-splash-screen → Splash transition.
 *
 * The canvas color (#F9FAFB) is applied per-screen for Login and Onboarding.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // dark-950 matches Splash background — prevents white-frame flash on launch
        contentStyle:       { backgroundColor: '#0D1117' },
        animation:          'fade',
        animationDuration:  220,
      }}
    >
      {/* Expo Router auto-discovers routes */}
    </Stack>
  );
}
