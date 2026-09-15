// NOTE: This screen requires a development build (not Expo Go)
// due to react-native-pdf native dependency.
// Run: npx expo prebuild && npx expo run:android
// Required: npx expo install expo-document-picker expo-image-picker
//   react-native-pdf react-native-svg react-native-gesture-handler
//   expo-image-manipulator

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  InteractionManager,
  Modal,
  Pressable,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DocumentAdjuster from '../../components/upload/DocumentAdjuster';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { uploadDocument, getDocumentStatus, confirmDocument } from '../../services/api';
import AnimatedPressable from '../../components/ui/Pressable';

// Categories
export const CATEGORIES = [
  { id: 'lab_report',       name: 'Lab Report',        icon: 'test-tube',         color: '#004D36', bg: '#E8F5E9' },
  { id: 'prescription',     name: 'Prescription',      icon: 'pill',              color: '#E65100', bg: '#FFF3E0' },
  { id: 'scan',             name: 'Imaging / Scan',    icon: 'radiology-box',     color: '#7B1FA2', bg: '#F3E5F5' },
  { id: 'hospital_summary', name: 'Discharge Summary', icon: 'hospital-building', color: '#0277BD', bg: '#E3F2FD' },
  { id: 'other',            name: 'Other',             icon: 'file-outline',      color: '#5C6E60', bg: '#F5F3F0' },
];

// Steps: 1=Select, 2=Adjust, 3=Label, 4=Details, 5=Review
const STEP_LABELS = ['Select', 'Adjust', 'Label', 'Details', 'Review'];

function ToolButton({
  icon, label, onPress, highlight = false, active = false,
}: {
  icon: string; label: string; onPress: () => void;
  highlight?: boolean; active?: boolean;
}) {
  const bg = active ? '#004D36' : highlight ? 'rgba(0,77,54,0.7)' : 'rgba(255,255,255,0.12)';
  return (
    <AnimatedPressable onPress={onPress} activeOpacity={0.75} style={{ alignItems: 'center', gap: 5 }}>
      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon as any} size={24} color={active || highlight ? 'white' : '#E5E2DE'} />
      </View>
      <Text style={{ color: active || highlight ? '#81C784' : '#819685', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export default function UploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ fileUri?: string; fileName?: string; fileType?: string }>();
  const token = useAuthStore((s) => s.token);

  // Steps: 1=Select, 2=Adjust, 3=Label, 4=Details, 5=Review
  const [step, setStep] = useState(1);
  const [showDiscard, setShowDiscard] = useState(false);

  // Hide tab bar on step 2 (fullscreen adjust), show on all others
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: step === 2 ? { display: 'none' } : undefined,
    });
  }, [step, navigation]);

  // File state — supports both photo URI and PDF URI
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'photo' | 'pdf' | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pdfPageImages, setPdfPageImages] = useState<string[]>([]); // Store converted PDF page images
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);

  // Adjustment state — DocumentAdjuster manages crop/rotate/fit internally
  // We just track the latest adjusted URI it emits
  const [adjustedUri, setAdjustedUri] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState('lab_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => {
      task.cancel();
      isMounted.current = false;
    };
  }, []);

  // Handle incoming file from home page FAB
  useEffect(() => {
    if (params.fileUri && isReady) {
      const uri = params.fileUri;
      const name = params.fileName || `Document_${Date.now()}`;
      const type = params.fileType || (uri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'photo');
      
      setFileUri(uri);
      setFileName(name);
      setFileType(type as 'photo' | 'pdf');
      
      if (type === 'photo') {
        setAdjustedUri(uri);
        setStep(2); // Go directly to adjustment step
      } else if (type === 'pdf') {
        setStep(2); // Show converting screen immediately
        // Convert PDF to images before showing adjustment step
        convertPdfToImages(uri).then((converted) => {
          if (!converted) {
            setStep(1); // Go back if failed
          }
        });
      }
    }
  }, [params.fileUri, params.fileName, params.fileType, isReady]);

  const resetState = () => {
    setFileUri(null); setFileName(''); setFileType(null);
    setAdjustedUri(null);
    setTotalPages(1); setCurrentPageIndex(0);
    setPdfPageImages([]);
    setCategory('lab_report'); setTitle(''); setDescription('');
    setUploading(false); setProgress(0); setSuccess(false);
    setSuccessMessage(null);
  };

  // Convert file URI to base64
  const fileUriToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to read file');
    }
  };

  // Convert PDF to images for editing
  const convertPdfToImages = async (pdfUri: string) => {
    setIsConvertingPdf(true);
    try {
      // Check if API URL is configured
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured. Please set EXPO_PUBLIC_API_URL in .env file.');
      }

      // Convert file URI to base64
      const base64Data = await fileUriToBase64(pdfUri);
      
      // Call backend API
      const formData = new FormData();
      formData.append('pdf_uri', base64Data);
      
      const headers: Record<string, string> = {};
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/v1/documents/pdf/convert`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Server error' }));
        throw new Error(error.detail || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        setPdfPageImages(data.images);
        setTotalPages(data.page_count);
        setIsConvertingPdf(false);
        return true;
      } else {
        throw new Error('No images returned from conversion');
      }
    } catch (error) {
      console.error('PDF conversion error:', error);
      
      let errorMessage = 'Failed to convert PDF. ';
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        errorMessage += 'Cannot connect to server. Please ensure:\n\n' +
          '1. Backend server is running (npm run dev in backend folder)\n' +
          '2. EXPO_PUBLIC_API_URL is set correctly in .env\n' +
          '3. Your device/emulator can reach the backend';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      Alert.alert(
        'PDF Conversion Failed',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { resetState(); setStep(1); } },
          { text: 'Retry', onPress: () => convertPdfToImages(pdfUri) }
        ]
      );
      setIsConvertingPdf(false);
      return false;
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.92 });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setFileUri(uri);
      setAdjustedUri(uri);
      setFileName('Photo_' + Date.now() + '.jpg');
      setFileType('photo');
      setStep(2);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.92,
      allowsMultipleSelection: true,
      // Phase D: exif metadata is not needed for document scanning.
      exif: false,
    });
    if (!result.canceled && result.assets?.length > 0) {
      // For now, take the first selected image and proceed
      // TODO: Support multi-page upload from multiple photos
      let uri = result.assets[0].uri;

      // Phase D: cap to MAX_UPLOAD_DIM px on the longest side using expo-image-manipulator.
      // The picker itself does not expose maxWidth/maxHeight in SDK 54, so we resize
      // post-pick before handing the URI to DocumentAdjuster. Images already within
      // bounds pass through with only a quality re-encode (compress: 0.92).
      const MAX_UPLOAD_DIM = 2048;
      const asset = result.assets[0];
      if (asset.width > MAX_UPLOAD_DIM || asset.height > MAX_UPLOAD_DIM) {
        try {
          const resized = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: MAX_UPLOAD_DIM } }],
            { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
          );
          uri = resized.uri;
        } catch {
          // Non-fatal — proceed with original if resize fails
        }
      }

      setFileUri(uri);
      setAdjustedUri(uri);
      setFileName(result.assets[0].fileName || 'Photo_' + Date.now() + '.jpg');
      setFileType('photo');
      setStep(2);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      
      const MAX_PDF_SIZE_MB = 15;
      if (file.size && file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          `PDF must be under ${MAX_PDF_SIZE_MB}MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
        );
        return;
      }

      setFileUri(file.uri);
      setAdjustedUri(null);
      setFileName(file.name ?? 'document.pdf');
      setFileType('pdf');
      setTotalPages(1);
      
      // Convert PDF to images for editing
      setStep(2); // Show converting screen immediately
      const converted = await convertPdfToImages(file.uri);
      if (!converted) {
        setStep(1); // Go back if failed
      }
    } catch {
      // cancelled
    }
  };

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) setCurrentPageIndex(p => p + 1);
    else setStep(3);
  }, [currentPageIndex, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) setCurrentPageIndex(p => p - 1);
  }, [currentPageIndex]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please add a title for this record.');
      return;
    }
    
    // Determine which URI to upload
    let uploadUri: string | null = null;
    let uploadFileName: string = fileName;
    let uploadMimeType: string = 'application/pdf';
    
    if (fileType === 'photo' && adjustedUri) {
      uploadUri = adjustedUri;
      uploadFileName = fileName || `photo_${Date.now()}.jpg`;
      uploadMimeType = 'image/jpeg';
    } else if (fileType === 'pdf' && pdfPageImages.length > 0) {
      // For PDFs, we upload the first adjusted page as representative
      // TODO: In future, support multi-page upload
      uploadUri = pdfPageImages[0];
      uploadFileName = fileName || `document_${Date.now()}.pdf`;
      uploadMimeType = 'application/pdf';
    } else if (fileUri) {
      uploadUri = fileUri;
    }
    
    if (!uploadUri) {
      Alert.alert('No File', 'Please select a file first.');
      return;
    }

    setStep(5);
    setUploading(true);
    setProgress(10);

    try {
      // Determine patient_id
      // If active profile is a dependent (not main account), use their id
      // Otherwise use the main user id (backend will use owner_id)
      const activeProfile = useProfileStore.getState().activeProfile;
      const currentUser = useAuthStore.getState().user;
      let patientId: string | undefined = undefined;

      if (activeProfile && !activeProfile.isMainAccount) {
        // Uploading for a dependent
        patientId = activeProfile.id;
      }
      // If main account, no patient_id needed — backend uses owner_id

      setProgress(20);

      // 1. Upload file (Async processing)
      const uploadResult = await uploadDocument(
        uploadUri,
        uploadFileName,
        uploadMimeType,
        category,
        title.trim(),
        description.trim() || '',
      );
      
      const documentId = uploadResult.document_id;
      setProgress(100);

      setSuccessMessage({ 
        title: 'Uploaded!', 
        subtitle: 'Your record has been saved and is being analyzed in the background.' 
      });
      setSuccess(true);
      
      // Free base64 images from memory
      setPdfPageImages([]);
      setAdjustedUri(null);

      // 4. Navigate to records after 2s
      setTimeout(() => {
        resetState();
        setStep(1);
        router.push('/(tabs)/records');
      }, 2000);

    } catch (error: any) {
      console.error('[Upload] Failed:', error);
      Alert.alert(
        'Upload Failed',
        error.message ?? 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
      setStep(4); // go back to details step
      setUploading(false);
      setProgress(0);
    }
  };

  const handleBack = () => {
    if (uploading || success) return;
    if (step === 2 && currentPageIndex > 0) { handlePrevPage(); return; }
    if (step > 1) {
      if (step === 2) { setFileUri(null); setFileName(''); setFileType(null); }
      setStep(step - 1);
    }
  };

  const handleClosePress = () => {
    if (step === 1) { router.back(); return; }
    if (uploading) return;
    setShowDiscard(true);
  };

  const confirmDiscard = () => {
    setShowDiscard(false);
    resetState();
    setStep(1);
    router.back();
  };

  if (!isReady) return <View style={{ flex: 1, backgroundColor: '#F5F3F0' }} />;

  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: step === 2 ? '#000' : '#F5F3F0' }}
      edges={step === 2 ? ['top', 'bottom'] : ['top']}
    >

      {/* -- HEADER (hidden on step 2) -- */}
      {step !== 2 && (
        <View style={s.header}>
          <View style={s.headerRow}>
            {/* Back � hidden on step 1 */}
            <View style={{ width: 40 }}>
              {step > 1 && (
                <AnimatedPressable onPress={handleBack} activeOpacity={0.75} style={s.iconBtn}>
                  <MaterialCommunityIcons name="chevron-left" size={24} color="#2D3A2F" />
                </AnimatedPressable>
              )}
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={s.headerTitle}>Upload Record</Text>
              <Text style={s.headerSub}>Step {step} of 5 • {STEP_LABELS[step - 1]}</Text>
            </View>

            <AnimatedPressable onPress={handleClosePress} activeOpacity={0.75} style={s.iconBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
            </AnimatedPressable>
          </View>

          {/* Progress bar */}
          <View style={s.progressRow}>
            {[1,2,3,4,5].map(i => {
              if (i < step) return (
                <View key={`step-${i}`} style={s.dotDone}>
                  <MaterialCommunityIcons name="check" size={10} color="white" />
                </View>
              );
              if (i === step) return <View key={`step-${i}`} style={s.dotActive} />;
              return <View key={`step-${i}`} style={s.dotIdle} />;
            })}
          </View>
        </View>
      )}

      {/* -- STEP 1: SELECT -- */}
      {step === 1 && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>Add a document</Text>
          <Text style={s.pageSubtitle}>Take a photo or upload a PDF from your device.</Text>

          <View style={{ gap: 16, marginTop: 8 }}>
            {/* Take Photo */}
            <AnimatedPressable onPress={handleTakePhoto} activeOpacity={0.8} style={s.sourceCard}>
              <View style={[s.sourceIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="camera-outline" size={28} color="#004D36" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sourceTitle}>Take Photo</Text>
                <Text style={s.sourceSub}>Scan a document with your camera</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
            </AnimatedPressable>

            {/* Upload Photo */}
            <AnimatedPressable onPress={handlePickPhoto} activeOpacity={0.8} style={s.sourceCard}>
              <View style={[s.sourceIcon, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="image-outline" size={28} color="#7B1FA2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sourceTitle}>Upload Photo</Text>
                <Text style={s.sourceSub}>Select images from gallery</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
            </AnimatedPressable>

            {/* Upload File */}
            <AnimatedPressable onPress={handlePickFile} activeOpacity={0.8} style={s.sourceCard}>
              <View style={[s.sourceIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="file-upload-outline" size={28} color="#0277BD" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sourceTitle}>Upload PDF</Text>
                <Text style={s.sourceSub}>Import a PDF from your device</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#C8D5CA" />
            </AnimatedPressable>
          </View>

          <View style={s.infoStrip}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#004D36" />
            <Text style={s.infoText}>
              Supported: JPEG photos and PDF files. After selecting, you can crop and rotate before uploading.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* -- STEP 2: ADJUST -- */}
      {step === 2 && fileUri && (
        <View style={{ flex: 1 }}>
          {isConvertingPdf ? (
            // Show loading state while converting PDF
            <View style={{ flex: 1, backgroundColor: '#F5F3F0' }}>
              <View style={s.adjTopBar}>
                <AnimatedPressable onPress={handleClosePress} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
                </AnimatedPressable>
                <Text style={s.adjFileName} numberOfLines={1}>
                  {fileName.length > 26 ? fileName.substring(0, 26) + '...' : fileName}
                </Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <View style={s.adjPreviewBox}>
                  <ActivityIndicator size="large" color="#004D36" />
                  <Text style={s.adjPreviewLabel}>Converting PDF...</Text>
                </View>
                <View style={s.adjPdfNote}>
                  <MaterialCommunityIcons name="information-outline" size={15} color="#004D36" />
                  <Text style={s.adjPdfNoteText}>
                    Converting PDF pages to images for editing. This may take a moment.
                  </Text>
                </View>
              </View>
            </View>
          ) : fileType === 'photo' && adjustedUri ? (
            // Photos: full interactive adjust with crop/rotate/fit
            <DocumentAdjuster
              pageUri={adjustedUri}
              pageNumber={currentPageIndex + 1}
              totalPages={totalPages}
              onAdjusted={(uri) => setAdjustedUri(uri)}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              onClose={() => {
                setShowDiscard(true);
              }}
              fileType="photo"
            />
          ) : fileType === 'pdf' && pdfPageImages.length > 0 ? (
            // PDF converted to images: editable
            <DocumentAdjuster
              pageUri={pdfPageImages[currentPageIndex]}
              pageNumber={currentPageIndex + 1}
              totalPages={pdfPageImages.length}
              onAdjusted={(uri) => {
                // Update the specific page in the array
                const updated = [...pdfPageImages];
                updated[currentPageIndex] = uri;
                setPdfPageImages(updated);
              }}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              onClose={() => {
                setShowDiscard(true);
              }}
              fileType="pdf"
            />
          ) : fileType === 'pdf' ? (
            // PDFs: Conversion failed or not yet converted - show error state
            <View style={{ flex: 1, backgroundColor: '#F5F3F0' }}>
              <View style={s.adjTopBar}>
                <AnimatedPressable onPress={handleClosePress} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
                </AnimatedPressable>
                <Text style={s.adjFileName} numberOfLines={1}>
                  {fileName.length > 26 ? fileName.substring(0, 26) + '...' : fileName}
                </Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <View style={s.adjPreviewBox}>
                  <MaterialCommunityIcons name="file-pdf-box" size={72} color="#E65100" />
                  <Text style={s.adjPreviewLabel}>Conversion Failed</Text>
                </View>
                <View style={[s.adjPdfNote, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#E65100" />
                  <Text style={s.adjPdfNoteText}>
                    Unable to convert PDF for editing. Please try again or upload a different file.
                  </Text>
                </View>
              </View>
              <View style={s.adjToolbar}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <AnimatedPressable onPress={() => { resetState(); setStep(1); }} activeOpacity={0.7} style={{ alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#004D36', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </View>
                    <Text style={{ color: '#004D36', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>
                      Back
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* -- STEP 3: LABEL -- */}
      {step === 3 && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>Label this document</Text>
          <Text style={s.pageSubtitle}>What type of record is this?</Text>

          <View style={{ gap: 8, marginTop: 8 }}>
            {CATEGORIES.map(cat => {
              const sel = category === cat.id;
              return (
                <AnimatedPressable key={cat.id} onPress={() => setCategory(cat.id)} activeOpacity={0.75}
                  style={[s.catCard, sel && s.catCardSel]}>
                  <View style={[s.catIcon, { backgroundColor: cat.bg }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text style={[s.catName, sel && { color: '#004D36' }]}>{cat.name}</Text>
                  <View style={[s.checkbox, sel && s.checkboxSel]}>
                    {sel && <MaterialCommunityIcons name="check" size={13} color="white" />}
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable onPress={() => setStep(4)} style={s.primaryBtn}>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            <Text style={s.primaryBtnText}>Continue</Text>
          </AnimatedPressable>
        </ScrollView>
      )}

      {/* -- STEP 4: DETAILS -- */}
      {step === 4 && (
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>Add details</Text>
          <Text style={s.pageSubtitle}>Give this record a title so you can find it later.</Text>

          <View style={s.formCard}>
            <Text style={s.fieldLabel}>Title *</Text>
            <TextInput
              value={title} onChangeText={setTitle}
              placeholder="e.g. CBC Report, Chest X-Ray Nov 2025"
              placeholderTextColor="#C8D5CA"
              style={[s.input, !title.trim() && s.inputEmpty]}
            />

            <Text style={s.fieldLabel}>Description (optional)</Text>
            <TextInput
              value={description} onChangeText={setDescription}
              placeholder="Any notes about this record..."
              placeholderTextColor="#C8D5CA"
              multiline numberOfLines={4}
              style={[s.input, s.inputMulti]}
              textAlignVertical="top"
            />
          </View>

          <AnimatedPressable
            onPress={() => { if (title.trim()) setStep(5); }}
            activeOpacity={title.trim() ? 0.8 : 1}
            style={[s.primaryBtn, { opacity: title.trim() ? 1 : 0.45 }]}
          >
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            <Text style={s.primaryBtnText}>Review</Text>
          </AnimatedPressable>
        </ScrollView>
      )}

      {/* -- STEP 5: REVIEW & SAVE -- */}
      {step === 5 && !uploading && !success && (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.pageTitle}>Review & Save</Text>
          <Text style={s.pageSubtitle}>Everything look good? Tap Save to upload.</Text>

          {/* Summary card */}
          <View style={s.reviewCard}>
            {/* File row */}
            <View style={s.reviewRow}>
              <View style={[s.reviewIcon, { backgroundColor: '#E3F2FD', overflow: 'hidden' }]}>
                {fileType === 'photo' && adjustedUri ? (
                  <Image source={{ uri: adjustedUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : fileType === 'pdf' && pdfPageImages.length > 0 ? (
                  <Image source={{ uri: pdfPageImages[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons
                    name={fileType === 'pdf' ? 'file-pdf-box' : 'image-outline'}
                    size={22} color="#0277BD" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reviewRowLabel}>File</Text>
                <Text style={s.reviewRowValue} numberOfLines={1}>{fileName}</Text>
              </View>
              <AnimatedPressable onPress={() => setStep(1)}>
                <Text style={s.editLink}>Edit</Text>
              </AnimatedPressable>
            </View>
            <View style={s.divider} />

            {/* Category row */}
            <View style={s.reviewRow}>
              <View style={[s.reviewIcon, { backgroundColor: selectedCat.bg }]}>
                <MaterialCommunityIcons name={selectedCat.icon as any} size={22} color={selectedCat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reviewRowLabel}>Category</Text>
                <Text style={s.reviewRowValue}>{selectedCat.name}</Text>
              </View>
              <AnimatedPressable onPress={() => setStep(3)}>
                <Text style={s.editLink}>Edit</Text>
              </AnimatedPressable>
            </View>
            <View style={s.divider} />

            {/* Title row */}
            <View style={s.reviewRow}>
              <View style={[s.reviewIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="text-short" size={22} color="#004D36" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reviewRowLabel}>Title</Text>
                <Text style={s.reviewRowValue}>{title}</Text>
                {description ? <Text style={s.reviewRowSub} numberOfLines={2}>{description}</Text> : null}
              </View>
              <AnimatedPressable onPress={() => setStep(4)}>
                <Text style={s.editLink}>Edit</Text>
              </AnimatedPressable>
            </View>
          </View>

          <AnimatedPressable onPress={handleSave} style={[s.primaryBtn, s.saveBtn]}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="white" />
            <Text style={s.primaryBtnText}>Save Record</Text>
          </AnimatedPressable>
        </ScrollView>
      )}

      {/* -- STEP 5: UPLOADING / SUCCESS -- */}
      {(uploading || success) && (
        <View style={s.processingWrap}>
          {success ? (
            <>
              <View style={s.successCircle}>
                <MaterialCommunityIcons name="check-circle" size={52} color="#004D36" />
              </View>
              <Text style={s.processingTitle}>{successMessage?.title ?? 'Saved!'}</Text>
              <Text style={s.processingSubtitle}>
                {successMessage?.subtitle ?? 'Your record has been uploaded and is being processed.'}
              </Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: '100%' }]} />
              </View>
            </>
          ) : (
            <>
              <View style={s.successCircle}>
                <ActivityIndicator size="large" color="#004D36" />
              </View>
              <Text style={s.processingTitle}>Uploading...</Text>
              <Text style={s.processingSubtitle}>
                Securely sending your document to the cloud.{'\n'}
                Analysis will continue in the background.
              </Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={s.progressPct}>{Math.round(progress)}%</Text>
            </>
          )}
        </View>
      )}

      {/* -- DISCARD MODAL -- */}
      <Modal visible={showDiscard} transparent animationType="fade" onRequestClose={() => setShowDiscard(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setShowDiscard(false)} />
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#E65100" />
            </View>
            <Text style={s.modalTitle}>Discard changes?</Text>
            <Text style={s.modalBody}>
              You'll lose your selected file and any adjustments you've made.
            </Text>
            <View style={s.modalBtns}>
              <AnimatedPressable onPress={() => setShowDiscard(false)} activeOpacity={0.8} style={s.modalBtnSecondary}>
                <Text style={s.modalBtnSecondaryText}>Keep editing</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={confirmDiscard} activeOpacity={0.8} style={s.modalBtnDestructive}>
                <Text style={s.modalBtnDestructiveText}>Discard</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  header: { backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E2DE' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#2D3A2F' },
  headerSub: { fontSize: 10, color: '#819685', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3F0', alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 },
  dotDone: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#004D36', alignItems: 'center', justifyContent: 'center' },
  dotActive: { height: 6, width: 28, borderRadius: 3, backgroundColor: '#004D36' },
  dotIdle: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#E5E2DE' },

  // Scroll content
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#004D36', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#5C6E60', fontFamily: 'Inter_400Regular', marginBottom: 28, lineHeight: 20 },

  // Step 1 � source cards
  sourceCard: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E2DE', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  sourceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2D3A2F', marginBottom: 2 },
  sourceSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#819685' },
  infoStrip: { marginTop: 28, backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 12, color: '#2D3A2F', fontFamily: 'Inter_400Regular', lineHeight: 18 },

  // Step 2 – adjust
  adjTopBar: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E2DE' },
  adjFileName: { flex: 1, color: '#2D3A2F', fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center', marginHorizontal: 8 },
  adjPageCount: { color: '#004D36', fontFamily: 'Inter_700Bold', fontSize: 12, minWidth: 40, textAlign: 'right' },
  adjPreviewBox: { width: 180, height: 220, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E2DE', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  adjPreviewLabel: { color: '#5C6E60', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center', paddingHorizontal: 12 },
  adjPdfNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 32, marginTop: 8, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  adjPdfNoteText: { flex: 1, color: '#2D3A2F', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  adjHint: { color: '#5C6E60', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 },
  adjToolbar: { backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 18, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#E5E2DE' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  processingOverlayText: { color: 'white', fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // Step 3  label
  catCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: 2, borderColor: '#E5E2DE', backgroundColor: 'white' },
  catCardSel: { borderColor: '#004D36', backgroundColor: '#F0F7F4' },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2D3A2F' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C8D5CA', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: '#004D36', borderColor: '#004D36' },

  // Step 4  details
  formCard: { backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: '#E5E2DE', padding: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#819685', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 },
  input: { backgroundColor: '#F5F3F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#2D3A2F', fontFamily: 'Inter_500Medium', marginBottom: 20 },
  inputEmpty: { borderWidth: 1, borderColor: '#E5E2DE' },
  inputMulti: { minHeight: 100, marginBottom: 0 },

  // Step 5 � review
  reviewCard: { backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: '#E5E2DE', marginBottom: 28, overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  reviewIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reviewRowLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#819685', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  reviewRowValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2D3A2F' },
  reviewRowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#5C6E60', marginTop: 2 },
  editLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#004D36' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E2DE', marginHorizontal: 16 },
  saveBtn: { shadowColor: '#004D36', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },

  // Processing / success
  processingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  processingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#2D3A2F', marginBottom: 8 },
  processingSubtitle: { fontSize: 14, color: '#5C6E60', fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  progressTrack: { width: '100%', height: 8, backgroundColor: '#E5E2DE', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#004D36', borderRadius: 4 },
  progressPct: { marginTop: 8, fontSize: 13, fontFamily: 'Inter_700Bold', color: '#004D36' },

  // Primary button
  primaryBtn: { backgroundColor: '#004D36', borderRadius: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  primaryBtnText: { color: 'white', fontFamily: 'Inter_700Bold', fontSize: 16 },

  // Discard modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40 },
  modalCard: { backgroundColor: 'white', borderRadius: 28, padding: 24 },
  modalIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2D3A2F', marginBottom: 8 },
  modalBody: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#5C6E60', lineHeight: 20, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F3F0', alignItems: 'center' },
  modalBtnSecondaryText: { fontFamily: 'Inter_700Bold', color: '#2D3A2F', fontSize: 15 },
  modalBtnDestructive: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#E65100', alignItems: 'center' },
  modalBtnDestructiveText: { fontFamily: 'Inter_700Bold', color: 'white', fontSize: 15 },
});
