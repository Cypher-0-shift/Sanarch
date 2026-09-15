// Required: npx expo install expo-image-manipulator react-native-svg
//   react-native-gesture-handler react-native-reanimated

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Polygon, Polyline, Rect } from 'react-native-svg';
import { useAlertStore } from '../../store/alertStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

/**
 * Phase D: max dimension for uploaded images (longest side).
 * Sufficient for OCR/document extraction quality; meaningfully reduces
 * upload payload for modern high-resolution camera sensors.
 */
const MAX_UPLOAD_DIM = 2048;
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
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
export function CropCorner({
  x, y,
  position,
  onMove,
  maxW, maxH,
  renderOffsetX = 0,
  renderOffsetY = 0,
}: {
  x: number;
  y: number;
  position: 'tl' | 'tr' | 'bl' | 'br';
  onMove: (pos: 'tl' | 'tr' | 'bl' | 'br', nx: number, ny: number) => void;
  maxW: number;
  maxH: number;
  renderOffsetX?: number;
  renderOffsetY?: number;
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
            left: x + renderOffsetX - HANDLE / 2,
            top: y + renderOffsetY - HANDLE / 2,
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
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [originalUri, setOriginalUri] = useState<string | null>(null);

  // When page changes, store its initial URI so we can reset to it
  useEffect(() => {
    setOriginalUri(pageUri);
    setHasEdited(false);
  }, [pageNumber]);

  const handleResetImage = () => {
    if (originalUri) {
      onAdjusted(originalUri);
      setHasEdited(false);
    }
  };

  // Rotate button press animation
  const rotateLeftScale = useSharedValue(1);
  const rotateRightScale = useSharedValue(1);
  const rotateLeftAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rotateLeftScale.value }],
  }));
  const rotateRightAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rotateRightScale.value }],
  }));

  // Load the image's natural dimensions so we can compute rendered bounds
  useEffect(() => {
    if (pageUri) {
      Image.getSize(
        pageUri,
        (w, h) => setImgNaturalSize({ width: w, height: h }),
        () => setImgNaturalSize({ width: 0, height: 0 }),
      );
    }
  }, [pageUri]);

  // Calculate the actual rendered image rect inside the "contain" layout
  const getRenderedImageBounds = useCallback(() => {
    const lw = imgLayout.width;
    const lh = imgLayout.height;
    const nw = imgNaturalSize.width;
    const nh = imgNaturalSize.height;
    if (lw === 0 || lh === 0 || nw === 0 || nh === 0) {
      return { x: 0, y: 0, w: lw, h: lh };
    }
    const scale = Math.min(lw / nw, lh / nh);
    const renderedW = nw * scale;
    const renderedH = nh * scale;
    const offsetX = (lw - renderedW) / 2;
    const offsetY = (lh - renderedH) / 2;
    return { x: offsetX, y: offsetY, w: renderedW, h: renderedH };
  }, [imgLayout, imgNaturalSize]);

  // ── Smart snap ──────────────────────────────────────────────────────────────
  // TODO: Replace with POST /api/ocr/detect-edges for real edge detection.
  const runSmartSnap = () => {
    if (imgLayout.width === 0 || imgLayout.height === 0) return;

    // Use the actual rendered image bounds (not full layout) for smart snap
    const bounds = getRenderedImageBounds();
    const inset = 16; // small inset from document edge

    setCropBox({
      left: bounds.x + inset,
      top: bounds.y + inset,
      right: bounds.x + bounds.w - inset,
      bottom: bounds.y + bounds.h - inset,
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

  // Auto-run smart snap when entering crop mode and dimensions are ready
  useEffect(() => {
    if (mode === 'crop' && !cropBox && imgLayout.width > 0 && imgNaturalSize.width > 0) {
      runSmartSnap();
    }
  }, [mode, cropBox, imgLayout, imgNaturalSize]);

  // ── Rotate ──────────────────────────────────────────────────────────────────
  const handleRotateRight = async () => {
    setIsProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        pageUri,
        [
          { rotate: 90 },
          // Phase D: cap longest side after rotation (aspect ratio may swap).
          { resize: { width: MAX_UPLOAD_DIM } },
        ],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setHasEdited(true);
      onAdjusted(result.uri);
    } catch {
      useAlertStore.getState().showAlert('Error', 'Could not rotate the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateLeft = async () => {
    setIsProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        pageUri,
        [
          { rotate: -90 },
          // Phase D: cap longest side after rotation.
          { resize: { width: MAX_UPLOAD_DIM } },
        ],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setHasEdited(true);
      onAdjusted(result.uri);
    } catch {
      useAlertStore.getState().showAlert('Error', 'Could not rotate the image.');
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
        [
          {
            crop: {
              originX: Math.round(cropBox.left * sx),
              originY: Math.round(cropBox.top * sy),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          },
          // Phase D: cap the cropped output to MAX_UPLOAD_DIM on the longest side.
          // expo-image-manipulator preserves aspect ratio when only one dimension is given;
          // images already within bounds are passed through unchanged.
          { resize: { width: MAX_UPLOAD_DIM } },
        ],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      setMode('none');
      setHasEdited(true);
      onAdjusted(result.uri);
    } catch {
      useAlertStore.getState().showAlert('Error', 'Could not apply crop. Please try again.');
    } finally {
      setIsProcessing(false);
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
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
          <MaterialCommunityIcons name="close" size={20} color="#2D3A2F" />
        </TouchableOpacity>
        
        <Text style={styles.topBarPage}>Page {pageNumber} of {totalPages}</Text>
        
        {mode === 'crop' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={() => { setCropBox(null); runSmartSnap(); }}
              style={styles.resetBtnWrap}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => { await handleApplyCrop(); onNext(); }}
              disabled={!cropBox}
              style={[styles.applyBtn, !cropBox && { opacity: 0.45 }]}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        ) : hasEdited ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={handleResetImage}
              style={styles.resetBtnWrap}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              activeOpacity={0.7}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.7}
            style={styles.skipBtn}
          >
            <Text style={styles.skipBtnText}>Skip Editing</Text>
          </TouchableOpacity>
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
          overflow: 'visible',
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
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                pointerEvents="none"
              >
                {/* Dark mask */}
                <Rect
                  x={16} y={16}
                  width={imgLayout.width}
                  height={imgLayout.height}
                  fill="rgba(0,0,0,0.5)"
                />
                {/* White crop window background */}
                <Rect
                  x={cropBox.left + 16}
                  y={cropBox.top + 16}
                  width={cropBox.right - cropBox.left}
                  height={cropBox.bottom - cropBox.top}
                  fill="rgba(255,255,255,0.2)"
                />
                {/* Green border */}
                <Rect
                  x={cropBox.left + 16}
                  y={cropBox.top + 16}
                  width={cropBox.right - cropBox.left}
                  height={cropBox.bottom - cropBox.top}
                  fill="transparent"
                  stroke="#004D36"
                  strokeWidth={3}
                />
                {/* White outline for better visibility */}
                <Rect
                  x={cropBox.left + 17.5}
                  y={cropBox.top + 17.5}
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
              <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* Corners */}
                <CropCorner
                  x={cropBox.left} y={cropBox.top}
                  position="tl"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                  renderOffsetX={16} renderOffsetY={16}
                />
                <CropCorner
                  x={cropBox.right} y={cropBox.top}
                  position="tr"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                  renderOffsetX={16} renderOffsetY={16}
                />
                <CropCorner
                  x={cropBox.right} y={cropBox.bottom}
                  position="br"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                  renderOffsetX={16} renderOffsetY={16}
                />
                <CropCorner
                  x={cropBox.left} y={cropBox.bottom}
                  position="bl"
                  onMove={moveCorner}
                  maxW={imgLayout.width}
                  maxH={imgLayout.height}
                  renderOffsetX={16} renderOffsetY={16}
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
        {/* Rotate Left */}
        <TouchableOpacity
          onPress={() => {
            rotateLeftScale.value = withSequence(
              withTiming(0.8, { duration: 80 }),
              withTiming(1, { duration: 150 }),
            );
            handleRotateLeft();
          }}
          activeOpacity={1}
          style={styles.toolItem}
        >
          <Animated.View style={[styles.toolIcon, styles.toolIconGreen, rotateLeftAnimStyle]}>
            <MaterialCommunityIcons name="rotate-left" size={22} color="white" />
          </Animated.View>
          <Text style={styles.toolLabel}>Rotate Left</Text>
        </TouchableOpacity>

        {/* Crop */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (mode !== 'crop') {
              setMode('crop');
            }
          }}
          style={styles.toolItem}
        >
          <View style={[styles.toolIcon, mode === 'crop' ? styles.toolIconGreen : styles.toolIconEmpty]}>
            <MaterialCommunityIcons name="crop-free" size={22} color={mode === 'crop' ? 'white' : '#2D3A2F'} />
          </View>
          <Text style={[styles.toolLabel, mode === 'crop' && styles.toolLabelActive]}>Crop</Text>
        </TouchableOpacity>

        {/* Rotate Right */}
        <TouchableOpacity
          onPress={() => {
            rotateRightScale.value = withSequence(
              withTiming(0.8, { duration: 80 }),
              withTiming(1, { duration: 150 }),
            );
            handleRotateRight();
          }}
          activeOpacity={1}
          style={styles.toolItem}
        >
          <Animated.View style={[styles.toolIcon, styles.toolIconGreen, rotateRightAnimStyle]}>
            <MaterialCommunityIcons name="rotate-right" size={22} color="white" />
          </Animated.View>
          <Text style={styles.toolLabel}>Rotate Right</Text>
        </TouchableOpacity>
      </View>


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
  resetBtnWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#004D36',
  },
  resetBtnText: {
    color: '#004D36',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  applyBtn: {
    backgroundColor: '#004D36',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#004D36',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  applyBtnText: { color: 'white', fontSize: 13, fontFamily: 'Inter_700Bold' },
  skipBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#004D36',
  },
  skipBtnText: { color: 'white', fontSize: 13, fontFamily: 'Inter_700Bold' },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconGreen: { backgroundColor: '#004D36' },
  toolIconEmpty: { backgroundColor: '#F5F3F0' },
  toolLabel: { fontSize: 10, color: '#2D3A2F', fontFamily: 'Inter_600SemiBold' },
  toolLabelActive: { color: '#004D36', fontFamily: 'Inter_700Bold' },
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
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    fontFamily: 'Inter_700Bold',
    color: '#2D3A2F',
    fontSize: 15,
  },
  modalBtnDestructive: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDestructiveText: {
    fontFamily: 'Inter_700Bold',
    color: 'white',
    fontSize: 15,
  },
  modalBtnPrimary: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#004D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    fontFamily: 'Inter_700Bold',
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
  },
});
