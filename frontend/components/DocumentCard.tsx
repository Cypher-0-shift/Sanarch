// components/DocumentCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useDocumentsStore, type DocumentRecord } from '../store/documentsStore';
import { retryDocument } from '../services/api';
import { useAlertStore } from '../store/alertStore';
import { CATEGORIES } from '../app/(tabs)/upload';

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
  const [imageError, setImageError] = useState(false);

  const category = CATEGORIES.find((c: any) => c.id === document_label) || CATEGORIES.find((c: any) => c.id === 'other')!;

  const ext = document.extracted_data || {};
  let secondaryLine = 'Details pending';
  if (ext.hospital_name || ext.doctor_name) {
    if (ext.hospital_name && ext.doctor_name) {
      secondaryLine = `Dr. ${ext.doctor_name} · ${ext.hospital_name}`;
    } else if (ext.doctor_name) {
      secondaryLine = `Dr. ${ext.doctor_name}`;
    } else {
      secondaryLine = ext.hospital_name;
    }
  }

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
        className="w-full mb-3"
        style={{ transform: [{ scale: pressScale }] }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="rounded-[24px] overflow-hidden shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            <BlurView intensity={40} tint="light" className="p-4 flex-row">
              {/* Left: Thumbnail area */}
              <View className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/60 relative bg-white/20 items-center justify-center mr-4">
                {document.b2_file_url && !imageError ? (
                  <Image 
                    source={{ uri: document.b2_file_url }} 
                    style={{ width: '100%', height: '100%', opacity: 0.8 }} 
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center opacity-60" style={{ backgroundColor: category.bg }}>
                    <MaterialCommunityIcons name={category.icon as any} size={32} color={category.color} />
                  </View>
                )}
                <View className="absolute bottom-1 right-1 bg-white/80 rounded p-1 items-center justify-center" style={{ overflow: 'hidden' }}>
                  <BlurView intensity={20} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                  <MaterialCommunityIcons name={category.icon as any} size={16} color="#004D36" />
                </View>
              </View>

              {/* Right: Content */}
              <View className="flex-1 flex-col justify-between">
                <View className="flex-row justify-between items-start">
                  <Text className="text-[15px] font-display-bold text-[#004D36] flex-1 mr-2" numberOfLines={1}>
                    {document_title || category.name}
                  </Text>
                  <Text className="text-[11px] font-display-medium text-[#707973] shrink-0 mt-0.5">
                    {formatDate(created_at)}
                  </Text>
                </View>
                
                <Text className="text-[13px] font-display-medium text-[#404944] mt-1 mb-2" numberOfLines={1}>
                  {secondaryLine}
                </Text>

                <View className="flex-row flex-wrap items-center gap-2 mt-auto">
                  <View className="px-2 py-0.5 rounded bg-[#d7e7d7]">
                    <Text className="text-[10px] font-display-bold uppercase tracking-wider text-[#004D36]">
                      {category.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <ActivityIndicator size="small" color="#546255" style={{ transform: [{ scale: 0.6 }] }} />
                    <Text className="text-[11px] font-display-medium text-[#546255]">
                      {STAGE_LABELS[processing_stage] ?? processing_stage}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="mt-2.5 h-1 rounded-full bg-[#E8E8E8]/50 overflow-hidden">
                  <Animated.View
                    className="h-full rounded-full bg-[#004D36]"
                    style={{ width: progressWidth }}
                  />
                </View>
              </View>
            </BlurView>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── READY STATE ────────────────────────────────────────────────
  if (isReady) {
    return (
      <Animated.View
        className="w-full mb-3"
        style={{ transform: [{ scale: Animated.multiply(pressScale, scaleAnim) }] }}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="rounded-[24px] overflow-hidden shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            <BlurView intensity={40} tint="light" className="p-4 flex-row">
              {/* Left: Thumbnail area */}
              <View className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/60 relative mr-4 bg-white/20">
                {document.b2_file_url && !imageError ? (
                  <Image 
                    source={{ uri: document.b2_file_url }} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center" style={{ backgroundColor: category.bg }}>
                    <MaterialCommunityIcons name={category.icon as any} size={32} color={category.color} />
                  </View>
                )}
                <View className="absolute bottom-1 right-1 bg-white/80 rounded p-1 items-center justify-center" style={{ overflow: 'hidden' }}>
                  <BlurView intensity={20} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                  <MaterialCommunityIcons name={category.icon as any} size={16} color="#004D36" />
                </View>
              </View>

              {/* Right: Content */}
              <View className="flex-1 flex-col justify-between">
                <View className="flex-row justify-between items-start">
                  <Text className="text-[15px] font-display-bold text-[#004D36] flex-1 mr-2" numberOfLines={1}>
                    {document_title || category.name}
                  </Text>
                  <Text className="text-[11px] font-display-medium text-[#707973] shrink-0 mt-0.5">
                    {formatDate(created_at)}
                  </Text>
                </View>
                
                <Text className="text-[13px] font-display-medium text-[#404944] mt-1 mb-2" numberOfLines={1}>
                  {secondaryLine}
                </Text>

                <View className="flex-row flex-wrap items-center gap-2 mt-auto">
                  <View className="px-2 py-0.5 rounded bg-[#d7e7d7]">
                    <Text className="text-[10px] font-display-bold uppercase tracking-wider text-[#004D36]">
                      {category.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="check-circle" size={14} color="#004D36" />
                    <Text className="text-[11px] font-display-medium text-[#004D36]">
                      Ready
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── FAILED STATE (Dead code — filtered out by hidden_from_list) ──
  return null;
}
