import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LABEL_OPTIONS = ['Lab Report', 'Prescription', 'Hospital Summary', 'Discharge', '+ Custom'];

export default function UploadScreen() {
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['Blood Test']);
  const [tagInput, setTagInput] = useState('');

  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'scanning' | 'extracting' | 'review' | 'error'
  >('idle');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('Lab Report');

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // ── Processing pipeline ────────────────────────────────────────────────────
  const startProcessing = async () => {
    setUploadStatus('uploading');
    await sleep(800);
    setUploadStatus('scanning');
    await sleep(1000);
    setUploadStatus('extracting');
    await sleep(1500);
    setExtractedData({
      document_type: 'Lab Report',
      document_date: '2026-01-15',
      hospital_name: 'City General Hospital',
      doctor_name: 'Dr. Arun Kumar',
      diagnosis: 'Routine blood work within normal limits',
      summary:
        'Complete blood count showing all values within normal reference ranges.',
    });
    setUploadStatus('review');
  };

  // ── Source handlers ────────────────────────────────────────────────────────
  const handleScan = async () => {
    setSelectedSource('scan');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) {
      setSelectedFile({
        uri: result.assets[0].uri,
        name: 'scan_' + Date.now() + '.jpg',
        size: 0,
        mimeType: 'image/jpeg',
      });
      startProcessing();
    }
  };

  const handlePDF = async () => {
    setSelectedSource('pdf');
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });
    if (!result.canceled) {
      setSelectedFile({
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        size: result.assets[0].size ?? 0,
        mimeType: 'application/pdf',
      });
      startProcessing();
    }
  };

  const handleImage = async () => {
    setSelectedSource('image');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) {
      setSelectedFile({
        uri: result.assets[0].uri,
        name: 'image_' + Date.now() + '.jpg',
        size: 0,
        mimeType: 'image/jpeg',
      });
      startProcessing();
    }
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = () => {
    Alert.alert('Saved!', 'Your record has been saved successfully.', [
      {
        text: 'View Records',
        onPress: () => router.push('/(tabs)/records'),
      },
      {
        text: 'Upload Another',
        onPress: () => {
          setUploadStatus('idle');
          setSelectedFile(null);
          setExtractedData(null);
          setSelectedSource(null);
        },
      },
    ]);
  };

  const isProcessing =
    uploadStatus === 'uploading' ||
    uploadStatus === 'scanning' ||
    uploadStatus === 'extracting';

  const statusText: Record<string, string> = {
    uploading: 'Uploading securely...',
    scanning: 'Scanning for viruses...',
    extracting: 'Extracting medical data with AI...',
  };

  const formatBytes = (bytes: number) => bytes === 0 ? 'Unknown size' : (bytes / 1024).toFixed(1) + ' KB';

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* HEADER */}
      <View className="bg-background-light/90 backdrop-blur-md px-4 py-4 flex-row items-center justify-between border-b border-primary/10">
        <TouchableOpacity 
          className="h-10 w-10 items-center justify-center"
          onPress={() => {
            if (uploadStatus !== 'idle') {
              setUploadStatus('idle');
              setSelectedFile(null);
              setExtractedData(null);
              setSelectedSource(null);
            } else {
              router.back();
            }
          }}
        >
          <MaterialCommunityIcons 
            name={uploadStatus === 'idle' ? 'arrow-left' : 'close'} 
            size={24} 
            color="#143832" 
          />
        </TouchableOpacity>
        <Text className="text-xl font-display-bold text-primary">Upload & Scan</Text>
        <View className="w-10" />
      </View>

      {/* SELECT SOURCE row */}
      {uploadStatus === 'idle' && (
        <View className="px-6 pt-6 pb-2">
          <Text className="text-xs font-display-semibold uppercase tracking-wider text-primary/60 mb-4">
            SELECT SOURCE
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className={`flex-1 bg-white rounded-xl p-4 items-center border shadow-sm ${selectedSource === 'scan' ? 'border-primary border-2 bg-primary/5' : 'border-primary/5'}`}
              onPress={handleScan}
            >
              <MaterialCommunityIcons name="camera-outline" size={48} color="#143832" />
              <Text className="text-sm font-display-medium text-slate-700 mt-2">Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-1 bg-white rounded-xl p-4 items-center border shadow-sm ${selectedSource === 'pdf' ? 'border-primary border-2 bg-primary/5' : 'border-primary/5'}`}
              onPress={handlePDF}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={48} color="#143832" />
              <Text className="text-sm font-display-medium text-slate-700 mt-2">PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-1 bg-white rounded-xl p-4 items-center border shadow-sm ${selectedSource === 'image' ? 'border-primary border-2 bg-primary/5' : 'border-primary/5'}`}
              onPress={handleImage}
            >
              <MaterialCommunityIcons name="image-outline" size={48} color="#143832" />
              <Text className="text-sm font-display-medium text-slate-700 mt-2">Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PROCESSING STATE */}
      {isProcessing && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View className="bg-white rounded-xl border border-primary/5 p-5 mb-4">
            <Text className="text-base font-display-medium text-slate-700 mb-4">
              {statusText[uploadStatus]}
            </Text>
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="80%" height={16} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="55%" height={16} />
          </View>
          
          {selectedFile && (
            <View className="bg-primary/5 rounded-xl p-4 flex-row items-center">
              <MaterialCommunityIcons name="file-document-outline" size={32} color="#143832" style={{ marginRight: 12 }} />
              <View className="flex-1">
                <Text className="font-display-semibold text-slate-900" numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text className="text-xs text-slate-500 font-display mt-0.5">
                  {formatBytes(selectedFile.size)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* REVIEW STATE */}
      {uploadStatus === 'review' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 128 }}>
          
          {/* Section 1: Extracted data card */}
          <View className="bg-white rounded-xl border border-primary/10 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-display-semibold uppercase tracking-wider text-primary/60">
                Extracted Data
              </Text>
              <TouchableOpacity onPress={() => Alert.alert('Edit', 'Editing coming soon.')}>
                <Text className="text-sm font-display-bold text-primary">Edit</Text>
              </TouchableOpacity>
            </View>
            
            {Object.entries(extractedData ?? {}).map(([key, value], index, array) => (
              <View 
                key={key} 
                className={`flex-row items-start py-2 ${index !== array.length - 1 ? 'border-b border-primary/5' : ''}`}
              >
                <Text className="text-xs text-slate-500 font-display w-28 mt-0.5">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text className="text-sm font-display-semibold text-slate-900 flex-1 ml-2">
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* Section 2: Label selector */}
          <View className="mb-4">
            <Text className="text-xs font-display-semibold uppercase tracking-wider text-primary/60 mb-3">
              DOCUMENT LABEL
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LABEL_OPTIONS.map(label =>
                label === '+ Custom' ? (
                  <TouchableOpacity key={label}
                    className="h-9 px-4 rounded-full items-center justify-center border border-dashed border-primary/30"
                    onPress={() => Alert.alert('Custom Label', 'Custom labels coming soon.')}
                  >
                    <Text className="text-sm font-display text-primary/60">+ Custom</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity key={label}
                    onPress={() => setSelectedLabel(label)}
                    className={`h-9 px-4 rounded-full items-center justify-center ${
                      selectedLabel === label ? 'bg-primary' : 'bg-primary/10'
                    }`}
                  >
                    <Text className={`text-sm font-display-medium ${
                      selectedLabel === label ? 'text-white' : 'text-primary'
                    }`}>{label}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* SAVE BUTTON */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-primary/10 px-6 py-4 pb-8">
        <TouchableOpacity
          disabled={uploadStatus !== 'review'}
          style={uploadStatus !== 'review' ? { opacity: 0.4 } : undefined}
          className="h-14 bg-primary rounded-full items-center justify-center flex-row"
          onPress={uploadStatus === 'review' ? handleSave : undefined}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="white" />
              <Text className="text-white font-display-bold ml-2">Processing...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-display-bold">Save Record</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
