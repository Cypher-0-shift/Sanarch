import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, ScrollView, InteractionManager, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import MedicalEventCard from '../../../components/records/MedicalEventCard';
import SkeletonCard from '../../../components/shared/SkeletonCard';
import { type MedicalEventLabel } from '../../../constants/mock';
import EmptyState from '../../../components/ui/EmptyState';
import { getTimeline, TimelineEvent } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';

const FILTER_LABELS = ['All', 'Reports', 'Prescriptions', 'Imaging', 'Vaccines'];

const FILTER_LABEL_MAP: Record<string, MedicalEventLabel | null> = {
  All: null,
  Reports: 'lab_report',
  Prescriptions: 'prescription',
  Imaging: 'scan',
  Vaccines: 'hospital_summary', // Mapping vaccine to hospital_summary for demo purposes
};

export default function RecordsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const user = useAuthStore((s) => s.user);
  const activeProfile = useProfileStore((s) => s.activeProfile);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const patientId = activeProfile?.id ?? user?.id;
        if (!patientId) {
          setLoading(false);
          return;
        }
        const data = await getTimeline(patientId, 100, 0);
        setRecords(data.events);
      } catch (error) {
        console.error('[Records] Fetch failed:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [isReady, activeProfile?.id, user?.id]);

  const deferredSearch = useDeferredValue(search);

  const filteredRecords = useMemo(() => {
    return records.filter((event) => {
      const labelFilter = FILTER_LABEL_MAP[activeFilter];
      const matchesFilter = labelFilter === null || event.label === labelFilter;
      const query = deferredSearch.toLowerCase();
      const matchesSearch =
        !query ||
        event.condition.toLowerCase().includes(query) ||
        (event.hospital && event.hospital.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, deferredSearch, records]);

  if (!isReady) return <View className="flex-1 bg-[#F5F3F0]" />;


  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      
      {/* Header Section */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-[#F8FAF9] border-b border-[#E5E2DE] z-30">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-[#2D3A2F] text-2xl font-display-bold tracking-tight">My Records</Text>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-[#F5F3F0] items-center justify-center"
            activeOpacity={0.75}
            onPress={() => useAlertStore.getState().showAlert('Sort', 'Sort options coming soon.')}
          >
            <MaterialCommunityIcons name="swap-vertical" size={20} color="#2D3A2F" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="h-12 bg-white rounded-2xl flex-row items-center px-4 gap-3 mb-6 border border-[#E5E2DE] focus-within:border-[#004D36]/20">
          <MaterialCommunityIcons name="magnify" size={20} color="#819685" />
          <TextInput 
            className="flex-1 bg-transparent text-sm text-[#2D3A2F] font-display-medium"
            placeholder="Search reports, doctors, clinics..."
            placeholderTextColor="#819685"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Tabs */}
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            {FILTER_LABELS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  className={`px-5 py-2.5 rounded-full border ${
                    isActive 
                      ? 'bg-[#004D36] border-[#004D36] shadow-sm' 
                      : 'bg-white border-[#E5E2DE]'
                  }`}
                  style={isActive ? { shadowColor: '#004D36', shadowOpacity: 0.15, shadowRadius: 12 } : {}}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.75}
                >
                  <View className="flex-row items-center">
                    <Text className={`text-sm font-display-bold ${isActive ? 'text-white' : 'text-[#5C6E60]'}`}>
                      {filter}
                    </Text>
                    {isActive && filteredRecords.length > 0 && (
                      <View className="ml-2 bg-white/20 rounded-full min-w-[20px] px-1 h-5 items-center justify-center bg-white">
                        <Text className="text-[#004D36] text-[10px] font-display-bold">{filteredRecords.length}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Scrollable Content */}
      {loading ? (
        <View className="px-6 pt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            records.length > 0 ? (
              <View className="flex-row items-center justify-center gap-2 mb-6">
                <View className="w-1.5 h-1.5 bg-[#81C784] rounded-full" />
                <Text className="text-[11px] font-display-bold text-[#819685] uppercase tracking-widest">
                  Last synced 2m ago
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(400)}>
              <MedicalEventCard
                id={item.id}
                condition={item.condition}
                date_start={item.date_start}
                hospital={item.hospital ?? ''}
                doctor={item.doctor ?? ''}
                document_count={item.document_count}
                label={item.label}
                onPress={() => {
                  const firstDocId = item.documents?.[0]?.id;
                  if (firstDocId) {
                    router.push(`/(tabs)/records/${firstDocId}`);
                  } else {
                    useAlertStore.getState().showAlert('No Document', 'This record has no attached document yet.');
                  }
                }}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState 
              icon="clipboard-text-outline" 
              title="No records found" 
              subtitle="Upload medical documents to build your health timeline."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
