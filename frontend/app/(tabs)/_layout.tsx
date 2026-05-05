import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#143832',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ focused }) => (
            <View className={`h-10 w-10 items-center justify-center rounded-full ${focused ? 'bg-primary' : 'bg-primary/10'} mb-1`}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={22} color={focused ? 'white' : '#143832'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="records/index"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'folder-account' : 'folder-account-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Doctor's View",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account' : 'account-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* Hide specific pages from the tab bar */}
      <Tabs.Screen name="records/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/search" options={{ href: null }} />
    </Tabs>
  );
}
