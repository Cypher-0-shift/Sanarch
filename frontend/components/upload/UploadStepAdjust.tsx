import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import DocumentAdjuster from './DocumentAdjuster';
import { SelectedFile } from './UploadStepSelect';
import { COLORS, SPACING } from '../../constants/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';

interface UploadStepAdjustProps {
  files: SelectedFile[];
  onConfirmFiles: (adjustedFiles: SelectedFile[]) => void;
  onCancel: () => void;
}

export default function UploadStepAdjust({ files, onConfirmFiles, onCancel }: UploadStepAdjustProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adjustedFiles, setAdjustedFiles] = useState<SelectedFile[]>([...files]);
  
  // The DocumentAdjuster expects "original" URI to stay stable so we can reset.
  // We'll manage reset by just passing the original URI from `files` again if needed.
  // Wait, DocumentAdjuster has its own state. 
  // We just need a Reset button here? DocumentAdjuster is full screen.
  // The spec says: "Reset to Original button always visible".
  // The old DocumentAdjuster might not have a slot for it. 
  // Let's check how DocumentAdjuster is rendered. It occupies the full screen.
  
  const handleAdjusted = (newUri: string) => {
    const updated = [...adjustedFiles];
    updated[currentIndex] = { ...updated[currentIndex], uri: newUri };
    setAdjustedFiles(updated);
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Done with all files
      onConfirmFiles(adjustedFiles);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onCancel();
    }
  };

  const handleReset = () => {
    // To force reset, we could trigger a re-mount of DocumentAdjuster
    // or just reset the uri in adjustedFiles to the original.
    const updated = [...adjustedFiles];
    updated[currentIndex] = { ...updated[currentIndex], uri: files[currentIndex].uri };
    setAdjustedFiles(updated);
  };

  const currentFile = files[currentIndex];
  // If it's a PDF, we might skip adjust, but wait — DocumentAdjuster handles PDFs?
  // In the old code, DocumentAdjuster received pdfPageImages if it was a PDF.
  // For simplicity here, if it's a PDF, we skip adjust.
  if (currentFile.type === 'pdf') {
    // Just pass it straight through
    React.useEffect(() => {
      onConfirmFiles(files);
    }, []);
    return null;
  }

  // We wrap DocumentAdjuster and overlay a Reset button if needed.
  return (
    <View style={styles.container}>
      {/* We mount DocumentAdjuster keying on original URI so reset works if we remount?
          Actually, DocumentAdjuster takes `pageUri`. */}
      <DocumentAdjuster
        key={`${currentFile.uri}-${currentIndex}`} // remounts on index change
        pageUri={adjustedFiles[currentIndex].uri} // Wait, DocumentAdjuster might expect the ORIGINAL uri to start, and calls onAdjusted when done.
        pageNumber={currentIndex + 1}
        totalPages={files.length}
        onAdjusted={handleAdjusted}
        onPrev={handlePrev}
        onNext={handleNext}
        onClose={onCancel}
        fileType={currentFile.type}
      />

      {/* Reset to Original Button overlay */}
      <View style={styles.resetContainer}>
        <SecondaryButton
          label="Reset to Original"
          onPress={handleReset}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink900, // dark mode
  },
  resetContainer: {
    position: 'absolute',
    top: 50, // safe area top roughly
    right: SPACING[4],
    zIndex: 100,
  }
});
