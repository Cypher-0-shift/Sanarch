import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HeroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Sticky Nav (Simulated) */}
      <View className="bg-white/90 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex-row items-center justify-between z-10 sticky top-0">
        <View className="flex-row items-center">
          <View className="bg-primary/10 p-1.5 rounded-lg mr-2">
            <MaterialCommunityIcons name="shield-plus" size={24} color="#143832" />
          </View>
          <Text className="text-xl font-display-bold text-slate-900">Sanarch</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text className="text-primary font-display-bold text-base">Log In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero Section */}
        <View className="bg-accent-green px-6 pt-12 pb-16 relative overflow-hidden">
          {/* Decorative blurred background shapes */}
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 blur-3xl rounded-full" />
          
          <Text className="text-primary font-display-bold tracking-widest uppercase text-xs mb-3">
            YOUR HEALTH, DIGITIZED
          </Text>
          
          <Text className="text-[40px] leading-[48px] font-display-bold text-primary mb-4 tracking-tight">
            Manage Your Health Records Easily
          </Text>
          
          <Text className="text-slate-600 font-display text-base leading-relaxed mb-8">
            Securely access, store, and share your medical history across all partner hospitals with your unique Sanarch SMART-ID.
          </Text>

          <View className="w-full gap-3">
            <TouchableOpacity 
              className="bg-primary h-14 rounded-xl items-center justify-center w-full"
              onPress={() => router.push('/auth/login')}
            >
              <Text className="text-white font-display-bold text-base">Get Started</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="h-14 rounded-xl items-center justify-center w-full border-2 border-primary/20 bg-white/50"
              onPress={() => Alert.alert('Demo Coming Soon', 'A full walkthrough video is being produced. Check back soon.')}
            >
              <Text className="text-primary font-display-bold text-base">Watch Demo</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Image / Security Badge */}
          <View className="mt-12 relative w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
             <View className="absolute inset-0 items-center justify-center bg-primary/5">
                <MaterialCommunityIcons name="hospital-building" size={80} color="#94A3B8" />
             </View>
             
             {/* Floating Badge */}
             <View className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-primary/10 flex-row items-center">
               <View className="h-10 w-10 rounded-full bg-green-100 items-center justify-center mr-3">
                 <MaterialCommunityIcons name="lock-check" size={20} color="#166534" />
               </View>
               <View>
                 <Text className="font-display-bold text-slate-900 text-sm">Security Status</Text>
                 <Text className="text-green-700 font-display-medium text-xs">Fully Encrypted</Text>
               </View>
             </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6 py-12 bg-white">
          <Text className="text-2xl font-display-bold text-primary mb-4 text-center">
            Why Choose Sanarch?
          </Text>

          {/* Why Sanarch? paragraph */}
          <Text className="text-slate-600 font-display text-base leading-relaxed mb-8 text-center">
            Every time you visit a new doctor, you carry a bag of old reports. Sanarch eliminates that — your entire medical history, organized, searchable, and shareable in seconds.
          </Text>

          <View className="gap-6 flex-col">
            {/* Feature 1 */}
            <View className="flex-row items-start">
              <View className="h-12 w-12 rounded-xl bg-accent-green/50 items-center justify-center mr-4 mt-1 border border-primary/5">
                <MaterialCommunityIcons name="brain" size={24} color="#143832" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-display-bold text-slate-900 mb-1">AI-Powered Extraction</Text>
                <Text className="text-slate-500 font-display text-sm leading-relaxed">Upload any medical report. Our AI reads it, extracts diagnoses, medications, and lab values automatically.</Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View className="flex-row items-start">
              <View className="h-12 w-12 rounded-xl bg-accent-green/50 items-center justify-center mr-4 mt-1 border border-primary/5">
                <MaterialCommunityIcons name="timeline-clock-outline" size={24} color="#143832" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-display-bold text-slate-900 mb-1">Structured Health Timeline</Text>
                <Text className="text-slate-500 font-display text-sm leading-relaxed">Every visit, test, and prescription organized chronologically. Your complete medical story in one place.</Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View className="flex-row items-start">
              <View className="h-12 w-12 rounded-xl bg-accent-green/50 items-center justify-center mr-4 mt-1 border border-primary/5">
                <MaterialCommunityIcons name="qrcode-scan" size={24} color="#143832" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-display-bold text-slate-900 mb-1">Doctor's View</Text>
                <Text className="text-slate-500 font-display text-sm leading-relaxed">Generate a timed QR code. Your doctor scans it for instant access. Expires in 10 minutes.</Text>
              </View>
            </View>

            {/* Feature 4 */}
            <View className="flex-row items-start">
              <View className="h-12 w-12 rounded-xl bg-accent-green/50 items-center justify-center mr-4 mt-1 border border-primary/5">
                <MaterialCommunityIcons name="account-group-outline" size={24} color="#143832" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-display-bold text-slate-900 mb-1">Family Profiles</Text>
                <Text className="text-slate-500 font-display text-sm leading-relaxed">Manage health records for every family member under one account with separate Sanarch IDs.</Text>
              </View>
            </View>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
