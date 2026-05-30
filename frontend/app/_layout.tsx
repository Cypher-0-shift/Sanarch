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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { getToken } from '../services/storage';
import { setupTokenRefresh } from '../services/auth';
import { getMe, getPatients } from '../services/api';
import { Dimensions, View, Text, TextInput } from 'react-native';
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [authChecked, setAuthChecked] = useState(false);
  const login = useAuthStore((s) => s.login);

  // Setup Firebase token auto-refresh and hydrate user profile
  useEffect(() => {
    setupTokenRefresh();

    const hydrateUser = async () => {
      const token = await getToken();
      if (!token || token === 'dev-mode-token') return;

      try {
        const [userData, patients] = await Promise.all([
          getMe(),
          getPatients(),
        ]);

        // Update auth store
        useAuthStore.getState().login(userData, token);

        // Build main profile
        const mainProfile = {
          id: userData.id,
          sanarchId: userData.sanarch_id,
          name: userData.full_name,
          relation: 'self' as const,
          isMainAccount: true,
          dob: userData.date_of_birth ?? undefined,
          heightCm: userData.height_cm ?? undefined,
          weightKg: userData.weight_kg ?? undefined,
          phone: userData.phone_number,
          email: userData.email ?? undefined,
        };

        // Build dependent profiles from patients
        const dependentProfiles = patients.map(p => ({
          id: p.id,
          sanarchId: p.sanarch_id,
          name: p.name,
          relation: p.relation as any,
          isMainAccount: false,
          dob: p.date_of_birth ?? undefined,
          heightCm: p.height_cm ?? undefined,
          weightKg: p.weight_kg ?? undefined,
        }));

        // Init profile store with main profile
        useProfileStore.getState().initProfiles(mainProfile, undefined);

        // Add additional dependents
        dependentProfiles.forEach(dep => {
          useProfileStore.getState().addFamilyMember(dep);
        });
      } catch (error) {
        console.error('[App] Profile hydration failed:', error);
        // Do not crash — user sees empty state
      }
    };

    hydrateUser();
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      if (token && token !== 'dev-mode-token') {
        // Token exists — fetch /users/me here later
        // For now: set authenticated with empty user
        const { EMPTY_USER } = await import('../constants/placeholders');
        login(EMPTY_USER, token);
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded && authChecked) SplashScreen.hideAsync();
  }, [fontsLoaded, authChecked]);

  if (!fontsLoaded || !authChecked) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <View style={theme} className="flex-1">
          <ErrorBoundary>
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
  );
}
