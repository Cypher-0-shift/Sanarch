import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddMedicationScreen() {
  const router = useRouter();
  const [isOngoing, setIsOngoing] = useState(false);

  const handleSubmit = () => {
    // Navigate back to medications schedule
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} 
        >
          <MaterialIcons name="arrow-back" size={24} color="#2c2f30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.formContainer}>
            {/* Section: Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>GENERAL INFORMATION</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medicine Name</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="medication" size={20} color="rgba(0,106,53,0.6)" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.inputBox}
                    placeholder="e.g., Metformin"
                    placeholderTextColor="#abadae"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dosage</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="medical-information" size={20} color="rgba(0,106,53,0.6)" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.inputBox}
                    placeholder="e.g., 500mg"
                    placeholderTextColor="#abadae"
                  />
                </View>
              </View>
            </View>

            {/* Section: Schedule */}
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionHeader}>DOSING SCHEDULE</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frequency</Text>
                <TouchableOpacity style={styles.dropdownContainer}>
                  <Text style={styles.dropdownText}>Twice daily</Text>
                  <MaterialIcons name="expand-more" size={20} color="#595c5d" />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Morning</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput 
                      style={styles.inputBox}
                      defaultValue="08:00"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Evening</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput 
                      style={styles.inputBox}
                      defaultValue="20:00"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Section: Duration */}
            <View style={styles.section}>
              <View style={styles.durationHeaderRow}>
                <Text style={styles.sectionHeader}>DURATION</Text>
                <View style={styles.ongoingToggleRow}>
                  <Text style={styles.ongoingText}>Ongoing</Text>
                  <Switch 
                    value={isOngoing} 
                    onValueChange={setIsOngoing}
                    trackColor={{ false: '#d9dddf', true: '#006a35' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start Date</Text>
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={styles.inputBox}
                      defaultValue="2023-10-27"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End Date</Text>
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={styles.inputBox}
                      placeholder="Select date"
                      placeholderTextColor="#abadae"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Section: Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Notes &amp; Instructions</Text>
              <TextInput 
                style={styles.textArea}
                placeholder="Instructions from doctor..."
                placeholderTextColor="#abadae"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* CTA */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit}>
                <LinearGradient
                  colors={['#006a35', '#2ecc71']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <MaterialIcons name="add-task" size={24} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Add Medication</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '600',
    color: '#143832',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 32,
  },
  section: {
    marginBottom: 16,
  },
  scheduleSection: {
    backgroundColor: '#eef1f2',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#595c5d',
    marginLeft: 4,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputBox: {
    flex: 1,
    fontSize: 16,
    color: '#2c2f30',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#2c2f30',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputContainer: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  durationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ongoingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ongoingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#595c5d',
    marginRight: 8,
  },
  textArea: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c2f30',
    height: 120,
  },
  ctaContainer: {
    paddingTop: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
