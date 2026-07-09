// app/(tabs)/records/index.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useDocumentsStore, type DocumentRecord } from '../../../store/documentsStore';
import DocumentCard from '../../../components/DocumentCard';

// ── Skeleton card placeholder with shimmer ───────────────────────
function SkeletonCard() {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={{ opacity }}
      className="bg-white rounded-xl mb-3 p-4 flex-row"
    >
      <View className="w-14 h-14 rounded-xl bg-[#E8E8E8] mr-3" />
      <View className="flex-1">
        <View className="h-4 bg-[#E8E8E8] rounded-full w-3/4 mb-2" />
        <View className="h-3 bg-[#E8E8E8] rounded-full w-1/2 mb-3" />
        <View className="h-1 bg-[#E8E8E8] rounded-full w-full" />
      </View>
    </Animated.View>
  );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState() {
  const pressScale = React.useRef(new Animated.Value(1)).current;
  return (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-6xl mb-5">📄</Text>
      <Text className="text-xl font-bold text-[#2D3A2F] text-center">No records yet</Text>
      <Text className="text-[15px] text-[#7A8A7C] text-center mt-2 leading-5">
        Upload your first medical document to get started.
      </Text>
      <Animated.View style={{ transform: [{ scale: pressScale }] }} className="mt-6">
        <Pressable
          onPressIn={() =>
            Animated.spring(pressScale, {
              toValue: 0.97,
              friction: 8,
              tension: 200,
              useNativeDriver: true,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(pressScale, {
              toValue: 1,
              friction: 8,
              tension: 200,
              useNativeDriver: true,
            }).start()
          }
          onPress={() => router.push('/(tabs)/upload')}
          className="bg-[#004D36] rounded-xl px-8 py-3.5"
        >
          <Text className="text-white font-semibold text-[15px]">Upload Document</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Main Records Screen ──────────────────────────────────────────
export default function RecordsScreen() {
  const documents = useDocumentsStore((s) => s.documents);
  const isLoading = useDocumentsStore((s) => s.isLoading);
  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  const renderCard = useCallback(
    ({ item }: { item: DocumentRecord }) => <DocumentCard document={item} />,
    []
  );

  const keyExtractor = useCallback((item: DocumentRecord) => item.document_id, []);

  // Loading skeleton
  if (isLoading && documents.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F3F0]">
        <View className="px-5 pt-4 pb-2">
          <Text className="text-[28px] font-bold text-[#2D3A2F]">My Records</Text>
        </View>
        <View className="px-5 pt-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!isLoading && documents.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F3F0]">
        <View className="px-5 pt-4 pb-2">
          <Text className="text-[28px] font-bold text-[#2D3A2F]">My Records</Text>
        </View>
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-[28px] font-bold text-[#2D3A2F]">My Records</Text>
      </View>
      <FlatList
        data={documents}
        renderItem={renderCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#004D36"
            colors={['#004D36']}
          />
        }
      />
    </SafeAreaView>
  );
}
