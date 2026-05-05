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
import { getToken } from '../services/storage';
import '../global.css'; // NativeWind CSS

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [authChecked, setAuthChecked] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      if (token && token !== 'dev-mode-token') {
        // Token exists — fetch /users/me here later
        // For now: set authenticated with mock user
        const { MOCK_USER } = await import('../constants/mock');
        login(MOCK_USER, token);
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
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
