import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    // Navigate to Login for now (or whatever is next)
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top 65%: Vibrant Section */}
      <View style={styles.topSection}>
        <LinearGradient
          colors={['#006a35', '#2ECC71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Branding & Header */}
        <View style={[styles.header, { top: insets.top || 40 }]}>
          <Text style={styles.brandTitle}>Sanarch</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.replace('/login')}
          >
            <BlurView intensity={20} tint="light" style={styles.blurCircle}>
              <MaterialIcons name="close" size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Floating Badges */}
        <BlurView intensity={80} tint="light" style={[styles.badge, { left: -10, top: '35%' }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="schedule" size={14} color="#005f2f" />
          </View>
          <Text style={styles.badgeText}>Save Time</Text>
        </BlurView>

        <BlurView intensity={80} tint="light" style={[styles.badge, { right: -15, top: '60%' }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="event-available" size={14} color="#005f2f" />
          </View>
          <Text style={styles.badgeText}>Scan Anywhere</Text>
        </BlurView>

        <BlurView intensity={80} tint="light" style={[styles.badge, { left: -15, bottom: '25%' }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="medical-services" size={14} color="#005f2f" />
          </View>
          <Text style={styles.badgeText}>Stay Organised</Text>
        </BlurView>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../assets/images/person_scanning.png')}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom 35%: Content Card */}
      <View style={styles.bottomSection}>
        <View style={styles.card}>
          {/* Card Header Action */}
          <View style={styles.actionPillContainer}>
            <TouchableOpacity style={styles.actionPill}>
              <Text style={styles.actionPillText}>Book Your Appointment</Text>
            </TouchableOpacity>
          </View>

          {/* Main Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>One App For All Your Healthcare Needs</Text>
            <Text style={styles.subtitle}>Health made simpler.</Text>
          </View>

          {/* Navigation */}
          <View style={styles.navigationRow}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <MaterialIcons name="arrow-forward" size={28} color="#f5f7f8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topSection: {
    height: '65%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurCircle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 80,
  },
  mainImage: {
    width: '90%',
    height: '95%',
  },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6bfe9c', // primary-container
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#2c2f30', // on-surface
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', // Overlaps top section
    zIndex: 30,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  actionPillContainer: {
    alignItems: 'center',
  },
  actionPill: {
    backgroundColor: '#006a35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionPillText: {
    color: '#cdffd4', // on-primary
    fontWeight: '700',
    fontSize: 14,
  },
  textContent: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    color: '#2c2f30', // on-surface
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 18,
    color: '#595c5d', // on-surface-variant
    textAlign: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2c2f30', // on-surface
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
