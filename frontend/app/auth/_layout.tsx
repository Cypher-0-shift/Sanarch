import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: '#F5F3F0' },
        animation: 'fade_from_bottom',
        animationDuration: 260
      }}
    >
      {/* Expo Router auto-discovers routes from files */}
    </Stack>
  );
}
