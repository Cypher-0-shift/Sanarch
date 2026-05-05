import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MOCK_MEDICAL_EVENTS, MOCK_USER } from '../../constants/mock';
import MedicalEventCard from '../../components/records/MedicalEventCard';
import QRDisplay from '../../components/doctors/QRDisplay';

export default function DoctorsScreen() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'generating' | 'qr' | 'expired'>('select');
  const [qrValue, setQrValue] = useState('');

  const toggleEvent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const generateQR = async () => {
    setStep('generating');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const token = JSON.stringify({
      events: selectedIds,
      user: MOCK_USER.sanarch_id,
      exp: Date.now() + 600000,
    });
    setQrValue(token);
    setStep('qr');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Scan this QR code to access my Sanarch medical records. Token expires in 10 minutes.',
        title: 'Sanarch Medical Records',
      });
    } catch {
      // user cancelled
    }
  };

  const resetFlow = () => {
    setStep('select');
    setSelectedIds([]);
  };

  // ── SELECT STEP ────────────────────────────────────────────────────────────
  if (step === 'select') {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-slate-100">
          <Text className="text-xl font-display-bold text-primary">Doctor's View</Text>
        </View>

        {/* Instruction card */}
        <View className="bg-accent-green rounded-xl p-4 mx-4 mt-4 mb-6 flex-row">
          <MaterialCommunityIcons
            name="information-outline"
            size={24}
            color="#143832"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <Text className="font-display text-sm text-primary flex-1 leading-relaxed">
            Select the records you want to share, then generate a QR code your
            doctor can scan. Access expires in 10 minutes.
          </Text>
        </View>

        {/* Events list */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_MEDICAL_EVENTS.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => toggleEvent(item.id)}
                className="relative"
              >
                {/* Selection border wrapper */}
                <View
                  className={`rounded-xl ${
                    isSelected ? 'border-2 border-primary' : 'border-2 border-transparent'
                  }`}
                >
                  <MedicalEventCard
                    id={item.id}
                    condition={item.condition}
                    date_start={item.date_start}
                    date_end={item.date_end ?? undefined}
                    hospital={item.hospital}
                    doctor={item.doctor}
                    document_count={item.document_count}
                    label={item.label}
                    onPress={() => toggleEvent(item.id)}
                  />
                </View>

                {/* Checkbox overlay */}
                <View className="absolute top-3 right-3 z-10">
                  {isSelected ? (
                    <View className="h-6 w-6 rounded-full bg-green-600 items-center justify-center">
                      <MaterialCommunityIcons name="check" size={16} color="white" />
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border-2 border-slate-300 bg-white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom sticky button */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8">
          <Text className="text-sm text-slate-500 font-display text-center mb-3">
            {selectedIds.length} record(s) selected
          </Text>
          <TouchableOpacity
            className="w-full h-14 bg-primary rounded-full items-center justify-center"
            style={selectedIds.length === 0 ? { opacity: 0.5 } : undefined}
            disabled={selectedIds.length === 0}
            onPress={generateQR}
          >
            <Text className="text-white font-display-bold text-base">Generate QR Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── GENERATING STEP ────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        <View className="items-center justify-center flex-1">
          <View className="h-28 w-28 rounded-full border-4 border-primary/30 items-center justify-center">
            <ActivityIndicator size="large" color="#143832" />
          </View>
          <Text className="mt-6 font-display-medium text-slate-600 text-base">
            Generating secure QR code...
          </Text>
          <Text className="mt-1 text-sm font-display text-slate-400">
            Preparing your selected records
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── QR STEP ────────────────────────────────────────────────────────────────
  if (step === 'qr') {
    return (
      <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
          <Text className="text-xl font-display-bold text-primary">Doctor's View</Text>
          <TouchableOpacity onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant" size={24} color="#143832" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 }}>
          {/* QR Card */}
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-primary/10 items-center mb-6">
            <QRDisplay
              value={qrValue}
              durationSeconds={600}
              onExpired={() => setStep('expired')}
            />
            <Text className="text-xs font-display-bold text-primary mt-4">
              Sanarch ID: {MOCK_USER.sanarch_id}
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              {selectedIds.length} record(s) shared
            </Text>
          </View>

          {/* Warning Card */}
          <View className="bg-amber-50 rounded-xl p-4 flex-row mb-6">
            <MaterialCommunityIcons name="alert-outline" size={20} color="#B45309" style={{ marginRight: 12, marginTop: 2 }} />
            <Text className="text-sm font-display text-amber-800 flex-1 leading-relaxed">
              This QR code will expire automatically. Only show it in person — never share digitally.
            </Text>
          </View>

          {/* Select Different Records button */}
          <TouchableOpacity
            className="border-2 border-primary rounded-full h-14 items-center justify-center"
            onPress={resetFlow}
          >
            <Text className="text-primary font-display-bold">
              Select Different Records
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── EXPIRED STEP ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#94A3B8" />
        <Text className="text-xl font-display-bold text-slate-900 mt-4">QR Code Expired</Text>
        <Text className="text-sm text-slate-500 font-display text-center mt-2">
          The 10-minute access window has closed for security.
        </Text>
        <TouchableOpacity
          className="mt-8 w-full h-14 bg-primary rounded-full items-center justify-center"
          onPress={resetFlow}
        >
          <Text className="text-white font-display-bold">Generate New Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
