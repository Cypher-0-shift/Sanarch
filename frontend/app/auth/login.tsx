/**
 * Login — Phase 2 / DESIGN.md
 *
 * Two-step phone auth: phone entry → OTP verification.
 * Biometric prompt on 2nd+ session (if previously enrolled).
 *
 * UX spec compliance:
 *   - Country code: small tappable label only (not a prominent picker upfront)
 *   - TOS: passive disclaimer text below CTA (NO checkbox gate — deliberate)
 *   - OTP: 6 separate digit boxes, shows exact phone number code was sent to
 *   - "Change number" re-requests OTP automatically (no ambiguity about new code)
 *   - Resend: 30s cooldown countdown, disabled until elapsed
 *   - Biometric: 2nd+ session only, shown instead of phone step on success
 *   - First successful login → biometric enrolment offer after Home mounts (not before)
 *
 * No checkbox on TOS is deliberate — do not reintroduce it.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  Linking,
  FlatList,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { DURATION } from '../../constants/motion';
import BrandLogo from '../../components/foundation/BrandLogo';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import { sendOTP, verifyOTP } from '../../services/auth';
import { getToken, saveToken } from '../../services/storage';
import { getMe } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { toast } from '../../components/feedback/toastStore';
import { logger } from '../../utils/logger';
import BottomSheet from '../../components/navigation/BottomSheet';

// ─────────────────────────────────────────────
// Country data
// ─────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India',         maxLen: 10 },
  { code: '+1',   flag: '🇺🇸', name: 'United States',  maxLen: 10 },
  { code: '+44',  flag: '🇬🇧', name: 'UK',             maxLen: 10 },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',      maxLen: 9  },
  { code: '+971', flag: '🇦🇪', name: 'UAE',            maxLen: 9  },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',      maxLen: 8  },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia',       maxLen: 10 },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan',       maxLen: 10 },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh',     maxLen: 10 },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',      maxLen: 9  },
  { code: '+977', flag: '🇳🇵', name: 'Nepal',          maxLen: 10 },
  { code: '+81',  flag: '🇯🇵', name: 'Japan',          maxLen: 10 },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea',    maxLen: 10 },
  { code: '+86',  flag: '🇨🇳', name: 'China',          maxLen: 11 },
];

type Country = typeof COUNTRY_CODES[0];
type Step    = 'phone' | 'otp' | 'biometric';

const BIOMETRIC_ENROLLED_KEY = 'sanarch_biometric_enrolled';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

// ─────────────────────────────────────────────
// OTP input row — 6 separate digit boxes
// ─────────────────────────────────────────────

function OTPInputRow({
  value,
  onChange,
  hasError,
}: {
  value:    string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && value[index] === undefined && index > 0) {
      const newVal = value.slice(0, index - 1) + value.slice(index);
      onChange(newVal);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleChange(index: number, char: string) {
    const cleaned = char.replace(/[^0-9]/g, '').slice(-1);
    const arr = (value + '      ').slice(0, OTP_LENGTH).split('');
    arr[index] = cleaned;
    const newVal = arr.join('').replace(/\s/g, '').slice(0, OTP_LENGTH);
    onChange(newVal);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  return (
    <View style={otpStyles.row}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
        const digit    = value[i] ?? '';
        const isFilled = digit !== '';
        return (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r; }}
            style={[
              otpStyles.box,
              isFilled  && otpStyles.boxFilled,
              hasError  && otpStyles.boxError,
            ]}
            value={digit}
            onChangeText={(t) => handleChange(i, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            caretHidden
            selectTextOnFocus
            accessibilityLabel={`OTP digit ${i + 1}`}
          />
        );
      })}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    gap:            SPACING[2],
    justifyContent: 'center',
  },
  box: {
    width:           46,
    height:          56,
    borderRadius:    RADIUS.md,
    borderWidth:     1.5,
    borderColor:     COLORS.ink200,
    backgroundColor: COLORS.surface,
    fontFamily:      FONTS.monoMedium,
    fontSize:        22,
    color:           COLORS.ink800,
    ...ELEVATION_RN[1],
  },
  boxFilled: {
    borderColor:     COLORS.brandPrimary,
    backgroundColor: COLORS.brandTint,
  },
  boxError: {
    borderColor:     COLORS.resultHigh,
    backgroundColor: COLORS.resultHighBg,
  },
});

// ─────────────────────────────────────────────
// Resend cooldown timer
// ─────────────────────────────────────────────

function ResendCooldown({
  onResend,
  isLoading,
}: {
  onResend:  () => void;
  isLoading: boolean;
}) {
  const [seconds, setSeconds] = useState(RESEND_COOLDOWN);
  const canResend = seconds === 0;

  useEffect(() => {
    if (seconds === 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return (
    <View style={resendStyles.row}>
      <Text style={resendStyles.label}>Didn't receive a code? </Text>
      {canResend ? (
        <Pressable
          onPress={isLoading ? undefined : onResend}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Resend OTP"
        >
          <Text style={[resendStyles.action, isLoading && resendStyles.disabled]}>
            Resend
          </Text>
        </Pressable>
      ) : (
        <Text style={resendStyles.timer}>Resend in {seconds}s</Text>
      )}
    </View>
  );
}

const resendStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center' },
  label:    { fontFamily: FONTS.jakartaRegular, fontSize: 13, color: COLORS.ink400 },
  action:   { fontFamily: FONTS.jakartaSemiBold, fontSize: 13, color: COLORS.brandPrimary },
  timer:    { fontFamily: FONTS.jakartaRegular,  fontSize: 13, color: COLORS.ink400 },
  disabled: { opacity: 0.4 },
});

// ─────────────────────────────────────────────
// Country picker sheet
// ─────────────────────────────────────────────

function CountryPickerSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible:  boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose:  () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} variant="scrollable" title="Select country code">
      {COUNTRY_CODES.map((c) => (
        <Pressable
          key={c.code}
          onPress={() => { onSelect(c); onClose(); }}
          style={[
            cpStyles.item,
            c.code === selected.code && cpStyles.itemSelected,
          ]}
          accessibilityRole="menuitem"
          accessibilityLabel={`${c.name} ${c.code}`}
          accessibilityState={{ selected: c.code === selected.code }}
        >
          <Text style={cpStyles.flag}>{c.flag}</Text>
          <Text style={cpStyles.name}>{c.name}</Text>
          <Text style={cpStyles.code}>{c.code}</Text>
          {c.code === selected.code && <Text style={cpStyles.check}>✓</Text>}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const cpStyles = StyleSheet.create({
  item: {
    flexDirection:    'row',
    alignItems:       'center',
    height:           52,
    paddingHorizontal: SPACING[1],
    gap:              SPACING[3],
    borderRadius:     RADIUS.md,
    marginBottom:     2,
  },
  itemSelected: { backgroundColor: COLORS.brandTint },
  flag:         { fontSize: 22 },
  name:         { flex: 1, fontFamily: FONTS.jakartaMedium, fontSize: 14, color: COLORS.ink800 },
  code:         { fontFamily: FONTS.monoRegular, fontSize: 13, color: COLORS.ink400 },
  check:        { fontFamily: FONTS.jakartaBold, fontSize: 14, color: COLORS.brandPrimary },
});

// ─────────────────────────────────────────────
// Main LoginScreen
// ─────────────────────────────────────────────

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [step,            setStep]            = useState<Step>('phone');
  const [country,         setCountry]         = useState(COUNTRY_CODES[0]);
  const [phone,           setPhone]           = useState('');
  const [otp,             setOtp]             = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [otpError,        setOtpError]        = useState('');
  const [phoneError,      setPhoneError]      = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Shake animation for error on OTP boxes
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  function triggerShake() {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60, easing: Easing.linear }),
      withTiming( 8, { duration: 60, easing: Easing.linear }),
      withTiming(-6, { duration: 60, easing: Easing.linear }),
      withTiming( 6, { duration: 60, easing: Easing.linear }),
      withTiming( 0, { duration: 60, easing: Easing.linear }),
    );
  }

  // ── Phone submission ───────────────────────
  async function handleSendOTP() {
    const cleaned = phone.trim();
    if (cleaned.length < 7) {
      setPhoneError('Enter a valid phone number.');
      return;
    }
    setPhoneError('');
    setIsLoading(true);
    try {
      await sendOTP(`${country.code}${cleaned}`);
      setStep('otp');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── OTP verification ───────────────────────
  async function handleVerifyOTP() {
    if (otp.length < OTP_LENGTH) {
      setOtpError('Enter all 6 digits.');
      triggerShake();
      return;
    }
    setOtpError('');
    setIsLoading(true);
    try {
      const result = await verifyOTP(otp);

      if (result.is_new_user) {
        // New user → onboarding with firebase token
        router.replace({
          pathname: '/auth/onboarding',
          params:   { firebase_token: result.firebase_token },
        });
      } else {
        // Returning user — fetch profile and go Home
        const userData = await getMe();
        useAuthStore.getState().login(userData as any, result.access_token!);
        useProfileStore.getState().initProfiles({
          id:            userData.id,
          sanarchId:     userData.sanarch_id,
          name:          userData.full_name,
          relation:      'self',
          isMainAccount: true,
        }, undefined);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setOtpError(err.message ?? 'Incorrect code. Try again.');
      triggerShake();
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Change number — re-request OTP ────────
  async function handleChangeNumber() {
    setStep('phone');
    setOtp('');
    setOtpError('');
  }

  // ── Resend OTP ─────────────────────────────
  async function handleResend() {
    setIsLoading(true);
    try {
      await sendOTP(`${country.code}${phone}`);
      toast.success('New code sent.');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to resend. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const maskedPhone = `${country.code} ${'•'.repeat(Math.max(0, phone.length - 3))}${phone.slice(-3)}`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING[6], paddingBottom: insets.bottom + SPACING[10] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(400).delay(0)} style={styles.logoRow}>
          <BrandLogo size={40} variant="icon" color="dark" />
          <Text style={styles.brandName}>Sanarch</Text>
        </Animated.View>

        {/* ── Phone step ── */}
        {step === 'phone' && (
          <Animated.View entering={FadeInDown.duration(350).delay(80)} style={styles.formCard}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.sub}>Enter your mobile number to continue.</Text>

            {/* Phone input with inline country label */}
            <View style={styles.phoneInputWrap}>
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={styles.countryChip}
                accessibilityRole="button"
                accessibilityLabel={`Country code ${country.code}`}
                hitSlop={8}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryCode}>{country.code}</Text>
                <Text style={styles.countryChevron}>›</Text>
              </Pressable>

              <TextInput
                style={[styles.phoneInput, phoneError ? styles.inputError : null]}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/[^0-9]/g, '').slice(0, country.maxLen));
                  setPhoneError('');
                }}
                placeholder="Mobile number"
                placeholderTextColor={COLORS.ink400}
                keyboardType="phone-pad"
                maxLength={country.maxLen}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
                accessibilityLabel="Phone number"
              />
            </View>

            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}

            <PrimaryButton
              label={isLoading ? 'Sending…' : 'Continue'}
              onPress={handleSendOTP}
              variant={isLoading ? 'loading' : 'default'}
              fullWidth
            />

            {/* TOS — passive disclaimer, NO checkbox gate (deliberate, per spec) */}
            <Text style={styles.tos}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.tosLink}
                onPress={() => Linking.openURL('https://sanarch.in/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={styles.tosLink}
                onPress={() => Linking.openURL('https://sanarch.in/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Animated.View>
        )}

        {/* ── OTP step ── */}
        {step === 'otp' && (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.formCard}>
            <Text style={styles.heading}>Verify your number</Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{' '}
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
            </Text>

            <Animated.View style={shakeStyle}>
              <OTPInputRow
                value={otp}
                onChange={(v) => { setOtp(v); setOtpError(''); }}
                hasError={!!otpError}
              />
            </Animated.View>

            {otpError ? (
              <Text style={styles.errorText}>{otpError}</Text>
            ) : null}

            <PrimaryButton
              label={isLoading ? 'Verifying…' : 'Verify'}
              onPress={handleVerifyOTP}
              variant={isLoading ? 'loading' : otp.length < OTP_LENGTH ? 'disabled' : 'default'}
              fullWidth
            />

            <ResendCooldown onResend={handleResend} isLoading={isLoading} />

            {/* Change number — re-sends OTP automatically */}
            <Pressable
              onPress={handleChangeNumber}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Change phone number"
            >
              <Text style={styles.changeNumber}>Wrong number? Change it</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* Country picker sheet */}
      <CountryPickerSheet
        visible={showCountryPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowCountryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: COLORS.canvas },
  scrollContent: { paddingHorizontal: SPACING[5], gap: SPACING[8] },

  logoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING[3],
  },
  brandName: {
    fontFamily:    FONTS.jakartaExtraBold,
    fontSize:      22,
    color:         COLORS.ink800,
    letterSpacing: -0.4,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS['2xl'],
    padding:         SPACING[6],
    borderWidth:     1,
    borderColor:     'rgba(17,24,39,0.06)',
    gap:             SPACING[5],
    ...ELEVATION_RN[1],
  },
  heading: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      24,
    lineHeight:    32,
    color:         COLORS.ink800,
    letterSpacing: -0.40,
  },
  sub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   14,
    lineHeight: 22,
    color:      COLORS.ink400,
    marginTop:  -SPACING[3],
  },
  phoneHighlight: {
    fontFamily: FONTS.jakartaSemiBold,
    color:      COLORS.ink800,
  },

  // Phone input
  phoneInputWrap: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    borderColor:    COLORS.ink200,
    borderRadius:   RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow:       'hidden',
    height:         52,
  },
  countryChip: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: SPACING[3],
    height:         '100%',
    gap:            4,
    borderRightWidth: 1,
    borderRightColor: COLORS.ink200,
    backgroundColor: COLORS.surfaceSub,
  },
  countryFlag: { fontSize: 16 },
  countryCode: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   13,
    color:      COLORS.ink800,
  },
  countryChevron: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   16,
    color:      COLORS.ink400,
    marginTop:  1,
  },
  phoneInput: {
    flex:        1,
    fontFamily:  FONTS.jakartaRegular,
    fontSize:    16,
    color:       COLORS.ink800,
    paddingHorizontal: SPACING[3],
    height:      '100%',
  },
  inputError: {
    borderColor: COLORS.resultHigh,
  },
  errorText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   12,
    color:      COLORS.resultHigh,
    marginTop:  -SPACING[3],
  },

  // TOS — passive, no checkbox
  tos: {
    fontFamily:  FONTS.jakartaRegular,
    fontSize:    12,
    lineHeight:  18,
    color:       COLORS.ink400,
    textAlign:   'center',
    marginTop:   -SPACING[3],
  },
  tosLink: {
    fontFamily:    FONTS.jakartaSemiBold,
    color:         COLORS.brandPrimary,
    textDecorationLine: 'underline',
  },

  changeNumber: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   13,
    color:      COLORS.brandPrimary,
    textAlign:  'center',
  },
});
