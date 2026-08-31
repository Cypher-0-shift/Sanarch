import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken } from '../../services/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SanarchLogo from '../../components/shared/SanarchLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState(0);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const barOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: logo appears → text appears → bar appears
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(barOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Progress starts at 1200ms
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 8 + 3;
          const next = Math.min(prev + increment, 100);
          setProgressText(Math.floor(next));
          if (next >= 100) {
            clearInterval(interval);
          }
          return next;
        });
      }, 100);

      return () => clearInterval(interval);
    }, 1200);

    return () => clearTimeout(startDelay);
  }, []);

  // Navigate when progress hits 100
  // Navigate when progress hits 100
  useEffect(() => {
    if (progress >= 100) {
      setTimeout(async () => {
        try {
          const token = await getToken();
          if (token) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/auth/hero');
          }
        } catch (error) {
          console.error('Error reading token:', error);
          router.replace('/auth/hero');
        }
      }, 500);
    }
  }, [progress, router]);

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.glow1} pointerEvents="none" />
      <View style={styles.glow2} pointerEvents="none" />
      <View style={styles.glow3} pointerEvents="none" />
      <View style={styles.glow4} pointerEvents="none" />

      {/* Center content (Logo + Text) */}
      <View style={styles.center}>
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <SanarchLogo size={100} />
        </Animated.View>

        <Animated.Text 
          style={[styles.brandText, { opacity: textOpacity }]}
          maxFontSizeMultiplier={1.3}
        >
          Sanarch
        </Animated.Text>
      </View>

      {/* Progress area */}
      <Animated.View style={[
        styles.progressArea, 
        { 
          opacity: barOpacity,
          bottom: Math.max(60, insets.bottom + 24)
        }
      ]}>
        <Text style={styles.progressLabel} maxFontSizeMultiplier={1.2}>Initializing</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>{progressText}%</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
    top: -100,
    right: -100,
  },
  glow2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFFFFF',
    opacity: 0.04,
    bottom: -80,
    left: -80,
  },
  glow3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    opacity: 0.03,
    top: '40%',
    left: -80,
  },
  glow4: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    opacity: 0.04,
    bottom: '25%',
    right: -40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBase: {
    position: 'absolute',
    width: 76,
    height: 76,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    transform: [{ rotate: '12deg' }],
  },
  logoTop: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  logoText: {
    color: '#004D36',
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    includeFontPadding: false,
    lineHeight: 56,
  },
  leafIcon: {
    position: 'absolute',
    top: -4,
    right: -12,
    transform: [{ rotate: '15deg' }],
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  progressArea: {
    position: 'absolute',
    left: 48,
    right: 48,
    alignItems: 'center',
    zIndex: 10,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  barTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  percentText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
});
