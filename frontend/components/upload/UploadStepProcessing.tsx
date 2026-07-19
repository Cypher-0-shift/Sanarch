import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { useUploadStore } from '../../store/uploadStore';
import { router } from 'expo-router';
import { useAlertStore } from '../../store/alertStore';

const STAGE_MESSAGES: Record<string, string> = {
  uploading: 'Securely uploading document...',
  queued: 'Waiting for AI analysis...',
  preparing: 'Preparing document layout...',
  reading_pages: 'Reading clinical text...',
  extracting: 'Extracting medical data...',
  generating_summary: 'Generating summary...',
  finalizing: 'Finalizing record...',
  ready: 'Analysis complete!',
  failed: 'Processing failed.',
};

export default function UploadStepProcessing() {
  const { processingStage, progress, isFailed, uploadError, reset } = useUploadStore();

  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value === 1 ? 0.7 : 1,
  }));

  const animatedRotate = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleBackground = () => {
    // Navigate to Records tab, upload continues via store listeners
    router.replace('/(tabs)/records');
  };

  // If the document hits 'ready', we automatically navigate to records (or we can just show a success state briefly)
  useEffect(() => {
    if (processingStage === 'ready') {
      setTimeout(() => {
        router.replace('/(tabs)/records');
      }, 1000);
    }
  }, [processingStage]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        {/* Animated Brand Core */}
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.glowRing, animatedPulse]} />
          <Animated.View style={[styles.spinnerRing, animatedRotate]} />
          <View style={styles.coreIcon}>
            <MaterialCommunityIcons name="auto-fix" size={40} color={COLORS.surface} />
          </View>
        </View>

        <Text style={styles.title}>Analyzing Document</Text>
        
        <Text style={styles.stageText}>
          {STAGE_MESSAGES[processingStage] || 'Processing...'}
        </Text>

        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleBackground} style={styles.bgButton}>
          <Text style={styles.bgButtonText}>Work in background</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.ink600} />
        </Pressable>
        <Text style={styles.footerNote}>
          You will be notified when the analysis is complete.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
  },
  animationContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[8],
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(67,97,238,0.15)',
  },
  spinnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: COLORS.brandPrimary,
    borderRightColor: COLORS.brandGlow,
  },
  coreIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 24,
    color: COLORS.ink900,
    marginBottom: SPACING[2],
  },
  stageText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 15,
    color: COLORS.ink600,
    marginBottom: SPACING[8],
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.ink100,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.brandPrimary,
    borderRadius: RADIUS.full,
  },
  footer: {
    padding: SPACING[6],
    paddingBottom: SPACING[8],
    alignItems: 'center',
  },
  bgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.ink200,
    marginBottom: SPACING[4],
  },
  bgButtonText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 14,
    color: COLORS.ink800,
  },
  footerNote: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.ink600,
    textAlign: 'center',
  }
});
