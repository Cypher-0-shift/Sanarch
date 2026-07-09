import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, InteractionManager, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import RecordCardCompact from '../../../components/records/RecordCardCompact';
import EmptyState from '../../../components/ui/EmptyState';
import { searchRecords } from '../../../services/api';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../../../services/storage';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<any>(null);

  const loadRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  };

  const handleSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchRecords(query);
      setResults(data.results);
      if (data.results.length > 0) {
        await saveRecentSearch(query);
        loadRecentSearches();
      }
    } catch (e) {
      console.error('[Search] Failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onChangeText = (text: string) => {
    setSearchQuery(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => handleSearch(text), 300);
  };

  const onRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };
  
  // Auto-focus on mount
  useEffect(() => {
    loadRecentSearches();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => {
      clearTimeout(timer);
      clearTimeout(debounceRef.current);
    };
  }, []);
  
  // Also focus when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });
      return () => task.cancel();
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="bg-white border-b border-[#E5E2DE] px-4 pt-4 pb-4 z-10">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#004D36" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-[#004D36]">Search</Text>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center w-full h-12 bg-white rounded-xl px-4 border-2 border-[#004D36] shadow-sm">
          <MaterialCommunityIcons name="magnify" size={22} color="#004D36" className="mr-2" />
          <TextInput
            ref={inputRef}
            className="flex-1 h-full bg-transparent text-base text-[#2D3A2F] font-display placeholder:text-[#819685]"
            placeholder="Search records, doctors, or tags"
            placeholderTextColor="#819685"
            value={searchQuery}
            onChangeText={onChangeText}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#819685" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between mb-4 ml-1">
          <Text className="text-sm font-display-semibold uppercase tracking-wider text-[#819685]">
            {searchQuery.length > 0 ? "Search results" : "Recent searches"}
          </Text>
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <TouchableOpacity onPress={async () => { await clearRecentSearches(); setRecentSearches([]); }}>
              <Text className="text-[#004D36] text-xs font-display-bold">CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#004D36" />
            <Text className="text-sm text-[#819685] font-display-medium mt-4">Searching...</Text>
          </View>
        ) : searchQuery.length >= 2 && results.length === 0 ? (
          <EmptyState 
            icon="magnify"
            title="No results found"
            subtitle={`Try searching for a different record name,\nhospital, or doctor.`}
          />
        ) : searchQuery.length >= 2 && results.length > 0 ? (
          <View className="gap-y-3">
            {results.map((result) => (
              <TouchableOpacity
                key={result.id}
                className="bg-white rounded-xl p-4 border border-[#E5E2DE] shadow-sm"
                activeOpacity={0.75}
                onPress={() => router.push(`/(tabs)/records/${result.id}` as any)}
              >
                <Text className="text-[#2D3A2F] font-display-bold text-base mb-1" numberOfLines={1}>
                  {result.title}
                </Text>
                <Text className="text-[#5C6E60] text-sm font-display" numberOfLines={2}>
                  {result.description}
                </Text>
                <Text className="text-[#819685] text-xs font-display-medium mt-2">
                  {new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {recentSearches.length > 0 ? (
              recentSearches.map((term, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => onRecentSearchPress(term)}
                  className="bg-white border border-[#E5E2DE] px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                  <MaterialCommunityIcons name="history" size={14} color="#819685" />
                  <Text className="text-[#2D3A2F] font-display-medium text-sm">{term}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-[#819685] font-display text-sm">No recent searches</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
