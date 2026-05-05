import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MOCK_MEDICAL_EVENTS, MOCK_USER } from '../../../constants/mock';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import BottomSheet from '../../../components/ui/BottomSheet';

export default function RecordDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = MOCK_MEDICAL_EVENTS.find((e) => e.id === id);

  const [viewMode, setViewMode] = useState<'digital' | 'original'>('digital');
  const [magicFlowVisible, setMagicFlowVisible] = useState(false);
  const [activeLabel, setActiveLabel] = useState('All');

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <View className="bg-white border-b border-primary/10 px-4 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#143832" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-primary">Record Details</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <MaterialCommunityIcons name="file-alert-outline" size={64} color="#94A3B8" />
          <Text className="text-xl font-display-bold mt-4 text-slate-900">Record not found</Text>
          <Text className="text-slate-500 text-center mt-2 font-display">
            The record you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            className="mt-6 h-12 px-8 bg-primary rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="text-white font-display-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Unique labels from documents
  const uniqueLabels = ['All', ...Array.from(new Set(event.documents.map((d) => d.label)))];

  // Filtered documents
  const filteredDocs =
    activeLabel === 'All'
      ? event.documents
      : event.documents.filter((d) => d.label === activeLabel);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // ── Main screen ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-primary/10 px-4 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#143832" />
          </TouchableOpacity>
          <Text className="text-lg font-display-bold text-primary flex-1" numberOfLines={1}>
            {event.condition}
          </Text>
        </View>
        <TouchableOpacity className="ml-2" onPress={() => Alert.alert('Options', 'Document options coming soon.')}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#143832" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle — Date + Hospital */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center mb-2">
            <MaterialCommunityIcons name="calendar-outline" size={16} color="#64748B" />
            <Text className="text-sm font-display text-slate-500 ml-2">
              {formatDate(event.date_start)}
              {event.date_end ? ` – ${formatDate(event.date_end)}` : ' – Ongoing'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748B" />
            <Text className="text-sm font-display text-slate-500 ml-2">{event.hospital}</Text>
          </View>
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          className="py-3"
        >
          {uniqueLabels.map((label) => {
            const isActive = activeLabel === label;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveLabel(label)}
                className={`h-9 px-5 rounded-full items-center justify-center ${
                  isActive ? 'bg-primary' : 'bg-white border border-primary/10'
                }`}
              >
                <Text
                  className={`text-sm font-display-medium ${
                    isActive ? 'text-white' : 'text-primary'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* View mode toggle */}
        <View className="flex-row items-center justify-between bg-white rounded-xl mx-6 px-4 py-3 mb-2 border border-primary/5">
          <Text className="text-sm text-slate-500 font-display">View Mode:</Text>
          <View className="flex-row items-center gap-3">
            <Text className={viewMode === 'digital' ? 'text-primary font-display-bold text-sm' : 'text-slate-400 font-display text-sm'}>
              Digital
            </Text>
            <Switch
              value={viewMode === 'original'}
              onValueChange={(val) => setViewMode(val ? 'original' : 'digital')}
              trackColor={{ false: '#DAF1DE', true: '#143832' }}
              thumbColor="white"
            />
            <Text className={viewMode === 'original' ? 'text-primary font-display-bold text-sm' : 'text-slate-400 font-display text-sm'}>
              Original
            </Text>
          </View>
        </View>

        {/* Documents List */}
        <View className="px-6 mt-2">
          <Text className="text-sm font-display-bold text-primary mt-4 mb-2 uppercase tracking-wide">
            Day 1
          </Text>
          
          {filteredDocs.map((doc) => (
            <View key={doc.id} className="bg-white rounded-xl border border-primary/5 p-4 mb-3 shadow-sm">
              {viewMode === 'digital' ? (
                <View>
                  <Text className="text-xs font-display-semibold uppercase tracking-wider text-primary/60 mb-3">
                    {doc.label}
                  </Text>
                  
                  <View className="flex-row items-center py-2 border-b border-primary/5">
                    <Text className="text-xs text-slate-400 font-display w-28">Document Type</Text>
                    <Text className="text-sm font-display-semibold text-slate-900 flex-1 ml-2">{event.label.replace(/_/g, ' ')}</Text>
                  </View>
                  
                  <View className="flex-row items-center py-2 border-b border-primary/5">
                    <Text className="text-xs text-slate-400 font-display w-28">Date</Text>
                    <Text className="text-sm font-display-semibold text-slate-900 flex-1 ml-2">{formatDate(event.date_start)}</Text>
                  </View>
                  
                  <View className="flex-row items-center py-2 border-b border-primary/5">
                    <Text className="text-xs text-slate-400 font-display w-28">Hospital</Text>
                    <Text className="text-sm font-display-semibold text-slate-900 flex-1 ml-2">{event.hospital}</Text>
                  </View>
                  
                  <View className="flex-row items-center py-2 border-b border-transparent">
                    <Text className="text-xs text-slate-400 font-display w-28">Doctor</Text>
                    <Text className="text-sm font-display-semibold text-slate-900 flex-1 ml-2">{event.doctor ?? 'Not specified'}</Text>
                  </View>
                </View>
              ) : (
                <View className="aspect-square bg-slate-100 rounded-xl items-center justify-center">
                  <MaterialCommunityIcons name="image-off-outline" size={48} color="#CBD5E1" />
                  <Text className="text-xs text-slate-400 font-display mt-2">
                    Original document preview
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Magic Flow button */}
        <TouchableOpacity
          className="mx-6 mb-6 mt-4 h-14 bg-primary rounded-xl flex-row items-center justify-center"
          onPress={() => setMagicFlowVisible(true)}
        >
          <MaterialCommunityIcons name="auto-fix" size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-display-bold">Magic Flow — Patient Journey</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Magic Flow BottomSheet */}
      <BottomSheet 
        visible={magicFlowVisible} 
        onClose={() => setMagicFlowVisible(false)}
        title="Patient Journey" 
        snapHeight={500}
      >
        <ScrollView>
          <Text className="font-display text-base text-slate-700 leading-relaxed">
            On {formatDate(event.date_start)}, {MOCK_USER.full_name} visited {event.hospital}.
            {'\n\n'}
            Condition recorded: {event.condition}.
            {'\n\n'}
            The treating physician {event.doctor ?? 'on record'} conducted a thorough evaluation and the following records were generated during this episode.
            {'\n\n'}
            Documents in this episode: {event.document_count} file(s) including {event.documents.map(d => d.label).join(', ')}.
            {'\n\n'}
            Follow-up and additional details will be populated as more records are added to this episode.
          </Text>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
