import { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import FilterPills from '../../../components/shared/FilterPills';
import MedicalEventCard from '../../../components/records/MedicalEventCard';
import SkeletonCard from '../../../components/shared/SkeletonCard';
import { MOCK_MEDICAL_EVENTS } from '../../../constants/mock';
import type { MedicalEventLabel } from '../../../constants/mock';

const FILTER_LABEL_MAP: Record<string, MedicalEventLabel | null> = {
  All: null,
  'Lab Reports': 'lab_report',
  Prescriptions: 'prescription',
  Scans: 'scan',
  'Hospital Summary': 'hospital_summary',
};

export default function RecordsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredRecords = MOCK_MEDICAL_EVENTS.filter((event) => {
    const labelFilter = FILTER_LABEL_MAP[activeFilter];
    const matchesFilter = labelFilter === null || event.label === labelFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      event.condition.toLowerCase().includes(query) ||
      event.hospital.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Sticky Header */}
      <View className="bg-background-light/90 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex-row items-center justify-between z-10">
        <View className="h-10 w-10" />
        <Text className="text-xl font-display-bold text-slate-900">Medical Records</Text>
        <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => Alert.alert('Options', 'Sort and filter options coming soon.')}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#143832" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="bg-primary/5 rounded-xl flex-row items-center mx-4 mt-4 mb-2 shadow-sm border border-transparent focus-within:border-primary/20 focus-within:bg-white">
        <MaterialCommunityIcons name="magnify" size={22} color="#143832" style={{ position: 'absolute', left: 12, opacity: 0.6 }} />
        <TextInput 
          className="flex-1 py-3 pl-11 pr-4 font-display text-primary text-base placeholder:text-primary/40"
          placeholder="Search records or documents"
          placeholderTextColor="rgba(20, 56, 50, 0.4)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Pills */}
      <View>
        <FilterPills activeFilter={activeFilter} onSelect={setActiveFilter} />
      </View>

      {/* Records List */}
      {loading ? (
        <View className="px-4 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MedicalEventCard
              id={item.id}
              condition={item.condition}
              date_start={item.date_start}
              date_end={item.date_end ?? undefined}
              hospital={item.hospital}
              doctor={item.doctor}
              document_count={item.document_count}
              label={item.label}
              onPress={() => router.push(`/(tabs)/records/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 opacity-50">
              <MaterialCommunityIcons name="file-hidden" size={64} color="#64748B" />
              <Text className="text-slate-500 font-display-medium mt-4">No records found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
