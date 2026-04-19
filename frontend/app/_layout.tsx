import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="services" />
        <Stack.Screen name="records" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="menu" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="scanner-results" />
        <Stack.Screen name="scan-analysis" />
        <Stack.Screen name="health-trackers" />
        <Stack.Screen name="heart-rate" />
        <Stack.Screen name="blood-sugar" />
        <Stack.Screen name="medications" />
        <Stack.Screen name="add-medication" />
        <Stack.Screen name="family-members" />
        <Stack.Screen name="family-member-status" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
