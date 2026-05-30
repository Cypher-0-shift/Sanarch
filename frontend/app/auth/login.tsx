// NOTE: Requires dev build. Run: npx expo run:android or run:ios

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  Modal, FlatList, StyleSheet, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import OTPInput from '../../components/ui/OTPInput';
import { useAuthStore } from '../../store/authStore';
import SanarchLogo from '../../components/shared/SanarchLogo';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../../constants/legal';
import { useAlertStore } from '../../store/alertStore';
import { sendOTP, verifyOTP, getFirebaseToken } from '../../services/auth';
import apiClient from '../../services/api';

// Country codes data
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', maxLength: 10 },
  { code: '+1', country: 'United States', flag: '🇺🇸', maxLength: 10 },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', maxLength: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', maxLength: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', maxLength: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', maxLength: 11 },
  { code: '+33', country: 'France', flag: '🇫🇷', maxLength: 9 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', maxLength: 11 },
  { code: '+39', country: 'Italy', flag: '🇮🇹', maxLength: 10 },
  { code: '+34', country: 'Spain', flag: '🇪🇸', maxLength: 9 },
  { code: '+7', country: 'Russia', flag: '🇷🇺', maxLength: 10 },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', maxLength: 11 },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', maxLength: 10 },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', maxLength: 9 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', maxLength: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', maxLength: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', maxLength: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', maxLength: 10 },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', maxLength: 11 },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', maxLength: 10 },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', maxLength: 9 },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', maxLength: 10 },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', maxLength: 10 },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', maxLength: 10 },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', maxLength: 10 },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', maxLength: 9 },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', maxLength: 10 },
];

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default to India
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showMandatoryLegal, setShowMandatoryLegal] = useState(true); // Show on first load
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
  }>({ visible: false, title: '', content: '' });

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned.slice(0, selectedCountry.maxLength));
  };

  const handleContinue = async () => {
    if (step === 'phone') {
      if (phone.length < 8 || phone.length > selectedCountry.maxLength) {
        useAlertStore.getState().showAlert('Invalid Number', `Please enter a valid ${selectedCountry.maxLength}-digit mobile number for ${selectedCountry.country}.`);
        return;
      }
      if (!agreed) {
        useAlertStore.getState().showAlert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);
      try {
        await sendOTP(`${selectedCountry.code}${phone}`);
        setStep('otp');
      } catch (error: any) {
        setErrorMsg(error.message ?? 'Failed to send OTP.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // OTP verification step
      if (otp.length < 6) {
        useAlertStore.getState().showAlert('Enter OTP', 'Please enter the 6-digit verification code.');
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);
      try {
        const { is_new_user } = await verifyOTP(otp);
        
        if (is_new_user) {
          router.replace({
            pathname: '/auth/onboarding',
            params: { phone: `${selectedCountry.code}${phone}` }
          });
        } else {
          // Fetch user profile from backend
          const userData = await apiClient.get('/users/me');
          useAuthStore.getState().login(userData.data, await getFirebaseToken());
          router.replace('/(tabs)/home');
        }
      } catch (error: any) {
        setErrorMsg(error.message ?? 'Verification failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { saveToken } = await import('../../services/storage');
      await saveToken('dev-mode-token');
      useAuthStore.getState().setToken('dev-mode-token');
      
      // Mock user data for offline dev mode
      const userData = {
        id: 'dev-user-id',
        sanarch_id: 'SANARCH-DEV-123',
        full_name: 'Developer User',
        phone_number: '+919999999999',
        email: 'dev@sanarch.io',
        role: 'user',
        created_at: new Date().toISOString(),
      };
      
      useAuthStore.getState().login(userData, 'dev-mode-token');
      
      const { useProfileStore } = await import('../../store/profileStore');
      useProfileStore.getState().initProfiles(
        {
          id: userData.id,
          sanarchId: userData.sanarch_id,
          name: userData.full_name,
          relation: 'self',
          isMainAccount: true,
          phone: userData.phone_number,
        },
        undefined
      );
      
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Dev Login failed:', err);
      setErrorMsg('Dev login failed.');
      useAuthStore.getState().setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptLegal = () => {
    if (hasReadTerms && hasReadPrivacy) {
      setAgreed(true);
      setShowMandatoryLegal(false);
    } else {
      useAlertStore.getState().showAlert(
        'Read Required Documents',
        'Please read both Terms of Service and Privacy Policy before accepting.'
      );
    }
  };

  const canContinue = step === 'phone'
    ? phone.length >= 8 && phone.length <= selectedCountry.maxLength && agreed
    : otp.length === 6;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#004D36' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* TOP HERO ZONE */}
        <View style={styles.heroZone}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoContainer}>
              <SanarchLogo size={48} />
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
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            
            {step === 'phone' ? (
              // PHONE STEP
              <View>
                <Text style={styles.heading}>Welcome back</Text>
                <Text style={styles.subheading}>
                  Enter your mobile number to access your health records securely.
                </Text>

                {/* Phone Input Group */}
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <View style={[
                  styles.phoneInputContainer,
                  phone.length > 0 && styles.phoneInputContainerActive
                ]}>
                  {/* Country Code Section */}
                  <TouchableOpacity
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.75}
                    style={styles.countryCodeSection}
                  >
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color="#004D36" />
                  </TouchableOpacity>

                  {/* Phone Input */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={`${selectedCountry.maxLength}-digit number`}
                    placeholderTextColor="#C8D5CA"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    maxLength={selectedCountry.maxLength}
                  />
                </View>

                {/* Character count */}
                {phone.length > 0 && (
                  <View style={styles.charCountContainer}>
                    <Text style={[
                      styles.charCount,
                      phone.length === selectedCountry.maxLength && styles.charCountComplete
                    ]}>
                      {phone.length}/{selectedCountry.maxLength}
                    </Text>
                  </View>
                )}

                {/* Terms Checkbox */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.75}
                    style={[styles.checkbox, agreed && styles.checkboxChecked]}
                  >
                    {agreed && (
                      <MaterialCommunityIcons name="check" size={14} color="white" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I have read and agree to the{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setLegalModal({ 
                        visible: true, 
                        title: 'Terms of Service', 
                        content: TERMS_OF_SERVICE 
                      })}
                    >
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setLegalModal({ 
                        visible: true, 
                        title: 'Privacy Policy', 
                        content: PRIVACY_POLICY 
                      })}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>

                {/* Error Message */}
                {errorMsg && (
                  <Text style={styles.errorMessage}>{errorMsg}</Text>
                )}

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.85}
                  disabled={!canContinue || isLoading}
                  style={[styles.continueButton, canContinue && !isLoading && styles.continueButtonActive]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={canContinue ? 'white' : '#819685'} />
                  ) : (
                    <>
                      <Text style={[styles.continueButtonText, canContinue && styles.continueButtonTextActive]}>
                        Continue
                      </Text>
                      <View style={[styles.arrowCircle, canContinue && styles.arrowCircleActive]}>
                        <MaterialCommunityIcons 
                          name="arrow-right" 
                          size={18} 
                          color={canContinue ? 'white' : '#819685'} 
                        />
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                {/* Dev Buttons */}
                <View style={styles.devButtonsContainer}>
                  <TouchableOpacity onPress={handleDevLogin} activeOpacity={0.75}>
                    <Text style={styles.devButtonText}>Developer Mode</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    activeOpacity={0.75} 
                    onPress={() => {
                      const simulatedPhone = phone.length >= 8 ? phone : '9999999999';
                      router.replace({
                        pathname: '/auth/onboarding',
                        params: { phone: `${selectedCountry.code}${simulatedPhone}` }
                      });
                    }}
                  >
                    <Text style={styles.devButtonText}>New User (Dev)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // OTP STEP
              <View>
                {/* Back Button */}
                <TouchableOpacity 
                  onPress={() => setStep('phone')}
                  activeOpacity={0.75}
                  style={styles.backButton}
                >
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#004D36" />
                  <Text style={styles.backButtonText}>Change number</Text>
                </TouchableOpacity>

                <Text style={styles.heading}>Verify your number</Text>
                <Text style={styles.subheading}>
                  Enter the 6-digit code sent to{' '}
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
                    <>
                      <Text style={[styles.continueButtonText, canContinue && styles.continueButtonTextActive]}>
                        Verify & Sign In
                      </Text>
                      <View style={[styles.arrowCircle, canContinue && styles.arrowCircleActive]}>
                        <MaterialCommunityIcons 
                          name="arrow-right" 
                          size={18} 
                          color={canContinue ? 'white' : '#819685'} 
                        />
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code?</Text>
                  <TouchableOpacity 
                    activeOpacity={0.75}
                    disabled={isLoading}
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
          <View style={styles.countryPickerModal}>
            {/* Handle bar */}
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

            {/* Country List */}
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCountry(item);
                    setPhone('');
                    setShowCountryPicker(false);
                  }}
                  activeOpacity={0.75}
                  style={[
                    styles.countryItem,
                    selectedCountry.code === item.code && styles.countryItemSelected
                  ]}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={styles.countryItemName}>{item.country}</Text>
                    <Text style={styles.countryItemCode}>{item.code}</Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <MaterialCommunityIcons name="check-circle" size={22} color="#004D36" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Mandatory Legal Agreement Modal */}
      <Modal
        visible={showMandatoryLegal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          // Prevent closing without accepting
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3F0' }} edges={['top']}>
          <View style={styles.mandatoryLegalHeader}>
            <View style={styles.mandatoryLegalIconContainer}>
              <MaterialCommunityIcons name="shield-check" size={32} color="#004D36" />
            </View>
            <Text style={styles.mandatoryLegalTitle}>Welcome to Sanarch</Text>
            <Text style={styles.mandatoryLegalSubtitle}>
              Please review and accept our terms to continue
            </Text>
          </View>

          <ScrollView 
            style={{ flex: 1, paddingHorizontal: 24 }} 
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Terms of Service Card */}
            <TouchableOpacity
              onPress={() => {
                setLegalModal({
                  visible: true,
                  title: 'Terms of Service',
                  content: TERMS_OF_SERVICE
                });
              }}
              activeOpacity={0.75}
              style={styles.legalDocCard}
            >
              <View style={styles.legalDocIconContainer}>
                <MaterialCommunityIcons 
                  name="file-document-outline" 
                  size={24} 
                  color="#004D36" 
                />
              </View>
              <View style={styles.legalDocInfo}>
                <Text style={styles.legalDocTitle}>Terms of Service</Text>
                <Text style={styles.legalDocSubtitle}>
                  {hasReadTerms ? 'Read ✓' : 'Tap to read'}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={hasReadTerms ? "check-circle" : "chevron-right"} 
                size={24} 
                color={hasReadTerms ? "#004D36" : "#C8D5CA"} 
              />
            </TouchableOpacity>

            {/* Privacy Policy Card */}
            <TouchableOpacity
              onPress={() => {
                setLegalModal({
                  visible: true,
                  title: 'Privacy Policy',
                  content: PRIVACY_POLICY
                });
              }}
              activeOpacity={0.75}
              style={styles.legalDocCard}
            >
              <View style={styles.legalDocIconContainer}>
                <MaterialCommunityIcons 
                  name="lock-outline" 
                  size={24} 
                  color="#004D36" 
                />
              </View>
              <View style={styles.legalDocInfo}>
                <Text style={styles.legalDocTitle}>Privacy Policy</Text>
                <Text style={styles.legalDocSubtitle}>
                  {hasReadPrivacy ? 'Read ✓' : 'Tap to read'}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={hasReadPrivacy ? "check-circle" : "chevron-right"} 
                size={24} 
                color={hasReadPrivacy ? "#004D36" : "#C8D5CA"} 
              />
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.legalInfoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#004D36" />
              <Text style={styles.legalInfoText}>
                By accepting, you agree to our terms and acknowledge that you have read our privacy policy.
              </Text>
            </View>
          </ScrollView>

          {/* Accept Button */}
          <View style={styles.mandatoryLegalFooter}>
            <TouchableOpacity
              onPress={handleAcceptLegal}
              activeOpacity={0.85}
              disabled={!hasReadTerms || !hasReadPrivacy}
              style={[
                styles.acceptButton,
                (hasReadTerms && hasReadPrivacy) && styles.acceptButtonActive
              ]}
            >
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color={(hasReadTerms && hasReadPrivacy) ? 'white' : '#819685'} 
              />
              <Text style={[
                styles.acceptButtonText,
                (hasReadTerms && hasReadPrivacy) && styles.acceptButtonTextActive
              ]}>
                I Accept
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Legal Modals */}
      <Modal 
        visible={legalModal.visible} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setLegalModal(p => ({ ...p, visible: false }))}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3F0' }} edges={['top', 'bottom']}>
          <View style={styles.legalModalHeader}>
            <Text style={styles.legalModalTitle}>{legalModal.title}</Text>
            <TouchableOpacity
              onPress={() => setLegalModal(p => ({ ...p, visible: false }))}
              activeOpacity={0.75}
              style={styles.legalModalClose}
            >
              <MaterialCommunityIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }} 
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <Text style={styles.legalModalContent}>
              {legalModal.content}
            </Text>
            <Text style={styles.legalModalFooter}>
              Last updated: May 2026
            </Text>
          </ScrollView>

          {/* I've Read This Button */}
          <View style={styles.legalModalButtonContainer}>
            <TouchableOpacity
              onPress={() => {
                // Mark as read based on which modal is open
                if (legalModal.title === 'Terms of Service') {
                  setHasReadTerms(true);
                } else if (legalModal.title === 'Privacy Policy') {
                  setHasReadPrivacy(true);
                }
                setLegalModal(p => ({ ...p, visible: false }));
              }}
              activeOpacity={0.85}
              style={styles.legalModalButton}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.legalModalButtonText}>I've Read This</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Hero Zone
  heroZone: {
    backgroundColor: '#004D36',
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 32,
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logoArea: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: 'white',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  brandName: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },

  // Form Card
  formCard: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    lineHeight: 20,
    marginBottom: 32,
  },
  phoneHighlight: {
    color: '#004D36',
    fontFamily: 'Inter_700Bold',
  },

  // Phone Input
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E2DE',
    overflow: 'hidden',
    height: 60,
  },
  phoneInputContainerActive: {
    borderColor: '#004D36',
  },
  countryCodeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#E5E2DE',
    backgroundColor: 'rgba(0,77,54,0.02)',
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#2D3A2F',
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  charCount: {
    fontSize: 11,
    color: '#819685',
    fontFamily: 'Inter_600SemiBold',
  },
  charCountComplete: {
    color: '#004D36',
  },

  // Terms
  termsContainer: {
    marginTop: 24,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginTop: 1,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#C8D5CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#004D36',
    borderWidth: 0,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#5C6E60',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  termsLink: {
    color: '#004D36',
    fontFamily: 'Inter_700Bold',
    textDecorationLine: 'underline',
  },

  // Error Message
  errorMessage: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  // Continue Button
  continueButton: {
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E2DE',
  },
  continueButtonActive: {
    backgroundColor: '#004D36',
    shadowColor: '#004D36',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#819685',
  },
  continueButtonTextActive: {
    color: 'white',
  },
  arrowCircle: {
    position: 'absolute',
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Dev Buttons
  devButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  devButtonText: {
    fontSize: 12,
    color: '#C8D5CA',
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },

  // OTP Step
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  backButtonText: {
    fontSize: 13,
    color: '#004D36',
    fontFamily: 'Inter_600SemiBold',
  },
  otpContainer: {
    marginBottom: 32,
  },
  resendContainer: {
    marginTop: 20,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  countryPickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E2DE',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  countryPickerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3F0',
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
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  countryItemSelected: {
    backgroundColor: '#F0F7F4',
    borderLeftWidth: 4,
    borderLeftColor: '#004D36',
  },
  countryItemFlag: {
    fontSize: 24,
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

  // Legal Modal
  legalModalHeader: {
    backgroundColor: '#004D36',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legalModalTitle: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  legalModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalModalContent: {
    fontSize: 14,
    color: '#2D3A2F',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  legalModalFooter: {
    fontSize: 12,
    color: '#819685',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  legalModalButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F3F0',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E2DE',
  },
  legalModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#004D36',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#004D36',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  legalModalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: 'white',
  },

  // Mandatory Legal Modal
  mandatoryLegalHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
    alignItems: 'center',
  },
  mandatoryLegalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mandatoryLegalTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 8,
  },
  mandatoryLegalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    textAlign: 'center',
  },
  legalDocCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E2DE',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  legalDocIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalDocInfo: {
    flex: 1,
  },
  legalDocTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 4,
  },
  legalDocSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
  },
  legalInfoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  legalInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#2D3A2F',
    lineHeight: 20,
  },
  mandatoryLegalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E2DE',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptButton: {
    height: 58,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E5E2DE',
  },
  acceptButtonActive: {
    backgroundColor: '#004D36',
    shadowColor: '#004D36',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#819685',
  },
  acceptButtonTextActive: {
    color: 'white',
  },
});
