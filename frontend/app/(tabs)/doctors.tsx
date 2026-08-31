import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlertStore } from '../../store/alertStore';

export default function ShareRecordsScreen() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const showAlert = useAlertStore((s) => s.showAlert);

  const handleNotifyPress = () => {
    if (!isSubscribed) {
      setIsSubscribed(true);
      showAlert(
        'Early Access Confirmed! 🎉',
        'You will be among the first to get instant doctor QR sharing when this feature launches in the next update.'
      );
    } else {
      showAlert(
        'Already on the list',
        'You are already subscribed to receive early access notifications for doctor sharing.'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAF9]" edges={['top']}>
      {/* Background Gradient Mesh */}
      <LinearGradient
        colors={['#F8FAF9', '#E8F5E9', '#F0F5F2']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: -1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View className="px-6 pt-4 pb-3.5 flex-row items-center justify-between bg-white/70 border-b border-[#E5E2DE] z-10">
        <View>
          <Text className="text-2xl font-display-bold text-[#004D36]">Share Records</Text>
          <Text className="text-xs text-[#5C6E60] font-display-medium mt-0.5">
            Instant Doctor Access & Privacy
          </Text>
        </View>
        <View className="bg-[#E8F5E9] border border-[#C8E6C9] px-3 py-1 rounded-full">
          <Text className="text-[11px] font-display-bold text-[#004D36] uppercase tracking-wider">
            Coming Soon
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Card */}
        <View className="bg-white rounded-[28px] p-6 border border-[#E5E2DE] shadow-sm mb-6 items-center overflow-hidden relative">
          <MaterialCommunityIcons 
            name="qrcode-scan" 
            size={160} 
            color="#004D36" 
            style={{ position: 'absolute', top: -30, right: -40, opacity: 0.04 }} 
          />

          {/* Glowing Icon Container */}
          <View className="w-24 h-24 rounded-[24px] bg-[#E8F5E9] border-2 border-[#C8E6C9] items-center justify-center mb-5 shadow-sm">
            <MaterialCommunityIcons name="qrcode-scan" size={44} color="#004D36" />
          </View>

          <View className="bg-[#E8F5E9] px-3.5 py-1 rounded-full mb-3 border border-[#C8E6C9]">
            <Text className="text-[11px] font-display-bold text-[#004D36] uppercase tracking-widest">
              Feature in Progress
            </Text>
          </View>

          <Text className="text-2xl font-display-bold text-[#2D3A2F] text-center mb-2">
            Instant Doctor Sharing
          </Text>
          
          <Text className="text-sm font-display text-[#5C6E60] text-center leading-5 px-2 mb-6">
            Effortlessly share test results, diagnoses, and prescriptions with consulting doctors via temporary, self-expiring QR codes. Zero login required for the doctor.
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleNotifyPress}
            activeOpacity={0.8}
            className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm ${
              isSubscribed ? 'bg-[#E8F5E9] border border-[#004D36]' : 'bg-[#004D36]'
            }`}
          >
            <MaterialCommunityIcons 
              name={isSubscribed ? "check-circle" : "bell-ring-outline"} 
              size={18} 
              color={isSubscribed ? "#004D36" : "#FFFFFF"} 
            />
            <Text className={`font-display-bold text-sm ${isSubscribed ? 'text-[#004D36]' : 'text-white'}`}>
              {isSubscribed ? "You're on the early access list" : "Notify Me When Available"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature Preview Section */}
        <Text className="text-base font-display-bold text-[#2D3A2F] mb-3 px-1">
          What's Coming in Doctor Sharing:
        </Text>

        <View className="flex-col gap-3 mb-6">
          {/* Tile 1 */}
          <View className="bg-white rounded-[20px] p-4 border border-[#E5E2DE] flex-row items-start gap-4 shadow-sm">
            <View className="w-11 h-11 rounded-xl bg-[#E8F5E9] items-center justify-center shrink-0">
              <MaterialCommunityIcons name="timer-sand" size={22} color="#004D36" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-display-bold text-[#2D3A2F] mb-0.5">
                10-Minute Expiring QR Codes
              </Text>
              <Text className="text-[13px] font-display text-[#718575] leading-5">
                Generates a one-time access token that automatically expires after consultation for total privacy.
              </Text>
            </View>
          </View>

          {/* Tile 2 */}
          <View className="bg-white rounded-[20px] p-4 border border-[#E5E2DE] flex-row items-start gap-4 shadow-sm">
            <View className="w-11 h-11 rounded-xl bg-[#E3F2FD] items-center justify-center shrink-0">
              <MaterialCommunityIcons name="account-search-outline" size={22} color="#0277BD" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-display-bold text-[#2D3A2F] mb-0.5">
                Zero Doctor Sign-Up
              </Text>
              <Text className="text-[13px] font-display text-[#718575] leading-5">
                Doctors simply scan the QR code with their mobile phone or tablet to open a clean web viewer.
              </Text>
            </View>
          </View>

          {/* Tile 3 */}
          <View className="bg-white rounded-[20px] p-4 border border-[#E5E2DE] flex-row items-start gap-4 shadow-sm">
            <View className="w-11 h-11 rounded-xl bg-[#FFF3E0] items-center justify-center shrink-0">
              <MaterialCommunityIcons name="tune-variant" size={22} color="#E65100" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-display-bold text-[#2D3A2F] mb-0.5">
                Selective Record Privacy
              </Text>
              <Text className="text-[13px] font-display text-[#718575] leading-5">
                You decide what to share: hand-pick individual lab tests or share your complete health timeline.
              </Text>
            </View>
          </View>

          {/* Tile 4 */}
          <View className="bg-white rounded-[20px] p-4 border border-[#E5E2DE] flex-row items-start gap-4 shadow-sm">
            <View className="w-11 h-11 rounded-xl bg-[#F3E5F5] items-center justify-center shrink-0">
              <MaterialCommunityIcons name="shield-check" size={22} color="#7B1FA2" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-display-bold text-[#2D3A2F] mb-0.5">
                Instant Revocation
              </Text>
              <Text className="text-[13px] font-display text-[#718575] leading-5">
                Revoke shared access anytime with one tap right from your Sanarch app.
              </Text>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View className="bg-[#E8F5E9]/70 rounded-[20px] p-4 border border-[#C8E6C9] flex-row items-center gap-3">
          <MaterialCommunityIcons name="lock-check" size={20} color="#004D36" />
          <Text className="text-xs font-display-medium text-[#004D36] flex-1 leading-4">
            All shared data is end-to-end encrypted with scoped tokens. Your primary credentials remain completely secure.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
