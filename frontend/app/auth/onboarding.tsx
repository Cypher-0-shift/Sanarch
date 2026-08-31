import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useProfileStore, Profile } from '../../store/profileStore';
import { createUser, createPatient } from '../../services/api';
import { getFirebaseToken } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';

import SanarchLogo from '../../components/shared/SanarchLogo';
import { FormField, SelectorField, ScrollStringPickerModal, DropdownModal, CalendarModal } from '../../components/shared/FormElements';
import { formatSanarchId } from '../../utils/sanarchId';

/* ─── Isolated Loading Step Component ────────────────────────────────────────────── */
/* Extracted to its own component so useSharedValue / useAnimatedStyle hooks
   only exist in the React tree when step === '4'. This prevents NativeWind's
   CSS interop from triggering an upgrade warning on the parent component
   (which crashes due to a bug in react-native-css-interop's stringify fn). */
function LoadingStep({
  loadingPhase,
}: {
  loadingPhase: number;
}) {
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
    height: '100%',
    backgroundColor: '#004D36',
    borderRadius: 9999,
  }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      false
    );
    progressWidth.value = withTiming(100, { duration: 2800, easing: Easing.linear });

    return () => {
      pulseScale.value = 1;
    };
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 48 }}>
      {/* Pulsing Logo */}
      <Animated.View style={[pulseStyle, { marginBottom: 32 }]}>
        <SanarchLogo size={80} />
      </Animated.View>

      {/* Phase Text */}
      <Animated.Text
        key={`phase-${loadingPhase}`}
        entering={FadeInUp.duration(350)}
        style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#2D3A2F', textAlign: 'center', marginBottom: 32 }}
      >
        {loadingPhase === 0 && 'Setting up your account...'}
        {loadingPhase === 1 && 'Generating your Sanarch ID...'}
        {loadingPhase === 2 && 'Almost ready...'}
      </Animated.Text>

      {/* Progress Bar */}
      <View style={{ width: 200, height: 4, backgroundColor: '#E5E2DE', borderRadius: 9999, overflow: 'hidden' }}>
        <Animated.View style={progressBarStyle} />
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; skipToStep2?: string; accountType?: string; dependentRelation?: string }>();
  const phoneFromLogin = params.phone || '';
  const initProfiles = useProfileStore((s) => s.initProfiles);

  const [step, setStep] = useState<'1' | '1b' | '2' | '3' | '3b' | '4' | '5'>(params.skipToStep2 === 'true' ? '2' : '1');
  const [accountType, setAccountType] = useState<'self' | 'patient' | null>((params.accountType as any) || null);

  // Smooth progress bar animation (uses RN core Animated, NOT reanimated)
  const progressAnim = useRef(new RNAnimated.Value(0.1)).current;
  useEffect(() => {
    const targets: Record<string, number> = {
      '1': 0.1, '1b': 0.2, '2': 0.4,
      '3': 0.55, '3b': 0.55, '4': 0.75, '5': 1.0
    };
    RNAnimated.timing(progressAnim, {
      toValue: targets[step] ?? 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountHolderPhone: phoneFromLogin,
    accountHolderEmail: '',
    accountHolderDob: '',
    accountHolderGender: '',
    accountHolderAddress: '',
    accountHolderCity: '',
    accountHolderState: '',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    dependentName: '',
    dependentDob: '',
    dependentGender: '',
    dependentRelation: '',
    dependentBloodGroup: '',
    dependentHeightCm: '',
    dependentWeightKg: '',
  });

  const [dependentRelation, setDependentRelation] = useState<'parent' | 'child' | 'spouse' | 'sibling' | 'elderly' | 'other' | null>((params.dependentRelation as any) || null);
  const [modalTarget, setModalTarget] = useState<'accountHolder' | 'dependent' | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGenderMenu, setShowGenderMenu] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);

  const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Other'];
  const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  const HEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => `${100 + i}`);
  const WEIGHT_OPTIONS = Array.from({ length: 181 }, (_, i) => `${20 + i}`);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [sanarchIdMain, setSanarchIdMain] = useState<string>('');
  const [sanarchIdDependent, setSanarchIdDependent] = useState<string | null>(null);

  // Helper function to parse DOB to ISO format
  const parseDobToISO = (dob: string): string => {
    // Accepts DD/MM/YYYY or DD / MM / YYYY
    const cleaned = dob.replace(/\s/g, '');
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return dob; // return as-is if format unknown
  };

  // Step 4 loading sequence — real API calls
  const runOnboarding = async () => {
    try {
      setLoadingPhase(0);

      // 1. Get Firebase token
      const firebaseToken = await getFirebaseToken();

      setLoadingPhase(1);

      // 2. Create main user account
      const userData = await createUser({
        firebase_token: firebaseToken,
        full_name: formData.accountHolderName.trim(),
        date_of_birth: formData.accountHolderDob
          ? parseDobToISO(formData.accountHolderDob)
          : undefined,
        height_cm: formData.heightCm || undefined,
        weight_kg: formData.weightKg || undefined,
        email: formData.accountHolderEmail || undefined,
      });

      // Get the backend access token now that the user is created
      const { default: apiClient } = await import('../../services/api');
      const { saveToken } = await import('../../services/storage');
      const verifyResponse = await apiClient.post('/auth/verify-firebase', {
        firebase_token: firebaseToken,
      });
      const accessToken = verifyResponse.data.access_token;
      
      await saveToken(accessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // 3. Save to auth store
      useAuthStore.getState().login(
        {
          id: userData.id,
          sanarch_id: userData.sanarch_id,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          email: userData.email,
          date_of_birth: userData.date_of_birth,
          height_cm: userData.height_cm,
          weight_kg: userData.weight_kg,
        },
        accessToken
      );

      setLoadingPhase(2);

      // 4. Build main Profile for profileStore
      const mainProfile: Profile = {
        id: userData.id,
        sanarchId: userData.sanarch_id,
        name: userData.full_name,
        relation: 'self' as const,
        isMainAccount: true,
        dob: formData.accountHolderDob,
        gender: formData.accountHolderGender,
        bloodGroup: formData.bloodGroup,
        heightCm: formData.heightCm,
        weightKg: formData.weightKg,
        phone: userData.phone_number,
        email: formData.accountHolderEmail,
        address: formData.accountHolderAddress,
        city: formData.accountHolderCity,
        state: formData.accountHolderState,
      };

      // 5. If patient/dependent path, create dependent profile
      let dependentProfile: Profile | undefined = undefined;
      if (accountType === 'patient' && formData.dependentName.trim()) {
        const patientData = await createPatient({
          name: formData.dependentName.trim(),
          relation: dependentRelation ?? 'other',
          date_of_birth: formData.dependentDob
            ? parseDobToISO(formData.dependentDob)
            : undefined,
          height_cm: formData.dependentHeightCm || undefined,
          weight_kg: formData.dependentWeightKg || undefined,
        });

        dependentProfile = {
          id: patientData.id,
          sanarchId: patientData.sanarch_id,
          name: patientData.name,
          relation: patientData.relation as any,
          isMainAccount: false,
          dob: formData.dependentDob,
          gender: formData.dependentGender,
          bloodGroup: formData.dependentBloodGroup,
          heightCm: formData.dependentHeightCm,
          weightKg: formData.dependentWeightKg,
        };
      }

      // 6. Init profile store
      useProfileStore.getState().initProfiles(mainProfile, dependentProfile);

      // 7. Set real Sanarch IDs in state for step '5' display
      setSanarchIdMain(userData.sanarch_id);
      if (dependentProfile) setSanarchIdDependent(dependentProfile.sanarchId);

      // 8. Advance to success step
      setStep('5');
    } catch (error: any) {
      console.error('[Onboarding] Failed:', error);
      // Go back to form with error
      setStep('2');
      useAlertStore.getState().showAlert(
        'Setup Failed',
        error?.response?.data?.detail ?? 'Could not create your account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    if (step !== '4') return;
    runOnboarding();
  }, [step]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step === '1') {
      if (!accountType) return;
      if (accountType === 'patient') {
        setStep('1b');
      } else {
        if (!phoneFromLogin) {
          router.push({ pathname: '/auth/login', params: { mode: 'signup', accountType } });
        } else {
          setStep('2');
        }
      }
    } else if (step === '1b') {
      if (!dependentRelation) {
        useAlertStore.getState().showAlert('Required', 'Please select a relationship.');
        return;
      }
      if (!phoneFromLogin) {
        router.push({ pathname: '/auth/login', params: { mode: 'signup', accountType, dependentRelation } });
      } else {
        setStep('2');
      }
    } else if (step === '2') {
      if (!formData.accountHolderName.trim() || !formData.accountHolderDob.trim() || !formData.accountHolderGender) {
        useAlertStore.getState().showAlert('Required', 'Please fill in all required fields.');
        return;
      }
      setStep(accountType === 'patient' ? '3b' : '3');
    } else if (step === '3') {
      setStep('4');
    } else if (step === '3b') {
      if (!formData.dependentName.trim() || !formData.dependentDob.trim() || !formData.dependentGender) {
        useAlertStore.getState().showAlert('Required', 'Please fill in all required fields.');
        return;
      }
      setStep('4');
    } else if (step === '5') {
      // Profiles already initialized by runOnboarding() in step '4'.
      // Just navigate to home.
      router.replace('/(tabs)/home');
    }
  };

  const handlePrev = () => {
    if (step === '1b') setStep('1');
    else if (step === '2') setStep(accountType === 'patient' ? '1b' : '1');
    else if (step === '3') setStep('2');
    else if (step === '3b') setStep('2');
    // No back navigation from steps '4' or '5'
  };

  const getProgress = () => {
    const progressMap: Record<string, string> = {
      '1': '10%',
      '1b': '20%',
      '2': '40%',
      '3': '55%',
      '3b': '55%',
      '4': '75%',
      '5': '100%',
    };
    return progressMap[step] || '0%';
  };

  const getDependentTitle = () => {
    switch (dependentRelation) {
      case 'child': return 'About your child';
      case 'parent': return 'About your parent';
      case 'spouse': return 'About your spouse / partner';
      case 'sibling': return 'About your sibling';
      case 'elderly': return 'About the person in your care';
      case 'other': return 'About your family member';
      default: return 'About your family member';
    }
  };

  const getDependentPillText = () => {
    switch (dependentRelation) {
      case 'child': return 'Managing: Child';
      case 'parent': return 'Managing: Parent';
      case 'spouse': return 'Managing: Spouse / Partner';
      case 'sibling': return 'Managing: Sibling';
      case 'elderly': return 'Managing: Elderly Care';
      case 'other': return 'Managing: Other';
      default: return 'Managing: Family Member';
    }
  };

  const getDependentRelationLabel = () => {
    switch (dependentRelation) {
      case 'child': return 'Child';
      case 'parent': return 'Parent';
      case 'spouse': return 'Spouse';
      case 'sibling': return 'Sibling';
      case 'elderly': return 'Elderly';
      case 'other': return 'Other';
      default: return 'Family Member';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center z-10 shrink-0">
          <View className="flex-row items-center gap-2">
            <SanarchLogo size={32} />
            <Text className="font-display-bold text-lg tracking-tight text-[#2D3A2F]">Sanarch</Text>
          </View>

          {/* Progress Bar */}
          <View className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
            <RNAnimated.View
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }),
                height: '100%',
                backgroundColor: '#004D36',
                borderRadius: 9999
              }}
            />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 120, flexGrow: 1 }}
        >
          {/* ─── STEP 1: Account Type ────────────────────────────────────────────────────────── */}
          {step === '1' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ flex: 1 }}>
              <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-8" style={{ maxWidth: 320 }}>
                Who are you setting up{'\u00A0'}for?
              </Text>

              <View className="flex-col gap-4">
                <TouchableOpacity
                  className={`w-full p-6 rounded-[24px] border-2 ${accountType === 'self' ? 'border-[#004D36] bg-[#E8F5E9]' : 'border-[#E5E2DE] bg-white'
                    }`}
                  activeOpacity={0.75}
                  onPress={() => setAccountType('self')}
                >
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mb-4 ${accountType === 'self' ? 'bg-[#004D36]' : 'bg-[#F5F3F0]'
                    }`}>
                    <MaterialCommunityIcons name="account-outline" size={24} color={accountType === 'self' ? 'white' : '#819685'} />
                  </View>
                  <Text className={`font-display-bold text-lg mb-1 ${accountType === 'self' ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>Personal Profile</Text>
                  <Text className="text-sm text-[#5C6E60] font-display leading-relaxed">
                    Manage your own health records and documents.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`w-full p-6 rounded-[24px] border-2 ${accountType === 'patient' ? 'border-[#004D36] bg-[#E8F5E9]' : 'border-[#E5E2DE] bg-white'
                    }`}
                  activeOpacity={0.75}
                  onPress={() => setAccountType('patient')}
                >
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mb-4 ${accountType === 'patient' ? 'bg-[#004D36]' : 'bg-[#F5F3F0]'
                    }`}>
                    <MaterialCommunityIcons name="account-group-outline" size={24} color={accountType === 'patient' ? 'white' : '#819685'} />
                  </View>
                  <Text className={`font-display-bold text-lg mb-1 ${accountType === 'patient' ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>Family Member</Text>
                  <Text className="text-sm text-[#5C6E60] font-display leading-relaxed">
                    Manage records for a family member via a linked profile you can easily switch{'\u00A0'}to.
                  </Text>
                </TouchableOpacity>

                {/* Info Strip */}
                <View className="flex-row items-center bg-[#E8F5E9] rounded-xl px-4 py-3 mt-2 gap-3">
                  <MaterialCommunityIcons name="information-outline" size={20} color="#004D36" />
                  <Text className="text-xs text-[#004D36] font-display-medium flex-1 leading-snug">
                    You can add more family profiles later from your profile.
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ─── STEP 1b: Dependent Relation (Patient only) ──────────────────────────────────── */}
          {step === '1b' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ flex: 1 }}>
              <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">Who are you managing records for?</Text>
              <Text className="text-[#5C6E60] font-display text-base mb-8">This helps us create the right kind of profile.</Text>

              <View className="flex-col gap-3">
                {[
                  { id: 'parent', icon: 'human-male-female', label: 'Parent', desc: 'Your mother or father' },
                  { id: 'child', icon: 'baby-face-outline', label: 'Child', desc: 'Your son or daughter' },
                  { id: 'spouse', icon: 'heart-outline', label: 'Spouse / Partner', desc: 'Your husband, wife or partner' },
                  { id: 'sibling', icon: 'account-multiple-outline', label: 'Sibling', desc: 'Your brother or sister' },
                  { id: 'elderly', icon: 'human-cane', label: 'Elderly care', desc: 'An elder in your care' },
                  { id: 'other', icon: 'account-question-outline', label: 'Other', desc: 'Someone else you manage' }
                ].map((opt) => {
                  const isSelected = dependentRelation === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      className={`w-full p-4 rounded-[20px] border-2 flex-row items-center gap-4 ${isSelected ? 'border-[#004D36] bg-[#E8F5E9]' : 'border-[#E5E2DE] bg-white'
                        }`}
                      activeOpacity={0.75}
                      onPress={() => setDependentRelation(opt.id as any)}
                    >
                      <View className={`w-11 h-11 rounded-xl items-center justify-center ${isSelected ? 'bg-[#004D36]' : 'bg-[#F5F3F0]'
                        }`}>
                        <MaterialCommunityIcons
                          name={opt.icon as any}
                          size={22}
                          color={isSelected ? 'white' : '#819685'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-display-bold text-base mb-0.5 ${isSelected ? 'text-[#004D36]' : 'text-[#2D3A2F]'}`}>{opt.label}</Text>
                        <Text className="text-xs text-[#5C6E60] font-display">{opt.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ─── STEP 2: Basic Information ─────────────────────────────────────────────────── */}
          {step === '2' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ flex: 1 }}>
              <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">Your details</Text>
              <Text className="text-[#5C6E60] font-display text-base mb-8">
                {accountType === 'self'
                  ? "Tell us about yourself. Only your name, date of birth and gender are required."
                  : "First, tell us about yourself — the account holder. We'll ask about your family member next."}
              </Text>

              <View className="flex-col gap-5">
                {/* 1. Full Name */}
                <FormField label="Full Name *" value={formData.accountHolderName} onChangeText={(v) => updateField('accountHolderName', v)} placeholder="John Doe" autoCapitalize="words" />

                {/* 2. Phone Number */}
                <FormField label="Phone Number *" value={`+91 ${formData.accountHolderPhone}`} locked lockReason="Verified" />

                {/* 3. Date of Birth */}
                <SelectorField label="Date of Birth *" value={formData.accountHolderDob} placeholder="DD / MM / YYYY" onPress={() => { setModalTarget('accountHolder'); setShowCalendar(true); }} />

                {/* 4. Gender */}
                <SelectorField label="Gender *" value={formData.accountHolderGender} placeholder="Select gender" onPress={() => { setModalTarget('accountHolder'); setShowGenderMenu(true); }} />

                {/* 5. Email Address */}
                <FormField label="Email Address (optional)" value={formData.accountHolderEmail} onChangeText={(v) => updateField('accountHolderEmail', v)} placeholder="john@example.com" keyboardType="email-address" />

                {/* 6. Address */}
                <View className="flex-col">
                  <FormField label="Address (optional)" value={formData.accountHolderAddress} onChangeText={(v) => updateField('accountHolderAddress', v)} placeholder="Full street address" />
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <FormField label="City" value={formData.accountHolderCity} onChangeText={(v) => updateField('accountHolderCity', v)} placeholder="City" />
                    </View>
                    <View className="flex-1">
                      <FormField label="State" value={formData.accountHolderState} onChangeText={(v) => updateField('accountHolderState', v)} placeholder="State" />
                    </View>
                  </View>
                </View>

                {/* Divider and Note */}
                <View className="h-[1px] bg-[#E2E8F0] mt-2 mb-1" />
                <Text className="text-[#819685] font-display text-xs ml-1 mb-6">Fields marked * are required</Text>

              </View>
            </Animated.View>
          )}

          {/* ─── STEP 3: Health Details (Self only) ────────────────────────────────────────── */}
          {step === '3' && accountType === 'self' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ flex: 1 }}>
              <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">Your health details</Text>
              <Text className="text-[#5C6E60] font-display text-base mb-4">Optional but helpful — this data gives context to your medical reports.</Text>

              {/* Tip Banner */}
              <View className="flex-row items-center bg-[#E8F5E9] rounded-[16px] p-3 mb-8 gap-3">
                <MaterialCommunityIcons name="information-outline" size={20} color="#004D36" />
                <Text className="text-sm text-[#004D36] font-display-medium flex-1 leading-snug">
                  You can always update these later from your profile settings.
                </Text>
              </View>

              <View className="flex-col">
                {/* 1. Blood Group */}
                <SelectorField label="Blood Group (optional)" value={formData.bloodGroup} placeholder="Select blood group" onPress={() => { setModalTarget('accountHolder'); setShowBloodGroupPicker(true); }} />

                {/* 2. Height & Weight */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <SelectorField label="Height (optional)" value={formData.heightCm ? `${formData.heightCm} cm` : ''} placeholder="Height" onPress={() => { setModalTarget('accountHolder'); setShowHeightPicker(true); }} />
                  </View>
                  <View className="flex-1">
                    <SelectorField label="Weight (optional)" value={formData.weightKg ? `${formData.weightKg} kg` : ''} placeholder="Weight" onPress={() => { setModalTarget('accountHolder'); setShowWeightPicker(true); }} />
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ─── STEP 3b: Dependent Details (Patient only) ─────────────────────────────────── */}
          {step === '3b' && accountType === 'patient' && (
            <Animated.View entering={FadeInUp.duration(400)} style={{ flex: 1 }}>
              <View className="self-start bg-[#E8F5E9] rounded-full px-3 py-1 mb-3 flex-row items-center gap-1.5">
                <MaterialCommunityIcons name="account-heart-outline" size={14} color="#004D36" />
                <Text className="text-[#004D36] text-xs font-display-bold uppercase tracking-widest">{getDependentPillText()}</Text>
              </View>

              <Text className="text-2xl font-display-bold text-[#2D3A2F] mb-2">{getDependentTitle()}</Text>
              <Text className="text-[#5C6E60] font-display text-base mb-8">This creates a separate health profile linked to your account.</Text>

              <View className="flex-col">
                {/* 1. Full Name */}
                <FormField label="Full Name *" value={formData.dependentName} onChangeText={(v) => updateField('dependentName', v)} placeholder="Full Name" autoCapitalize="words" />

                {/* 2. Date of Birth */}
                <SelectorField label="Date of Birth *" value={formData.dependentDob} placeholder="DD / MM / YYYY" onPress={() => { setModalTarget('dependent'); setShowCalendar(true); }} />

                {/* 3. Gender */}
                <SelectorField label="Gender *" value={formData.dependentGender} placeholder="Select gender" onPress={() => { setModalTarget('dependent'); setShowGenderMenu(true); }} />

                {/* 4. Blood Group */}
                <SelectorField label="Blood Group (optional)" value={formData.dependentBloodGroup} placeholder="Select blood group" onPress={() => { setModalTarget('dependent'); setShowBloodGroupPicker(true); }} />

                {/* 5 & 6. Height & Weight */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <SelectorField label="Height (optional)" value={formData.dependentHeightCm ? `${formData.dependentHeightCm} cm` : ''} placeholder="Height" onPress={() => { setModalTarget('dependent'); setShowHeightPicker(true); }} />
                  </View>
                  <View className="flex-1">
                    <SelectorField label="Weight (optional)" value={formData.dependentWeightKg ? `${formData.dependentWeightKg} kg` : ''} placeholder="Weight" onPress={() => { setModalTarget('dependent'); setShowWeightPicker(true); }} />
                  </View>
                </View>

                {/* Divider and Note */}
                <View className="h-[1px] bg-[#E2E8F0] mt-2 mb-1" />
                <Text className="text-[#819685] font-display text-xs ml-1 mb-6">Fields marked * are required</Text>
              </View>
            </Animated.View>
          )}

          {/* ─── STEP 4: Loading / Generating ─────────────────────────────────────────────── */}
          {step === '4' && (
            <LoadingStep loadingPhase={loadingPhase} />
          )}

          {/* ─── STEP 5: Success / ID Cards ───────────────────────────────────────────────── */}
          {step === '5' && (
            <Animated.View entering={FadeInUp.duration(600)} style={{ flex: 1 }}>
              {/* Main Profile Card */}
              <View
                className="bg-[#004D36] rounded-[28px] p-6 relative overflow-hidden"
                style={{ shadowColor: '#004D36', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}
              >
                {/* Decorative circle */}
                <View className="absolute -top-14 -right-14 w-28 h-28 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

                {/* Row 1: Brand + Verified */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <MaterialCommunityIcons name="shield-plus" size={18} color="white" />
                    </View>
                    <Text className="text-white font-display-bold text-sm tracking-tight">SANARCH</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full bg-[#66BB6A]" />
                    <Text className="text-white text-xs font-display-medium" style={{ opacity: 0.8 }}>Verified</Text>
                  </View>
                </View>

                {/* Row 2: Label + Name */}
                <View className="mb-6">
                  <Text className="text-[10px] font-display-bold uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Account Holder</Text>
                  <Text className="text-white text-lg font-display-bold">{formData.accountHolderName || 'User'}</Text>
                </View>

                {/* Row 3: ID + QR */}
                <View className="flex-row justify-between items-end">
                  <View className="flex-1 mr-4">
                    <Text className="text-[10px] font-display-bold uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Sanarch ID</Text>
                    <Text className="text-white font-mono text-sm font-bold tracking-wider">{formatSanarchId(sanarchIdMain)}</Text>
                  </View>
                  <View className="bg-white p-1 rounded-md">
                    <QRCode value={sanarchIdMain} size={42} backgroundColor="white" color="#004D36" />
                  </View>
                </View>
              </View>

              {/* Dependent Profile Card (patient path only) */}
              {accountType === 'patient' && sanarchIdDependent && (
                <>
                  <Text className="text-[#819685] text-xs font-display text-center my-4 px-4">
                    These profiles are linked. Switch between them from your home screen.
                  </Text>

                  <View
                    className="bg-white border-2 border-[#004D36] rounded-[28px] p-6 relative overflow-hidden"
                    style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
                  >
                    {/* Decorative circle */}
                    <View className="absolute -top-14 -right-14 w-28 h-28 rounded-full bg-[#E8F5E9]" />

                    {/* Row 1: Brand + Relation badge */}
                    <View className="flex-row items-center justify-between mb-6">
                      <View className="flex-row items-center gap-2.5">
                        <View className="w-8 h-8 bg-[#E8F5E9] rounded-lg items-center justify-center">
                          <MaterialCommunityIcons name="shield-plus" size={18} color="#004D36" />
                        </View>
                        <Text className="text-[#2D3A2F] font-display-bold text-sm tracking-tight">SANARCH</Text>
                      </View>
                      <View className="bg-[#E8F5E9] rounded-full px-2 py-0.5">
                        <Text className="text-[#004D36] text-xs font-display-bold">{getDependentRelationLabel()}</Text>
                      </View>
                    </View>

                    {/* Row 2: Label + Name */}
                    <View className="mb-6">
                      <Text className="text-[10px] font-display-bold uppercase tracking-[0.15em] text-[#819685] mb-1">{formData.dependentName ? `${formData.dependentName}'s Profile` : 'Family Member Profile'}</Text>
                      <Text className="text-[#2D3A2F] text-lg font-display-bold">{formData.dependentName || 'Family Member'}</Text>
                    </View>

                    {/* Row 3: ID + QR */}
                    <View className="flex-row justify-between items-end">
                      <View className="flex-1 mr-4">
                        <Text className="text-[10px] font-display-bold uppercase tracking-[0.15em] text-[#819685] mb-1">Sanarch ID</Text>
                        <Text className="text-[#004D36] font-mono text-sm font-bold tracking-wider">{formatSanarchId(sanarchIdDependent)}</Text>
                      </View>
                      <View className="bg-white p-1 rounded-md border border-[#004D36]">
                        <QRCode value={sanarchIdDependent} size={42} backgroundColor="white" color="#004D36" />
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Welcome Text */}
              <Text className="text-2xl font-display-bold text-[#2D3A2F] text-center mt-8">Welcome to Sanarch</Text>
              <Text className="text-[#5C6E60] font-display text-sm text-center mt-2 px-4 leading-relaxed">
                Your health identity is ready. Keep your Sanarch ID safe — doctors will use it to access your records.
              </Text>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Footer Navigation ──────────────────────────────────────────────────────────── */}
      {step !== '4' && !(step === '1' && !accountType) && !(step === '1b' && !dependentRelation) && (
        <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8, flexDirection: 'row', gap: 16, backgroundColor: '#F5F3F0' }}>
          {step !== '5' && step !== '1' && (
            <TouchableOpacity
              className="w-20 h-[58px] bg-white rounded-[24px] items-center justify-center border border-[#E2E8F0]"
              activeOpacity={0.75}
              onPress={handlePrev}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-1 h-[58px] bg-[#004D36] rounded-[24px] flex-row items-center justify-center shadow-sm"
            activeOpacity={0.75}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-display-bold text-base">
                  {step === '5' ? 'Go to Dashboard' : 'Continue'}
                </Text>
                {step !== '5' && <MaterialCommunityIcons name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* Modals */}
      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onConfirm={(date) => {
        const val = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        if (modalTarget === 'accountHolder') updateField('accountHolderDob', val);
        else if (modalTarget === 'dependent') updateField('dependentDob', val);
      }} />
      <DropdownModal visible={showGenderMenu} onClose={() => setShowGenderMenu(false)} title="Select Gender" options={GENDER_OPTIONS} value={modalTarget === 'accountHolder' ? formData.accountHolderGender : formData.dependentGender} onSelect={(val) => {
        if (modalTarget === 'accountHolder') updateField('accountHolderGender', val);
        else if (modalTarget === 'dependent') updateField('dependentGender', val);
      }} />
      <ScrollStringPickerModal visible={showBloodGroupPicker} onClose={() => setShowBloodGroupPicker(false)} title="Select Blood Group" options={BLOOD_GROUP_OPTIONS} value={modalTarget === 'accountHolder' ? formData.bloodGroup : formData.dependentBloodGroup} onSelect={(val) => {
        if (modalTarget === 'accountHolder') updateField('bloodGroup', val);
        else if (modalTarget === 'dependent') updateField('dependentBloodGroup', val);
      }} />
      <ScrollStringPickerModal visible={showHeightPicker} onClose={() => setShowHeightPicker(false)} title="Select Height (cm)" options={HEIGHT_OPTIONS} value={modalTarget === 'accountHolder' ? formData.heightCm : formData.dependentHeightCm} onSelect={(val) => {
        if (modalTarget === 'accountHolder') updateField('heightCm', val);
        else if (modalTarget === 'dependent') updateField('dependentHeightCm', val);
      }} />
      <ScrollStringPickerModal visible={showWeightPicker} onClose={() => setShowWeightPicker(false)} title="Select Weight (kg)" options={WEIGHT_OPTIONS} value={modalTarget === 'accountHolder' ? formData.weightKg : formData.dependentWeightKg} onSelect={(val) => {
        if (modalTarget === 'accountHolder') updateField('weightKg', val);
        else if (modalTarget === 'dependent') updateField('dependentWeightKg', val);
      }} />

    </SafeAreaView>
  );
}
