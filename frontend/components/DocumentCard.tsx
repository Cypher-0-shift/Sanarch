// components/DocumentCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useDocumentsStore, type DocumentRecord } from '../store/documentsStore';
import { retryDocument } from '../services/api';
import { useAlertStore } from '../store/alertStore';

// Map processing_stage to human-readable labels
const STAGE_LABELS: Record<string, string> = {
  uploading: 'Preparing upload…',
  uploaded: 'Securely stored',
  queued: 'Queued for AI',
  preparing: 'Preparing document',
  reading_pages: 'Reading pages',
  extracting: 'Extracting medical data',
  generating_summary: 'Generating summary',
  finalizing: 'Finalizing',
  ready: 'Complete',
  failed: 'Processing failed',
};

// Map document labels to icons
const LABEL_ICONS: Record<string, string> = {
  'Prescription': '💊',
  'Lab Report': '🔬',
  'Discharge Summary': '🏥',
  'Imaging': '📷',
  'Other': '📄',
};

function getDocIcon(label: string): string {
  return LABEL_ICONS[label] ?? '📄';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

interface DocumentCardProps {
  document: DocumentRecord;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const {
    document_id,
    document_title,
    document_label,
    status,
    processing_progress,
    processing_stage,
    created_at,
  } = document;

  const [isRetrying, setIsRetrying] = useState(false);

  const isInProgress =
    status === 'uploading' ||
    status === 'uploaded' ||
    status === 'queued' ||
    status === 'processing';
  const isReady = status === 'ready';
  const isFailed = status === 'failed';

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Scale-in for ready transition
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevStatusRef = useRef(status);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: processing_progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [processing_progress]);

  // Animate scale-in only on processing→ready transition
  useEffect(() => {
    if (prevStatusRef.current !== 'ready' && status === 'ready') {
      scaleAnim.setValue(0.95);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
    prevStatusRef.current = status;
  }, [status]);

  const pressScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.97,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (isReady) {
      router.push(`/(tabs)/records/${document_id}`);
    } else if (isFailed && !isRetrying) {
      setIsRetrying(true);
      try {
        await retryDocument(document_id);
        useDocumentsStore.getState().updateDocument(document_id, {
          status: 'queued',
          processing_progress: 25,
          processing_stage: 'queued',
        });
      } catch (error: any) {
        useAlertStore.getState().showAlert(
          'Retry Failed',
          error.message ?? 'Retry failed. Please try again.'
        );
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // ── IN PROGRESS STATE ──────────────────────────────────────────
  if (isInProgress) {
    return (
      <Animated.View
        style={{ transform: [{ scale: pressScale }] }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden"
          style={{ opacity: 0.85 }}
        >
          <View className="flex-row p-4">
            {/* Left: Icon area */}
            <View className="w-14 h-14 rounded-xl bg-[#F0F5F3] items-center justify-center mr-3">
              <Text className="text-2xl">{getDocIcon(document_label)}</Text>
            </View>

            {/* Right: Content */}
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-[#2D3A2F]" numberOfLines={1}>
                {document_label}
              </Text>
              <Text className="text-[13px] text-[#7A8A7C] mt-0.5" numberOfLines={1}>
                {document_title || 'Processing…'}
              </Text>

              {/* AI badge */}
              <View className="flex-row items-center mt-2">
                <View className="bg-[#004D36] rounded-full px-2.5 py-0.5">
                  <Text className="text-[11px] text-white font-medium">🤖 AI Processing</Text>
                </View>
              </View>

              {/* Stage label */}
              <Text className="text-[12px] text-[#7A8A7C] mt-2">
                {STAGE_LABELS[processing_stage] ?? processing_stage}
              </Text>

              {/* Progress bar */}
              <View className="mt-2 h-1 rounded-full bg-[#E8E8E8] overflow-hidden">
                <Animated.View
                  className="h-full rounded-full bg-[#004D36]"
                  style={{ width: progressWidth }}
                />
              </View>

              {/* Progress percentage */}
              <Text className="text-[11px] text-[#9CA89E] mt-1 text-right">
                {processing_progress}%
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── READY STATE ────────────────────────────────────────────────
  if (isReady) {
    return (
      <Animated.View
        style={{ transform: [{ scale: Animated.multiply(pressScale, scaleAnim) }] }}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden"
        >
          <View className="flex-row p-4">
            {/* Left: Icon */}
            <View className="w-14 h-14 rounded-xl bg-[#F0F5F3] items-center justify-center mr-3">
              <Text className="text-2xl">{getDocIcon(document_label)}</Text>
            </View>

            {/* Right: Content */}
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-[#2D3A2F]" numberOfLines={1}>
                {document_title || document_label}
              </Text>
              <Text className="text-[13px] text-[#7A8A7C] mt-0.5" numberOfLines={1}>
                {document_label}
              </Text>
              <Text className="text-[11px] text-[#9CA89E] mt-1">
                {formatDate(created_at)}
              </Text>
            </View>

            {/* Chevron */}
            <View className="justify-center">
              <Text className="text-[#C0C0C0] text-lg">›</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── FAILED STATE ───────────────────────────────────────────────
  return (
    <Animated.View
      style={{ transform: [{ scale: pressScale }] }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden border-l-4 border-red-500"
      >
        <View className="flex-row p-4">
          {/* Left: Icon */}
          <View className="w-14 h-14 rounded-xl bg-red-50 items-center justify-center mr-3">
            <Text className="text-2xl">⚠️</Text>
          </View>

          {/* Right: Content */}
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-[#2D3A2F]" numberOfLines={1}>
              {document_label}
            </Text>
            <Text className="text-[13px] text-red-500 mt-0.5">
              Processing failed
            </Text>
            {isRetrying ? (
              <View className="flex-row items-center mt-1">
                <ActivityIndicator size="small" color="#004D36" />
                <Text className="text-[12px] text-[#004D36] ml-1.5">Retrying…</Text>
              </View>
            ) : (
              <Text className="text-[12px] text-[#9CA89E] mt-1">
                Tap to retry
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
