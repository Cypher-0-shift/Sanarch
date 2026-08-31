import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlertStore } from '../../../store/alertStore';

const ISSUE_TYPES = [
  { id: 'bug', label: 'Bug', icon: 'bug-outline' },
  { id: 'data', label: 'Wrong data extraction', icon: 'file-alert-outline' },
  { id: 'account', label: 'Account issue', icon: 'account-alert-outline' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal-circle-outline' },
] as const;

type IssueType = typeof ISSUE_TYPES[number]['id'];

export default function ReportIssueScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedType) {
      useAlertStore.getState().showAlert('Select Issue Type', 'Please select what kind of issue you\'re reporting.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      useAlertStore.getState().showAlert('Add Details', 'Please describe the issue in at least a few words.');
      return;
    }

    const issueLabel = ISSUE_TYPES.find(t => t.id === selectedType)?.label || 'Issue';
    const subject = encodeURIComponent(`Sanarch App Report: ${issueLabel}`);
    const body = encodeURIComponent(`Issue Type: ${issueLabel}\n\nDescription:\n${description}`);
    const emailUrl = `mailto:eduindiafoundatiion@gmail.com?subject=${subject}&body=${body}`;

    Linking.openURL(emailUrl).then(() => {
      useAlertStore.getState().showAlert(
        'Email Client Opened',
        'Please send the email from your mail app to submit the report.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile/settings') }]
      );
    }).catch(() => {
      useAlertStore.getState().showAlert(
        'Error',
        'Could not open your email app. Please send an email to eduindiafoundatiion@gmail.com directly.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile/settings') }]
      );
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-white border-b border-[#E5E2DE] z-10 flex-row items-center justify-between" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#D2E7D6] items-center justify-center"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#004D36" />
        </TouchableOpacity>
        <Text className="text-[#004D36] text-xl font-display-bold tracking-tight">Report an Issue</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-6 pt-8"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Issue Type Picker */}
          <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-3 ml-1">
            What's the issue?
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {ISSUE_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.75}
                  className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                    isSelected
                      ? 'bg-[#004D36] border-[#004D36]'
                      : 'bg-white border-[#E5E2DE]'
                  }`}
                  style={!isSelected ? { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 } : {}}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={18}
                    color={isSelected ? 'white' : '#5C6E60'}
                  />
                  <Text
                    className={`text-sm font-display-bold ${
                      isSelected ? 'text-white' : 'text-[#2D3A2F]'
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-3 ml-1">
            Describe the issue
          </Text>
          <View
            className="bg-white border border-[#E5E2DE] rounded-[24px] p-1 mb-8"
            style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened. Include any steps to reproduce the issue if possible..."
              placeholderTextColor="#B0B0B0"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="px-4 py-4 text-sm font-display text-[#2D3A2F] min-h-[180px]"
              style={{ fontSize: 14, lineHeight: 22 }}
            />
          </View>

          {/* Character count */}
          <Text className="text-right text-[10px] font-display text-[#819685] mb-8 -mt-5 mr-2">
            {description.length} characters
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.75}
            className="w-full h-[56px] bg-[#004D36] rounded-[20px] items-center justify-center flex-row gap-2"
            style={{
              opacity: selectedType && description.trim().length >= 10 ? 1 : 0.5,
              shadowColor: '#004D36', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="send" size={18} color="white" />
            <Text className="text-white font-display-bold text-base">Submit Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
