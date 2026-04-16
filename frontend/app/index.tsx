import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // 1. Fade in + Zoom in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Hold for 1 sec
      setTimeout(() => {
        // 3. Fade out + Zoom out (scale down)
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Animation complete, navigate to Onboarding
          router.replace('/onboarding');
        });
      }, 1000);
    });
  }, [opacity, scale, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Animated.Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida/ADBb0uisIw2k7_L4ejqZHAvdcJ0zSad8cat-KYj_DffhOUjG-rrIcPkVvDIh8VQjtLzUYYKrzXWH8CRQTbkCVG-WWZkp1fB3ohbMM1sb5qqQ1js6M6yibd5U6GMx1yGa_6MNV-LE9l55doSCLWptkI_NUYHSWB4ndM9ZEnTuydi_Zp-AB_d-RAYY_j2F0LefTDbTao3zFymAO6DMAh2XzzIANKoy3TfvM3r9Zbe9u4FLuOfsy8NFuBjBcM5SEUyuPHRw80Ht5iNgeWA' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Sanarch</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#006a35', // bg-primary
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 192, // 48 * 4 from w-48
    height: 192,
    marginBottom: 8,
  },
  title: {
    fontWeight: '800',
    fontSize: 48, // text-5xl
    letterSpacing: -1, // tracking-tighter
    color: '#ffffff', // text-surface-container-lowest
    margin: 0,
  }
});
