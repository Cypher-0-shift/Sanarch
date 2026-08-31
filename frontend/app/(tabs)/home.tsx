import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, InteractionManager, Pressable, Animated, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import SanarchLogo from '../../components/shared/SanarchLogo';
import FAB from '../../components/shared/FAB';
import GlassmorphismCard from '../../components/ui/GlassmorphismCard';
import EmptyState from '../../components/ui/EmptyState';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import { useProfileStore, Profile } from '../../store/profileStore';
import { useAuthStore } from '../../store/authStore';
import { getTimeline, TimelineEvent } from '../../services/api';
import { useAlertStore } from '../../store/alertStore';
import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  updateDoc
} from '@react-native-firebase/firestore';
import { useDocumentsStore } from '../../store/documentsStore';
import { formatDate, formatRelativeTime, formatFullDateTime } from '../../utils/date';

interface AppNotification {
  id: string;
  type: string;
  document_id: string;
  title: string;
  created_at: any;
  read: boolean;
}

const SkeletonPulse = ({ style }: { style: any }) => {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [anim]);

  return <Animated.View style={[style, { opacity: anim, backgroundColor: '#E5E2DE' }]} />;
};

interface CategoryVisualConfig {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  badgeBg: string;
  badgeText: string;
  tag: string;
}

const getCategoryConfig = (label?: string, conditionOrTitle?: string): CategoryVisualConfig => {
  const text = `${label || ''} ${conditionOrTitle || ''}`.toLowerCase();

  if (
    text.includes('prescription') ||
    text.includes('medication') ||
    text.includes('tablet') ||
    text.includes('capsule') ||
    text.includes('meds') ||
    text.includes('pill') ||
    text.includes('amoxicillin')
  ) {
    return {
      name: 'Prescription',
      icon: 'pill',
      color: '#D97706',
      bg: '#FEF3C7',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      tag: 'MEDS',
    };
  }

  if (
    text.includes('scan') ||
    text.includes('xray') ||
    text.includes('x-ray') ||
    text.includes('mri') ||
    text.includes('ct') ||
    text.includes('radiology') ||
    text.includes('ultrasound') ||
    text.includes('imaging')
  ) {
    return {
      name: 'Imaging / Scan',
      icon: 'radiology-box',
      color: '#7C3AED',
      bg: '#F3E8FF',
      badgeBg: '#F3E8FF',
      badgeText: '#6D28D9',
      tag: 'SCAN',
    };
  }

  if (
    text.includes('lab') ||
    text.includes('blood') ||
    text.includes('cbc') ||
    text.includes('test') ||
    text.includes('report') ||
    text.includes('lipid') ||
    text.includes('glucose')
  ) {
    return {
      name: 'Lab Report',
      icon: 'test-tube',
      color: '#004D36',
      bg: '#E8F5E9',
      badgeBg: '#DCF7E3',
      badgeText: '#004D36',
      tag: 'LAB',
    };
  }

  if (
    text.includes('hospital') ||
    text.includes('discharge') ||
    text.includes('summary') ||
    text.includes('admission') ||
    text.includes('surgery') ||
    text.includes('operative')
  ) {
    return {
      name: 'Discharge Summary',
      icon: 'hospital-building',
      color: '#0284C7',
      bg: '#E0F2FE',
      badgeBg: '#E0F2FE',
      badgeText: '#0369A1',
      tag: 'HOSPITAL',
    };
  }

  return {
    name: 'Medical Record',
    icon: 'file-document-outline',
    color: '#004D36',
    bg: '#E8F5E9',
    badgeBg: '#E8F5E9',
    badgeText: '#004D36',
    tag: 'RECORD',
  };
};

const getProviderBadge = (providerName?: string | null) => {
  if (!providerName) return { initial: 'HP', color: '#004D36', bg: '#E8F5E9' };
  const clean = providerName.replace(/^(Hospital|Clinic|Dr\.|Dr|Centre|Center)\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const initial = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : clean.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { color: '#004D36', bg: '#E8F5E9' },
    { color: '#0284C7', bg: '#E0F2FE' },
    { color: '#7C3AED', bg: '#F3E8FF' },
    { color: '#D97706', bg: '#FEF3C7' },
    { color: '#059669', bg: '#D1FAE5' },
    { color: '#EA580C', bg: '#FFEDD5' },
  ];
  const selected = palettes[Math.abs(hash) % palettes.length];
  return { initial, ...selected };
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showUploadCard, setShowUploadCard] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [dismissQRHint, setDismissQRHint] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const user = useAuthStore((s) => s.user);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const familyMembers = useProfileStore((s) => s.familyMembers);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const documents = useDocumentsStore((s) => s.documents);

  const readyDocuments = useMemo(() => {
    return (documents || []).filter((d) => d?.status === 'ready');
  }, [documents]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    if (hour >= 17 && hour < 22) return 'Good evening,';
    return 'Good night,';
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  // Only re-fetch timeline when ready documents change (prevents flickering during upload progress)
  const timelineDependency = useMemo(() => {
    return (documents || [])
      .filter(d => d?.status === 'ready')
      .map(d => `${d?.document_id}:${d?.updated_at}`)
      .join(',');
  }, [documents]);

  useEffect(() => {
    if (!isReady) return;

    const fetchTimeline = async () => {
      // Only show full loading spinner if we don't have timeline data yet
      if (timeline.length === 0) {
        setLoading(true);
      }
      try {
        // Skip API call in dev mode — production backend rejects dev-mode-token
        const { getToken } = await import('../../services/storage');
        const token = await getToken();
        if (token === 'dev-mode-token') {
          setTimeline([]);
          setLoading(false);
          return;
        }

        const patientId = activeProfile?.id ?? user?.id;
        if (!patientId) {
          setLoading(false);
          return;
        }
        const data = await getTimeline(patientId, 3, 0);
        setTimeline(data.events);
      } catch (error) {
        console.error('[Home] Timeline fetch failed:', error);
        // Show empty state, not crash
        setTimeline([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [isReady, activeProfile?.id, user?.id, timelineDependency]);

  useEffect(() => {
    const ownerId = user?.id;
    if (!ownerId) return;

    const db = getFirestore();
    const notifsQuery = query(
      collection(db, 'users', ownerId, 'notifications'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      notifsQuery,
      (snapshot: any) => {
        if (!snapshot || !snapshot.docs) return;
        const notifs = snapshot.docs.map((docSnap: any) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AppNotification[];
        setNotifications(notifs);
      },
      (error: any) => {
        console.error('[Home] Notifications onSnapshot failed:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic local state update so red numbers clear immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const ownerId = user?.id;
    if (!ownerId) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const db = getFirestore();
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const ref = doc(db, 'users', ownerId, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Batch mark read failed, updating individually:', e);
      unread.forEach((n) => {
        const ref = doc(db, 'users', ownerId, 'notifications', n.id);
        updateDoc(ref, { read: true }).catch(() => { });
      });
    }
  }, [user?.id, notifications]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    // Optimistic local state update for single item
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    const ownerId = user?.id;
    if (!ownerId || !notificationId) return;

    try {
      const db = getFirestore();
      const ref = doc(db, 'users', ownerId, 'notifications', notificationId);
      if (typeof updateDoc === 'function') {
        await updateDoc(ref, { read: true });
      } else if (typeof (ref as any)?.update === 'function') {
        await (ref as any).update({ read: true });
      }
    } catch (err) {
      console.warn('[Home] Failed to mark notification read in Firestore:', err);
    }
  }, [user?.id]);

  const formatNotificationDate = (createdAt: any) => {
    return formatRelativeTime(createdAt, '');
  };

  const formatFullNotificationDate = (createdAt: any) => {
    return formatFullDateTime(createdAt, '');
  };

  const getNotificationHeading = (n: AppNotification) => {
    switch (n.type?.toLowerCase()) {
      case 'processing_failed':
      case 'upload_failed':
        return 'Document Processing Issue';
      case 'document_ready':
      case 'document':
      case 'ready':
        return 'Document Ready';
      case 'doctor_share':
      case 'share':
        return 'Records Shared';
      case 'security':
      case 'auth':
        return 'Security Alert';
      case 'reminder':
        return 'Health Reminder';
      default: {
        if (n.title && n.title.length > 32) {
          const firstSentence = n.title.split('.')[0];
          return firstSentence.length <= 32 ? firstSentence : `${firstSentence.slice(0, 30)}...`;
        }
        return n.title || 'Notification';
      }
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'processing_failed':
      case 'upload_failed':
        return { bg: '#FEE2E2', icon: '#DC2626', border: '#FECACA' };
      case 'document_ready':
      case 'ready':
        return { bg: '#E8F5E9', icon: '#004D36', border: '#C8E6C9' };
      case 'doctor_share':
      case 'share':
        return { bg: '#E0F2FE', icon: '#0284C7', border: '#BAE6FD' };
      default:
        return { bg: '#E8F5E9', icon: '#004D36', border: '#C8E6C9' };
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'processing_failed':
      case 'upload_failed':
        return 'alert-circle-outline';
      case 'document_ready':
      case 'document':
      case 'upload':
        return 'file-document-check-outline';
      case 'doctor_share':
      case 'share':
        return 'share-variant-outline';
      case 'security':
      case 'auth':
        return 'shield-check-outline';
      case 'reminder':
        return 'clock-outline';
      default:
        return 'bell-ring-outline';
    }
  };

  const handleUploadPress = useCallback(() => router.push('/(tabs)/upload'), [router]);
  const handleRecordsPress = useCallback(() => router.push('/(tabs)/records'), [router]);
  const handleSharePress = useCallback(() => router.push('/(tabs)/doctors'), [router]);
  const handleProfilePress = useCallback(() => router.push('/(tabs)/profile'), [router]);
  const handleSearchFocus = useCallback(() => router.push('/(tabs)/profile/search'), [router]);

  // Get display name for greeting
  const displayName = activeProfile?.name ?? user?.full_name ?? 'there';
  const firstName = displayName.split(' ')[0];

  const handleTakePhoto = async () => {
    setShowUploadCard(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      useAlertStore.getState().showAlert('Permission Required', 'Camera access is needed to take photos of your documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      router.push({
        pathname: '/(tabs)/upload',
        params: {
          fileUri: uri,
          fileName: `Photo_${Date.now()}.jpg`,
          fileType: 'photo',
        },
      });
    }
  };

  const handleUploadPhoto = async () => {
    setShowUploadCard(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      useAlertStore.getState().showAlert('Permission Required', 'Gallery access is needed to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      router.push({
        pathname: '/(tabs)/upload',
        params: {
          fileUri: uri,
          fileName: result.assets[0].fileName || `Photo_${Date.now()}.jpg`,
          fileType: 'photo',
        },
      });
    }
  };

  const handleUploadFile = async () => {
    setShowUploadCard(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const asset = result.assets[0];
        const isPdf = asset.mimeType === 'application/pdf' || asset.name?.toLowerCase().endsWith('.pdf');
        router.push({
          pathname: '/(tabs)/upload',
          params: {
            fileUri: asset.uri,
            fileName: asset.name || `Document_${Date.now()}`,
            fileType: isPdf ? 'pdf' : 'photo',
          },
        });
      }
    } catch (err) {
      console.log('Document picker cancelled or failed', err);
    }
  };

  if (!isReady) return <View className="flex-1 bg-[#F5F3F0]" />;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>

      {/* Header Section */}
      <View className="shrink-0 pt-3 pb-3 px-6 bg-[#F8FAF9] border-b border-[#E5E2DE] z-10">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3 justify-center">
            <Text style={{ color: '#5C6E60', fontSize: 24, fontFamily: 'LobsterTwo_400Regular', lineHeight: 30 }} numberOfLines={1}>{getGreeting()}</Text>
            <Text style={{ color: '#004D36', fontSize: 38, fontFamily: 'LobsterTwo_700Bold', lineHeight: 42 }} numberOfLines={1}>{firstName}</Text>
          </View>
          <View className="flex-row items-center gap-5">
            <TouchableOpacity
              onPress={() => {
                setShowNotifications(true);
              }}
              activeOpacity={0.75}
              className="relative h-11 w-11 items-center justify-center rounded-[14px] bg-[#E8F5E9] border border-[#D2E7D6]"
            >
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={22}
                color="#004D36"
              />
              {unreadCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E53935] items-center justify-center border-2 border-white"
                  style={{ shadowColor: '#E53935', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}
                >
                  <Text className="text-white text-[10px] font-display-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <SanarchLogo size={40} />
          </View>
        </View>

        {/* Search and Profile Selector */}
        <View className="mt-6 flex-row gap-2">
          <TouchableOpacity
            className="flex-1 h-12 bg-white rounded-xl flex-row items-center px-4 gap-3 border border-[#E5E2DE]"
            onPress={handleSearchFocus}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#819685" />
            <Text className="flex-1 text-sm text-[#819685] font-display-medium">
              Search records...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="h-12 w-12 bg-white rounded-xl items-center justify-center shadow-sm border border-[#E5E2DE] overflow-hidden"
            activeOpacity={0.75}
            onPress={() => setShowProfileSheet(true)}
          >
            <ProfileAvatar
              size={36}
              gender={activeProfile?.gender}
              dob={activeProfile?.dob}
              relation={activeProfile?.relation}
              name={displayName}
              borderWidth={2}
              borderColor="#D2E7D6"
            />
          </TouchableOpacity>
        </View>

        {/* QR Context Tip Strip (Commented out) */}
        {/* {!dismissQRHint && (
          <View className="mt-4 bg-[#E8F5E9] p-3 rounded-xl flex-row items-center justify-between border border-[#C8E6C9]">
            <View className="flex-1 mr-3 flex-row items-start gap-3">
              <View className="mt-0.5">
                <MaterialCommunityIcons name="qrcode-scan" size={18} color="#004D36" />
              </View>
              <Text className="flex-1 text-[#2D3A2F] text-[13px] font-display-medium leading-5">
                Tap the QR button below to share records with your doctor instantly.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDismissQRHint(true)} activeOpacity={0.75} className="p-1 rounded-full bg-[#C8E6C9] opacity-50" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={16} color="#004D36" />
            </TouchableOpacity>
          </View>
        )} */}
      </View>

      {/* Main Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* Health Summary Card */}
        <View className="mb-7">
          <View className="mb-3">
            <Text className="text-[#2D3A2F] font-display-bold text-lg">Health Summary</Text>
          </View>
          <View className="bg-white rounded-[20px] p-4 shadow-sm border border-[#E5E2DE] overflow-hidden relative">
            {/* Watermark — shrunk & moved to avoid crowding date text */}
            <MaterialCommunityIcons
              name="pulse"
              size={52}
              color="#004D36"
              style={{ position: 'absolute', top: -4, right: 8, opacity: 0.035 }}
            />

            <View className="flex-row items-stretch justify-between">
              {/* Left Metric: Total Records */}
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <View className="w-5 h-5 rounded-md bg-[#E8F5E9] items-center justify-center">
                    <MaterialCommunityIcons name="file-document-multiple-outline" size={12} color="#004D36" />
                  </View>
                  <Text style={{ color: '#4A5E50', fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Total Records
                  </Text>
                </View>
                {/* Big number */}
                <Text style={{ color: '#1A2E1F', fontSize: 38, fontFamily: 'Inter_700Bold', lineHeight: 40, letterSpacing: -1 }}>
                  {readyDocuments.length}
                </Text>
              </View>

              {/* Subtle vertical divider */}
              <View className="w-[1px] bg-[#EBE8E3] mx-3" />

              {/* Right Metric: Last Upload */}
              <View className="flex-1 pl-2">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <View className="w-5 h-5 rounded-md bg-[#E0F2FE] items-center justify-center">
                    <MaterialCommunityIcons name="clock-check-outline" size={12} color="#0284C7" />
                  </View>
                  <Text style={{ color: '#4A5E50', fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Last Upload
                  </Text>
                </View>
                {readyDocuments.length > 0 && readyDocuments[0].created_at ? (() => {
                  const full = formatDate(readyDocuments[0].created_at, { day: 'numeric', month: 'short', year: 'numeric' }, '—');
                  const [dayPart, ...rest] = full.split(' ');
                  return (
                    <>
                      <Text style={{ color: '#1A2E1F', fontSize: 38, fontFamily: 'Inter_700Bold', lineHeight: 40, letterSpacing: -1 }}>
                        {dayPart}
                      </Text>
                      <Text style={{ color: '#2D3A2F', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2, letterSpacing: 0.1 }}>
                        {rest.join(' ')}
                      </Text>
                    </>
                  );
                })() : (
                  <>
                    <Text style={{ color: '#1A2E1F', fontSize: 38, fontFamily: 'Inter_700Bold', lineHeight: 40, letterSpacing: -1 }}>—</Text>
                    <Text style={{ color: '#819685', fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 3 }}>No uploads yet</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Timeline Preview */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A2F] font-display-bold text-lg">Recent Timeline</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/records/timeline' as any)} activeOpacity={0.75}
              className="flex-row items-center gap-0.5"
            >
              <Text className="text-[#004D36] text-sm font-display-semibold">View All</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#004D36" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="relative flex-col gap-4">
              <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#E5E2DE] z-0" />
              {[1, 2, 3].map((_, i) => (
                <View key={i} className="flex-row items-start gap-4">
                  <View className="w-10 h-10 rounded-full bg-[#E5E2DE] items-center justify-center z-10" />
                  <View className="flex-1 bg-white p-4 rounded-xl border border-[#E5E2DE]">
                    <SkeletonPulse style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }} />
                    <SkeletonPulse style={{ width: '40%', height: 12, borderRadius: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : timeline.length === 0 ? (
            <View className="bg-white rounded-[24px] p-6 border border-[#E5E2DE] shadow-sm">
              <View className="mb-8">
                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-[#E8F5E9] items-center justify-center">
                    <MaterialCommunityIcons name="file-upload-outline" size={20} color="#004D36" />
                  </View>
                  <Text className="flex-1 text-[#2D3A2F] text-sm font-display-bold">Upload any medical document</Text>
                </View>

                <View className="w-10 items-center my-1">
                  <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#819685" />
                </View>

                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-[#E3F2FD] items-center justify-center">
                    <MaterialCommunityIcons name="robot-outline" size={20} color="#0277BD" />
                  </View>
                  <Text className="flex-1 text-[#2D3A2F] text-sm font-display-bold">AI reads and extracts the data</Text>
                </View>

                <View className="w-10 items-center my-1">
                  <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#819685" />
                </View>

                <View className="flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-[#FFF3E0] items-center justify-center">
                    <MaterialCommunityIcons name="timeline-clock-outline" size={20} color="#E65100" />
                  </View>
                  <Text className="flex-1 text-[#2D3A2F] text-sm font-display-bold">Your health timeline builds automatically</Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-[#004D36] rounded-xl py-4 items-center flex-row justify-center gap-2 shadow-sm"
                onPress={handleUploadPress}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="cloud-upload" size={20} color="white" />
                <Text className="text-white font-display-bold text-sm tracking-wide">Upload Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative flex-col gap-3.5">
              <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#E5E2DE] z-0" />
              {timeline.slice(0, 3).map((event, index) => {
                const docId = event.document_id || event.id;
                const doc = (documents || []).find(
                  (d) => d?.document_id === docId || d?.document_id === event.id
                );

                // 1. Title: user-given title at upload time
                const displayTitle =
                  doc?.document_title ||
                  event.condition ||
                  'Untitled Document';

                // 2. Document date from extracted_data (NOT upload date)
                const rawDocDate =
                  doc?.extracted_data?.document_date ||
                  doc?.extracted_data?.date ||
                  event.event_date ||
                  event.date_start ||
                  null;
                const formattedDocDate = rawDocDate
                  ? formatDate(rawDocDate, { day: 'numeric', month: 'short', year: 'numeric' })
                  : null;
                const dateLabel = formattedDocDate || 'Date not available';
                const dateUnavailable = !formattedDocDate;

                // 3. Doctor name — only if present in doc
                const doctorName =
                  doc?.extracted_data?.doctor_name ||
                  event.doctor ||
                  event.doctor_name ||
                  null;

                // 4. Lab / Hospital — only if present in doc
                const labName =
                  doc?.extracted_data?.hospital_name ||
                  doc?.extracted_data?.lab_name ||
                  event.hospital ||
                  event.hospital_name ||
                  null;

                // 5. Label type selected during upload
                const labelStr = doc?.document_label || event.label || null;
                const catConfig = getCategoryConfig(labelStr ?? undefined, displayTitle);
                const providerBadge = labName ? getProviderBadge(labName) : null;

                const targetRecordId = event.document_id || event.id;

                return (
                  <View key={event.id || `timeline-${index}`} className="flex-row items-start gap-3.5">
                    {/* Node on timeline */}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center z-10 border-2 border-white shadow-sm"
                      style={{ backgroundColor: catConfig.bg }}
                    >
                      <MaterialCommunityIcons
                        name={catConfig.icon}
                        size={20}
                        color={catConfig.color}
                      />
                    </View>

                    {/* Timeline Event Card */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      className="flex-1 bg-white p-3.5 rounded-[18px] border border-[#E5E2DE] shadow-sm mb-1"
                      onPress={() => router.push(`/(tabs)/records/${targetRecordId}` as any)}
                    >
                      {/* 1. Title row */}
                      <Text
                        style={{ color: '#1A2E1F', fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 20, marginBottom: 6 }}
                        numberOfLines={1}
                      >
                        {displayTitle}
                      </Text>

                      {/* 2. Date row */}
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <MaterialCommunityIcons
                          name="calendar-outline"
                          size={12}
                          color={dateUnavailable ? '#B0A99F' : '#5C6E60'}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Inter_500Medium',
                            color: dateUnavailable ? '#B0A99F' : '#5C6E60',
                            fontStyle: dateUnavailable ? 'italic' : 'normal',
                          }}
                        >
                          {dateLabel}
                        </Text>
                      </View>

                      {/* 3. Doctor — only if available */}
                      {doctorName ? (
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <MaterialCommunityIcons name="stethoscope" size={12} color="#5C6E60" />
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#5C6E60' }} numberOfLines={1}>
                            Dr. {doctorName.replace(/^Dr\.\s*/i, '')}
                          </Text>
                        </View>
                      ) : null}

                      {/* 4. Lab / Hospital — only if available */}
                      {labName ? (
                        <View className="flex-row items-center gap-1.5 mb-1">
                          {providerBadge && (
                            <View
                              className="w-4 h-4 rounded-[4px] items-center justify-center"
                              style={{ backgroundColor: providerBadge.bg }}
                            >
                              <Text style={{ fontSize: 8, fontFamily: 'Inter_700Bold', color: providerBadge.color }}>
                                {providerBadge.initial}
                              </Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#5C6E60' }} numberOfLines={1}>
                            {labName}
                          </Text>
                        </View>
                      ) : null}

                      {/* 5. Label type + View Record footer */}
                      <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-[#F5F3F0]">
                        {labelStr ? (
                          <View
                            className="px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: catConfig.badgeBg }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: catConfig.badgeText, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                              {catConfig.name}
                            </Text>
                          </View>
                        ) : <View />}
                        <View className="flex-row items-center gap-1">
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#004D36' }}>View Record</Text>
                          <MaterialCommunityIcons name="chevron-right" size={14} color="#004D36" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Action Button — opens upload card */}
      <FAB icon="plus" onPress={() => setShowUploadCard(true)} />

      {/* Upload Action Card */}
      <GlassmorphismCard
        visible={showUploadCard}
        onClose={() => setShowUploadCard(false)}
        onTakePhoto={handleTakePhoto}
        onUploadPhoto={handleUploadPhoto}
        onUploadFile={handleUploadFile}
      />

      {/* Profile Switcher Bottom Sheet */}
      <Modal
        visible={showProfileSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfileSheet(false)}
      >
        <Pressable style={sheetStyles.backdrop} onPress={() => setShowProfileSheet(false)} />
        <View style={sheetStyles.sheet}>
          {/* Handle */}
          <View style={sheetStyles.handleWrap}><View style={sheetStyles.handle} /></View>

          {/* Title */}
          <View style={sheetStyles.titleRow}>
            <Text style={sheetStyles.title}>Switch Profile</Text>
            <TouchableOpacity onPress={() => setShowProfileSheet(false)} activeOpacity={0.75} style={sheetStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={20} color="#5C6E60" />
            </TouchableOpacity>
          </View>

          {/* Profile List */}
          {familyMembers.length === 0 ? (
            <View style={sheetStyles.emptyWrap}>
              <MaterialCommunityIcons name="account-plus-outline" size={40} color="#819685" />
              <Text style={sheetStyles.emptyText}>No profiles yet</Text>
              <Text style={sheetStyles.emptySubtext}>Complete onboarding to set up your profiles.</Text>
            </View>
          ) : (
            <ScrollView style={sheetStyles.list} showsVerticalScrollIndicator={false}>
              {familyMembers.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[sheetStyles.profileRow, isActive ? sheetStyles.profileRowActive : undefined]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveProfile(profile);
                      setShowProfileSheet(false);
                    }}
                  >
                    {/* Avatar */}
                    <ProfileAvatar
                      size={44}
                      gender={profile.gender}
                      dob={profile.dob}
                      relation={profile.relation}
                      name={profile.name}
                      borderWidth={isActive ? 2.5 : 1}
                      borderColor={isActive ? '#1D9E75' : '#D2E7D6'}
                    />

                    {/* Info */}
                    <View style={sheetStyles.infoWrap}>
                      <View style={sheetStyles.nameRow}>
                        <Text style={sheetStyles.profileName}>{profile.name}</Text>
                        <View style={[sheetStyles.badge, isActive ? sheetStyles.badgeActive : undefined]}>
                          <Text style={[sheetStyles.badgeText, isActive ? sheetStyles.badgeTextActive : undefined]}>
                            {profile.relation.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={sheetStyles.sanarchId}>{profile.sanarchId}</Text>
                    </View>

                    {/* Checkmark */}
                    {isActive && (
                      <View style={sheetStyles.checkWrap}>
                        <MaterialCommunityIcons name="check-circle" size={22} color="#004D36" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Notifications Pop-up Modal */}
      <Modal
        visible={showNotifications}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setSelectedNotification(null);
          setShowNotifications(false);
        }}
      >
        <Pressable
          style={sheetStyles.backdrop}
          onPress={() => {
            setSelectedNotification(null);
            setShowNotifications(false);
          }}
        />
        <View style={[notifSheetStyles.popupContainer, { paddingBottom: Math.max(28, insets.bottom + 16) }]}>
          {/* Top Drag Handle */}
          <View style={notifSheetStyles.handleWrap}>
            <View style={notifSheetStyles.handle} />
          </View>

          {selectedNotification ? (
            // ─── NOTIFICATION DETAIL VIEW ─────────────────────────────────
            <>
              <View style={notifSheetStyles.headerRow}>
                <TouchableOpacity
                  onPress={() => setSelectedNotification(null)}
                  activeOpacity={0.75}
                  style={notifSheetStyles.backBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#2D3A2F" />
                  <Text style={notifSheetStyles.backBtnText}>All Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedNotification(null);
                    setShowNotifications(false);
                  }}
                  activeOpacity={0.75}
                  style={notifSheetStyles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#5C6E60" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={notifSheetStyles.scrollList}
                contentContainerStyle={notifSheetStyles.detailScrollContent}
                showsVerticalScrollIndicator={true}
              >
                <View style={notifSheetStyles.detailHeader}>
                  <View style={[
                    notifSheetStyles.detailIconWrap,
                    { backgroundColor: getNotificationColor(selectedNotification.type).bg }
                  ]}>
                    <MaterialCommunityIcons
                      name={getNotificationIcon(selectedNotification.type) as any}
                      size={26}
                      color={getNotificationColor(selectedNotification.type).icon}
                    />
                  </View>
                  <View style={notifSheetStyles.detailTitleBlock}>
                    <Text style={notifSheetStyles.detailHeading}>
                      {getNotificationHeading(selectedNotification)}
                    </Text>
                    <Text style={notifSheetStyles.detailFullTime}>
                      {formatFullNotificationDate(selectedNotification.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={notifSheetStyles.detailMessageCard}>
                  <Text style={notifSheetStyles.detailMessageLabel}>Details</Text>
                  <Text style={notifSheetStyles.detailMessageText}>
                    {selectedNotification.title}
                  </Text>
                </View>

                {selectedNotification.document_id ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={notifSheetStyles.detailActionBtn}
                    onPress={() => {
                      const docId = selectedNotification.document_id;
                      setSelectedNotification(null);
                      setShowNotifications(false);
                      router.push(`/(tabs)/records/${docId}` as any);
                    }}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={18} color="#FFFFFF" />
                    <Text style={notifSheetStyles.detailActionBtnText}>View Document</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </>
          ) : (
            // ─── NOTIFICATIONS LIST VIEW ──────────────────────────────────
            <>
              {/* Header Row */}
              <View style={notifSheetStyles.headerRow}>
                <View style={notifSheetStyles.headerLeft}>
                  <Text style={notifSheetStyles.title}>Notifications</Text>
                  {unreadCount > 0 ? (
                    <View style={notifSheetStyles.unreadBadge}>
                      <Text style={notifSheetStyles.unreadBadgeText}>{unreadCount} new</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => setShowNotifications(false)}
                  activeOpacity={0.75}
                  style={notifSheetStyles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#5C6E60" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Notifications List with Visible Scrollbar */}
              <ScrollView
                style={notifSheetStyles.scrollList}
                contentContainerStyle={notifSheetStyles.scrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
              >
                {notifications.length === 0 ? (
                  <View style={notifSheetStyles.emptyWrap}>
                    <View style={notifSheetStyles.emptyIconWrap}>
                      <MaterialCommunityIcons name="bell-check-outline" size={26} color="#004D36" />
                    </View>
                    <Text style={notifSheetStyles.emptyTitle}>Nothing here</Text>
                    <Text style={notifSheetStyles.emptySubtitle} numberOfLines={1} adjustsFontSizeToFit>
                      We'll notify you when updates arrive.
                    </Text>
                  </View>
                ) : (
                  notifications.map((n) => {
                    const iconName = getNotificationIcon(n.type);
                    const heading = getNotificationHeading(n);
                    const timeText = formatNotificationDate(n.created_at);
                    const isUnread = !n.read;
                    const colorTheme = getNotificationColor(n.type);

                    return (
                      <TouchableOpacity
                        key={n.id}
                        activeOpacity={0.75}
                        style={[
                          notifSheetStyles.card,
                          isUnread && notifSheetStyles.cardUnread
                        ]}
                        onPress={() => {
                          if (isUnread) {
                            markNotificationRead(n.id);
                          }
                          setSelectedNotification({ ...n, read: true });
                        }}
                      >
                        <View style={[
                          notifSheetStyles.cardIconWrap,
                          { backgroundColor: colorTheme.bg }
                        ]}>
                          <MaterialCommunityIcons
                            name={iconName as any}
                            size={20}
                            color={colorTheme.icon}
                          />
                        </View>

                        <View style={notifSheetStyles.cardBody}>
                          <View style={notifSheetStyles.cardTitleRow}>
                            <Text
                              style={[
                                notifSheetStyles.cardTitle,
                                isUnread && notifSheetStyles.cardTitleUnread
                              ]}
                              numberOfLines={1}
                            >
                              {heading}
                            </Text>
                            {isUnread && <View style={notifSheetStyles.unreadDot} />}
                          </View>

                          <View style={notifSheetStyles.cardFooterRow}>
                            <Text style={notifSheetStyles.cardTime}>{timeText}</Text>
                            <View style={notifSheetStyles.readMoreRow}>
                              <Text style={notifSheetStyles.readMoreText}>Read</Text>
                              <MaterialCommunityIcons name="chevron-right" size={14} color="#819685" />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E2DE' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3F0',
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#2D3A2F' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F3F0', alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: 24, paddingTop: 12 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  profileRowActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#004D36',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(0,77,54,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  avatarActive: {
    backgroundColor: '#004D36',
  },
  infoWrap: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  profileName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#2D3A2F' },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: '#F5F3F0',
  },
  badgeActive: { backgroundColor: '#004D36' },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#5C6E60', letterSpacing: 0.5 },
  badgeTextActive: { color: '#FFFFFF' },
  sanarchId: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#819685' },
  checkWrap: { marginLeft: 8 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#2D3A2F', marginTop: 12 },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#819685', textAlign: 'center', marginTop: 4 },
});

const notifSheetStyles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '68%',
    minHeight: 280,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 24,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E2DE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#2D3A2F',
  },
  unreadBadge: {
    backgroundColor: '#E53935',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#2D3A2F',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#718575',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  cardUnread: {
    backgroundColor: '#F0F9F4',
    borderColor: '#C8E6C9',
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAE8E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardIconWrapUnread: {
    backgroundColor: '#D1EAD7',
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 19,
    flex: 1,
  },
  cardTitleUnread: {
    fontFamily: 'Inter_600SemiBold',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004D36',
    marginTop: 5,
    flexShrink: 0,
  },
  cardTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#819685',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  readMoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#004D36',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#2D3A2F',
  },
  detailScrollContent: {
    paddingVertical: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  detailIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitleBlock: {
    flex: 1,
  },
  detailHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#2D3A2F',
    marginBottom: 4,
  },
  detailFullTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#819685',
  },
  detailMessageCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E2DE',
    padding: 16,
    marginBottom: 20,
  },
  detailMessageLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#819685',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailMessageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#2D3A2F',
    lineHeight: 23,
  },
  detailActionBtn: {
    backgroundColor: '#004D36',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#004D36',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailActionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

