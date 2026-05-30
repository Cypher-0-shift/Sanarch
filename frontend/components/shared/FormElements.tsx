import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlertStore } from '../../store/alertStore';

// ── Reusable Form Field ──
export function FormField({ label, value, onChangeText, locked, lockReason, placeholder, keyboardType = 'default', autoCapitalize = 'none' }: {
  label: string; value: string; onChangeText?: (t: string) => void; locked?: boolean; lockReason?: string; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] ml-1">{label}</Text>
        {locked && (
          <View className="flex-row items-center gap-1 bg-[#F5F3F0] px-2 py-0.5 rounded-md">
            <MaterialCommunityIcons name="lock" size={10} color="#819685" />
            <Text className="text-[9px] font-display-bold text-[#819685] uppercase">{lockReason ?? 'Locked'}</Text>
          </View>
        )}
      </View>
      {locked ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => useAlertStore.getState().showAlert('Field Locked', `${label} cannot be edited. This field is permanently set to protect your identity.`)}
        >
          <View className="w-full h-[52px] bg-[#F8F7F5] border border-[#E5E2DE] rounded-2xl px-4 flex-row items-center">
            <Text className="text-sm font-display-medium text-[#A0A0A0] flex-1">{value || '—'}</Text>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#C5C5C5" />
          </View>
        </TouchableOpacity>
      ) : (
        <TextInput
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor="#B0B0B0" keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className={`w-full h-[52px] bg-white border rounded-2xl px-4 text-sm font-display-medium ${value ? 'border-[#004D36] text-[#004D36]' : 'border-[#E5E2DE] text-[#2D3A2F]'}`}
          style={{ fontSize: 14 }}
        />
      )}
    </View>
  );
}

// ── Selector Field (for dropdowns) ──
export function SelectorField({ label, value, placeholder, onPress }: {
  label: string; value: string; placeholder: string; onPress: () => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-2 ml-1">{label}</Text>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}
        className={`w-full h-[52px] bg-white border rounded-2xl px-4 flex-row items-center justify-between ${value ? 'border-[#004D36]' : 'border-[#E5E2DE]'}`}>
        <Text className={`text-sm font-display-medium ${value ? 'text-[#004D36]' : 'text-[#B0B0B0]'}`}>{value || placeholder}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#819685" />
      </TouchableOpacity>
    </View>
  );
}

// ── Scrollable String Picker Modal ──
export function ScrollStringPickerModal({ visible, onClose, title, options, value, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: string[]; value: string; onSelect: (v: string) => void;
}) {
  const ITEM_H = 52;
  const flatListRef = useRef<FlatList>(null);
  const currentIndex = Math.max(0, options.indexOf(value));
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    if (visible) {
      setInternalVal(value);
      setTimeout(() => flatListRef.current?.scrollToIndex({ index: currentIndex, animated: false }), 100);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-white rounded-[32px] p-6 shadow-sm">
          <Text className="text-lg font-display-bold text-[#2D3A2F] mb-4 text-center">{title}</Text>
          <View className="bg-[#F5F3F0] rounded-2xl overflow-hidden" style={{ height: ITEM_H * 3 }}>
            <View className="absolute left-0 right-0 bg-[#E8F5E9] border-y border-[#C8E6C9] z-0" style={{ top: ITEM_H, height: ITEM_H }} />
            <FlatList
              ref={flatListRef}
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
              contentContainerStyle={{ paddingVertical: ITEM_H }}
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                const val = options[Math.min(idx, options.length - 1)];
                if (val !== undefined && val !== internalVal) setInternalVal(val);
              }}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                const val = options[Math.min(idx, options.length - 1)];
                if (val !== undefined) setInternalVal(val);
              }}
              renderItem={({ item, index }) => {
                const isSelected = item === internalVal;
                const isLast = index === options.length - 1;
                return (
                  <View style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }} className={`w-full ${!isLast ? 'border-b border-[#E5E2DE]/60' : ''}`}>
                    <Text className={`text-lg ${isSelected ? 'font-display-bold text-[#004D36]' : 'font-display-medium text-[#819685]'}`}>{item}</Text>
                  </View>
                );
              }}
            />
          </View>
          <View className="flex-row justify-end gap-4 mt-6">
            <TouchableOpacity onPress={onClose} className="px-4 py-2"><Text className="text-sm font-display-bold text-[#5C6E60]">Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { onSelect(internalVal); onClose(); }} className="px-6 py-2 bg-[#004D36] rounded-xl">
              <Text className="text-sm font-display-bold text-white">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Dropdown Modal ──
export function DropdownModal({ visible, onClose, title, options, value, onSelect }: {
  visible: boolean; onClose: () => void; title: string; options: string[]; value: string; onSelect: (v: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-display-bold text-[#2D3A2F]">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-[#F5F3F0] rounded-full" activeOpacity={0.75}>
              <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity key={opt} activeOpacity={0.75}
                onPress={() => { onSelect(opt); onClose(); }}
                className={`px-5 py-4 rounded-2xl mb-2 flex-row items-center justify-between ${value === opt ? 'bg-[#E8F5E9]' : 'bg-[#F5F3F0]'}`}>
                <Text className={`text-base font-display-medium ${value === opt ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>{opt}</Text>
                {value === opt && <MaterialCommunityIcons name="check-circle" size={20} color="#004D36" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Calendar Modal ──
export function CalendarModal({ visible, onClose, onConfirm }: {
  visible: boolean; onClose: () => void; onConfirm: (date: Date) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mode, setMode] = useState<'day' | 'month' | 'year'>('day');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-white rounded-[32px] p-6 shadow-sm">
          {mode === 'day' && (<>
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2"><MaterialCommunityIcons name="chevron-left" size={28} color="#2D3A2F" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('year')} className="px-4 py-2 bg-[#F5F3F0] rounded-full">
                <Text className="text-base font-display-bold text-[#2D3A2F]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2"><MaterialCommunityIcons name="chevron-right" size={28} color="#2D3A2F" /></TouchableOpacity>
            </View>
            <View className="flex-row mb-4">
              {weekDays.map((d, i) => (<View key={i} className="flex-1 items-center"><Text className="text-xs font-display-bold text-[#819685]">{d}</Text></View>))}
            </View>
            <View className="flex-row flex-wrap">
              {days.map((day, i) => {
                if (day === null) return <View key={`e-${i}`} className="w-[14.28%] aspect-square" />;
                const isSel = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
                return (
                  <TouchableOpacity key={i} onPress={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`w-[14.28%] aspect-square items-center justify-center rounded-full ${isSel ? 'bg-[#004D36]' : ''}`}>
                    <Text className={`text-sm font-display-bold ${isSel ? 'text-white' : 'text-[#2D3A2F]'}`}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>)}
          {mode === 'year' && (<>
            <Text className="text-lg font-display-bold text-[#2D3A2F] mb-4 text-center">Select Year</Text>
            <View className="h-[280px]"><ScrollView showsVerticalScrollIndicator={false}><View className="flex-row flex-wrap justify-between gap-y-2">
              {years.map(year => (
                <TouchableOpacity key={year} onPress={() => { setCurrentDate(new Date(year, currentDate.getMonth(), 1)); setMode('month'); }}
                  className={`w-[31%] py-3 rounded-xl items-center ${currentDate.getFullYear() === year ? 'bg-[#004D36]' : 'bg-[#F5F3F0]'}`}>
                  <Text className={`text-base font-display-bold ${currentDate.getFullYear() === year ? 'text-white' : 'text-[#2D3A2F]'}`}>{year}</Text>
                </TouchableOpacity>
              ))}
            </View></ScrollView></View>
          </>)}
          {mode === 'month' && (<>
            <Text className="text-lg font-display-bold text-[#2D3A2F] mb-4 text-center">Select Month ({currentDate.getFullYear()})</Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {monthNames.map((month, index) => (
                <TouchableOpacity key={month} onPress={() => { setCurrentDate(new Date(currentDate.getFullYear(), index, 1)); setMode('day'); }}
                  className={`w-[31%] py-4 rounded-xl items-center ${currentDate.getMonth() === index ? 'bg-[#004D36]' : 'bg-[#F5F3F0]'}`}>
                  <Text className={`text-sm font-display-bold ${currentDate.getMonth() === index ? 'text-white' : 'text-[#2D3A2F]'}`}>{month.substring(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>)}
          <View className="flex-row justify-end gap-4 mt-6">
            <TouchableOpacity onPress={() => { onClose(); setMode('day'); }} className="px-4 py-2"><Text className="text-sm font-display-bold text-[#5C6E60]">Cancel</Text></TouchableOpacity>
            {mode === 'day' && (
              <TouchableOpacity onPress={() => { if (selectedDate) onConfirm(selectedDate); onClose(); setMode('day'); }} className="px-6 py-2 bg-[#004D36] rounded-xl">
                <Text className="text-sm font-display-bold text-white">OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
