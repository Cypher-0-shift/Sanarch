// components/DocumentCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import RNAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useDocumentsStore, type DocumentRecord } from '../store/documentsStore';
import { retryDocument, deleteDocument } from '../services/api';
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

import { formatDate } from '../utils/date';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const category = CATEGORIES.find((c) => c.id === document_label) || CATEGORIES.find((c) => c.id === 'other')!;

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

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteDocument(document_id);
      useDocumentsStore.getState().fetchDocuments();
    } catch (error: any) {
      useAlertStore.getState().showAlert('Delete Failed', error.message || 'Failed to delete document.');
    }
  };

  // ── SWIPE-TO-DELETE (Reanimated + Gesture API) ────────────────
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -70;

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      // Only allow swiping left (negative x), clamp to -90
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -90);
      } else {
        // Allow small positive movement to snap back
        translateX.value = Math.min(event.translationX, 0);
      }
    })
    .onEnd((event) => {
      if (translateX.value < DELETE_THRESHOLD) {
        // Snap open to reveal delete button
        translateX.value = withSpring(-80, { damping: 20, stiffness: 200 });
      } else {
        // Snap back closed
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
    transform: [{ scale: translateX.value < -40 ? 1 : 0.5 }],
  }));

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // ── DELETE CONFIRMATION MODAL (DLS styled) ────────────────────
  const deleteModal = (
    <Modal visible={showDeleteModal} animationType="fade" transparent={true} onRequestClose={() => setShowDeleteModal(false)}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
        onPress={() => setShowDeleteModal(false)}
      >
        <Pressable style={{ width: '100%' }} onPress={(e) => e.stopPropagation()}>
          <View style={{ backgroundColor: '#F0F2F1', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}>
            <BlurView intensity={80} tint="light" style={{ padding: 24, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,205,210,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={28} color="#C62828" />
              </View>
              <Text className="text-xl font-display-bold text-[#2D3A2F] mb-2 text-center">Delete Document?</Text>
              <Text className="text-[14px] font-display text-[#5C6E60] text-center mb-6 leading-5">
                Are you sure you want to delete this document? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E2DE', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-[#2D3A2F] font-display-bold text-[15px]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDelete}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#C62828', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-display-bold text-[15px]">Delete</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // ── Shared card content renderers ─────────────────────────────

  const renderCardContent = (showProgress: boolean) => (
    <View className="rounded-[24px] overflow-hidden shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
      <BlurView intensity={40} tint="light" className="p-4 flex-row">
        {/* Left: Category Icon area */}
        <View
          className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/60 items-center justify-center mr-4 ${showProgress ? 'opacity-60' : ''}`}
          style={{ backgroundColor: category.bg }}
        >
          <MaterialCommunityIcons name={category.icon as any} size={32} color={category.color} />
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
            {showProgress ? (
              <View className="flex-row items-center gap-1">
                <ActivityIndicator size="small" color="#546255" style={{ transform: [{ scale: 0.6 }] }} />
                <Text className="text-[11px] font-display-medium text-[#546255]">
                  {STAGE_LABELS[processing_stage] ?? processing_stage}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name="check-circle" size={14} color="#004D36" />
                <Text className="text-[11px] font-display-medium text-[#004D36]">
                  Ready
                </Text>
              </View>
            )}
          </View>

          {showProgress && (
            <View className="mt-2.5 h-1 rounded-full bg-[#E8E8E8]/50 overflow-hidden">
              <Animated.View
                className="h-full rounded-full bg-[#004D36]"
                style={{ width: progressWidth }}
              />
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );

  // ── IN PROGRESS STATE ──────────────────────────────────────────
  if (isInProgress) {
    return (
      <View style={{ marginBottom: 12, position: 'relative' }}>
        {/* Delete button behind card (right side) */}
        <RNAnimated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 80,
              justifyContent: 'center',
              alignItems: 'center',
            },
            deleteButtonAnimatedStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => { translateX.value = withSpring(0); openDeleteModal(); }}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FFCDD2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={26} color="#C62828" />
          </TouchableOpacity>
        </RNAnimated.View>

        {/* Swipeable card */}
        <GestureDetector gesture={panGesture}>
          <RNAnimated.View style={cardAnimatedStyle}>
            <Animated.View style={{ transform: [{ scale: pressScale }] }}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                {renderCardContent(true)}
              </Pressable>
            </Animated.View>
          </RNAnimated.View>
        </GestureDetector>

        {deleteModal}
      </View>
    );
  }

  // ── READY STATE ────────────────────────────────────────────────
  if (isReady) {
    return (
      <View style={{ marginBottom: 12, position: 'relative' }}>
        {/* Delete button behind card (right side) */}
        <RNAnimated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 80,
              justifyContent: 'center',
              alignItems: 'center',
            },
            deleteButtonAnimatedStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => { translateX.value = withSpring(0); openDeleteModal(); }}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FFCDD2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={26} color="#C62828" />
          </TouchableOpacity>
        </RNAnimated.View>

        {/* Swipeable card */}
        <GestureDetector gesture={panGesture}>
          <RNAnimated.View style={cardAnimatedStyle}>
            <Animated.View style={{ transform: [{ scale: Animated.multiply(pressScale, scaleAnim) }] }}>
              <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                {renderCardContent(false)}
              </Pressable>
            </Animated.View>
          </RNAnimated.View>
        </GestureDetector>

        {deleteModal}
      </View>
    );
  }

  // ── FAILED STATE (Dead code — filtered out by hidden_from_list) ──
  return null;
}
