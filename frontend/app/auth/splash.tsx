import { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getToken } from '../../services/storage';
import SanarchLogo from '../../components/shared/SanarchLogo';

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Navigate once progress reaches 100
  useEffect(() => {
    if (progress < 100) return;

    const checkAuth = async () => {
      const token = await getToken();
      if (token) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/hero');
      }
    };

    checkAuth();
  }, [progress]);

  return (
    <LinearGradient
      colors={['#143832', '#235347']}
      className="flex-1 items-center justify-center relative"
    >
      {/* Decorative Orbs */}
      <View
        className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white opacity-20 blur-3xl"
        pointerEvents="none"
      />
      <View
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary opacity-20 blur-3xl"
        pointerEvents="none"
      />

      {/* Main Content */}
      <View className="items-center z-10 w-full">
        {/* Logo */}
        <View className="h-32 w-32 rounded-2xl bg-white/10 border border-white/20 shadow-2xl items-center justify-center mb-6 overflow-hidden">
          <View className="absolute inset-0 bg-white/5 opacity-50 blur-md" />
          <SanarchLogo size={64} color="white" />
        </View>

        {/* Text */}
        <Text className="text-5xl font-display-bold text-white tracking-tight mb-2">
          Sanarch
        </Text>
        <Text className="text-white/80 text-lg font-display-medium tracking-wide">
          Secure Your Health Records
        </Text>

        {/* Loading Progress */}
        <View className="mt-20 w-64">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white/60 text-xs font-display-medium uppercase tracking-widest">
              INITIALISING
            </Text>
            <Text className="text-white/60 text-xs font-display-medium">
              {progress}%
            </Text>
          </View>
          <View className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <View
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="absolute bottom-12 flex-row items-center justify-center space-x-2">
        <MaterialCommunityIcons name="lock-outline" size={14} color="rgba(255,255,255,0.4)" />
        <Text className="text-white/40 text-[10px] font-display-bold uppercase tracking-[0.2em] ml-1">
          END-TO-END ENCRYPTED
        </Text>
      </View>
    </LinearGradient>
  );
}
