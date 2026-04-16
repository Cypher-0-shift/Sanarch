import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function MedicationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()} 
          >
            <MaterialIcons name="arrow-back" size={24} color="#059669" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medications</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-medication')}
        >
          <MaterialIcons name="add" size={24} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.dateText}>Oct 24, 2023</Text>
          </View>

          {/* Morning Section */}
          <View style={styles.timeSection}>
            <View style={styles.timeHeader}>
              <MaterialIcons name="wb-sunny" size={18} color="#006a35" />
              <Text style={styles.timeText}>MORNING (8:00 AM)</Text>
            </View>

            {/* Card 1 */}
            <View style={[styles.medCard, { borderLeftColor: '#059669', borderLeftWidth: 4 }]}>
              <View style={styles.medCardHeader}>
                <View>
                  <Text style={styles.medTitle}>Metformin 500mg</Text>
                  <View style={styles.medSubtitleRow}>
                    <MaterialIcons name="restaurant" size={14} color="#595c5d" />
                    <Text style={styles.medSubtitle}>After breakfast</Text>
                  </View>
                </View>
                <View style={styles.badgeRequired}>
                  <Text style={styles.badgeTextRequired}>Required</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnTaken}>
                  <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                  <Text style={styles.btnTakenText}>Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSkip}>
                  <Text style={styles.btnSkipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSnooze}>
                  <Text style={styles.btnSnoozeText}>Snooze</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2 */}
            <View style={[styles.medCard, { borderLeftColor: '#059669', borderLeftWidth: 4 }]}>
              <View style={styles.medCardHeader}>
                <View>
                  <Text style={styles.medTitle}>Aspirin 75mg</Text>
                  <View style={styles.medSubtitleRow}>
                    <MaterialIcons name="restaurant" size={14} color="#595c5d" />
                    <Text style={styles.medSubtitle}>After breakfast</Text>
                  </View>
                </View>
                <View style={styles.badgeDaily}>
                  <Text style={styles.badgeTextDaily}>Daily</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnTaken}>
                  <MaterialIcons name="check-circle" size={16} color="#ffffff" />
                  <Text style={styles.btnTakenText}>Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSkip}>
                  <Text style={styles.btnSkipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSnooze}>
                  <Text style={styles.btnSnoozeText}>Snooze</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Afternoon Section */}
          <View style={[styles.timeSection, { marginTop: 24 }]}>
            <View style={styles.timeHeader}>
              <MaterialIcons name="light-mode" size={18} color="#747778" />
              <Text style={[styles.timeText, { color: '#747778' }]}>AFTERNOON (2:00 PM)</Text>
            </View>

            {/* Empty State Card */}
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIcons name="local-pharmacy" size={24} color="#abadae" />
              </View>
              <Text style={styles.emptyText}>No medications scheduled</Text>
            </View>
          </View>
        </View>

        {/* Your Prescriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Prescriptions</Text>
            <TouchableOpacity>
              <Text style={styles.viewHistoryText}>View History</Text>
            </TouchableOpacity>
          </View>

          {/* Prescription Card */}
          <View style={styles.prescriptionCard}>
            <View style={styles.prescriptionBlur} />
            <View style={styles.prescriptionHeader}>
              <View style={styles.prescriptionInfoRow}>
                <View style={styles.pillIconContainer}>
                  <MaterialIcons name="local-pharmacy" size={24} color="#006a35" />
                </View>
                <View>
                  <Text style={styles.medTitle}>Metformin 500mg</Text>
                  <Text style={styles.prescriptionMetadata}>2X DAILY • 25 DAYS LEFT</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MaterialIcons name="more-vert" size={24} color="#abadae" />
              </TouchableOpacity>
            </View>

            <View style={styles.doctorInfoRow}>
              <View style={styles.doctorImageWrapper}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9Wq0nSzPqZ_o9wviDcD-iVp9f2TljY5HQS4UtZR563L0L6wQgecQzBxrH0ghafDnnmN2VUrO1LzjnGiVEUMBa9Cn4BgcMRqQwLF9HNzD451KfonH_5MHaKJppVh7hbUguqHDnRV2VG53AGNWKKJMZblYMYR_oa5ML6QfGIT8y-taJOYPFdixmhbsWwvaElgFxLdhhy9CT9Nrt4gA4OKZgiq0OdcsWKQrCX-q_MvmEMLZfW5LBoiGCNfWqgIPbosNEmz2pEBut' }}
                  style={styles.doctorImage}
                />
              </View>
              <Text style={styles.doctorText}>
                Prescribed by <Text style={styles.doctorName}>Dr. Sharma</Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#006a35" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.02)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: -0.5,
  },
  addButton: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '700',
    color: '#2c2f30',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#747778',
  },
  timeSection: {
    marginBottom: 16,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#006a35',
    marginLeft: 12,
    textTransform: 'uppercase',
  },
  medCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
  },
  medSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  medSubtitle: {
    fontSize: 14,
    color: '#595c5d',
    marginLeft: 4,
  },
  badgeRequired: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextRequired: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005e3e',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  badgeDaily: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextDaily: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005e3e',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnTaken: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#006a35',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTakenText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  btnSkip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eef1f2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSkipText: {
    color: '#747778',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSnooze: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffedd5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSnoozeText: {
    color: '#c2410c',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: 'rgba(238, 241, 242, 0.5)',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#abadae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dfe3e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#747778',
  },
  viewHistoryText: {
    color: '#006a35',
    fontSize: 14,
    fontWeight: '700',
  },
  prescriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  prescriptionBlur: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(107, 254, 156, 0.1)',
    borderRadius: 60,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 10,
  },
  prescriptionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  prescriptionMetadata: {
    color: '#006a35',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    zIndex: 10,
  },
  doctorImageWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d0d5d7',
    overflow: 'hidden',
    marginRight: 8,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  doctorText: {
    fontSize: 14,
    color: '#595c5d',
    fontWeight: '500',
  },
  doctorName: {
    color: '#2c2f30',
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(171, 173, 174, 0.3)',
    borderRadius: 12,
    zIndex: 10,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
  },
});
