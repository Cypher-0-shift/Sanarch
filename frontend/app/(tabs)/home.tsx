import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, InteractionManager, Pressable, Animated, Alert, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import SanarchLogo from '../../components/shared/SanarchLogo';
import FAB from '../../components/shared/FAB';
import GlassmorphismCard from '../../components/ui/GlassmorphismCard';
import EmptyState from '../../components/ui/EmptyState';
import { useProfileStore, Profile } from '../../store/profileStore';
import { useAuthStore } from '../../store/authStore';
import { getTimeline, TimelineEvent } from '../../services/api';

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

export default function HomeScreen() {
  const router = useRouter();
  const [showUploadCard, setShowUploadCard] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [dismissQRHint, setDismissQRHint] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((s) => s.user);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const familyMembers = useProfileStore((s) => s.familyMembers);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);

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

  useEffect(() => {
    if (!isReady) return;

    const fetchTimeline = async () => {
      setLoading(true);
      try {
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
  }, [isReady, activeProfile?.id, user?.id]);

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
      Alert.alert('Permission Required', 'Camera access is needed to take photos of your documents.');
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
      Alert.alert('Permission Required', 'Gallery access is needed to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
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
      <View className="shrink-0 pt-4 pb-4 px-6 bg-[#F8FAF9] border-b border-[#E5E2DE] z-10">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[#5C6E60] text-sm font-display-medium">{getGreeting()}</Text>
            <Text className="text-[#2D3A2F] text-xl font-display-bold tracking-tight">Hello, {firstName}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <SanarchLogo size={40} />
          </View>
        </View>

        {/* Search and Profile Selector */}
        <View className="mt-6 flex-row gap-2">
          <TouchableOpacity
            className="flex-1 h-12 bg-white rounded-2xl flex-row items-center px-4 gap-3 border border-[#E5E2DE]"
            onPress={handleSearchFocus}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#819685" />
            <Text className="flex-1 text-sm text-[#819685] font-display-medium">
              Search records...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="h-12 w-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-[#E5E2DE]"
            activeOpacity={0.75}
            onPress={() => setShowProfileSheet(true)}
          >
            <MaterialCommunityIcons name="account-switch-outline" size={20} color="#2D3A2F" />
          </TouchableOpacity>
        </View>

        {/* QR Context Tip Strip */}
        {!dismissQRHint && (
          <View className="mt-4 bg-[#E8F5E9] p-3 rounded-xl flex-row items-center justify-between border border-[#C8E6C9]">
            <View className="flex-1 mr-3 flex-row items-start gap-3">
              <View className="mt-0.5">
                <MaterialCommunityIcons name="qrcode-scan" size={18} color="#004D36" />
              </View>
              <Text className="flex-1 text-[#2D3A2F] text-[13px] font-display-medium leading-5">
                Tap the QR button below to share records with your doctor instantly.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDismissQRHint(true)} activeOpacity={0.75} className="p-1 rounded-full bg-[#C8E6C9] opacity-50">
              <MaterialCommunityIcons name="close" size={16} color="#004D36" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* Profile/Analytics Card */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A2F] font-display-bold text-lg">Health Summary</Text>
            <View className="bg-[#E8F5E9] px-2 py-1 rounded-full">
              <Text className="text-[10px] text-[#004D36] font-display-bold uppercase tracking-wider">
                Active: {activeProfile?.relation === 'self' ? 'Self' : activeProfile?.name ?? 'Self'}
              </Text>
            </View>
          </View>
          <View className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E5E2DE] overflow-hidden relative">
            <MaterialCommunityIcons name="pulse" size={100} color="#004D36" style={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }} />

            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-[#5C6E60] text-xs font-display-medium uppercase tracking-wide mb-1">Documents</Text>
                <Text className="text-[#2D3A2F] text-3xl font-display-bold">0</Text>
              </View>
              <View className="w-[1px] bg-[#E5E2DE] mx-4" />
              <View className="flex-1">
                <Text className="text-[#5C6E60] text-xs font-display-medium uppercase tracking-wide mb-1">Last Upload</Text>
                <Text className="text-[#2D3A2F] text-3xl font-display-bold">—</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline Preview */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#2D3A2F] font-display-bold text-lg">Recent Timeline</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/records')} activeOpacity={0.75}>
              <Text className="text-[#004D36] text-sm font-display-semibold">View All</Text>
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
            <View className="relative flex-col gap-4">
              <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#E5E2DE] z-0" />
              {timeline.slice(0, 3).map((event, index) => (
                <View key={event.id} className="flex-row items-start gap-4">
                  <View className="w-10 h-10 rounded-full bg-[#E8F5E9] items-center justify-center z-10 border-2 border-white shadow-sm">
                    <MaterialCommunityIcons 
                      name={
                        event.label === 'lab_report' ? 'test-tube' :
                        event.label === 'prescription' ? 'pill' :
                        event.label === 'scan' ? 'radiology-box' :
                        'hospital-building'
                      } 
                      size={20} 
                      color="#004D36" 
                    />
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.75}
                    className="flex-1 bg-white p-4 rounded-2xl border border-[#E5E2DE] shadow-sm"
                    onPress={() => router.push(`/(tabs)/records/${event.id}` as any)}
                  >
                    <Text className="text-[#2D3A2F] font-display-bold text-base mb-1" numberOfLines={2}>
                      {event.condition}
                    </Text>
                    <Text className="text-[#5C6E60] font-display text-xs mb-3">
                      {new Date(event.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.hospital}
                    </Text>
                    <View className="flex-row items-center gap-1 bg-[#F5F3F0] self-start px-2 py-1 rounded-md">
                      <MaterialCommunityIcons name="file-document-outline" size={12} color="#5C6E60" />
                      <Text className="text-[#5C6E60] text-[10px] font-display-bold uppercase tracking-wider">
                        {event.document_count} Document{event.document_count > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
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
            <TouchableOpacity onPress={() => setShowProfileSheet(false)} activeOpacity={0.75} style={sheetStyles.closeBtn}>
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
                    <View style={[sheetStyles.avatar, isActive ? sheetStyles.avatarActive : undefined]}>
                      <MaterialCommunityIcons
                        name={profile.isMainAccount ? 'account' : 'account-heart'}
                        size={22}
                        color={isActive ? '#FFFFFF' : '#004D36'}
                      />
                    </View>

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
