import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import OTPInput from '../../components/ui/OTPInput';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleLogin = () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (otp.length !== 4) {
      Alert.alert('Enter OTP', 'Please enter the 4-digit verification code.');
      return;
    }
    router.replace('/(tabs)/home');
  };

  const handleResendOTP = () => {
    if (phone.length !== 10) {
      Alert.alert('Enter Phone', 'Please enter your phone number first.');
      return;
    }
    Alert.alert('OTP Sent', `A new verification code has been sent to +91 ${phone}.`);
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numeric input
    const digits = text.replace(/[^0-9]/g, '');
    setPhone(digits);
  };

  const handleDevLogin = () => {
    useAuthStore.getState().devLogin();
    router.replace('/(tabs)/home');
  };

  const isLoginDisabled = !agreed || phone.length !== 10;

  return (
    <SafeAreaView className="flex-1 bg-accent-green justify-center px-6">
      <View className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full mx-auto">
        {/* Card Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-primary/5">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#143832" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-primary">Sanarch</Text>
          <View className="w-6" />
        </View>

        {/* Content */}
        <View className="p-6">
          <Text className="text-3xl font-display-bold text-primary tracking-tight">
            Welcome to Sanarch
          </Text>
          <Text className="text-slate-500 text-sm mt-2 font-display">
            Enter your details to continue
          </Text>

          {/* Phone Field */}
          <View className="mt-6">
            <Text className="text-primary text-sm font-display-semibold mb-2">
              Phone Number
            </Text>
            <View className="relative justify-center">
              <Text className="absolute left-4 font-display-medium text-slate-800 z-10 text-base">
                +91
              </Text>
              <TextInput
                className="h-14 rounded-xl border border-slate-200 pl-14 pr-4 text-base font-display-medium text-slate-800"
                placeholder="Enter 10 digit number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
                maxLength={10}
              />
            </View>
          </View>

          {/* OTP Field */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-primary text-sm font-display-semibold">
                Verification Code
              </Text>
              <TouchableOpacity onPress={handleResendOTP}>
                <Text className="text-primary text-xs font-display-bold">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
            <OTPInput value={otp} onChange={setOtp} />
          </View>

          {/* Agreement Checkbox */}
          <View className="mt-6">
            <TouchableOpacity
              className="flex-row items-start"
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View
                className={`w-5 h-5 rounded-sm border-2 mr-3 mt-0.5 items-center justify-center ${
                  agreed ? 'bg-primary border-primary' : 'border-primary'
                }`}
              >
                {agreed && (
                  <MaterialCommunityIcons name="check" size={14} color="white" />
                )}
              </View>
              <Text className="flex-1 font-display text-sm text-slate-600">
                I agree to the{' '}
                <Text
                  className="text-primary font-display-bold"
                  onPress={() =>
                    Alert.alert('Privacy Policy', 'Privacy policy document coming soon.')
                  }
                >
                  Privacy Policy
                </Text>
                {' '}and{' '}
                <Text
                  className="text-primary font-display-bold"
                  onPress={() =>
                    Alert.alert('Terms & Conditions', 'Terms document coming soon.')
                  }
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="w-full h-14 bg-primary rounded-full items-center justify-center mt-6 shadow-sm"
            style={isLoginDisabled ? { opacity: 0.5 } : undefined}
            onPress={handleLogin}
            disabled={isLoginDisabled}
          >
            <Text className="text-white font-display-bold text-base">Login</Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            className="w-full h-14 rounded-full items-center justify-center mt-3 border-2 border-primary"
            onPress={() => router.push('/auth/onboarding')}
            activeOpacity={0.7}
          >
            <Text className="text-primary font-display-bold text-base">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-center text-xs text-slate-500 font-display mt-6 px-4">
        By continuing, you agree to Sanarch's{' '}
        <Text className="font-display-bold text-primary"
          onPress={() => Alert.alert('Terms of Service', 'Terms document coming soon.')}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text className="font-display-bold text-primary"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy policy document coming soon.')}>
          Privacy Policy
        </Text>
        .
      </Text>

      {/* Developer Mode */}
      <TouchableOpacity className="mt-4 self-center" onPress={handleDevLogin}>
        <Text className="text-xs text-slate-400 font-display underline">Developer Mode</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
