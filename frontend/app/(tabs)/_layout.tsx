import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const scale = Math.min(Math.max(width / 390, 0.8), 1.2);

const TabBarBackground = () => {
  // A mathematically smooth wave with reduced thickness
  const path = `
    M 0 12
    C ${width * 0.1} 4, ${width * 0.2} 4, ${width * 0.3} 12
    C ${width * 0.4} 20, ${width * 0.6} 20, ${width * 0.7} 12
    C ${width * 0.8} 4, ${width * 0.9} 4, ${width} 12
    V 80
    H 0
    Z
  `;

  return (
    <View style={styles.svgContainer}>
      <Svg width={width} height={80} viewBox={`0 0 ${width} 80`}>
        <Path
          d={path}
          fill="#015C42" 
          stroke="#014A35"
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          paddingTop: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 9 * scale,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          marginTop: 2,
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
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'cloud-upload' : 'cloud-upload-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Floating Center Action Button */}
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Share',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#004D36',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: '#FFFFFF',
                top: -15, // Floating effect
                shadowColor: '#004D36',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={26} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'clipboard-text' : 'clipboard-text-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account' : 'account-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  svgContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 80,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 20,
  },
});
