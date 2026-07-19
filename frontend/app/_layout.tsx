import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
// ── Fonts — DESIGN.md §3: Plus Jakarta Sans + JetBrains Mono ──
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useDocumentsStore } from '../store/documentsStore';
import { getToken } from '../services/storage';
import { setupTokenRefresh } from '../services/auth';
import { getMe, getPatients } from '../services/api';
import { useActiveDocumentListeners } from '../hooks/useDocumentListener';
import { Dimensions, View, Text, TextInput } from 'react-native';
import { vars } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../components/foundation/ThemeProvider';
import '../global.css'; // NativeWind CSS

// Prevent system text scaling from breaking layouts
interface TextWithDefaultProps extends React.FC<any> {
  defaultProps?: any;
}
((Text as unknown) as TextWithDefaultProps).defaultProps = {
  ...((Text as unknown) as TextWithDefaultProps).defaultProps,
  maxFontSizeMultiplier: 1.1,
};
((TextInput as unknown) as TextWithDefaultProps).defaultProps = {
  ...((TextInput as unknown) as TextWithDefaultProps).defaultProps,
  maxFontSizeMultiplier: 1.1,
};

// Calculate responsive rem value based on screen width
const { width } = Dimensions.get('window');
const baseWidth = 390; // Standard mobile width (e.g., iPhone 14)
// Cap the scaling so tablets don't look completely bloated, but smaller phones shrink
const scale = Math.min(Math.max(width / baseWidth, 0.8), 1.2); 
const remValue = 16 * scale;

const theme = vars({
  '--rem': remValue
});


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes memory
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

import { CustomAlert } from '../components/ui/CustomAlert';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { ToastContainer } from '../components/feedback/Toast';

// ── App-level listeners (never unmounted during navigation) ──────
function AppListeners() {
  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useActiveDocumentListeners();

  return null;
}

export default function RootLayout() {
  // DESIGN.md §3 — Plus Jakarta Sans (display) + JetBrains Mono (data/IDs)
  // Fallback order: Jakarta variants only — never default Inter (DESIGN.md §10)
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // Setup Firebase token auto-refresh
  useEffect(() => {
    setupTokenRefresh();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {/* ThemeProvider — DESIGN.md Phase 0: light mode v1, dark-mode ready */}
        <ThemeProvider>
          <View style={theme} className="flex-1">
            <ErrorBoundary>
              <AppListeners />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: 220,
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  // DESIGN.md §2: canvas color — warm-tinted, never pure white/gray
                  contentStyle: { backgroundColor: '#F9FAFB' },
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{ animation: 'fade', animationDuration: 200 }}
                />
                <Stack.Screen
                  name="auth"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{ animation: 'fade', animationDuration: 200 }}
                />
              </Stack>
            </ErrorBoundary>
            <CustomAlert />
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
