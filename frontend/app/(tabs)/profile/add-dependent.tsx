import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { createPatient } from '../../../services/api';
import { formatSanarchId } from '../../../utils/sanarchId';
import ProfileAvatar from '../../../components/profile/ProfileAvatar';
import { useRef, useEffect } from 'react';
import { Animated, FlatList } from 'react-native';

type Step = 'relation' | 'details' | 'success';

// ── Reusable Form Field ──
function FormField({ label, value, onChangeText, locked, lockReason, placeholder, keyboardType = 'default' }: {
  label: string; value: string; onChangeText?: (t: string) => void; locked?: boolean; lockReason?: string; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685]">{label}</Text>
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
          <View className="w-full h-[52px] bg-[#F8F7F5] border border-[#E5E2DE] rounded-xl px-4 flex-row items-center">
            <Text className="text-sm font-display-medium text-[#A0A0A0] flex-1">{value || '—'}</Text>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#C5C5C5" />
          </View>
        </TouchableOpacity>
      ) : (
        <TextInput
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor="#B0B0B0" keyboardType={keyboardType}
          className={`w-full h-[52px] bg-white border rounded-xl px-4 text-sm font-display-medium ${value ? 'border-[#004D36] text-[#004D36]' : 'border-[#E5E2DE] text-[#2D3A2F]'}`}
          style={{ fontSize: 14 }}
        />
      )}
    </View>
  );
}

// ── Selector Field ──
function SelectorField({ label, value, placeholder, onPress }: {
  label: string; value: string; placeholder: string; onPress: () => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-2">{label}</Text>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}
        className={`w-full h-[52px] bg-white border rounded-xl px-4 flex-row items-center justify-between ${value ? 'border-[#004D36]' : 'border-[#E5E2DE]'}`}>
        <Text className={`text-sm font-display-medium ${value ? 'text-[#004D36]' : 'text-[#B0B0B0]'}`}>{value || placeholder}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#819685" />
      </TouchableOpacity>
    </View>
  );
}

export default function AddDependentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addFamilyMember = useProfileStore((state) => state.addFamilyMember);

  const [step, setStep] = useState<Step>('relation');

  // Form State
  const [relation, setRelation] = useState<'child' | 'parent' | 'spouse' | 'sibling' | 'elderly' | 'other'>('child');
  const [otherRelation, setOtherRelation] = useState('');

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [generatedId, setGeneratedId] = useState('');

  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'day' | 'month' | 'year'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);

  const HEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => `${100 + i}`);
  const WEIGHT_OPTIONS = Array.from({ length: 181 }, (_, i) => `${20 + i}`);

  const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Other'];
  const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

  // Helper to parse DD/MM/YYYY to ISO format
  const parseDobToISO = (dobStr: string): string | undefined => {
    if (!dobStr || !dobStr.includes('/')) return undefined;
    const [day, month, year] = dobStr.split('/');
    if (!day || !month || !year) return undefined;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleNextStep = async () => {
    if (step === 'relation') {
      if (relation === 'other' && !otherRelation.trim()) {
        useAlertStore.getState().showAlert('Required', 'Please specify the relationship.');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!name.trim()) {
        useAlertStore.getState().showAlert('Required', 'Please enter a full name.');
        return;
      }

      const finalRelation = relation === 'other' ? (otherRelation.trim() as any) : relation;

      try {
        const patientData = await createPatient({
          name: name.trim(),
          relation: finalRelation,
          date_of_birth: dob ? parseDobToISO(dob) : undefined,
          gender: gender.trim() || undefined,
          blood_group: bloodGroup.trim() || undefined,
          height_cm: height || undefined,
          weight_kg: weight || undefined,
        });

        const newSanarchId = patientData.sanarch_id;
        setGeneratedId(newSanarchId);

        addFamilyMember({
          id: patientData.id,
          sanarchId: newSanarchId,
          name: patientData.name || name.trim(),
          relation: (patientData.relation || finalRelation) as any,
          isMainAccount: false,
          dob: dob.trim(),
          gender: gender.trim(),
          bloodGroup: bloodGroup.trim(),
          heightCm: height.trim(),
          weightKg: weight.trim(),
        });

        // Invalidate patients query cache so Profile page refetches immediately
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['profiles'] });

        setStep('success');
      } catch (error: any) {
        useAlertStore.getState().showAlert(
          'Failed',
          error?.response?.data?.detail ?? 'Could not add family member.'
        );
      }
    }
  };

  const renderRelationStep = () => (
    <View className="flex-1 px-6 pt-6">
      <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">Who are you adding?</Text>
      <Text className="text-[#5C6E60] font-display mb-8">Select their relationship to you.</Text>

      <View className="flex-row flex-wrap gap-3">
        {['child', 'parent', 'spouse', 'sibling', 'other'].map(rel => (
          <Pressable
            key={rel}
            onPress={() => setRelation(rel as any)}
            className="w-full sm:w-auto"
          >
            {({ pressed }) => (
              <View className={`px-5 py-3 rounded-xl border-2 ${relation === rel ? 'border-[#004D36]' : 'border-[#E5E2DE]'} ${pressed ? 'bg-[#DCF7E3]' : (relation === rel ? 'bg-[#E8F5E9]' : 'bg-white')}`}>
                <Text className={`font-display-bold capitalize text-base ${relation === rel ? 'text-[#004D36]' : 'text-[#5C6E60]'}`}>
                  {rel === 'spouse' ? 'Spouse / Partner' : rel}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {relation === 'other' && (
        <View className="mt-6">
          <Text className="text-sm font-display-bold text-[#819685] uppercase tracking-wider mb-2">Please Specify</Text>
          <TextInput
            value={otherRelation}
            onChangeText={setOtherRelation}
            placeholder="e.g. Grandchild, Aunt"
            placeholderTextColor="#A0ACA3"
            className="bg-white rounded-xl px-5 py-4 text-base text-[#2D3A2F] font-display-medium border border-[#E5E2DE]"
          />
        </View>
      )}

      <TouchableOpacity
        onPress={handleNextStep}
        activeOpacity={0.8}
        className="w-full h-[58px] bg-[#004D36] rounded-[22px] items-center justify-center mt-12"
      >
        <Text className="text-white font-display-bold text-lg">Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">Basic Details</Text>
      <Text className="text-[#5C6E60] font-display mb-8">Enter health data and bio for the new profile.</Text>

      <View>
        <FormField label="Full Name *" value={name} onChangeText={setName} placeholder="Their full name" />
        
        <View className="flex-row gap-4">
          <View className="flex-1">
            <SelectorField label="Date of Birth" value={dob} placeholder="DD/MM/YYYY" onPress={() => setShowCalendar(true)} />
          </View>
          <View className="flex-1">
            <SelectorField label="Gender" value={gender} placeholder="Select" onPress={() => setShowGenderMenu(true)} />
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <SelectorField label="Blood Group" value={bloodGroup} placeholder="Select" onPress={() => setShowBloodGroupPicker(true)} />
          </View>
          <View className="flex-1">
            <SelectorField label="Height (cm)" value={height ? `${height} cm` : ''} placeholder="Select" onPress={() => setShowHeightPicker(true)} />
          </View>
        </View>

        <SelectorField label="Weight (kg)" value={weight ? `${weight} kg` : ''} placeholder="Select" onPress={() => setShowWeightPicker(true)} />
      </View>

      <TouchableOpacity
        onPress={handleNextStep}
        activeOpacity={0.8}
        className="w-full h-[58px] bg-[#004D36] rounded-[22px] items-center justify-center mt-6"
      >
        <Text className="text-white font-display-bold text-lg">Create Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSuccessStep = () => (
    <View className="flex-1 px-6 items-center justify-center">
      <View className="mb-5">
        <ProfileAvatar
          size={96}
          gender={gender}
          dob={dob}
          relation={relation}
          name={name}
          borderWidth={4}
          borderColor="#D2E7D6"
        />
      </View>
      <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2 text-center">Profile Created!</Text>
      <Text className="text-[#5C6E60] font-display text-center mb-8 px-4">
        {name} has been successfully added to your family profiles. They are now connected to your main account.
      </Text>

      <View className="bg-white border border-[#E5E2DE] rounded-[24px] p-6 w-full mb-10 items-center">
        <Text className="text-xs font-display-bold text-[#819685] uppercase tracking-widest mb-2">Assigned Sanarch ID</Text>
        <Text className="text-xl font-display-bold text-[#004D36] tracking-wider text-center" adjustsFontSizeToFit numberOfLines={1}>
          {formatSanarchId(generatedId)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          // Reset state for future additions
          setStep('relation');
          setName('');
          setDob('');
          setGender('');
          setBloodGroup('');
          setHeight('');
          setWeight('');
          setRelation('child');
          setOtherRelation('');
          setSelectedDate(null);
          router.replace('/(tabs)/profile');
        }}
        activeOpacity={0.8}
        className="w-full h-[58px] bg-[#004D36] rounded-[22px] items-center justify-center"
      >
        <Text className="text-white font-display-bold text-lg">Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCalendarModal = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

    return (
      <Modal visible={showCalendar} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-[32px] p-6 shadow-sm">
            {calendarMode === 'day' && (
              <>
                <View className="flex-row justify-between items-center mb-6">
                  <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2">
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#2D3A2F" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCalendarMode('year')} className="px-4 py-2 bg-[#F5F3F0] rounded-full">
                    <Text className="text-base font-display-bold text-[#2D3A2F]">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2">
                    <MaterialCommunityIcons name="chevron-right" size={28} color="#2D3A2F" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row mb-4">
                  {weekDays.map((d, i) => (
                    <View key={i} className="flex-1 items-center">
                      <Text className="text-xs font-display-bold text-[#819685]">{d}</Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row flex-wrap">
                  {days.map((day, i) => {
                    if (day === null) return <View key={`empty-${i}`} className="w-[14.28%] aspect-square" />;

                    const isSelected = selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();

                    return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                          className={`w-[14.28%] aspect-square items-center justify-center rounded-full ${isSelected ? 'bg-[#DCF7E3] border border-[#004D36]/20' : ''}`}
                        >
                          <Text className={`text-sm font-display-bold ${isSelected ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {calendarMode === 'year' && (
              <>
                <Text className="text-lg font-display-bold text-[#2D3A2F] mb-4 text-center">Select Year</Text>
                <View className="h-[280px]">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap justify-between gap-y-2">
                      {years.map(year => (
                        <TouchableOpacity
                          key={year}
                          onPress={() => {
                            setCurrentDate(new Date(year, currentDate.getMonth(), 1));
                            setCalendarMode('month');
                          }}
                          className={`w-[31%] py-3 rounded-xl items-center ${currentDate.getFullYear() === year ? 'bg-[#DCF7E3] border border-[#004D36]/20' : 'bg-[#F5F3F0]'}`}
                        >
                          <Text className={`text-base font-display-bold ${currentDate.getFullYear() === year ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </>
            )}

            {calendarMode === 'month' && (
              <>
                <Text className="text-lg font-display-bold text-[#2D3A2F] mb-4 text-center">Select Month ({currentDate.getFullYear()})</Text>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {monthNames.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      onPress={() => {
                        setCurrentDate(new Date(currentDate.getFullYear(), index, 1));
                        setCalendarMode('day');
                      }}
                      className={`w-[31%] py-4 rounded-xl items-center ${currentDate.getMonth() === index ? 'bg-[#DCF7E3] border border-[#004D36]/20' : 'bg-[#F5F3F0]'}`}
                    >
                      <Text className={`text-sm font-display-bold ${currentDate.getMonth() === index ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>
                        {month.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View className="flex-row justify-end gap-4 mt-6">
              <TouchableOpacity onPress={() => { setShowCalendar(false); setCalendarMode('day'); }} className="px-4 py-2">
                <Text className="text-sm font-display-bold text-[#5C6E60]">Cancel</Text>
              </TouchableOpacity>
              {calendarMode === 'day' && (
                <TouchableOpacity onPress={() => {
                  if (selectedDate) {
                    setDob(`${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`);
                  }
                  setShowCalendar(false);
                }} className="px-6 py-2 bg-[#004D36] rounded-xl">
                  <Text className="text-sm font-display-bold text-white">OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDropdownModal = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    title: string,
    options: string[],
    value: string,
    setValue: (v: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-display-bold text-[#2D3A2F]">{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} className="p-2 bg-[#F5F3F0] rounded-full" hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => { setValue(opt); setVisible(false); }}
                className={`px-5 py-4 rounded-xl mb-2 flex-row items-center justify-between ${value === opt ? 'bg-[#E8F5E9]' : 'bg-[#F5F3F0]'}`}
              >
                <Text className={`text-base font-display-medium ${value === opt ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>
                  {opt}
                </Text>
                {value === opt && <MaterialCommunityIcons name="check-circle" size={20} color="#004D36" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const ScrollStringPickerModal = ({ visible, onClose, title, options, value, onSelect }: {
    visible: boolean; onClose: () => void; title: string; options: string[]; value: string; onSelect: (v: string) => void;
  }) => {
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
            <View className="bg-[#F5F3F0] rounded-xl overflow-hidden" style={{ height: ITEM_H * 3 }}>
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
  };


  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-white border-b border-[#E5E2DE] z-10 flex-row items-center justify-between" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        <TouchableOpacity
          onPress={() => step === 'details' ? setStep('relation') : router.back()}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#D2E7D6] items-center justify-center"
          style={{ opacity: step === 'success' ? 0 : 1 }}
          disabled={step === 'success'}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#004D36" />
        </TouchableOpacity>
        <Text className="text-xl font-display-bold tracking-tight text-[#004D36]">Add Family Member</Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {step === 'relation' && renderRelationStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'success' && renderSuccessStep()}
      </KeyboardAvoidingView>

      {renderCalendarModal()}
      {renderDropdownModal(showGenderMenu, setShowGenderMenu, "Select Gender", GENDER_OPTIONS, gender, setGender)}
      
      <ScrollStringPickerModal 
        visible={showBloodGroupPicker} 
        onClose={() => setShowBloodGroupPicker(false)} 
        title="Select Blood Group" 
        options={BLOOD_GROUP_OPTIONS} 
        value={bloodGroup} 
        onSelect={setBloodGroup} 
      />

      <ScrollStringPickerModal 
        visible={showHeightPicker} 
        onClose={() => setShowHeightPicker(false)} 
        title="Select Height (cm)" 
        options={HEIGHT_OPTIONS} 
        value={height} 
        onSelect={setHeight} 
      />

      <ScrollStringPickerModal 
        visible={showWeightPicker} 
        onClose={() => setShowWeightPicker(false)} 
        title="Select Weight (kg)" 
        options={WEIGHT_OPTIONS} 
        value={weight} 
        onSelect={setWeight} 
      />
    </SafeAreaView>
  );
}
