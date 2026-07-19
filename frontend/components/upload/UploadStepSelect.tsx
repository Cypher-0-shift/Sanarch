import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { useAlertStore } from '../../store/alertStore';

export interface SelectedFile {
  uri: string;
  name: string;
  type: 'photo' | 'pdf';
  mimeType: string;
}

interface UploadStepSelectProps {
  onSelectFiles: (files: SelectedFile[]) => void;
}

export default function UploadStepSelect({ onSelectFiles }: UploadStepSelectProps) {
  
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      useAlertStore.getState().showAlert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      onSelectFiles([{
        uri: asset.uri,
        name: asset.fileName || `Photo_${Date.now()}.jpg`,
        type: 'photo',
        mimeType: 'image/jpeg',
      }]);
    }
  };

  const handleChooseGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      useAlertStore.getState().showAlert('Permission Denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const files: SelectedFile[] = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `Image_${Date.now()}.jpg`,
        type: 'photo',
        mimeType: 'image/jpeg',
      }));
      onSelectFiles(files);
    }
  };

  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      onSelectFiles([{
        uri: asset.uri,
        name: asset.name,
        type: 'pdf',
        mimeType: 'application/pdf',
      }]);
    } catch (e: any) {
      console.error(e);
      useAlertStore.getState().showAlert('Upload Failed', 'Failed to pick document.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Document</Text>
      <Text style={styles.subtitle}>Select a medical record to analyze and store.</Text>

      <View style={styles.optionsContainer}>
        <Pressable style={styles.optionCard} onPress={handleTakePhoto}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(67,97,238,0.1)' }]}>
            <MaterialCommunityIcons name="camera" size={28} color={COLORS.brandPrimary} />
          </View>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>Take a Photo</Text>
            <Text style={styles.optionSubtitle}>Scan a physical document</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ink300} />
        </Pressable>

        <Pressable style={styles.optionCard} onPress={handleChooseGallery}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(123,31,162,0.1)' }]}>
            <MaterialCommunityIcons name="image-multiple" size={28} color="#7B1FA2" />
          </View>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>Choose from Gallery</Text>
            <Text style={styles.optionSubtitle}>Select one or multiple images</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ink300} />
        </Pressable>

        <Pressable style={styles.optionCard} onPress={handleUploadPdf}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(230,81,0,0.1)' }]}>
            <MaterialCommunityIcons name="file-pdf-box" size={28} color="#E65100" />
          </View>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>Upload PDF</Text>
            <Text style={styles.optionSubtitle}>Select a file from your device</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ink300} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING[6],
    paddingTop: SPACING[8],
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 28,
    color: COLORS.ink900,
    marginBottom: SPACING[2],
  },
  subtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 16,
    color: COLORS.ink600,
    marginBottom: SPACING[8],
  },
  optionsContainer: {
    gap: SPACING[4],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.ink100,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[4],
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  optionSubtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.ink600,
  },
});
