import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function SetupProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');

  const handleNext = () => {
    // Navigate to next screen
    router.replace('/dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c2f30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>Set up your profile!</Text>
            <Text style={styles.subtitle}>Help us get to know you better to personalize your healthcare experience.</Text>
          </View>

          {/* Profile Form */}
          <View style={styles.formContainer}>
            
            {/* Name Section */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>FIRST NAME</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. John"
                  placeholderTextColor="#abadae"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. Doe"
                  placeholderTextColor="#abadae"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GENDER</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
                  onPress={() => setGender('Male')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="male" size={18} color={gender === 'Male' ? '#cdffd4' : '#2c2f30'} />
                  <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
                  onPress={() => setGender('Female')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="female" size={18} color={gender === 'Female' ? '#cdffd4' : '#2c2f30'} />
                  <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderButton, gender === 'Other' && styles.genderButtonActive]}
                  onPress={() => setGender('Other')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="group" size={18} color={gender === 'Other' ? '#cdffd4' : '#2c2f30'} />
                  <Text style={[styles.genderText, gender === 'Other' && styles.genderTextActive]}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DATE OF BIRTH</Text>
              <View style={styles.iconInputContainer}>
                <MaterialIcons name="calendar-today" size={20} color="#abadae" style={styles.inputIcon} />
                <TextInput 
                  style={styles.iconInput}
                  placeholder="DD / MM / YYYY"
                  placeholderTextColor="#abadae"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.iconInputContainer}>
                <MaterialIcons name="mail" size={20} color="#abadae" style={styles.inputIcon} />
                <TextInput 
                  style={styles.iconInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#abadae"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.countryCodePicker}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <MaterialIcons name="expand-more" size={18} color="#595c5d" />
                </TouchableOpacity>
                <TextInput 
                  style={[styles.input, { flex: 1, marginLeft: 12 }]}
                  placeholder="Phone number"
                  placeholderTextColor="#abadae"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

          </View>

          {/* Privacy Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <MaterialIcons name="verified-user" size={20} color="#006576" style={{ marginTop: 2 }} />
            <Text style={styles.disclaimerText}>
              Your data is encrypted and secure. We use this information strictly for clinical verification and to ensure your care is tailored to your needs.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.nextButtonWrapper}>
          <LinearGradient
            colors={['#006a35', '#6bfe9c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialIcons name="check-circle" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7f8', // bg-surface
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(245, 247, 248, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.02)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 18,
    color: '#2c2f30',
    letterSpacing: -0.5,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120, // space for bottom bar
  },
  heroSection: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '800',
    fontSize: 32,
    color: '#2c2f30',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#595c5d',
    lineHeight: 24,
  },
  formContainer: {
    gap: 32, 
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#eef1f2',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2c2f30',
  },
  iconInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c2f30',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef1f2',
    height: 50,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  genderButtonActive: {
    backgroundColor: '#006a35',
  },
  genderText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2f30',
  },
  genderTextActive: {
    color: '#cdffd4',
  },
  phoneRow: {
    flexDirection: 'row',
  },
  countryCodePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    minWidth: 100,
    justifyContent: 'space-between',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2f30',
  },
  disclaimerContainer: {
    marginTop: 48,
    padding: 24,
    backgroundColor: '#eef1f2',
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(171, 173, 174, 0.1)',
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#595c5d',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingTop: 16,
    backgroundColor: 'rgba(245, 247, 248, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.02)',
    alignItems: 'center',
  },
  nextButtonWrapper: {
    width: '100%',
    maxWidth: 300,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 30,
  },
  nextButtonText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 18,
    color: '#ffffff',
  },
});
