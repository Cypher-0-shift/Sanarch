import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function HeartRateScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#047857" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Heart Rate</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="more-vert" size={24} color="#747778" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Current Stat Card */}
        <View style={styles.statCard}>
          <View style={styles.cardDecorationRow}>
             <View style={styles.badgeNormal}>
               <Text style={styles.badgeTextNormal}>NORMAL</Text>
             </View>
          </View>

          <View style={styles.cardValueContainer}>
            <View style={styles.largeValueRow}>
              <Text style={styles.largeValue}>72</Text>
              <Text style={styles.largeUnit}>BPM</Text>
            </View>
            <Text style={styles.lastCheckedText}>Last checked 2 hours ago</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 32 }}>
            <LinearGradient
              colors={['#006a35', '#6bfe9c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.measureBtn}
            >
              <MaterialIcons name="favorite" size={24} color="#cdffd4" />
              <Text style={styles.measureBtnText}>Measure Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Trend Chart Section */}
        <View style={styles.trendSection}>
          <View style={styles.trendHeader}>
            <View>
              <Text style={styles.sectionTitle}>Trends</Text>
              <Text style={styles.subtext}>Last 7 days</Text>
            </View>
            <View style={styles.avgContainer}>
              <Text style={styles.avgLabel}>Avg</Text>
              <Text style={styles.avgValue}>74 BPM</Text>
            </View>
          </View>

          <View style={styles.chartArea}>
             {/* Fake Bars representing graph */}
             {[60, 45, 80, 70, 55, 90, 65].map((height, index) => (
                <View key={index} style={styles.chartBarWrapper}>
                   <View style={[styles.chartBarBg, { height: `${height}%` }]}>
                      <View style={[styles.chartBarFill, { height: `${height - 10}%` }]} />
                   </View>
                </View>
             ))}
          </View>
          <View style={styles.chartLabels}>
             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <Text key={day} style={styles.chartLabelText}>{day}</Text>
             ))}
          </View>
        </View>

        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>

          {/* Item 1 */}
          <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
            <View style={styles.historyCardLeft}>
              <View style={styles.historyIconWrapper}>
                <MaterialIcons name="favorite" size={24} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.historyValueText}>72 BPM</Text>
                <Text style={styles.historyDateText}>Today, 2:30 PM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
          </TouchableOpacity>

          {/* Item 2 */}
          <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
            <View style={styles.historyCardLeft}>
              <View style={styles.historyIconWrapper}>
                <MaterialIcons name="favorite" size={24} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.historyValueText}>75 BPM</Text>
                <Text style={styles.historyDateText}>Today, 9:15 AM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
          </TouchableOpacity>

          {/* Item 3 */}
          <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
            <View style={styles.historyCardLeft}>
              <View style={styles.historyIconWrapper}>
                <MaterialIcons name="favorite" size={24} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.historyValueText}>68 BPM</Text>
                <Text style={styles.historyDateText}>Yesterday, 11:45 PM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
          </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#064e3b',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardDecorationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeNormal: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeTextNormal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#005e3e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValueContainer: {
    alignItems: 'center',
  },
  largeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  largeValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 72,
    fontWeight: '800',
    color: '#2c2f30',
    letterSpacing: -2,
  },
  largeUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006a35',
  },
  lastCheckedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#595c5d',
    marginTop: 8,
  },
  measureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  measureBtnText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#cdffd4',
    marginLeft: 12,
  },
  trendSection: {
    backgroundColor: '#eef1f2',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  subtext: {
    fontSize: 14,
    color: '#595c5d',
    marginTop: 2,
  },
  avgContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  avgLabel: {
    fontSize: 12,
    color: '#595c5d',
    fontWeight: '500',
  },
  avgValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006a35',
  },
  chartArea: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarBg: {
    width: '100%',
    backgroundColor: 'rgba(0,106,53,0.1)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#006a35',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historySection: {
    marginBottom: 24,
  },
  historyTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyValueText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
  },
  historyDateText: {
    fontSize: 14,
    color: '#595c5d',
    marginTop: 2,
  },
});
