/**
 * Upload Wizard Controller — Phase 6
 *
 * Manages the 4-step upload flow:
 * 1. Select
 * 2. Adjust
 * 3. Confirm & Label
 * 4. Processing
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useUploadStore } from '../../store/uploadStore';
import { useAlertStore } from '../../store/alertStore';

import UploadStepSelect, { SelectedFile } from '../../components/upload/UploadStepSelect';
import UploadStepAdjust from '../../components/upload/UploadStepAdjust';
import UploadStepConfirm from '../../components/upload/UploadStepConfirm';
import UploadStepProcessing from '../../components/upload/UploadStepProcessing';
import { COLORS } from '../../constants/theme';

export { CATEGORIES } from '../../components/upload/UploadStepConfirm';

export default function UploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ fileUri?: string; fileName?: string; fileType?: string }>();
  
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  const startUpload = useUploadStore(s => s.startUpload);

  // If launched from FAB with params, we could prepopulate (not strictly required if FAB just routes here, but keeping for compatibility)
  useEffect(() => {
    if (params.fileUri && step === 1) {
      setFiles([{
        uri: params.fileUri,
        name: params.fileName || `File_${Date.now()}`,
        type: params.fileType === 'pdf' ? 'pdf' : 'photo',
        mimeType: params.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'
      }]);
      setStep(2); // Jump to adjust
    }
  }, [params.fileUri]);

  // Hide tab bar on step 2 (Fullscreen Adjust) and step 4 (Processing)
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: (step === 2 || step === 4) ? { display: 'none' } : undefined,
    });
  }, [step, navigation]);

  // Handlers
  const handleSelectFiles = (selectedFiles: SelectedFile[]) => {
    setFiles(selectedFiles);
    setStep(2);
  };

  const handleConfirmAdjust = (adjustedFiles: SelectedFile[]) => {
    setFiles(adjustedFiles);
    setStep(3);
  };

  const handleCancelAdjust = () => {
    setFiles([]);
    setStep(1);
  };

  const handleConfirmMetadata = async (category: string, title: string, notes: string) => {
    setIsRetrying(true);
    try {
      const tasks = files.map((f, i) => ({
        uri: f.uri,
        name: f.name,
        mimeType: f.mimeType,
        category,
        title: files.length > 1 ? `${title} (${i + 1})` : title,
        notes
      }));
      
      // Move to step 4 immediately so the UI shows progress
      setStep(4);
      
      await startUpload(tasks);
    } catch (e: any) {
      // Step 4 will unmount, we revert to Step 3
      setStep(3);
      useAlertStore.getState().showAlert('Upload Failed', e.message || 'Check your connection and try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <UploadStepSelect onSelectFiles={handleSelectFiles} />
      )}
      
      {step === 2 && (
        <UploadStepAdjust 
          files={files} 
          onConfirmFiles={handleConfirmAdjust} 
          onCancel={handleCancelAdjust} 
        />
      )}
      
      {step === 3 && (
        <UploadStepConfirm
          onConfirm={handleConfirmMetadata}
          onBack={() => setStep(2)}
          suggestedTitle="" // Could integrate AI prescan logic here in the future
          isRetrying={isRetrying}
        />
      )}

      {step === 4 && (
        <UploadStepProcessing />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  }
});
