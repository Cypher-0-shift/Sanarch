import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface GlassmorphismCardProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUploadFile: () => void;
}

const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onUploadFile,
}) => {
  const handleTakePhoto = () => {
    onTakePhoto();
    onClose();
  };

  const handleUploadFile = () => {
    onUploadFile();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card */}
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Take Photo */}
          <TouchableOpacity
            style={styles.row}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="camera-outline"
                size={24}
                color={'#004D36'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Take Photo</Text>
              <Text style={styles.rowSubtitle}>
                Scan a document with your camera
              </Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Upload File */}
          <TouchableOpacity
            style={styles.row}
            onPress={handleUploadFile}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="file-upload-outline"
                size={24}
                color={'#004D36'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.rowTitle}>Upload File</Text>
              <Text style={styles.rowSubtitle}>
                PDF or image from your device
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    alignItems: 'flex-end',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0,77,54,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D3A2F',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#000000',
    marginVertical: 4,
  },
});

export default GlassmorphismCard;
