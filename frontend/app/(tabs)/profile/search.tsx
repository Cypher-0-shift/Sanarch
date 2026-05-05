import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RecordCardCompact from '../../../components/records/RecordCardCompact';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus the input on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-primary/10 px-4 pt-4 pb-4 z-10">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#143832" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-primary">Search</Text>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center w-full h-12 bg-primary/5 rounded-xl px-4 border border-transparent focus-within:border-primary/30 focus-within:bg-white">
          <MaterialCommunityIcons name="magnify" size={22} color="rgba(20, 56, 50, 0.6)" className="mr-2" />
          <TextInput
            ref={inputRef}
            className="flex-1 h-full bg-transparent text-base text-primary font-display placeholder:text-primary/40"
            placeholder="Search records, doctors, or tags"
            placeholderTextColor="rgba(20, 56, 50, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="rgba(20, 56, 50, 0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm font-display-semibold uppercase tracking-wider text-primary/60 mb-4 ml-1">
          {searchQuery.length > 0 ? "Search results" : "Recent searches"}
        </Text>

        {searchQuery.length > 0 ? (
          // Empty State for demo purposes since we're using mock data
          <View className="bg-white rounded-xl border border-primary/5 p-4 py-12 flex-col items-center shadow-sm">
            <View className="h-16 w-16 rounded-full bg-primary/5 items-center justify-center mb-3">
              <MaterialCommunityIcons name="magnify" size={32} color="#143832" />
            </View>
            <Text className="font-display-bold text-slate-900 text-lg">No results found</Text>
            <Text className="text-sm text-slate-500 font-display mt-1 text-center">
              Try searching for a different record name,{'\n'}hospital, or doctor.
            </Text>
          </View>
        ) : (
          // Recent Searches mock
          <View className="gap-y-3">
            <RecordCardCompact id="1" title="Blood Test" subtitle="Search • 10:30 AM" />
            <RecordCardCompact id="2" title="Dr. Sharma" subtitle="Search • Yesterday" />
            <RecordCardCompact id="3" title="Apollo" subtitle="Search • 12 Mar 2026" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
