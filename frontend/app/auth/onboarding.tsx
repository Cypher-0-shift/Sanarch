/**
 * Onboarding — Phase 2 / DESIGN.md
 *
 * 3 steps only, per spec:
 *   Step 1 — Who are you managing records for?
 *            Cards: Just myself / A family member / Both
 *            Inline relationship selector appears on same step for family/both
 *   Step 2 — Tell us about yourself
 *            Name, DOB (calendar, 80+ years back), Gender
 *            If dependent, second set of same 3 fields below
 *   Step 3 — "Creating your account…"
 *            Automated loading with real phase text (not a spinner alone)
 *            On success: animated Sanarch ID reveal + explanation sentence
 *
 * API failure on step 3 → returns to step 2 with toast, form state preserved (per spec).
 * ProgressBar shown on steps 1–2, hidden on step 3.
 * No blood group / height / weight / email / address collected here.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { SPRING, DURATION } from '../../constants/motion';
import BrandLogo from '../../components/foundation/BrandLogo';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import FormField from '../../components/inputs/FormField';
import { toast } from '../../components/feedback/toastStore';
import { createUser, createPatient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { saveToken } from '../../services/storage';
import { logger } from '../../utils/logger';
import { useTheme } from '../../components/foundation/ThemeProvider';

type WhoAmI = 'self' | 'dependent' | 'both';

const RELATIONS = [
  'Parent', 'Child', 'Spouse', 'Sibling', 'Grandparent', 'Other',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const LOADING_PHASES = [
  'Securing your account…',
  'Generating your Sanarch ID…',
  'Almost done…',
];

// ─────────────────────────────────────────────
// Progress bar (steps 1–2 only)
// ─────────────────────────────────────────────

function StepProgressBar({ step, total }: { step: number; total: number }) {
  const progress = (step / total) * 100;
  const animW    = useSharedValue(0);

  useEffect(() => {
    animW.value = withTiming(progress, { duration: DURATION.enter });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${animW.value}%` as any }));

  return (
    <View style={pgStyles.wrap}>
      <View style={pgStyles.track}>
        <Animated.View style={[pgStyles.fill, barStyle]} />
      </View>
      <Text style={pgStyles.label}>Step {step} of {total}</Text>
    </View>
  );
}

const pgStyles = StyleSheet.create({
  wrap:  { gap: SPACING[2] },
  track: {
    height:          4,
    backgroundColor: COLORS.ink100,
    borderRadius:    2,
    overflow:        'hidden',
  },
  fill: {
    height:          '100%',
    backgroundColor: COLORS.brandPrimary,
    borderRadius:    2,
  },
  label: {
    fontFamily:    FONTS.jakartaMedium,
    fontSize:      11,
    color:         COLORS.ink400,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────
// Selection card
// ─────────────────────────────────────────────

function SelectionCard({
  label,
  sub,
  icon,
  selected,
  onPress,
}: {
  label:    string;
  sub?:     string;
  icon:     string;
  selected: boolean;
  onPress:  () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        selStyles.card,
        selected && selStyles.cardSelected,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <View style={[selStyles.iconBox, selected && selStyles.iconBoxSelected]}>
        <Text style={selStyles.icon}>{icon}</Text>
      </View>
      <View style={selStyles.text}>
        <Text style={[selStyles.label, selected && selStyles.labelSelected]}>{label}</Text>
        {sub && <Text style={selStyles.sub}>{sub}</Text>}
      </View>
      <View style={[selStyles.radio, selected && selStyles.radioSelected]}>
        {selected && <View style={selStyles.radioDot} />}
      </View>
    </Pressable>
  );
}

const selStyles = StyleSheet.create({
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    padding:          SPACING[4],
    borderRadius:     RADIUS.xl,
    borderWidth:      1.5,
    borderColor:      COLORS.ink200,
    backgroundColor:  COLORS.surface,
    gap:              SPACING[3],
    ...ELEVATION_RN[1],
  },
  cardSelected: {
    borderColor:      'rgba(67,97,238,0.35)',
    backgroundColor:  COLORS.brandTint,
  },
  iconBox: {
    width:           44,
    height:          44,
    borderRadius:    RADIUS.icon,
    backgroundColor: COLORS.ink100,
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconBoxSelected: { backgroundColor: 'rgba(67,97,238,0.12)' },
  icon:  { fontSize: 22 },
  text:  { flex: 1, gap: 2 },
  label: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   15,
    color:      COLORS.ink800,
  },
  labelSelected: { color: COLORS.brandPrimary },
  sub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   12,
    color:      COLORS.ink400,
  },
  radio: {
    width:        20,
    height:       20,
    borderRadius: RADIUS.full,
    borderWidth:  2,
    borderColor:  COLORS.ink300,
    alignItems:   'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.brandPrimary, backgroundColor: COLORS.brandPrimary },
  radioDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surface },
});

// ─────────────────────────────────────────────
// Simple DOB picker (native date picker modal)
// ─────────────────────────────────────────────

function DOBField({
  label,
  value,
  onChange,
}: {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Parse or default
  const toDate = (str: string) => {
    if (!str) return new Date(1990, 0, 1);
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const current = toDate(value);

  // Inline wheel pickers (month / day / year)
  // Supports 80+ years back per spec
  const minYear = new Date().getFullYear() - 100;
  const maxYear = new Date().getFullYear() - 0;
  const years   = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const months  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days    = Array.from({ length: 31 }, (_, i) => i + 1);

  const [selectedYear,  setYear]  = useState(current.getFullYear());
  const [selectedMonth, setMonth] = useState(current.getMonth());
  const [selectedDay,   setDay]   = useState(current.getDate());

  function confirm() {
    const d = new Date(selectedYear, selectedMonth, Math.min(selectedDay, 28));
    onChange(toStr(d));
    setShowPicker(false);
  }

  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  return (
    <View style={{ gap: 6 }}>
      <Text style={dobStyles.label}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={dobStyles.field}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display || 'Not set'}`}
      >
        <Text style={display ? dobStyles.value : dobStyles.placeholder}>
          {display || 'Select date of birth'}
        </Text>
        <Text style={dobStyles.chevron}>›</Text>
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={dobStyles.modalOverlay}>
          <View style={dobStyles.modalCard}>
            <Text style={dobStyles.modalTitle}>Date of Birth</Text>

            <View style={dobStyles.pickerRow}>
              {/* Day */}
              <FlatList
                data={days}
                keyExtractor={(d) => String(d)}
                style={dobStyles.wheel}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
                getItemLayout={(_, i) => ({ length: 40, offset: 40 * i, index: i })}
                initialScrollIndex={selectedDay - 1}
                renderItem={({ item }) => (
                  <Pressable onPress={() => setDay(item)} style={dobStyles.wheelItem}>
                    <Text style={[dobStyles.wheelText, item === selectedDay && dobStyles.wheelActive]}>
                      {String(item).padStart(2, '0')}
                    </Text>
                  </Pressable>
                )}
              />
              {/* Month */}
              <FlatList
                data={months}
                keyExtractor={(m) => m}
                style={dobStyles.wheel}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
                getItemLayout={(_, i) => ({ length: 40, offset: 40 * i, index: i })}
                initialScrollIndex={selectedMonth}
                renderItem={({ item, index }) => (
                  <Pressable onPress={() => setMonth(index)} style={dobStyles.wheelItem}>
                    <Text style={[dobStyles.wheelText, index === selectedMonth && dobStyles.wheelActive]}>
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
              {/* Year */}
              <FlatList
                data={years}
                keyExtractor={(y) => String(y)}
                style={dobStyles.wheel}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
                getItemLayout={(_, i) => ({ length: 40, offset: 40 * i, index: i })}
                renderItem={({ item }) => (
                  <Pressable onPress={() => setYear(item)} style={dobStyles.wheelItem}>
                    <Text style={[dobStyles.wheelText, item === selectedYear && dobStyles.wheelActive]}>
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
            </View>

            <Pressable onPress={confirm} style={dobStyles.confirmBtn}>
              <Text style={dobStyles.confirmLabel}>Confirm</Text>
            </Pressable>
            <Pressable onPress={() => setShowPicker(false)} style={dobStyles.cancelBtn}>
              <Text style={dobStyles.cancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dobStyles = StyleSheet.create({
  label:    { fontFamily: FONTS.jakartaSemiBold, fontSize: 12, color: COLORS.ink600 },
  field: {
    flexDirection:    'row',
    alignItems:       'center',
    height:           48,
    borderRadius:     RADIUS.md,
    borderWidth:      1,
    borderColor:      COLORS.ink300,
    backgroundColor:  COLORS.surface,
    paddingHorizontal: SPACING[4],
    justifyContent:   'space-between',
  },
  value:   { fontFamily: FONTS.jakartaRegular, fontSize: 14, color: COLORS.ink800 },
  placeholder: { fontFamily: FONTS.jakartaRegular, fontSize: 14, color: COLORS.ink400 },
  chevron: { fontFamily: FONTS.jakartaRegular, fontSize: 18, color: COLORS.ink400 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius:  RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding: SPACING[5],
    paddingBottom: SPACING[8],
    gap: SPACING[4],
  },
  modalTitle: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      16,
    color:         COLORS.ink800,
    textAlign:     'center',
  },
  pickerRow: {
    flexDirection:  'row',
    height:         200,
    gap:            SPACING[4],
  },
  wheel:     { flex: 1 },
  wheelItem: { height: 40, alignItems: 'center', justifyContent: 'center' },
  wheelText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   15,
    color:      COLORS.ink400,
  },
  wheelActive: {
    fontFamily: FONTS.jakartaBold,
    fontSize:   17,
    color:      COLORS.brandPrimary,
  },
  confirmBtn: {
    height:          48,
    borderRadius:    RADIUS.lg,
    backgroundColor: COLORS.brandPrimary,
    alignItems:      'center',
    justifyContent:  'center',
    ...ELEVATION_RN.brand,
  },
  confirmLabel: { fontFamily: FONTS.jakartaSemiBold, fontSize: 15, color: COLORS.surface },
  cancelBtn:    { alignItems: 'center', paddingVertical: SPACING[2] },
  cancelLabel:  { fontFamily: FONTS.jakartaMedium, fontSize: 14, color: COLORS.ink400 },
});

// ─────────────────────────────────────────────
// Loading step — step 3
// ─────────────────────────────────────────────

function LoadingStep({ sanarchId }: { sanarchId?: string }) {
  const [phase, setPhase] = useState(0);
  const idScale = useSharedValue(0.8);
  const idOpacity = useSharedValue(0);

  const idStyle = useAnimatedStyle(() => ({
    transform: [{ scale: idScale.value }],
    opacity:   idOpacity.value,
  }));

  useEffect(() => {
    const timers = LOADING_PHASES.map((_, i) =>
      setTimeout(() => setPhase(i), i * 1200),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (sanarchId) {
      idScale.value   = withSpring(1, SPRING.buttonReturn);
      idOpacity.value = withTiming(1, { duration: DURATION.enter });
    }
  }, [sanarchId]);

  return (
    <View style={ldStyles.container}>
      {/* Pulsing brand logo */}
      <BrandLogo size={80} variant="icon" color="dark" />

      {/* Phase text */}
      <Animated.View key={phase} entering={FadeInDown.duration(300)} style={ldStyles.phaseWrap}>
        <Text style={ldStyles.phaseText}>{LOADING_PHASES[Math.min(phase, LOADING_PHASES.length - 1)]}</Text>
      </Animated.View>

      {/* Progress dots */}
      <View style={ldStyles.dots}>
        {LOADING_PHASES.map((_, i) => (
          <View key={i} style={[ldStyles.dot, i <= phase && ldStyles.dotActive]} />
        ))}
      </View>

      {/* Sanarch ID reveal on success */}
      {sanarchId && (
        <Animated.View style={[ldStyles.idCard, idStyle]}>
          <LinearGradient
            colors={[COLORS.dark900, COLORS.dark800]}
            style={ldStyles.idGradient}
          >
            <Text style={ldStyles.idLabel}>SANARCH ID</Text>
            <Text style={ldStyles.idValue}>{sanarchId}</Text>
            <Text style={ldStyles.idExplain}>
              This is your unique health ID. Doctors can use it to look you up.
            </Text>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const ldStyles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING[6],
    paddingHorizontal: SPACING[6],
  },
  phaseWrap: { alignItems: 'center' },
  phaseText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   16,
    color:      COLORS.ink600,
    textAlign:  'center',
  },
  dots: { flexDirection: 'row', gap: SPACING[2] },
  dot:  {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.ink200,
  },
  dotActive: { backgroundColor: COLORS.brandPrimary },
  idCard: {
    width:        '100%',
    borderRadius: RADIUS['2xl'],
    overflow:     'hidden',
    marginTop:    SPACING[4],
    ...ELEVATION_RN[4],
  },
  idGradient: {
    padding:  SPACING[6],
    gap:      SPACING[3],
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.08)',
    borderRadius: RADIUS['2xl'],
  },
  idLabel: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      10,
    color:         'rgba(255,255,255,0.5)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  idValue: {
    fontFamily: FONTS.monoMedium,
    fontSize:   24,
    color:      COLORS.surface,
    letterSpacing: 2,
  },
  idExplain: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   13,
    lineHeight: 20,
    color:      'rgba(255,255,255,0.55)',
    marginTop:  SPACING[2],
  },
});

// ─────────────────────────────────────────────
// Main Onboarding Screen
// ─────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firebase_token } = useLocalSearchParams<{ firebase_token: string }>();

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [whoAmI,    setWhoAmI]    = useState<WhoAmI | null>(null);
  const [relation,  setRelation]  = useState('');

  // Step 2 state — own details (name/dob/gender preserved on API error per spec)
  const [selfName,   setSelfName]   = useState('');
  const [selfDob,    setSelfDob]    = useState('');
  const [selfGender, setSelfGender] = useState('');
  const [depName,    setDepName]    = useState('');
  const [depDob,     setDepDob]     = useState('');
  const [depGender,  setDepGender]  = useState('');

  // Step 2 errors
  const [selfNameErr,   setSelfNameErr]   = useState('');
  const [selfDobErr,    setSelfDobErr]    = useState('');
  const [selfGenderErr, setSelfGenderErr] = useState('');

  // Step 3 state
  const [isCreating,  setIsCreating]  = useState(false);
  const [sanarchId,   setSanarchId]   = useState<string | undefined>();
  const [isComplete,  setIsComplete]  = useState(false);

  const showDependent = whoAmI === 'dependent' || whoAmI === 'both';
  const showSelf      = whoAmI === 'self'      || whoAmI === 'both';

  // ── Validate and go to step 2 ─────────────
  function handleStep1Next() {
    if (!whoAmI) {
      toast.warning('Please select who you are managing records for.');
      return;
    }
    if (showDependent && !relation) {
      toast.warning('Please select the relationship for the family member.');
      return;
    }
    setStep(2);
  }

  // ── Validate and go to step 3 ─────────────
  function handleStep2Next() {
    let valid = true;

    if (!selfName.trim()) { setSelfNameErr('Name is required.'); valid = false; }
    else setSelfNameErr('');

    if (!selfDob) { setSelfDobErr('Date of birth is required.'); valid = false; }
    else setSelfDobErr('');

    if (!selfGender) { setSelfGenderErr('Please select a gender.'); valid = false; }
    else setSelfGenderErr('');

    if (!valid) return;

    setStep(3);
    submitAccount();
  }

  // ── API call — step 3 ─────────────────────
  async function submitAccount() {
    setIsCreating(true);
    try {
      // Create the primary user account
      const user = await createUser({
        firebase_token,
        full_name:     selfName.trim(),
        date_of_birth: selfDob || undefined,
      });

      // Set access token in store (backend returned it via verifyOTP → auth)
      useAuthStore.getState().login(user as any, '');
      setSanarchId(user.sanarch_id);

      // If managing a dependent, create them too
      if (showDependent && depName.trim()) {
        await createPatient({
          name:          depName.trim(),
          relation:      relation.toLowerCase(),
          date_of_birth: depDob || undefined,
        });
        useProfileStore.getState().initProfiles(
          {
            id:            user.id,
            sanarchId:     user.sanarch_id,
            name:          user.full_name,
            relation:      'self',
            isMainAccount: true,
          },
          depName.trim()
            ? { id: 'dep-temp', sanarchId: '', name: depName.trim(), relation: relation as any, isMainAccount: false }
            : undefined,
        );
      } else {
        useProfileStore.getState().initProfiles({
          id:            user.id,
          sanarchId:     user.sanarch_id,
          name:          user.full_name,
          relation:      'self',
          isMainAccount: true,
        });
      }

      setIsComplete(true);

      // Navigate to Home after showing the ID for 2.5s
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 2800);
    } catch (err: any) {
      logger.error('[Onboarding] account creation failed:', err);
      // Return to step 2 with toast, form data preserved (spec requirement)
      setStep(2);
      setIsCreating(false);
      toast.error('Setup failed. Please try again.');
      // Form state (selfName, selfDob, selfGender, etc.) is preserved by design
    }
  }

  // ─────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />

      {/* Progress bar — steps 1–2 only */}
      {step < 3 && (
        <View style={[styles.header, { paddingTop: insets.top + SPACING[3] }]}>
          <StepProgressBar step={step} total={2} />
        </View>
      )}

      {/* Step 3 fills entire screen */}
      {step === 3 && (
        <View style={{ flex: 1 }}>
          <LoadingStep sanarchId={sanarchId} />
        </View>
      )}

      {/* Steps 1–2 */}
      {step < 3 && (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + SPACING[10] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1 ── */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
              <Text style={styles.heading}>Who are you managing records for?</Text>
              <Text style={styles.sub}>We'll personalise your experience based on your answer.</Text>

              <View style={styles.cards}>
                <SelectionCard
                  label="Just myself"
                  sub="Personal health records only"
                  icon="🧑"
                  selected={whoAmI === 'self'}
                  onPress={() => setWhoAmI('self')}
                />
                <SelectionCard
                  label="A family member"
                  sub="Manage records for someone else"
                  icon="👨‍👩‍👧"
                  selected={whoAmI === 'dependent'}
                  onPress={() => setWhoAmI('dependent')}
                />
                <SelectionCard
                  label="Both"
                  sub="My records + a family member's"
                  icon="👪"
                  selected={whoAmI === 'both'}
                  onPress={() => setWhoAmI('both')}
                />
              </View>

              {/* Inline relationship selector — same step, no new screen */}
              {showDependent && (
                <Animated.View entering={FadeInDown.duration(250)} style={styles.relationWrap}>
                  <Text style={styles.fieldLabel}>Relationship to family member</Text>
                  <View style={styles.chipRow}>
                    {RELATIONS.map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => setRelation(r)}
                        style={[styles.chip, relation === r && styles.chipSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: relation === r }}
                        accessibilityLabel={r}
                      >
                        <Text style={[styles.chipText, relation === r && styles.chipTextSelected]}>
                          {r}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              <PrimaryButton
                label="Continue"
                onPress={handleStep1Next}
                fullWidth
              />
            </Animated.View>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
              <Text style={styles.heading}>Tell us about yourself</Text>
              {showDependent && (
                <Text style={styles.sub}>
                  We'll collect details for {whoAmI === 'both' ? 'you and your family member' : 'the family member'} below.
                </Text>
              )}

              {/* Own details */}
              {(whoAmI === 'self' || whoAmI === 'both') && (
                <>
                  {whoAmI === 'both' && (
                    <Text style={styles.sectionDivider}>Your details</Text>
                  )}
                  <FormField
                    label="Full name"
                    value={selfName}
                    onChangeText={setSelfName}
                    placeholder="As on official documents"
                    variant={selfNameErr ? 'error' : 'text'}
                    errorMessage={selfNameErr}
                    autoCapitalize="words"
                  />
                  <DOBField
                    label="Date of birth"
                    value={selfDob}
                    onChange={setSelfDob}
                  />
                  {selfDobErr ? <Text style={styles.errorText}>{selfDobErr}</Text> : null}

                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.chipRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        onPress={() => setSelfGender(g)}
                        style={[styles.chip, selfGender === g && styles.chipSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selfGender === g }}
                        accessibilityLabel={g}
                      >
                        <Text style={[styles.chipText, selfGender === g && styles.chipTextSelected]}>
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {selfGenderErr ? <Text style={styles.errorText}>{selfGenderErr}</Text> : null}
                </>
              )}

              {/* Dependent details — same 3 fields */}
              {showDependent && (
                <View style={styles.dependentBlock}>
                  <Text style={styles.sectionDivider}>
                    {relation || 'Family member'}'s details
                  </Text>
                  <FormField
                    label="Full name"
                    value={depName}
                    onChangeText={setDepName}
                    placeholder="Family member's name"
                    autoCapitalize="words"
                  />
                  <DOBField
                    label="Date of birth"
                    value={depDob}
                    onChange={setDepDob}
                  />
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.chipRow}>
                    {GENDERS.map((g) => (
                      <Pressable
                        key={g}
                        onPress={() => setDepGender(g)}
                        style={[styles.chip, depGender === g && styles.chipSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: depGender === g }}
                        accessibilityLabel={g}
                      >
                        <Text style={[styles.chipText, depGender === g && styles.chipTextSelected]}>
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <PrimaryButton
                label="Create account"
                onPress={handleStep2Next}
                fullWidth
              />

              {/* Back to step 1 */}
              <Pressable
                onPress={() => setStep(1)}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
              >
                <Text style={styles.backLabel}>← Back</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING[5],
    paddingBottom:     SPACING[4],
    backgroundColor:   COLORS.canvas,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,24,39,0.05)',
  },
  scroll: {
    paddingHorizontal: SPACING[5],
    paddingTop:        SPACING[6],
    gap:               SPACING[5],
  },
  section: {
    gap: SPACING[4],
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
    marginTop:  -SPACING[2],
  },
  cards: { gap: SPACING[3] },

  // Relation selector
  relationWrap: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.xl,
    padding:         SPACING[4],
    borderWidth:     1,
    borderColor:     'rgba(17,24,39,0.06)',
    gap:             SPACING[3],
    ...ELEVATION_RN[1],
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING[2],
  },
  chip: {
    paddingHorizontal: SPACING[4],
    paddingVertical:   SPACING[2],
    borderRadius:      RADIUS.lg,
    borderWidth:       1.5,
    borderColor:       COLORS.ink200,
    backgroundColor:   COLORS.surface,
  },
  chipSelected: {
    borderColor:     COLORS.brandPrimary,
    backgroundColor: COLORS.brandTint,
  },
  chipText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   13,
    color:      COLORS.ink600,
  },
  chipTextSelected: {
    fontFamily: FONTS.jakartaSemiBold,
    color:      COLORS.brandPrimary,
  },

  // Field label
  fieldLabel: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      12,
    color:         COLORS.ink600,
    letterSpacing: 0,
  },

  // Dependent block
  dependentBlock: {
    gap:             SPACING[4],
    borderTopWidth:  1,
    borderTopColor:  COLORS.ink100,
    paddingTop:      SPACING[4],
  },
  sectionDivider: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      14,
    color:         COLORS.ink600,
    letterSpacing: 0,
  },

  // Error text
  errorText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   12,
    color:      COLORS.resultHigh,
    marginTop:  -SPACING[2],
  },

  // Back button
  backBtn: {
    alignSelf:       'flex-start',
    paddingVertical: SPACING[1],
  },
  backLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   14,
    color:      COLORS.ink400,
  },
});
