import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HealthTipCard() {
  return (
    <View className="relative overflow-hidden rounded-xl bg-primary p-6 shadow-lg mb-8">
      {/* Decorative Elements */}
      <MaterialCommunityIcons 
        name="water" 
        size={72} 
        color="white" 
        className="absolute right-4 top-4 opacity-20"
        style={{ position: 'absolute', right: 16, top: 16, opacity: 0.2 }}
      />
      <View className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" pointerEvents="none" />

      {/* Content */}
      <View className="flex-row items-center mb-4 z-10">
        <View className="bg-white/20 rounded-full p-1 mr-2">
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="white" />
        </View>
        <Text className="text-xs font-display-semibold uppercase tracking-wider text-white/80">
          HEALTH TIP OF THE DAY
        </Text>
      </View>

      <Text className="text-xl font-display-bold text-white mb-2 z-10">
        Stay Hydrated!
      </Text>
      <Text className="text-white/80 text-sm leading-relaxed mb-4 font-display z-10 pr-8">
        Drinking at least 8 glasses of water a day helps maintain energy levels and supports your kidney health.
      </Text>

      <TouchableOpacity 
        className="bg-white px-4 py-2 rounded-lg self-start z-10"
        onPress={() => Alert.alert('Coming Soon', 'Full health article is not available yet.')}
      >
        <Text className="text-primary text-sm font-display-bold">Read More</Text>
      </TouchableOpacity>
    </View>
  );
}
