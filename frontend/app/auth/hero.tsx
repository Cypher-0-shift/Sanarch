import { useRef, useState } from 'react';
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

// Page data configuration
const PAGES = [
  { id: '0', type: 'brand', bgColor: '#004D36' },
  { id: '1', type: 'feature', title: 'Upload anything.\nWe organize it.', subtitle: 'Snap photos or upload PDFs. Your records are instantly categorized.', mockup: 'upload', bgColor: '#004D36' },
  { id: '2', type: 'feature', title: 'AI reads your documents.', subtitle: 'Extracts diagnosis, medications, and lab values automatically.', mockup: 'ai', bgColor: '#F5F3F0' },
  { id: '3', type: 'feature', title: 'Your health timeline.', subtitle: 'All medical events in chronological order. Filter and search easily.', mockup: 'timeline', bgColor: '#2D3A2F' },
  { id: '4', type: 'feature', title: 'Share with a QR code.', subtitle: 'Generate a secure code your doctor scans. Expires in 10 minutes.', mockup: 'qr', bgColor: '#F5F3F0' },
  { id: '5', type: 'cta', bgColor: '#004D36' },
];

export default function HeroScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Background color interpolation
  const backgroundColor = scrollY.interpolate({
    inputRange: PAGES.map((_, i) => i * SCREEN_HEIGHT),
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

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const isLightPage = [2, 4].includes(activeIndex);

  return (
    <View style={{ flex: 1, backgroundColor: '#004D36' }}>
      <StatusBar barStyle={isLightPage ? 'dark-content' : 'light-content'} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />

      {/* Main vertical swiper */}
      <FlatList
        ref={flatListRef}
        style={{ flex: 1, backgroundColor: '#004D36' }}
        contentContainerStyle={{ backgroundColor: '#004D36' }}
        ListHeaderComponent={null}
        data={PAGES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
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
              />
            );
          } else {
            return <CTAPage onGetStarted={handleSkip} topInset={insets.top} bottomInset={insets.bottom} bgColor={item.bgColor} />;
          }
        }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Fixed overlay with skip and dots */}
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]} pointerEvents="box-none">
        {activeIndex < PAGES.length - 1 && (
          <>
            {/* Page dots - left center */}
            <View style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 24,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6
            }} pointerEvents="none">
              {PAGES.map((_, index) => (
                <View
                  key={index}
                  style={
                    activeIndex === index
                      ? { width: 6, height: 22, borderRadius: 3, backgroundColor: 'white' }
                      : { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }
                  }
                />
              ))}
            </View>

            {/* Chevron down button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                bottom: 44,
                right: 28,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
              }}
            >
              <MaterialCommunityIcons name="chevron-down" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>
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

        {/* Hero headline — large, confident, centered */}
        <Text style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 34,
          color: 'white',
          textAlign: 'center',
          lineHeight: 42,
          marginBottom: 20,
        }}>Your health,{'\n'}your records.</Text>

        {/* Divider */}
        <View style={{
          width: 40, height: 2,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 1,
          marginBottom: 20,
        }} />

        {/* Sub description — smaller, lighter weight, proper line breaks */}
        <Text
          adjustsFontSizeToFit
          numberOfLines={2}
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            lineHeight: 24,
            paddingHorizontal: 16,
            marginBottom: 40,
          }}>All your medical documents in one place.{'\n'}Organized, searchable, shareable.</Text>
      </View>
    </View>
  );
}

// Feature page with mockup
function FeaturePage({ title, subtitle, mockup, topInset, bottomInset, bgColor }: { title: string; subtitle: string; mockup: string; topInset: number; bottomInset: number; bgColor: string }) {
  const isDark = bgColor === '#004D36' || bgColor === '#2D3A2F';

  return (
    <View style={[styles.page, { paddingTop: topInset, paddingBottom: bottomInset, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: bgColor }]}>
      <View style={styles.featureContainer}>
        {/* Mockup component */}
        <View style={styles.mockupContainer}>
          {mockup === 'upload' && <UploadMockup />}
          {mockup === 'ai' && <AIMockup />}
          {mockup === 'timeline' && <TimelineMockup />}
          {mockup === 'qr' && <QRMockup />}
        </View>

        {/* Text content */}
        <View style={styles.featureTextContainer}>
          <Text adjustsFontSizeToFit numberOfLines={2} style={[styles.featureTitle, isDark && { color: 'white' }]}>{title}</Text>
          <Text style={[styles.featureSubtitle, isDark && { color: 'rgba(255,255,255,0.7)' }]}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

// CTA page
function CTAPage({ onGetStarted, topInset, bottomInset, bgColor }: { onGetStarted: () => void; topInset: number; bottomInset: number; bgColor: string }) {
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
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: 'rgba(255,255,255,0.05)',
      }} pointerEvents="none" />

      {/* Bottom-left circle */}
      <View style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.04)',
      }} pointerEvents="none" />

      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%' }}>
        {/* Heading */}
        <Text style={{
          fontSize: 34,
          fontFamily: 'Inter_700Bold',
          color: 'white',
          textAlign: 'center',
          lineHeight: 42,
          marginBottom: 16
        }}>Take control of{'\n'}your health records</Text>

        {/* Subheading */}
        <Text style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 48,
          paddingHorizontal: 16
        }}>Join thousands managing their health story with Sanarch.</Text>

        {/* Get Started button */}
        <TouchableOpacity
          onPress={onGetStarted}
          activeOpacity={0.7}
          style={{
            backgroundColor: 'white',
            width: '100%',
            height: 62,
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
            marginBottom: 20
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#004D36' }}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#004D36" />
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ============================================
// MOCKUP COMPONENTS
// ============================================

function UploadMockup() {
  return (
    <View style={styles.mockup}>
      {/* Phone frame */}
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Upload Document</Text>
          <View style={{ width: 18 }} />
        </View>

        {/* Content - Upload options */}
        <View style={styles.mockupContent}>
          {/* Title */}
          <Text style={styles.uploadTitle}>Choose upload method</Text>
          <Text style={styles.uploadSubtitle}>Select how you'd like to add your document</Text>

          {/* Upload buttons */}
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconContainer}>
              <MaterialCommunityIcons name="camera" size={28} color="#004D36" />
            </View>
            <View style={styles.uploadCardContent}>
              <Text style={styles.uploadCardTitle}>Take Photo</Text>
              <Text style={styles.uploadCardSubtitle}>Capture with camera</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
          </View>

          <View style={styles.uploadCard}>
            <View style={styles.uploadIconContainer}>
              <MaterialCommunityIcons name="file-pdf-box" size={28} color="#004D36" />
            </View>
            <View style={styles.uploadCardContent}>
              <Text style={styles.uploadCardTitle}>Upload PDF</Text>
              <Text style={styles.uploadCardSubtitle}>From your files</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
          </View>

          <View style={styles.uploadCard}>
            <View style={styles.uploadIconContainer}>
              <MaterialCommunityIcons name="image" size={28} color="#004D36" />
            </View>
            <View style={styles.uploadCardContent}>
              <Text style={styles.uploadCardTitle}>Choose Image</Text>
              <Text style={styles.uploadCardSubtitle}>From gallery</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
          </View>
        </View>
      </View>
    </View>
  );
}

function AIMockup() {
  return (
    <View style={styles.mockup}>
      {/* Phone frame */}
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Document Details</Text>
          <MaterialCommunityIcons name="check" size={18} color="#004D36" />
        </View>

        {/* Content - AI extraction */}
        <View style={styles.mockupContent}>
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
                <Text style={styles.aiFieldValueText}>Lab Report</Text>
              </View>
            </View>

            <View style={styles.aiFieldGroup}>
              <Text style={styles.aiFieldLabel}>Date</Text>
              <View style={styles.aiFieldValueContainer}>
                <MaterialCommunityIcons name="calendar" size={16} color="#004D36" />
                <Text style={styles.aiFieldValueText}>May 12, 2026</Text>
              </View>
            </View>

            <View style={styles.aiFieldGroup}>
              <Text style={styles.aiFieldLabel}>Diagnosis</Text>
              <View style={styles.aiFieldValueContainer}>
                <MaterialCommunityIcons name="stethoscope" size={16} color="#004D36" />
                <Text style={styles.aiFieldValueText}>Vitamin D Deficiency</Text>
              </View>
            </View>

            <View style={styles.aiFieldGroup}>
              <Text style={styles.aiFieldLabel}>Lab Values</Text>
              <View style={styles.aiLabValuesContainer}>
                <View style={styles.aiLabValue}>
                  <Text style={styles.aiLabValueName}>Vit D</Text>
                  <Text style={styles.aiLabValueResult}>18 ng/mL</Text>
                  <View style={styles.aiLabValueBadge}>
                    <Text style={styles.aiLabValueBadgeText}>Low</Text>
                  </View>
                </View>
                <View style={styles.aiLabValue}>
                  <Text style={styles.aiLabValueName}>HGB</Text>
                  <Text style={styles.aiLabValueResult}>14.2 g/dL</Text>
                  <View style={[styles.aiLabValueBadge, styles.aiLabValueBadgeNormal]}>
                    <Text style={[styles.aiLabValueBadgeText, styles.aiLabValueBadgeTextNormal]}>Normal</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function TimelineMockup() {
  return (
    <View style={styles.mockup}>
      {/* Phone frame */}
      <View style={styles.phoneFrame}>
        {/* Header */}
        <View style={styles.mockupHeader}>
          <MaterialCommunityIcons name="menu" size={18} color="#2D3A2F" />
          <Text style={styles.mockupHeaderTitle}>Timeline</Text>
          <MaterialCommunityIcons name="magnify" size={18} color="#2D3A2F" />
        </View>

        {/* Content - Timeline */}
        <View style={styles.mockupContent}>
          {/* Timeline items with real data */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="flask" size={12} color="#1976D2" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#1976D2' }]}>Lab Report</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 12</Text>
              </View>
              <Text style={styles.timelineCardTitle}>Blood Test Results</Text>
              <Text style={styles.timelineCardSubtitle}>Vitamin D: 18 ng/mL (Low)</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#F3E5F5' }]}>
                  <MaterialCommunityIcons name="pill" size={12} color="#7B1FA2" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#7B1FA2' }]}>Prescription</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 10</Text>
              </View>
              <Text style={styles.timelineCardTitle}>Vitamin D Supplement</Text>
              <Text style={styles.timelineCardSubtitle}>60,000 IU weekly for 8 weeks</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineCard}>
              <View style={styles.timelineCardHeader}>
                <View style={[styles.timelineCardBadge, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="stethoscope" size={12} color="#388E3C" />
                  <Text style={[styles.timelineCardBadgeText, { color: '#388E3C' }]}>Consultation</Text>
                </View>
                <Text style={styles.timelineCardDate}>May 8</Text>
              </View>
              <Text style={styles.timelineCardTitle}>Dr. Sarah Johnson</Text>
              <Text style={styles.timelineCardSubtitle}>General checkup and review</Text>
            </View>
          </View>
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
            <Text style={styles.qrInfoText}>Secure 10-minute access</Text>
          </View>

          <View style={styles.qrInfoCard}>
            <MaterialCommunityIcons name="eye-off" size={16} color="#004D36" />
            <Text style={styles.qrInfoText}>View-only access</Text>
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
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#004D36',
  },
  dotsContainer: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: [{ translateY: -60 }],
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    height: 24,
    backgroundColor: 'white',
  },
  nextButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    width: 240,
    height: 480,
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
