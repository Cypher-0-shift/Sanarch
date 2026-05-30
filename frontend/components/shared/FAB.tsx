import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FABProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}

export default function FAB({ icon = 'plus', onPress }: FABProps) {
  return (
    <TouchableOpacity 
      className="absolute bottom-[110px] right-6 h-14 w-14 bg-[#006B4D] rounded-full shadow-xl items-center justify-center z-50"
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        shadowColor: '#006B4D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <MaterialCommunityIcons name={icon} size={28} color="white" />
    </TouchableOpacity>
  );
}
