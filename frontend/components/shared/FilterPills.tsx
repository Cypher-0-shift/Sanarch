import { ScrollView, TouchableOpacity, Text } from 'react-native';

const DEFAULT_FILTERS = ['All', 'Lab Reports', 'Prescriptions', 'Scans', 'Hospital Summary'];

interface FilterPillsProps {
  activeFilter: string;
  onSelect: (filter: string) => void;
  filters?: string[];
}

export default function FilterPills({ activeFilter, onSelect, filters }: FilterPillsProps) {
  const FILTERS = filters ?? DEFAULT_FILTERS;
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onSelect(filter)}
            className={`h-9 px-5 rounded-full items-center justify-center flex-row ${
              isActive ? 'bg-primary' : 'bg-white border border-primary/10'
            }`}
          >
            <Text className={`text-sm font-display-medium ${
              isActive ? 'text-white' : 'text-primary'
            }`}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
