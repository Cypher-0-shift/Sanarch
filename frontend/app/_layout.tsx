import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  LobsterTwo_400Regular,
  LobsterTwo_400Regular_Italic,
  LobsterTwo_700Bold,
  LobsterTwo_700Bold_Italic,
} from '@expo-google-fonts/lobster-two';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useDocumentsStore } from '../store/documentsStore';
import { getToken } from '../services/storage';
import { setupTokenRefresh } from '../services/auth';
import { getMe, getPatients } from '../services/api';
import { useActiveDocumentListeners } from '../hooks/useDocumentListener';
import { Dimensions, View, Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { vars } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    LobsterTwo_400Regular,
    LobsterTwo_400Regular_Italic,
    LobsterTwo_700Bold,
    LobsterTwo_700Bold_Italic,
  });

  const [authChecked, setAuthChecked] = useState(false);
  const login = useAuthStore((s) => s.login);

  // Setup Firebase token auto-refresh
  useEffect(() => {
    setupTokenRefresh();
  }, []);

  // Silent ping to wake up backend (prevents cold starts on upload)
  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`).catch(() => {});
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        if (token) {
          const userData = await getMe();
          login(userData, token);
          
          useProfileStore.getState().initProfiles({
            id: userData.id,
            sanarchId: userData.sanarch_id,
            name: userData.full_name,
            relation: 'self',
            isMainAccount: true,
            phone: userData.phone_number,
          }, undefined);
        }
      } catch (error) {
        console.error('checkAuth failed:', error);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded && authChecked) SplashScreen.hideAsync();
  }, [fontsLoaded, authChecked]);

  if (!fontsLoaded || !authChecked) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
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
                  contentStyle: { backgroundColor: '#F5F3F0' },
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
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
