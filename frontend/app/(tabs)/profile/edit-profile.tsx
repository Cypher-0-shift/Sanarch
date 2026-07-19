import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Animated, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { updateMe } from '../../../services/api';
import { toast } from '../../../components/feedback/toastStore';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

import { FormField, SelectorField, ScrollStringPickerModal, DropdownModal, CalendarModal } from '../../../components/shared/FormElements';

// ── Main Screen ──
export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeProfile = useProfileStore((state) => state.activeProfile);

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(activeProfile?.email ?? user?.email ?? '');
  const [address, setAddress] = useState(activeProfile?.address ?? '');
  const [city, setCity] = useState(activeProfile?.city ?? '');

  const [bloodGroup, setBloodGroup] = useState(activeProfile?.bloodGroup ?? '');
  const [heightCm, setHeightCm] = useState(activeProfile?.heightCm ?? '');
  const [weightKg, setWeightKg] = useState(activeProfile?.weightKg ?? '');
  const [gender, setGender] = useState(activeProfile?.gender ?? '');

  const [dob, setDob] = useState(activeProfile?.dob ?? '');
  const dobLocked = !!dob && dob.length > 0;

  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  const HEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => `${100 + i}`);
  const WEIGHT_OPTIONS = Array.from({ length: 181 }, (_, i) => `${20 + i}`);

  const savingAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (saving) {
      Animated.loop(Animated.sequence([
        Animated.timing(savingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(savingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])).start();
    }
  }, [saving]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      useAlertStore.getState().showAlert('Required', 'Name cannot be empty.');
      return;
    }
    
    setSaving(true);
    try {
      const updated = await updateMe({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
      });

      // Sync auth store
      useAuthStore.getState().setUser({
        ...useAuthStore.getState().user,
        full_name: updated.full_name,
        email: updated.email,
      });

      // Sync profile store
      const updatedProfile = {
        ...activeProfile!,
        name: updated.full_name,
        email: updated.email ?? undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
      };
      useProfileStore.getState().setActiveProfile(updatedProfile);

      const updatedMembers = useProfileStore.getState().familyMembers.map(p =>
        p.id === updatedProfile.id ? updatedProfile : p
      );
      useProfileStore.setState({ familyMembers: updatedMembers });

      toast.show({ message: 'Profile updated ✓', type: 'success' });
      router.push('/(tabs)/profile');
    } catch (error: any) {
      useAlertStore.getState().showAlert(
        'Save Failed',
        error?.response?.data?.detail ?? 'Could not update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-white border-b border-[#E5E2DE] z-10 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} 
          activeOpacity={0.75} 
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          className="w-10 h-10 rounded-full bg-[#F5F3F0] items-center justify-center">
          <MaterialCommunityIcons name="chevron-left" size={24} color="#2D3A2F" />
        </TouchableOpacity>
        <Text className="text-[#2D3A2F] text-xl font-display-bold tracking-tight">Edit Profile</Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

          {/* Identity — locked */}
          <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-4 ml-1">Identity</Text>
          <View className="bg-white border border-[#E5E2DE] rounded-[24px] p-5 mb-8" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}>
            <FormField label="Sanarch ID" value={user?.sanarch_id ?? '—'} locked lockReason="Permanent" />
            <FormField label="Phone Number" value={activeProfile?.phone ?? user?.phone_number ?? '—'} locked lockReason="Permanent" />
          </View>

          {/* Account Details */}
          <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-4 ml-1">Account Details</Text>
          <View className="bg-white border border-[#E5E2DE] rounded-[24px] p-5 mb-8" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}>
            <FormField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
            <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" />
            <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Street address" />
            <FormField label="City" value={city} onChangeText={setCity} placeholder="City" />
          </View>

          {/* Health Details */}
          <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-4 ml-1">Health Details</Text>
          <View className="bg-white border border-[#E5E2DE] rounded-[24px] p-5 mb-8" style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}>

            {/* Date of Birth — Calendar */}
            {dobLocked ? (
              <FormField label="Date of Birth" value={dob} locked lockReason="Set once" />
            ) : (
              <View className="mb-5">
                <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-2">Date of Birth</Text>
                <TouchableOpacity activeOpacity={0.75} onPress={() => setShowCalendar(true)}
                  className={`w-full h-[52px] bg-white border rounded-xl px-4 flex-row items-center justify-between ${dob ? 'border-[#004D36]' : 'border-[#E5E2DE]'}`}>
                  <Text className={`text-sm font-display-medium ${dob ? 'text-[#004D36]' : 'text-[#B0B0B0]'}`}>{dob || 'DD / MM / YYYY'}</Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#819685" />
                </TouchableOpacity>
              </View>
            )}

            {!dobLocked && (
              <View className="bg-[#FFF8E1] rounded-xl p-3 flex-row items-start gap-2 mb-5">
                <MaterialCommunityIcons name="information-outline" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                <Text className="text-[11px] font-display text-[#92700C] flex-1 leading-4">
                  Date of birth can only be set once. This field is locked after saving to protect your medical identity.
                </Text>
              </View>
            )}

            {/* Gender — Dropdown */}
            <SelectorField label="Gender" value={gender} placeholder="Select gender" onPress={() => setShowGenderMenu(true)} />

            {/* Blood Group — Scrollable Picker */}
            <SelectorField label="Blood Group" value={bloodGroup} placeholder="Select blood group" onPress={() => setShowBloodGroupPicker(true)} />

            {/* Height — Tap to open scroll picker */}
            <SelectorField label="Height (cm)" value={heightCm ? `${heightCm} cm` : ''} placeholder="Select height" onPress={() => setShowHeightPicker(true)} />

            {/* Weight — Tap to open scroll picker */}
            <SelectorField label="Weight (kg)" value={weightKg ? `${weightKg} kg` : ''} placeholder="Select weight" onPress={() => setShowWeightPicker(true)} />
          </View>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.75} disabled={saving}
            className={`w-full h-[56px] rounded-[20px] items-center justify-center mb-6 ${saving ? 'bg-[#819685]' : 'bg-[#004D36]'}`}
            style={{ shadowColor: '#004D36', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <Text className="text-white font-display-bold text-base">{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onConfirm={(date) => {
        setDob(`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`);
      }} />
      <DropdownModal visible={showGenderMenu} onClose={() => setShowGenderMenu(false)} title="Select Gender" options={GENDER_OPTIONS} value={gender} onSelect={setGender} />
      <ScrollStringPickerModal visible={showBloodGroupPicker} onClose={() => setShowBloodGroupPicker(false)} title="Select Blood Group" options={BLOOD_GROUP_OPTIONS} value={bloodGroup} onSelect={setBloodGroup} />
      <ScrollStringPickerModal visible={showHeightPicker} onClose={() => setShowHeightPicker(false)} title="Select Height (cm)" options={HEIGHT_OPTIONS} value={heightCm} onSelect={setHeightCm} />
      <ScrollStringPickerModal visible={showWeightPicker} onClose={() => setShowWeightPicker(false)} title="Select Weight (kg)" options={WEIGHT_OPTIONS} value={weightKg} onSelect={setWeightKg} />

      {/* Saving Overlay */}
      {saving && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center z-50">
          <Animated.View style={{ opacity: savingAnim, transform: [{ scale: savingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }] }}>
            <View className="bg-white rounded-[28px] px-10 py-8 items-center shadow-lg">
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#004D36" />
              <Text className="text-lg font-display-bold text-[#2D3A2F] mt-3">Saving...</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
