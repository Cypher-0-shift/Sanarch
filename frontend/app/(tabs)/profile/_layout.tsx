import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="family" />
      <Stack.Screen name="add-dependent" />
      <Stack.Screen name="dependent-details" />
      <Stack.Screen name="data-storage" />
      <Stack.Screen name="report-issue" />
      <Stack.Screen name="search" />
    </Stack>
  );
}
