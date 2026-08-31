// NOTE: Requires dev build. Run: npx expo run:android or run:ios

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  Modal, FlatList, StyleSheet, ActivityIndicator, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import OTPInput from '../../components/ui/OTPInput';
import { useAuthStore } from '../../store/authStore';
import SanarchLogo from '../../components/shared/SanarchLogo';
import { LEGAL_URLS, LEGAL_VERSIONS } from '../../constants/legal';
import { useAlertStore } from '../../store/alertStore';
import { sendOTP, verifyOTP } from '../../services/auth';
import { saveConsentRecord } from '../../services/storage';
import apiClient from '../../services/api';

import { ALL_COUNTRIES, CountryCodeItem } from '../../constants/countries';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; accountType?: string; dependentRelation?: string }>();
  const [isSignUp, setIsSignUp] = useState(params.mode === 'signup');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(ALL_COUNTRIES[0]); // Default to India (+91)
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCountries = ALL_COUNTRIES.filter((item) =>
    item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery)
  );

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned.slice(0, selectedCountry.maxLength));
  };

  const isPhoneValid = selectedCountry.code === '+91'
    ? phone.length === 10
    : phone.length >= 6 && phone.length <= selectedCountry.maxLength;

  const handleContinue = async () => {
    if (step === 'phone') {
      if (!isPhoneValid) {
        useAlertStore.getState().showAlert(
          'Invalid Mobile Number',
          selectedCountry.code === '+91'
            ? 'Please enter a valid 10-digit mobile number.'
            : `Please enter a valid ${selectedCountry.maxLength}-digit mobile number for ${selectedCountry.country}.`
        );
        return;
      }
      if (!agreed) {
        useAlertStore.getState().showAlert(
          'Consent Required',
          'Please accept the Terms, Privacy Policy, and health records processing consent to continue.'
        );
        return;
      }

      // Instantly transition to OTP screen without blocking UI
      const fullPhone = `${selectedCountry.code}${phone}`;
      setOtp('');
      setErrorMsg(null);
      setStep('otp');

      // Save consent record and dispatch OTP in the background
      saveConsentRecord({
        timestamp: new Date().toISOString(),
        termsVersion: LEGAL_VERSIONS.TERMS_VERSION,
        privacyVersion: LEGAL_VERSIONS.PRIVACY_POLICY_VERSION,
        action: 'agreed_terms_privacy_and_health_data_processing',
        identifier: fullPhone,
      }).catch((err) => console.warn('Consent save record:', err));

      sendOTP(fullPhone).catch((error: any) => {
        setErrorMsg(error.message ?? 'Failed to send OTP. Please tap Resend.');
      });
    } else {
      // OTP verification step
      if (otp.length < 6) {
        useAlertStore.getState().showAlert('Enter OTP', 'Please enter the 6-digit verification code.');
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);
      try {
        const { is_new_user, access_token } = await verifyOTP(otp);

        if (is_new_user) {
          router.replace({
            pathname: '/auth/onboarding',
            params: { 
              phone: `${selectedCountry.code}${phone}`,
              accountType: params.accountType,
              dependentRelation: params.dependentRelation,
              skipToStep2: 'true'
            }
          });
        } else {
          // Fetch user profile from backend
          const userData = await apiClient.get('/users/me');
          useAuthStore.getState().login(userData.data, access_token!);
          router.replace('/(tabs)/home');
        }
      } catch (error: any) {
        setErrorMsg(error.message ?? 'Verification failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canContinue = step === 'phone'
    ? isPhoneValid && agreed
    : otp.length === 6;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#004D36' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

        {/* TOP HERO ZONE */}
        <View style={styles.heroZone}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoContainer}>
              <SanarchLogo size={42} />
            </View>
            <Text style={styles.brandName}>SANARCH</Text>
            <Text style={styles.tagline}>Your health, your records.</Text>
          </View>
        </View>

        {/* BOTTOM FORM CARD */}
        <Animated.View
          key={step}
          entering={FadeInUp.duration(400).springify()}
          style={styles.formCard}
        >
          <ScrollView
            scrollEnabled={true}
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {step === 'phone' ? (
              // PHONE STEP
              <View style={styles.stepContainer}>
                <Text style={styles.heading}>
                  {isSignUp ? 'Create account' : 'Welcome back'}
                </Text>
                <Text style={styles.subheading}>
                  {isSignUp
                    ? 'Enter your mobile number to get started.'
                    : 'Enter your mobile number to continue.'}
                </Text>

                {/* Phone Input Group */}
                <View style={[
                  styles.phoneInputContainer,
                  phone.length > 0 && styles.phoneInputContainerActive
                ]}>
                  {/* Selectable Country Code Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setShowCountryPicker(true);
                    }}
                    activeOpacity={0.75}
                    style={styles.countryCodeSection}
                  >
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={15} color="#004D36" />
                  </TouchableOpacity>

                  {/* Phone Input with concise non-overflowing placeholder */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Mobile number"
                    placeholderTextColor="#9EAFA3"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    maxLength={selectedCountry.maxLength}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>

                {/* Inline Helper Row (Character count) */}
                <View style={styles.inputHelperRow}>
                  <View style={{ flex: 1 }} />
                  {phone.length > 0 && (
                    <Text style={[
                      styles.charCount,
                      phone.length === selectedCountry.maxLength && styles.charCountComplete
                    ]}>
                      {phone.length}/{selectedCountry.maxLength}
                    </Text>
                  )}
                </View>

                {/* Single Combined Consent Checkbox (DPDP & Play Policy Compliant) */}
                <View style={styles.consentContainer}>
                  <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.75}
                    style={styles.consentRow}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agreed }}
                    accessibilityLabel="I agree to the Terms, Privacy Policy, and consent to Sanarch processing my health records."
                  >
                    <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                      {agreed && (
                        <MaterialCommunityIcons name="check" size={14} color="white" />
                      )}
                    </View>
                    <Text style={styles.consentText}>
                      I agree to the{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL(LEGAL_URLS.TERMS_AND_CONDITIONS)}
                      >
                        Terms
                      </Text>
                      ,{' '}
                      <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY_POLICY)}
                      >
                        Privacy Policy
                      </Text>
                      , and consent to Sanarch processing my health records.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {errorMsg && (
                  <Text style={styles.errorMessage}>{errorMsg}</Text>
                )}

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.85}
                  disabled={isLoading}
                  style={[styles.continueButton, canContinue && !isLoading && styles.continueButtonActive]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={canContinue ? 'white' : '#819685'} />
                  ) : (
                    <Text style={[styles.continueButtonText, canContinue && styles.continueButtonTextActive]}>
                      Continue
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Auth Mode Toggle (Login vs Create Account) */}
                <View style={styles.authToggleContainer}>
                  <Text style={styles.authToggleText}>
                    {isSignUp ? 'Already have an account?' : 'New to Sanarch?'}{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (!isSignUp) {
                        router.push('/auth/onboarding');
                      } else {
                        setIsSignUp(false);
                      }
                      setErrorMsg(null);
                    }}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.authToggleLink}>
                      {isSignUp ? 'Sign In' : 'Create account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // OTP STEP
              <View style={styles.stepContainer}>
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => setStep('phone')}
                  activeOpacity={0.75}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#004D36" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.heading}>
                  Verify your number
                </Text>
                <Text style={styles.subheading}>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.phoneHighlight}>
                    {selectedCountry.code} {phone}
                  </Text>
                </Text>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  <OTPInput value={otp} onChange={setOtp} length={6} />
                </View>

                {/* Error Message */}
                {errorMsg && (
                  <Text style={styles.errorMessage}>{errorMsg}</Text>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.85}
                  disabled={!canContinue || isLoading}
                  style={[styles.continueButton, canContinue && !isLoading && styles.continueButtonActive]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={canContinue ? 'white' : '#819685'} />
                  ) : (
                    <Text style={[styles.continueButtonText, canContinue && styles.continueButtonTextActive]}>
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code?</Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={async () => {
                      try {
                        await sendOTP(`${selectedCountry.code}${phone}`);
                        useAlertStore.getState().showAlert('OTP Sent', `A new code has been sent to ${selectedCountry.code} ${phone}`);
                      } catch (error: any) {
                        useAlertStore.getState().showAlert('Error', error.message ?? 'Failed to resend OTP');
                      }
                    }}
                  >
                    <Text style={styles.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCountryPicker(false)}
          />
          <View style={styles.countryPickerModal}>
            {/* Modal Drag Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.countryPickerHeader}>
              <Text style={styles.countryPickerTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                activeOpacity={0.75}
                style={styles.countryPickerClose}
              >
                <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#819685" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code"
                placeholderTextColor="#9EAFA3"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.code}-${item.country}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 36 }}
              renderItem={({ item }) => {
                const isSelected = selectedCountry.code === item.code && selectedCountry.country === item.country;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCountry(item);
                      setPhone('');
                      setShowCountryPicker(false);
                    }}
                    activeOpacity={0.75}
                    style={[
                      styles.countryItem,
                      isSelected && styles.countryItemSelected
                    ]}
                  >
                    <Text style={styles.countryItemFlag}>{item.flag}</Text>
                    <View style={styles.countryItemInfo}>
                      <Text style={styles.countryItemName}>{item.country}</Text>
                      <Text style={styles.countryItemCode}>{item.code}</Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={22} color="#004D36" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Hero Zone — compact and responsive to keyboard
  heroZone: {
    backgroundColor: '#004D36',
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 24,
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoArea: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'white',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: 'white',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  brandName: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.4,
  },

  // Form Card
  formCard: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -16,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  stepContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#718575',
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 320,
  },
  phoneHighlight: {
    color: '#004D36',
    fontFamily: 'Inter_700Bold',
  },

  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E2DE',
    overflow: 'hidden',
    minHeight: 54,
  },
  phoneInputContainerActive: {
    borderColor: '#004D36',
  },
  countryCodeSection: {
    paddingLeft: 12,
    paddingRight: 10,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: '#E5E2DE',
    backgroundColor: 'rgba(0,77,54,0.03)',
    flexShrink: 0,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginHorizontal: 2,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#2D3A2F',
  },
  inputHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    minHeight: 18,
  },
  inlineWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#D97706',
    fontFamily: 'Inter_500Medium',
    marginRight: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#819685',
    fontFamily: 'Inter_600SemiBold',
  },
  charCountComplete: {
    color: '#004D36',
  },

  // Consent Container
  consentContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 44,
    paddingVertical: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginTop: 2,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#C8D5CA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#004D36',
    borderWidth: 0,
  },
  consentText: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 13,
    color: '#5C6E60',
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  termsLink: {
    color: '#004D36',
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },

  // Error Message
  errorMessage: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 10,
  },

  // Continue Button
  continueButton: {
    minHeight: 54,
    borderRadius: 27,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E2DE',
  },
  continueButtonActive: {
    backgroundColor: '#004D36',
    shadowColor: '#004D36',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#819685',
  },
  continueButtonTextActive: {
    color: 'white',
  },

  // OTP Step
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 13,
    color: '#004D36',
    fontFamily: 'Inter_600SemiBold',
  },
  otpContainer: {
    marginBottom: 24,
  },
  resendContainer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: 13,
    color: '#819685',
    fontFamily: 'Inter_400Regular',
  },
  resendLink: {
    fontSize: 13,
    color: '#004D36',
    fontFamily: 'Inter_700Bold',
  },

  // Country Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  countryPickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E2DE',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  countryPickerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryPickerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
  },
  countryPickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 14,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D3A2F',
    height: '100%',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  countryItemSelected: {
    backgroundColor: '#F0F7F4',
    borderLeftWidth: 4,
    borderLeftColor: '#004D36',
  },
  countryItemFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
  },
  countryItemCode: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    marginTop: 2,
  },

  // Auth Mode Toggle Footer
  authToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 4,
  },
  authToggleText: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
  },
  authToggleLink: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: '#004D36',
  },
});
