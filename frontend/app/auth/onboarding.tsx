import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomSheet from '../../components/ui/BottomSheet';

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'self' | 'patient' | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    heightCm: '',
    weightKg: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [sanarchId] = useState('SAN-' + Math.floor(100000 + Math.random() * 900000));

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate API
    setLoading(false);
    setSuccessVisible(true);
  };

  const isStep2Disabled = !formData.fullName.trim() || !formData.dob.trim();

  // ─── STEP 1 ───────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#143832" />
          </TouchableOpacity>
          <Text className="text-lg font-display-bold text-primary">Set Up Your Account</Text>
          <Text className="text-xs font-display-medium text-slate-400">Step 1 of 2</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-display-bold text-slate-900 mb-2">
            Who are you setting up for?
          </Text>
          <Text className="text-sm font-display text-slate-500 mb-8">
            You can add more profiles later from your account.
          </Text>

          {/* Card 1 — For Myself */}
          <TouchableOpacity
            className={`w-full p-6 rounded-xl border-2 mb-4 ${
              accountType === 'self'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 bg-white'
            }`}
            activeOpacity={0.7}
            onPress={() => setAccountType('self')}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={48}
              color="#143832"
              style={{ marginBottom: 12 }}
            />
            <Text className="text-lg font-display-bold text-slate-900 mb-1">For Myself</Text>
            <Text className="text-sm font-display text-slate-500 leading-relaxed">
              Set up your personal health profile with your own Sanarch ID.
            </Text>
          </TouchableOpacity>

          {/* Card 2 — For a Patient */}
          <TouchableOpacity
            className={`w-full p-6 rounded-xl border-2 mb-4 ${
              accountType === 'patient'
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 bg-white'
            }`}
            activeOpacity={0.7}
            onPress={() => setAccountType('patient')}
          >
            <MaterialCommunityIcons
              name="account-heart-outline"
              size={48}
              color="#143832"
              style={{ marginBottom: 12 }}
            />
            <Text className="text-lg font-display-bold text-slate-900 mb-1">For a Patient</Text>
            <Text className="text-sm font-display text-slate-500 leading-relaxed">
              Create a patient profile linked to your account. Great for managing family records.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Continue Button — Fixed at bottom */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white border-t border-slate-100">
          <TouchableOpacity
            className="w-full h-14 bg-primary rounded-full items-center justify-center"
            style={!accountType ? { opacity: 0.5 } : undefined}
            disabled={!accountType}
            onPress={() => setStep(2)}
            activeOpacity={0.7}
          >
            <Text className="text-white font-display-bold text-base">Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 2 ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
        <TouchableOpacity onPress={() => setStep(1)}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#143832" />
        </TouchableOpacity>
        <Text className="text-lg font-display-bold text-primary">
          {accountType === 'self' ? 'Your Details' : 'Patient Details'}
        </Text>
        <Text className="text-xs text-slate-400 font-display">Step 2 of 2</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Photo */}
        <TouchableOpacity
          className="items-center mb-6"
          onPress={() =>
            Alert.alert('Coming Soon', 'Photo upload will be available after account creation.')
          }
        >
          <View className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 items-center justify-center mb-2">
            <MaterialCommunityIcons name="account-circle" size={40} color="#143832" style={{ opacity: 0.5 }} />
          </View>
          <Text className="text-sm text-primary font-display-medium">Add Photo (Optional)</Text>
        </TouchableOpacity>

        {/* Full Name */}
        <View className="mb-4">
          <Text className="text-sm font-display-semibold text-primary mb-2">Full Name *</Text>
          <TextInput
            className="h-14 border border-slate-200 rounded-xl px-4 font-display text-slate-900 text-base"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
            value={formData.fullName}
            onChangeText={(v) => updateField('fullName', v)}
          />
        </View>

        {/* Date of Birth */}
        <View className="mb-4">
          <Text className="text-sm font-display-semibold text-primary mb-2">Date of Birth *</Text>
          <TextInput
            className="h-14 border border-slate-200 rounded-xl px-4 font-display text-slate-900 text-base"
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.dob}
            onChangeText={(v) => updateField('dob', v)}
          />
        </View>

        {/* Height */}
        <View className="mb-4">
          <Text className="text-sm font-display-semibold text-primary mb-2">Height (cm)</Text>
          <TextInput
            className="h-14 border border-slate-200 rounded-xl px-4 font-display text-slate-900 text-base"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.heightCm}
            onChangeText={(v) => updateField('heightCm', v)}
          />
        </View>

        {/* Weight */}
        <View className="mb-4">
          <Text className="text-sm font-display-semibold text-primary mb-2">Weight (kg)</Text>
          <TextInput
            className="h-14 border border-slate-200 rounded-xl px-4 font-display text-slate-900 text-base"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.weightKg}
            onChangeText={(v) => updateField('weightKg', v)}
          />
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-display-semibold text-primary mb-2">Email Address</Text>
          <TextInput
            className="h-14 border border-slate-200 rounded-xl px-4 font-display text-slate-900 text-base"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
          />
        </View>
      </ScrollView>

      {/* Create Account Button — Fixed at bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white border-t border-slate-100">
        <TouchableOpacity
          className="h-14 bg-primary rounded-full items-center justify-center"
          disabled={isStep2Disabled}
          style={isStep2Disabled ? { opacity: 0.5 } : undefined}
          onPress={handleCreateAccount}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-display-bold">Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Success Modal ────────────────────────────────────────────────────── */}
      <BottomSheet
        visible={successVisible}
        onClose={() => router.replace('/(tabs)/home')}
        title="Account Created!"
        snapHeight={480}
      >
        <View className="items-center text-center">
          <View className="h-16 w-16 rounded-full bg-green-100 items-center justify-center mb-4 self-center">
            <MaterialCommunityIcons name="check-circle" size={40} color="#166534" />
          </View>
          <Text className="text-sm text-slate-500 font-display mt-2">Your Sanarch ID</Text>
          <Text className="text-2xl font-display-bold text-primary tracking-widest mt-1">
            {sanarchId}
          </Text>
          <Text className="text-sm text-slate-500 font-display text-center mt-2 mb-6">
            Save this ID — it's your unique medical identity across all hospitals.
          </Text>

          <TouchableOpacity
            className="h-14 bg-primary rounded-full items-center justify-center w-full"
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text className="text-white font-display-bold">Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
