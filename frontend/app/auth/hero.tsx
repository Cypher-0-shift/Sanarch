import { useRef, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StyleSheet, Animated, ViewToken,
  StatusBar, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SanarchLogo from '../../components/shared/SanarchLogo';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const REF_WIDTH = 390;
const REF_HEIGHT = 844;

// Responsive computed dimensions
const PHONE_FRAME_WIDTH = Math.max(Math.min(SCREEN_WIDTH * (240 / REF_WIDTH), 300), 200);
const PHONE_FRAME_HEIGHT = Math.max(Math.min(SCREEN_HEIGHT * (480 / REF_HEIGHT), 600), 380);

const TOP_CIRCLE_SIZE = Math.max(Math.min(SCREEN_WIDTH * (260 / REF_WIDTH), 340), 200);
const BOTTOM_CIRCLE_SIZE = Math.max(Math.min(SCREEN_WIDTH * (200 / REF_WIDTH), 280), 150);

// Page data configuration
const PAGES = [
  { id: '0', type: 'brand', bgColor: '#004D36' },
  {
    id: '1',
    type: 'feature',
    title: 'Drop the paperwork.',
    subtitle: 'Snap it. Upload it. Sanarch organizes it.',
    mockup: 'upload',
    bgColor: '#004D36'
  },
  {
    id: '2',
    type: 'feature',
    title: 'Let AI do the sorting.',
    subtitle: 'Important medical information is extracted automatically.',
    mockup: 'ai',
    bgColor: '#F5F3F0'
  },
  {
    id: '3',
    type: 'feature',
    title: 'See the bigger picture.',
    subtitle: 'Your medical history, connected over time.',
    mockup: 'timeline',
    bgColor: '#2D3A2F'
  },
  {
    id: '4',
    type: 'feature',
    title: 'Share only what you need.',
    subtitle: 'Secure, view-only access that expires automatically.',
    mockup: 'qr',
    bgColor: '#F5F3F0'
  },
  { id: '5', type: 'cta', bgColor: '#004D36' },
];

export default function HeroScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Background color interpolation
  const backgroundColor = scrollX.interpolate({
    inputRange: PAGES.map((_, i) => i * SCREEN_WIDTH),
    outputRange: PAGES.map(p => p.bgColor),
    extrapolate: 'clamp',
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleGetStarted = () => {
    router.push('/auth/onboarding');
  };

  const handleSignIn = () => {
    router.push({ pathname: '/auth/login', params: { mode: 'login' } });
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToOffset({
      offset: (PAGES.length - 1) * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScrollTo = (index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const isLightPage = [2, 4].includes(activeIndex);

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar barStyle={isLightPage ? 'dark-content' : 'light-content'} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />

      {/* Main horizontal swiper */}
      <FlatList
        ref={flatListRef}
        horizontal
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{ backgroundColor: 'transparent' }}
        ListHeaderComponent={null}
        data={PAGES}
        keyExtractor={(item) => item.id}
        initialNumToRender={PAGES.length}
        windowSize={11}
        renderItem={({ item, index }) => {
          if (item.type === 'brand') {
            return <BrandPage topInset={insets.top} bottomInset={insets.bottom} bgColor={item.bgColor} />;
          } else if (item.type === 'feature') {
            return (
              <FeaturePage
                title={item.title!}
                subtitle={item.subtitle!}
                mockup={item.mockup!}
                topInset={insets.top}
                bottomInset={insets.bottom}
                bgColor={item.bgColor}
                isActive={activeIndex === index}
              />
            );
          } else {
            return (
              <CTAPage
                onGetStarted={handleGetStarted}
                onSignIn={handleSignIn}
                topInset={insets.top}
                bottomInset={insets.bottom}
                bgColor={item.bgColor}
              />
            );
          }
        }}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.index * SCREEN_WIDTH,
            animated: true,
          });
        }}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Top Right Skip Button */}
      {activeIndex < PAGES.length - 1 && (
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.skipButton,
            {
              top: Math.max(insets.top + 8, 16),
            },
            isLightPage ? styles.skipButtonLight : styles.skipButtonDark,
          ]}
          onPress={handleSkip}
        >
          <Text
            style={[
              styles.skipText,
              isLightPage ? styles.skipTextLight : styles.skipTextDark,
            ]}
          >
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Horizontal Progress Dots */}
      {activeIndex < PAGES.length - 1 && (
        <View
          style={[
            styles.dotsContainer,
            { bottom: Math.max(insets.bottom + 24, 36) },
          ]}
        >
          {PAGES.map((_, index) => (
            <TouchableOpacity
              key={index}
              hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
              onPress={() => handleScrollTo(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  activeIndex === index
                    ? styles.dotActiveHorizontal
                    : styles.dotInactiveHorizontal,
                  {
                    backgroundColor: isLightPage
                      ? (activeIndex === index ? '#004D36' : 'rgba(0, 77, 54, 0.45)')
                      : (activeIndex === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'),
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Brand intro page
function BrandPage({ topInset, bottomInset, bgColor }: { topInset: number; bottomInset: number; bgColor: string }) {
  return (
    <View style={[styles.page, { paddingTop: topInset, paddingBottom: bottomInset, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: bgColor }]}>
      <View style={styles.brandContainer}>
        {/* Logo */}
        <View style={{
          width: 88, height: 88,
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 26,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          // Shadow
          shadowColor: '#000', shadowOpacity: 0.2,
          shadowRadius: 16, elevation: 8,
        }}>
          {/* Render your SanarchLogo or Image here */}
          <Image source={require('../../assets/logo.jpg')}
            style={{ width: 72, height: 72, borderRadius: 20 }}
          />
        </View>

        {/* Brand name */}
        <Text style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: 6,
          textTransform: 'uppercase',
          marginBottom: 14,
          textAlign: 'center',
        }}>SANARCH</Text>

        {/* Hero headline — natural wrap without hardcoded breaks or fixed lineHeight collisions */}
        <Text style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 32,
          color: 'white',
          textAlign: 'center',
          marginBottom: 20,
          maxWidth: 320,
        }}>Your health story. Finally in one place.</Text>

        {/* Divider */}
        <View style={{
          width: 40, height: 2,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 1,
          marginBottom: 20,
        }} />

        {/* Sub description — natural wrapping without shrink-to-fit */}
        <Text
          numberOfLines={3}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 16,
            marginBottom: 40,
            maxWidth: 340,
          }}>Reports, prescriptions, scans and consultations — organized automatically.</Text>
      </View>
    </View>
  );
}

// Feature page with mockup
function FeaturePage({
  title,
  subtitle,
  mockup,
  topInset,
  bottomInset,
  bgColor,
  isActive,
}: {
  title: string;
  subtitle: string;
  mockup: string;
  topInset: number;
  bottomInset: number;
  bgColor: string;
  isActive: boolean;
}) {
  const isDark = bgColor === '#004D36' || bgColor === '#2D3A2F';

  return (
    <View style={[styles.page, { paddingTop: topInset, paddingBottom: bottomInset, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: bgColor }]}>
      <View style={styles.featureContainer}>
        {/* Mockup component */}
        <View style={styles.mockupContainer}>
          {mockup === 'upload' && <UploadMockup isActive={isActive} />}
          {mockup === 'ai' && <AIMockup isActive={isActive} />}
          {mockup === 'timeline' && <TimelineMockup isActive={isActive} />}
          {mockup === 'qr' && <QRMockup />}
        </View>

        {/* Text content — natural wrapping without adjustsFontSizeToFit shrinking */}
        <View style={styles.featureTextContainer}>
          <Text numberOfLines={2} style={[styles.featureTitle, isDark && { color: 'white' }]}>{title}</Text>
          <Text numberOfLines={3} style={[styles.featureSubtitle, isDark && { color: 'rgba(255,255,255,0.7)' }]}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

// CTA page
function CTAPage({ onGetStarted, onSignIn, topInset, bottomInset, bgColor }: { onGetStarted: () => void; onSignIn: () => void; topInset: number; bottomInset: number; bgColor: string }) {
  return (
    <View style={{
      backgroundColor: bgColor,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      paddingTop: topInset,
      paddingBottom: bottomInset
    }}>
      {/* Top-right circle */}
      <View style={{
        position: 'absolute', top: -80, right: -80,
        width: TOP_CIRCLE_SIZE, height: TOP_CIRCLE_SIZE, borderRadius: TOP_CIRCLE_SIZE / 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
      }} pointerEvents="none" />

      {/* Bottom-left circle */}
      <View style={{
        position: 'absolute', bottom: -60, left: -60,
        width: BOTTOM_CIRCLE_SIZE, height: BOTTOM_CIRCLE_SIZE, borderRadius: BOTTOM_CIRCLE_SIZE / 2,
        backgroundColor: 'rgba(255,255,255,0.04)',
      }} pointerEvents="none" />

      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
        {/* Heading — natural wrap without forced line break or fixed line height collision */}
        <Text style={{
          fontSize: 32,
          fontFamily: 'Inter_700Bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 16,
          maxWidth: 320,
        }}>Take control of your health records.</Text>

        {/* Subheading */}
        <Text style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 44,
          paddingHorizontal: 16,
          maxWidth: 320,
        }}>Your health records. Your control.</Text>

        {/* Get Started button with minHeight for elastic accessibility scaling */}
        <TouchableOpacity
          onPress={onGetStarted}
          activeOpacity={0.8}
          style={{
            backgroundColor: 'white',
            width: '100%',
            minHeight: 60,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOpacity: 1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
            marginBottom: 16
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#004D36' }}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#004D36" />
        </TouchableOpacity>

        {/* Secondary Sign In Link */}
        <TouchableOpacity
          onPress={onSignIn}
          activeOpacity={0.75}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
            Already have an account? <Text style={{ fontFamily: 'Inter_700Bold', color: 'white' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// MOCKUP COMPONENTS
// ============================================

function UploadMockup({ isActive }: { isActive: boolean }) {
  const [phase, setPhase] = useState<'selected' | 'organizing' | 'complete'>('selected');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      setPhase('selected');
      fadeAnim.setValue(1);
      progressAnim.setValue(0);
      return;
    }

    setPhase('selected');
    fadeAnim.setValue(1);
    progressAnim.setValue(0);

    const t1 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setPhase('organizing');

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1700,
        useNativeDriver: false,
      }).start();
    }, 600);

    const t2 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setPhase('complete');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isActive]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%'],
  });

  return (
    <View style={styles.mockup}>
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>
            {phase === 'complete' ? 'Document Added' : 'Upload Document'}
          </Text>
          {phase === 'complete' ? (
            <MaterialCommunityIcons name="check" size={18} color="#004D36" />
          ) : (
            <View style={{ width: 18 }} />
          )}
        </View>

        {/* Content */}
        <Animated.View style={[styles.mockupContent, { opacity: fadeAnim }]}>
          {phase === 'selected' && (
            <View style={styles.simContainer}>
              <View style={styles.simFileIconBox}>
                <MaterialCommunityIcons name="file-pdf-box" size={38} color="#C62828" />
              </View>
              <Text style={styles.simFileTitle} numberOfLines={1}>Blood_Report.pdf</Text>
              <Text style={styles.simFileSub}>2.4 MB • Ready to process</Text>

              <View style={styles.simSelectedBadge}>
                <MaterialCommunityIcons name="check" size={12} color="#004D36" />
                <Text style={styles.simSelectedBadgeText}>File Selected</Text>
              </View>
            </View>
          )}

          {phase === 'organizing' && (
            <View style={styles.simContainer}>
              <View style={styles.simAiIconBox}>
                <MaterialCommunityIcons name="brain" size={36} color="#004D36" />
              </View>
              <Text style={styles.simOrganizingTitle}>AI organizing...</Text>
              <Text style={styles.simOrganizingSub}>Extracting diagnosis & metrics</Text>

              <View style={styles.simProgressBarTrack}>
                <Animated.View style={[styles.simProgressBarFill, { width: progressWidth }]} />
              </View>
            </View>
          )}

          {phase === 'complete' && (
            <View style={styles.simContainer}>
              <View style={styles.simSuccessIconBox}>
                <MaterialCommunityIcons name="check-circle" size={40} color="#004D36" />
              </View>
              <Text style={styles.simCompleteTitle}>Lab Report • May 12</Text>
              <Text style={styles.simCompleteSub}>Organized & categorized automatically</Text>

              <View style={styles.simResultCard}>
                <View style={styles.simResultRow}>
                  <Text style={styles.simResultLabel}>Type:</Text>
                  <Text style={styles.simResultVal} numberOfLines={1} ellipsizeMode="tail">Blood Test Report</Text>
                </View>
                <View style={styles.simResultRow}>
                  <Text style={styles.simResultLabel}>Extracted:</Text>
                  <Text style={styles.simResultVal} numberOfLines={1} ellipsizeMode="tail">3 Lab Values, Diagnosis</Text>
                </View>
                <View style={styles.simResultRow}>
                  <Text style={styles.simResultLabel}>Status:</Text>
                  <Text style={[styles.simResultVal, { color: '#004D36', fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>Ready</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function AIMockup({ isActive }: { isActive: boolean }) {
  const [phase, setPhase] = useState<'scanning' | 'checklist' | 'details'>('scanning');
  const [checkedItems, setCheckedItems] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      setPhase('scanning');
      setCheckedItems(0);
      scanProgress.setValue(0);
      fadeAnim.setValue(1);
      return;
    }

    setPhase('scanning');
    setCheckedItems(0);
    scanProgress.setValue(0);
    fadeAnim.setValue(1);

    // State A: Scanning progress bar filling 0 -> 80% over 1.1s
    Animated.timing(scanProgress, {
      toValue: 0.8,
      duration: 1100,
      useNativeDriver: false,
    }).start();

    // State B: Checklist sequence starts at ~1.2s
    const t1 = setTimeout(() => {
      setPhase('checklist');
      setCheckedItems(1); // Document type
    }, 1200);

    const t2 = setTimeout(() => {
      setCheckedItems(2); // Date
    }, 1500);

    const t3 = setTimeout(() => {
      setCheckedItems(3); // Diagnosis
    }, 1800);

    const t4 = setTimeout(() => {
      setCheckedItems(3.5); // Lab values appears unchecked
    }, 2050);

    const t5 = setTimeout(() => {
      setCheckedItems(4); // Lab values checked
    }, 2350);

    // State C: At ~2.7s transition to full Document Details
    const t6 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setPhase('details');
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [isActive]);

  const scanWidth = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.mockup}>
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Document Details</Text>
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={phase === 'details' ? '#004D36' : 'transparent'}
          />
        </View>

        {/* Content */}
        <Animated.View style={[styles.mockupContent, { opacity: fadeAnim }]}>
          {phase === 'scanning' && (
            <View style={styles.simContainer}>
              <View style={styles.simAiIconBox}>
                <MaterialCommunityIcons name="file-search-outline" size={38} color="#004D36" />
              </View>
              <Text style={styles.simOrganizingTitle}>Scanning document...</Text>
              <Text style={styles.simOrganizingSub}>Reading clinical markers</Text>

              <View style={styles.simProgressBarTrack}>
                <Animated.View style={[styles.simProgressBarFill, { width: scanWidth }]} />
              </View>
            </View>
          )}

          {phase === 'checklist' && (
            <View style={styles.simChecklistContainer}>
              <Text style={styles.simChecklistHeader}>Extracting Information</Text>

              <View style={styles.simChecklistItems}>
                {/* Item 1: Document type */}
                <View style={styles.simChecklistItem}>
                  {checkedItems >= 1 ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#004D36" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={18} color="#C8D5CA" />
                  )}
                  <Text style={[styles.simChecklistText, checkedItems >= 1 && styles.simChecklistTextChecked]}>
                    Document type
                  </Text>
                </View>

                {/* Item 2: Date */}
                <View style={styles.simChecklistItem}>
                  {checkedItems >= 2 ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#004D36" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={18} color="#C8D5CA" />
                  )}
                  <Text style={[styles.simChecklistText, checkedItems >= 2 && styles.simChecklistTextChecked]}>
                    Date
                  </Text>
                </View>

                {/* Item 3: Diagnosis */}
                <View style={styles.simChecklistItem}>
                  {checkedItems >= 3 ? (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#004D36" />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={18} color="#C8D5CA" />
                  )}
                  <Text style={[styles.simChecklistText, checkedItems >= 3 && styles.simChecklistTextChecked]}>
                    Diagnosis
                  </Text>
                </View>

                {/* Item 4: Lab values */}
                {checkedItems >= 3.5 && (
                  <View style={styles.simChecklistItem}>
                    {checkedItems >= 4 ? (
                      <MaterialCommunityIcons name="check-circle" size={18} color="#004D36" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={18} color="#C8D5CA" />
                    )}
                    <Text style={[styles.simChecklistText, checkedItems >= 4 && styles.simChecklistTextChecked]}>
                      Lab values
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {phase === 'details' && (
            <>
              {/* AI badge */}
              <View style={styles.aiBadge}>
                <MaterialCommunityIcons name="brain" size={14} color="#004D36" />
                <Text style={styles.aiBadgeText}>AI Extracted</Text>
              </View>

              {/* Extracted fields with real data */}
              <View style={styles.aiFieldsContainer}>
                <View style={styles.aiFieldGroup}>
                  <Text style={styles.aiFieldLabel}>Document Type</Text>
                  <View style={styles.aiFieldValueContainer}>
                    <MaterialCommunityIcons name="file-document" size={16} color="#004D36" />
                    <Text style={styles.aiFieldValueText} numberOfLines={1} ellipsizeMode="tail">Lab Report</Text>
                  </View>
                </View>

                <View style={styles.aiFieldGroup}>
                  <Text style={styles.aiFieldLabel}>Date</Text>
                  <View style={styles.aiFieldValueContainer}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#004D36" />
                    <Text style={styles.aiFieldValueText} numberOfLines={1} ellipsizeMode="tail">May 12, 2026</Text>
                  </View>
                </View>

                <View style={styles.aiFieldGroup}>
                  <Text style={styles.aiFieldLabel}>Diagnosis</Text>
                  <View style={styles.aiFieldValueContainer}>
                    <MaterialCommunityIcons name="stethoscope" size={16} color="#004D36" />
                    <Text style={styles.aiFieldValueText} numberOfLines={1} ellipsizeMode="tail">Vitamin D Deficiency</Text>
                  </View>
                </View>

                <View style={styles.aiFieldGroup}>
                  <Text style={styles.aiFieldLabel}>Lab Values</Text>
                  <View style={styles.aiLabValuesContainer}>
                    <View style={styles.aiLabValue}>
                      <Text style={styles.aiLabValueName} numberOfLines={1} ellipsizeMode="tail">Vit D</Text>
                      <Text style={styles.aiLabValueResult} numberOfLines={1}>18 ng/mL</Text>
                      <View style={styles.aiLabValueBadge}>
                        <Text style={styles.aiLabValueBadgeText} numberOfLines={1}>Low</Text>
                      </View>
                    </View>
                    <View style={styles.aiLabValue}>
                      <Text style={styles.aiLabValueName} numberOfLines={1} ellipsizeMode="tail">HGB</Text>
                      <Text style={styles.aiLabValueResult} numberOfLines={1}>14.2 g/dL</Text>
                      <View style={[styles.aiLabValueBadge, styles.aiLabValueBadgeNormal]}>
                        <Text style={[styles.aiLabValueBadgeText, styles.aiLabValueBadgeTextNormal]} numberOfLines={1}>Normal</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function TimelineMockup({ isActive }: { isActive: boolean }) {
  // Three Animated.Value pairs — one per card (opacity + slide)
  const anim0 = useRef(new Animated.Value(0)).current; // Consultation — May 8
  const slide0 = useRef(new Animated.Value(10)).current;
  const anim1 = useRef(new Animated.Value(0)).current; // Prescription — May 10
  const slide1 = useRef(new Animated.Value(10)).current;
  const anim2 = useRef(new Animated.Value(0)).current; // Lab Report — May 12
  const slide2 = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Reset on every activation — no static first frame: cards start at opacity 0 / slide 10
    anim0.setValue(0); slide0.setValue(10);
    anim1.setValue(0); slide1.setValue(10);
    anim2.setValue(0); slide2.setValue(10);

    if (!isActive) return;

    // Card 0 (Consultation May 8) — starts immediately so it's already mid-fade on screen entry
    const makeEntrance = (opacity: Animated.Value, translate: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1,  duration: 380, delay, useNativeDriver: true }),
        Animated.timing(translate,  { toValue: 0,  duration: 380, delay, useNativeDriver: true }),
      ]);

    Animated.stagger(0, [
      makeEntrance(anim0, slide0, 0),
      makeEntrance(anim1, slide1, 600),
      makeEntrance(anim2, slide2, 1200),
    ]).start();

    // No cleanup needed for Animated — setValue(0) on next activation handles reset
  }, [isActive]);

  return (
    <View style={styles.mockup}>
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="menu" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Timeline</Text>
          <MaterialCommunityIcons name="magnify" size={18} color="#2D3A2F" />
        </View>

        {/* Content - animated timeline cards */}
        <View style={styles.mockupContent}>

          {/* Card 0 — Consultation, May 8 (oldest, enters first) */}
          <Animated.View style={[styles.timelineItem, { opacity: anim0, transform: [{ translateY: slide0 }] }]}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="stethoscope" size={12} color="#388E3C" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#388E3C' }]} numberOfLines={1}>Consultation</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 8</Text>
              </View>
              <Text style={styles.timelineCardTitle} numberOfLines={1} ellipsizeMode="tail">Dr. Sarah Johnson</Text>
              <Text style={styles.timelineCardSubtitle} numberOfLines={2} ellipsizeMode="tail">General checkup and review</Text>
            </View>
          </Animated.View>

          {/* Card 1 — Prescription, May 10 */}
          <Animated.View style={[styles.timelineItem, { opacity: anim1, transform: [{ translateY: slide1 }] }]}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#F3E5F5' }]}>
                  <MaterialCommunityIcons name="pill" size={12} color="#7B1FA2" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#7B1FA2' }]} numberOfLines={1}>Prescription</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 10</Text>
              </View>
              <Text style={styles.timelineCardTitle} numberOfLines={1} ellipsizeMode="tail">Vitamin D Supplement</Text>
              <Text style={styles.timelineCardSubtitle} numberOfLines={2} ellipsizeMode="tail">60,000 IU weekly for 8 weeks</Text>
            </View>
          </Animated.View>

          {/* Card 2 — Lab Report, May 12 (most recent, enters last) */}
          <Animated.View style={[styles.timelineItem, { opacity: anim2, transform: [{ translateY: slide2 }] }]}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="flask" size={12} color="#1976D2" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#1976D2' }]} numberOfLines={1}>Lab Report</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 12</Text>
              </View>
              <Text style={styles.timelineCardTitle} numberOfLines={1} ellipsizeMode="tail">Blood Test Results</Text>
              <Text style={styles.timelineCardSubtitle} numberOfLines={2} ellipsizeMode="tail">Vitamin D: 18 ng/mL (Low)</Text>
            </View>
          </Animated.View>

        </View>
      </View>
    </View>
  );
}


function QRMockup() {
  return (
    <View style={styles.mockup}>
      {/* Phone frame */}
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Share Records</Text>
          <MaterialCommunityIcons name="dots-vertical" size={18} color="#2D3A2F" />
        </View>

        {/* Content - QR code */}
        <View style={styles.mockupContent}>
          {/* Info text */}
          <Text style={styles.qrTitle}>Scan to access records</Text>
          <Text style={styles.qrSubtitle}>Show this QR code to your doctor</Text>

          {/* QR code container */}
          <View style={styles.qrContainer}>
            <View style={styles.qrCode}>
              {/* QR pattern simulation - more realistic */}
              <View style={styles.qrPattern}>
                {[...Array(7)].map((_, i) => (
                  <View key={i} style={styles.qrRow}>
                    {[...Array(7)].map((_, j) => {
                      // Create a more realistic QR pattern
                      const isCorner = (i < 2 && j < 2) || (i < 2 && j > 4) || (i > 4 && j < 2);
                      const isData = (i + j) % 3 !== 0 || (i * j) % 5 === 0;
                      return (
                        <View
                          key={j}
                          style={[
                            styles.qrCell,
                            (isCorner || isData) && styles.qrCellFilled,
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Timer with icon */}
            <View style={styles.qrTimer}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#F57C00" />
              <Text style={styles.qrTimerText}>Expires in 9:45</Text>
            </View>
          </View>

          {/* Info cards */}
          <View style={styles.qrInfoCard}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#004D36" />
            <Text style={styles.qrInfoText} numberOfLines={1} ellipsizeMode="tail">Secure 10-minute access</Text>
          </View>

          <View style={styles.qrInfoCard}>
            <MaterialCommunityIcons name="eye-off" size={16} color="#004D36" />
            <Text style={styles.qrInfoText} numberOfLines={1} ellipsizeMode="tail">View-only access</Text>
          </View>

          {/* Revoke button */}
          <TouchableOpacity style={styles.qrRevokeButton} activeOpacity={0.7}>
            <Text style={styles.qrRevokeButtonText}>Revoke Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    elevation: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skipButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  skipButtonLight: {
    backgroundColor: 'rgba(45, 58, 47, 0.08)',
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  skipTextDark: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  skipTextLight: {
    color: '#2D3A2F',
  },

  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 100,
    elevation: 10,
  },
  dotActiveHorizontal: {
    width: 22,
    height: 6,
    borderRadius: 3,
  },
  dotInactiveHorizontal: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Brand page
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  brandLogoContainer: {
    marginBottom: 28,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 5,
    color: 'white',
    marginBottom: 12,
  },
  brandTagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  brandSubtitle2: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
  },

  // Feature page
  featureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: 8,
  },
  mockupContainer: {
    marginBottom: 28,
  },
  featureTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  featureTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#2D3A2F',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  featureSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#5C6E60',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },

  // CTA page
  ctaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  ctaIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ctaHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaSubheading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 300,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#004D36',
  },
  ctaSignInText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  ctaSignInLink: {
    fontFamily: 'Inter_700Bold',
    color: 'white',
    textDecorationLine: 'underline',
  },

  // Mockup styles
  mockup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: PHONE_FRAME_WIDTH,
    height: PHONE_FRAME_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#2D3A2F',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  mockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F5F3F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },
  mockupHeaderTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
  },
  mockupContent: {
    flex: 1,
    padding: 14,
  },

  // Simulation styles (Phase 2)
  simContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  simFileIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  simFileTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#2D3A2F',
    marginBottom: 4,
    textAlign: 'center',
  },
  simFileSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#819685',
    marginBottom: 16,
    textAlign: 'center',
  },
  simSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  simSelectedBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#004D36',
  },
  simAiIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  simOrganizingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#2D3A2F',
    marginBottom: 4,
    textAlign: 'center',
  },
  simOrganizingSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#5C6E60',
    marginBottom: 18,
    textAlign: 'center',
  },
  simProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E2DE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  simProgressBarFill: {
    height: 6,
    backgroundColor: '#004D36',
    borderRadius: 3,
  },
  simSuccessIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  simCompleteTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#2D3A2F',
    marginBottom: 4,
    textAlign: 'center',
  },
  simCompleteSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#819685',
    marginBottom: 14,
    textAlign: 'center',
  },
  simResultCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E2DE',
    gap: 6,
  },
  simResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simResultLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#819685',
  },
  simResultVal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#2D3A2F',
  },
  simChecklistContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  simChecklistHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#2D3A2F',
    marginBottom: 14,
    textAlign: 'center',
  },
  simChecklistItems: {
    gap: 10,
  },
  simChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  simChecklistText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#819685',
  },
  simChecklistTextChecked: {
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
  },

  // Upload mockup
  uploadTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    marginBottom: 14,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  uploadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  uploadCardContent: {
    flex: 1,
  },
  uploadCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#2D3A2F',
    marginBottom: 2,
  },
  uploadCardSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#819685',
  },

  // AI mockup
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  aiBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#004D36',
  },
  aiFieldsContainer: {
    gap: 12,
  },
  aiFieldGroup: {
    gap: 6,
  },
  aiFieldLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#819685',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiFieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  aiFieldValueText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
    flex: 1,
  },
  aiLabValuesContainer: {
    gap: 8,
  },
  aiLabValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E2DE',
    gap: 8,
  },
  aiLabValueName: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#5C6E60',
    flex: 1,
  },
  aiLabValueResult: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
  },
  aiLabValueBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiLabValueBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#C62828',
  },
  aiLabValueBadgeNormal: {
    backgroundColor: '#E8F5E9',
  },
  aiLabValueBadgeTextNormal: {
    color: '#2E7D32',
  },

  // Timeline mockup
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#004D36',
    marginRight: 8,
    marginTop: 6,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timelineCardBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  timelineCardDate: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: '#819685',
  },
  timelineCardTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
    marginBottom: 3,
  },
  timelineCardSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    lineHeight: 14,
  },

  // QR mockup
  qrTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCode: {
    width: 140,
    height: 140,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrPattern: {
    flex: 1,
    gap: 2,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  qrCell: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  qrCellFilled: {
    backgroundColor: '#2D3A2F',
  },
  qrTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  qrTimerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#F57C00',
  },
  qrInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E2DE',
  },
  qrInfoText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#2D3A2F',
    flex: 1,
  },
  qrRevokeButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  qrRevokeButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#C62828',
  },
});
