import { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  Alert, InteractionManager, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRDisplay from '../../components/doctors/QRDisplay';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { EMPTY_USER } from '../../constants/placeholders';
import { type MedicalEventLabel } from '../../constants/mock';
import { getTimeline, TimelineEvent, generateShareToken } from '../../services/api';
import apiClient from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery } from '@tanstack/react-query';

const encodePayload = (payload: object): string => {
  const str = JSON.stringify(payload);
  // Simple base64-like encoding for React Native
  // TODO: Replace with signed token from backend when auth is ready
  return encodeURIComponent(str);
};

// Duration in seconds map
const DURATION_SECONDS: Record<string, number> = {
  '10m': 600,
  '1h': 3600,
  '24h': 86400,
};

// Label config for record type icons (same as MedicalEventCard)
const LABEL_CONFIG: Record<MedicalEventLabel, { 
  icon: string; color: string; bg: string; text: string 
}> = {
  lab_report: { icon: 'file-document-outline', color: '#004D36', bg: '#E8F5E9', text: 'REPORT' },
  prescription: { icon: 'pill', color: '#E65100', bg: '#FFF3E0', text: 'MEDS' },
  hospital_summary: { icon: 'hospital-building', color: '#0277BD', bg: '#E3F2FD', text: 'SUMMARY' },
  scan: { icon: 'radiology-box', color: '#7B1FA2', bg: '#F3E5F5', text: 'IMAGING' },
};

export default function ShareRecordsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [isReady, setIsReady] = useState(false);
  const [records, setRecords] = useState<TimelineEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'read_only' | 'full'>('read_only');
  const [accessDuration, setAccessDuration] = useState<'10m' | '1h' | '24h'>('10m');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrSummary, setQrSummary] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  if (token && !scanning) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Doctor View Token: {token}</Text>
      </View>
    );
  }

  if (scanning) {
    if (!permission) return <View />;
    if (!permission.granted) {
      return (
        <SafeAreaView className="flex-1 bg-[#F5F3F0] items-center justify-center p-6">
          <Text className="text-center mb-4 text-[#2D3A2F] font-display-medium">We need your permission to show the camera</Text>
          <TouchableOpacity onPress={requestPermission} className="bg-[#004D36] px-6 py-3 rounded-[20px]">
             <Text className="text-white font-display-bold">Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            if (data.startsWith('sanarch://share/')) {
              const scannedToken = data.split('/').pop();
              router.push(`/(tabs)/doctors?token=${scannedToken}`);
            } else {
              Alert.alert('Invalid QR', 'This is not a valid SANARCH share code.');
            }
          }}
        />
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity onPress={() => setScanning(false)} className="bg-white/20 px-6 py-3 rounded-full">
            <Text className="text-white font-display-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (!isReady) return;

    const load = async () => {
      try {
        const patientId = activeProfile?.id ?? user?.id;
        if (!patientId) return;
        const data = await getTimeline(patientId, 100, 0);
        setRecords(data.events);
      } catch (e) {
        console.error('[DoctorShare] Records fetch failed:', e);
        setRecords([]);
      }
    };
    load();
  }, [isReady, activeProfile?.id, user?.id]);

  const toggleRecord = (id: string) => {
    setQrValue(null); // Reset QR when selection changes
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setQrValue(null);
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
      setSelectAll(true);
    }
  };

  // Keep selectAll in sync
  useEffect(() => {
    if (records.length > 0 && selectedIds.size === records.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, records]);

  const handleGenerateQR = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('No records selected', 'Select at least one record to share.');
      return;
    }

    setGenerating(true);
    try {
      const patientId = activeProfile?.id ?? user?.id;
      if (!patientId) {
        throw new Error('No patient ID available');
      }

      const hoursMap: Record<string, number> = { '10m': 0.17, '1h': 1, '24h': 24 };
      const result = await generateShareToken({
        patient_id: patientId,
        expires_in_hours: hoursMap[accessDuration] ?? 1,
      });

      // Use the real token as QR value
      setQrValue(`sanarch://share/${result.token}`);
      setQrSummary(
        `${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''} · ` +
        `${accessLevel === 'read_only' ? 'Read Only' : 'Full Access'} · ` +
        `Expires in ${accessDuration}`
      );
    } catch (error: any) {
      Alert.alert(
        'Failed',
        error?.response?.data?.detail ?? 'Could not generate QR code.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleQRExpired = () => {
    setQrValue(null);
    setQrSummary('');
  };

  if (!isReady) return <View style={{ flex: 1, backgroundColor: '#F5F3F0' }} />;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F5F3F0]">
      {/* HEADER */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-[#E5E2DE] flex-row items-center justify-between">
        <Text className="text-xl font-display-bold text-[#2D3A2F]">Share with Doctor</Text>
        <TouchableOpacity onPress={() => setScanning(true)} className="flex-row items-center gap-1 bg-[#E8F5E9] px-3 py-1.5 rounded-full">
           <MaterialCommunityIcons name="qrcode-scan" size={16} color="#004D36" />
           <Text className="text-[#004D36] font-display-bold text-xs uppercase">Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: PATIENT IDENTITY STRIP */}
        <View className="bg-white rounded-[20px] border border-[#E5E2DE] p-4 mb-6 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-[#004D36] items-center justify-center">
            <Text className="text-white font-bold text-base">
              {(activeProfile?.name ?? user.full_name ?? 'U').charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-display-bold text-[#2D3A2F]">
              {activeProfile?.name ?? user.full_name ?? 'Your Profile'}
            </Text>
            <Text className="text-[11px] font-display-medium text-[#819685] uppercase tracking-widest mt-0.5">
              {activeProfile?.sanarchId ?? user.sanarch_id ?? '—'}
            </Text>
          </View>
          <View className="bg-[#E8F5E9] px-2 py-1 rounded-lg">
            <Text className="text-[9px] font-display-bold text-[#004D36] uppercase tracking-wider">
              ACTIVE PROFILE
            </Text>
          </View>
        </View>

        {/* SECTION 2: SELECT RECORDS */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-display-bold text-[#2D3A2F]">Select Records</Text>
          {records.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
              <Text className="text-sm font-display-bold text-[#004D36]">
                {selectAll ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {records.length === 0 ? (
          <View className="bg-white rounded-[24px] border border-[#E5E2DE] p-8 items-center mb-6">
            <MaterialCommunityIcons name="file-upload-outline" size={48} color="#819685" />
            <Text className="text-base font-display-bold text-[#2D3A2F] mt-4 text-center">No records yet</Text>
            <Text className="text-sm text-[#5C6E60] text-center mt-2">
              Upload medical documents first to share them with a doctor.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/upload')}
              activeOpacity={0.75}
              className="mt-6 bg-[#004D36] rounded-[20px] px-6 py-3 flex-row items-center gap-2"
            >
              <MaterialCommunityIcons name="cloud-upload" color="white" size={18} />
              <Text className="text-white font-display-bold text-sm">Upload Records</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mb-6">
            {records.map(record => (
              <TouchableOpacity 
                key={record.id}
                onPress={() => toggleRecord(record.id)}
                activeOpacity={0.75} 
                className="mb-3"
              >
                <View className={`flex-row items-center gap-3 rounded-[20px] border-2 p-4 ${selectedIds.has(record.id) ? 'bg-[#F0F7F4] border-[#004D36]' : 'bg-white border-[#E5E2DE]'}`}>
                  <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: LABEL_CONFIG[record.label].bg }}>
                    <MaterialCommunityIcons name={LABEL_CONFIG[record.label].icon as any} size={20} color={LABEL_CONFIG[record.label].color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-display-bold text-[#2D3A2F]" numberOfLines={1}>{record.condition}</Text>
                    <Text className="text-[11px] text-[#819685] mt-0.5" numberOfLines={1}>{record.hospital}</Text>
                    <Text className="text-[11px] text-[#819685] mt-0.5">
                      {new Date(record.date_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedIds.has(record.id) ? 'bg-[#004D36] border-[#004D36]' : 'bg-white border-[#C8D5CA]'}`}>
                    {selectedIds.has(record.id) && <MaterialCommunityIcons name="check" size={14} color="white" />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}



            {/* SECTION 4: GENERATE QR */}
            <Text className="text-base font-display-bold text-[#2D3A2F] mb-3">Generate QR</Text>
            <View className="bg-white rounded-[24px] border border-[#E5E2DE] p-6 items-center mb-6">
              
              {qrValue === null ? (
                <>
                  <View className="w-20 h-20 bg-[#F8FAF9] rounded-[20px] border-2 border-[#E5E2DE] items-center justify-center mb-4">
                    <MaterialCommunityIcons name="qrcode-scan" size={40} color="#004D36" />
                  </View>
                  <Text className="text-base font-display-bold text-[#2D3A2F] mb-2 text-center">Ready to share?</Text>
                  <Text className={`text-sm text-center mb-6 font-display ${selectedIds.size === 0 ? 'text-[#819685]' : 'text-[#5C6E60]'}`}>
                    {selectedIds.size === 0 
                      ? "Select records above to continue" 
                      : `${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''} selected · tap to generate`}
                  </Text>

                  {selectedIds.size > 0 && (
                    <View className="bg-[#E8F5E9] rounded-xl p-3 flex-row items-start gap-3 mb-6 w-full">
                      <MaterialCommunityIcons name="information-outline" size={18} color="#004D36" style={{ marginTop: 2 }} />
                      <Text className="text-[12px] text-[#2D3A2F] font-display flex-1 leading-5">
                        The QR code will expire automatically in {accessDuration}. The doctor only needs to scan it once.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    onPress={handleGenerateQR}
                    activeOpacity={0.8}
                    disabled={selectedIds.size === 0 || generating}
                    className={`w-full h-12 rounded-xl flex-row items-center justify-center gap-2 ${selectedIds.size > 0 && !generating ? 'bg-[#004D36]' : 'bg-[#E5E2DE]'}`}
                  >
                    {generating ? (
                      <>
                        <ActivityIndicator color="white" size="small" />
                        <Text className="font-display-bold text-sm text-white">
                          Generating...
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialCommunityIcons name="qrcode" size={20} color={selectedIds.size > 0 ? 'white' : '#819685'} />
                        <Text className={`font-display-bold text-sm ${selectedIds.size > 0 ? 'text-white' : 'text-[#819685]'}`}>
                          Generate QR Code
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="bg-[#004D36] p-4 rounded-2xl flex-row items-start gap-3 mb-6 w-full">
                    <MaterialCommunityIcons name="information-outline" size={20} color="white" />
                    <Text className="text-white text-xs font-display flex-1 leading-tight">
                      This QR gives {accessLevel === 'read_only' ? 'read-only' : 'full'} access to {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''}. It expires automatically for your security.
                    </Text>
                  </View>

                  <QRDisplay 
                    value={qrValue}
                    durationSeconds={DURATION_SECONDS[accessDuration]}
                    onExpired={handleQRExpired}
                  />

                  <View className="bg-[#F5F3F0] rounded-full px-4 py-2 mt-2">
                    <Text className="text-xs font-display-bold text-[#5C6E60] text-center">
                      {qrSummary}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => { setQrValue(null); setQrSummary(''); }}
                    activeOpacity={0.7}
                    className="mt-4 flex-row items-center gap-2"
                  >
                    <MaterialCommunityIcons name="refresh" size={16} color="#004D36" />
                    <Text className="text-sm font-display-bold text-[#004D36]">Generate new code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
      </ScrollView>
    </SafeAreaView>
  );
}
