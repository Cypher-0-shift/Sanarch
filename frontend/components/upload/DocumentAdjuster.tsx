// Required: npx expo install expo-image-manipulator react-native-svg
//   react-native-gesture-handler react-native-reanimated

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Polygon, Polyline, Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

interface DocumentAdjusterProps {
  pageUri: string;
  pageNumber: number;
  totalPages: number;
  onAdjusted: (adjustedUri: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  fileType: 'photo' | 'pdf';
  hasUnsavedChanges?: boolean;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

type AdjustMode = 'none' | 'crop';

interface CropBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// ─── Draggable crop corner handle ─────────────────────────────────────────────
function CropCorner({
  x,
  y,
  position,
  onMove,
  maxW,
  maxH,
}: {
  x: number;
  y: number;
  position: 'tl' | 'tr' | 'br' | 'bl';
  onMove: (position: string, nx: number, ny: number) => void;
  maxW: number;
  maxH: number;
}) {
  const HANDLE = 44;
  const TOUCH_SLOP = 12;
  const DAMPING = 0.6;
  
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const baseX = useSharedValue(x);
  const baseY = useSharedValue(y);
  const isActive = useSharedValue(false);

  useEffect(() => {
    if (!isActive.value) {
      baseX.value = x;
      baseY.value = y;
      offsetX.value = 0;
      offsetY.value = 0;
    }
  }, [x, y]);

  const pan = Gesture.Pan()
    .minDistance(TOUCH_SLOP)
    .onStart(() => {
      isActive.value = true;
      baseX.value = x;
      baseY.value = y;
    })
    .onUpdate((e) => {
      offsetX.value = e.translationX * DAMPING;
      offsetY.value = e.translationY * DAMPING;
      
      const nx = Math.max(0, Math.min(maxW, baseX.value + offsetX.value));
      const ny = Math.max(0, Math.min(maxH, baseY.value + offsetY.value));
      
      if (Math.abs(nx - x) > 2 || Math.abs(ny - y) > 2) {
        runOnJS(onMove)(position, Math.round(nx), Math.round(ny));
      }
    })
    .onEnd(() => {
      isActive.value = false;
      offsetX.value = 0;
      offsetY.value = 0;
    });

  const animStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 0.9 : 1,
    transform: [{ scale: isActive.value ? 1.2 : 1 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: x - HANDLE / 2,
            top: y - HANDLE / 2,
            width: HANDLE,
            height: HANDLE,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          },
          animStyle,
        ]}
      >
        <View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: '#004D36',
          borderWidth: 4,
          borderColor: 'white',
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 12,
        }} />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DocumentAdjuster({
  pageUri,
  pageNumber,
  totalPages,
  onAdjusted,
  onPrev,
  onNext,
  onClose,
  fileType,
  hasUnsavedChanges = false,
  onUnsavedChangesChange,
}: DocumentAdjusterProps) {
  const [mode, setMode] = useState<AdjustMode>('none');
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isSmartSnapDone, setIsSmartSnapDone] = useState(false);
  const [imgLayout, setImgLayout] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  // ── Smart snap ──────────────────────────────────────────────────────────────
  // TODO: Replace with POST /api/ocr/detect-edges for real edge detection.
  const runSmartSnap = () => {
    if (imgLayout.width === 0 || imgLayout.height === 0) return;
    const w = imgLayout.width;
    const h = imgLayout.height;
    // Add more margin so crop area is clearly visible and handles don't go off-screen
    // Account for handle size (44px / 2 = 22px) plus extra padding for safety
    const handleRadius = 22;
    const extraPadding = 12;
    const minMargin = handleRadius + extraPadding;
    
    // Use larger of: minimum margin or percentage-based margin
    const mx = Math.max(minMargin, w * 0.12);
    const my = Math.max(minMargin, h * 0.10);
    
    setCropBox({
      left: mx,
      top: my,
      right: w - mx,
      bottom: h - my,
    });
    setIsSmartSnapDone(true);
    setMode('crop');
  };

  // Track edits
  useEffect(() => {
    if (hasEdited && onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  }, [hasEdited, onUnsavedChangesChange]);

  useEffect(() => {
    setIsSmartSnapDone(false);
    setCropBox(null);
    setMode('none');
  }, [pageUri]);

  // ── Rotate ──────────────────────────────────────────────────────────────────
  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        pageUri,
        [{ rotate: 90 }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setHasEdited(true);
      onAdjusted(result.uri);
    } catch {
      Alert.alert('Error', 'Could not rotate the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Apply crop ──────────────────────────────────────────────────────────────
  const handleApplyCrop = async () => {
    if (!cropBox) return;
    setIsProcessing(true);
    try {
      const info = await ImageManipulator.manipulateAsync(
        pageUri, [], { format: ImageManipulator.SaveFormat.JPEG }
      );
      const sx = info.width / imgLayout.width;
      const sy = info.height / imgLayout.height;
      
      const cropWidth = (cropBox.right - cropBox.left) * sx;
      const cropHeight = (cropBox.bottom - cropBox.top) * sy;
      
      const result = await ImageManipulator.manipulateAsync(
        pageUri,
        [{
          crop: {
            originX: Math.round(cropBox.left * sx),
            originY: Math.round(cropBox.top * sy),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
          },
        }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setMode('none');
      setHasEdited(true);
      onAdjusted(result.uri);
    } catch {
      Alert.alert('Error', 'Could not apply crop. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle next with unsaved changes check
  const handleNextClick = () => {
    if (mode === 'crop' && cropBox) {
      // User is in crop mode with unsaved crop
      setShowUnsavedAlert(true);
    } else {
      onNext();
    }
  };

  // Handle corner movement
  const moveCorner = (position: string, nx: number, ny: number) => {
    if (!cropBox) return;
    setCropBox(prev => {
      if (!prev) return prev;
      
      const minSize = 50; // Minimum crop size
      const next = { ...prev };
      
      switch (position) {
        case 'tl': // Top-left
          next.left = Math.min(nx, prev.right - minSize);
          next.top = Math.min(ny, prev.bottom - minSize);
          break;
        case 'tr': // Top-right
          next.right = Math.max(nx, prev.left + minSize);
          next.top = Math.min(ny, prev.bottom - minSize);
          break;
        case 'br': // Bottom-right
          next.right = Math.max(nx, prev.left + minSize);
          next.bottom = Math.max(ny, prev.top + minSize);
          break;
        case 'bl': // Bottom-left
          next.left = Math.min(nx, prev.right - minSize);
          next.bottom = Math.max(ny, prev.top + minSize);
          break;
      }
      
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F3F0' }}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowDiscardAlert(true)} activeOpacity={0.7} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
        </TouchableOpacity>
        
        <Text style={styles.topBarPage}>Page {pageNumber} of {totalPages}</Text>
        
        {mode === 'crop' ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => { setCropBox(null); runSmartSnap(); }}>
              <Text style={styles.resetBtn}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApplyCrop}
              disabled={!cropBox}
              style={[styles.applyBtn, !cropBox && { opacity: 0.45 }]}
            >
              <Text style={styles.applyBtnText}>Apply Crop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Image container with box styling */}
      <View style={{ flex: 1, padding: 24 }}>
        <View style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#E5E2DE',
        }}>
          <View style={{ flex: 1, position: 'relative', padding: 16 }}>
            <Image
              source={{ uri: pageUri }}
              style={{ flex: 1, width: '100%' }}
              resizeMode="contain"
              onLayout={e =>
                setImgLayout({
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                })
              }
            />

            {/* SVG dark overlay + crop rectangle */}
            {mode === 'crop' && cropBox && imgLayout.width > 0 && (
              <Svg
                style={[StyleSheet.absoluteFill, { margin: 16 }]}
                width={imgLayout.width}
                height={imgLayout.height}
                pointerEvents="none"
              >
                {/* Dark mask */}
                <Rect
                  x={0} y={0}
                  width={imgLayout.width}
                  height={imgLayout.height}
                  fill="rgba(0,0,0,0.5)"
                />
                {/* White crop window background */}
                <Rect
                  x={cropBox.left}
                  y={cropBox.top}
                  width={cropBox.right - cropBox.left}
                  height={cropBox.bottom - cropBox.top}
                  fill="rgba(255,255,255,0.2)"
                />
                {/* Green border */}
                <Rect
                  x={cropBox.left}
                  y={cropBox.top}
                  width={cropBox.right - cropBox.left}
                  height={cropBox.bottom - cropBox.top}
                  fill="transparent"
                  stroke="#004D36"
                  strokeWidth={3}
                />
                {/* White outline for better visibility */}
                <Rect
                  x={cropBox.left + 1.5}
                  y={cropBox.top + 1.5}
                  width={cropBox.right - cropBox.left - 3}
                  height={cropBox.bottom - cropBox.top - 3}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              </Svg>
            )}

            {/* Draggable corners only */}
            {mode === 'crop' && cropBox && imgLayout.width > 0 && (
              <View style={[StyleSheet.absoluteFill, { margin: 16 }]} pointerEvents="box-none">
                {/* Corners */}
                <CropCorner
                  x={cropBox.left} y={cropBox.top}
                  position="tl"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                />
                <CropCorner
                  x={cropBox.right} y={cropBox.top}
                  position="tr"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                />
                <CropCorner
                  x={cropBox.right} y={cropBox.bottom}
                  position="br"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                />
                <CropCorner
                  x={cropBox.left} y={cropBox.bottom}
                  position="bl"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                />
              </View>
            )}

            {/* Processing overlay */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#004D36" />
                <Text style={styles.processingText}>Processing…</Text>
              </View>
            )}
          </View>
        </View>

        {/* Crop hint - outside the image box */}
        {mode === 'crop' && cropBox && (
          <View style={styles.cropHintExternal}>
            <MaterialCommunityIcons name="gesture-tap-hold" size={16} color="#004D36" />
            <Text style={styles.cropHintExternalText}>Drag corners to adjust crop area</Text>
          </View>
        )}
      </View>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        {/* Prev - show for all pages except first */}
        {pageNumber > 1 && (
          <TouchableOpacity onPress={onPrev} activeOpacity={0.7} style={styles.toolItem}>
            <View style={styles.toolIcon}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#5C6E60" />
            </View>
            <Text style={styles.toolLabel}>Previous</Text>
          </TouchableOpacity>
        )}

        {/* Rotate */}
        <TouchableOpacity onPress={handleRotate} activeOpacity={0.7} style={styles.toolItem}>
          <View style={styles.toolIcon}>
            <MaterialCommunityIcons name="rotate-right" size={22} color="#5C6E60" />
          </View>
          <Text style={styles.toolLabel}>Rotate</Text>
        </TouchableOpacity>

        {/* Crop */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (mode === 'crop') {
              // Turn off crop mode
              setMode('none');
              setCropBox(null);
            } else {
              // Turn on crop mode and run smart snap
              setMode('crop');
              if (!cropBox && imgLayout.width > 0) {
                runSmartSnap();
              }
            }
          }}
          style={styles.toolItem}
        >
          <View style={[styles.toolIcon, mode === 'crop' && styles.toolIconActive]}>
            <MaterialCommunityIcons name="crop-free" size={22}
              color={mode === 'crop' ? 'white' : '#5C6E60'} />
          </View>
          <Text style={[styles.toolLabel, mode === 'crop' && styles.toolLabelActive]}>Crop</Text>
        </TouchableOpacity>

        {/* Next / Done */}
        <TouchableOpacity onPress={handleNextClick} activeOpacity={0.7} style={styles.toolItem}>
          <View style={[styles.toolIcon, styles.toolIconHighlight]}>
            <MaterialCommunityIcons
              name={pageNumber < totalPages ? 'chevron-right' : 'check'}
              size={24} color="white" />
          </View>
          <Text style={styles.toolLabelActive}>
            {pageNumber < totalPages ? 'Next' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Discard Alert Modal */}
      <Modal visible={showDiscardAlert} transparent animationType="fade" onRequestClose={() => setShowDiscardAlert(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDiscardAlert(false)} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#E65100" />
            </View>
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalBody}>
              Any edits you've made to this image will be lost.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowDiscardAlert(false)} activeOpacity={0.8} style={styles.modalBtnSecondary}>
                <Text style={styles.modalBtnSecondaryText}>Keep editing</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.modalBtnDestructive}>
                <Text style={styles.modalBtnDestructiveText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unsaved Changes Alert Modal */}
      <Modal visible={showUnsavedAlert} transparent animationType="fade" onRequestClose={() => setShowUnsavedAlert(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUnsavedAlert(false)} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="content-save-alert-outline" size={28} color="#E65100" />
            </View>
            <Text style={styles.modalTitle}>Apply crop changes?</Text>
            <Text style={styles.modalBody}>
              You have unsaved crop changes. Apply them before continuing?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity 
                onPress={() => {
                  setShowUnsavedAlert(false);
                  setMode('none');
                  setCropBox(null);
                  onNext();
                }} 
                activeOpacity={0.8} 
                style={styles.modalBtnSecondary}
              >
                <Text style={styles.modalBtnSecondaryText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={async () => {
                  setShowUnsavedAlert(false);
                  await handleApplyCrop();
                  onNext();
                }} 
                activeOpacity={0.8} 
                style={styles.modalBtnPrimary}
              >
                <Text style={styles.modalBtnPrimaryText}>Apply & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2DE',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarPage: { color: '#2D3A2F', fontSize: 14, fontFamily: 'Inter_700Bold' },
  resetBtn: { color: '#819685', fontSize: 14, fontFamily: 'Inter_700Bold' },
  applyBtn: {
    backgroundColor: '#004D36',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  applyBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_700Bold' },
  cropHintExternal: {
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  cropHintExternalText: { color: '#004D36', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: { color: '#2D3A2F', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  toolbar: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E2DE',
  },
  toolItem: { alignItems: 'center', gap: 5 },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconActive: { backgroundColor: '#004D36' },
  toolIconHighlight: { backgroundColor: '#004D36' },
  toolLabel: { fontSize: 10, color: '#819685', fontFamily: 'Inter_600SemiBold' },
  toolLabelActive: { fontSize: 10, color: '#004D36', fontFamily: 'Inter_600SemiBold' },
  // Modal styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#5C6E60',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    fontSize: 15,
  },
  modalBtnDestructive: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E65100',
    alignItems: 'center',
  },
  modalBtnDestructiveText: {
    fontFamily: 'Inter_700Bold',
    color: 'white',
    fontSize: 15,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#004D36',
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontFamily: 'Inter_700Bold',
    color: 'white',
    fontSize: 15,
  },
});
