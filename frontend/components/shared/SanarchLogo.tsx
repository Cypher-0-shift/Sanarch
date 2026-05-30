import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

interface SanarchLogoProps {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  leafColor?: string;
  veinColor?: string;
}

export default function SanarchLogo({
  size = 80,
  width,
  height,
  color = '#FFFFFF',
  backgroundColor = '#135832',
  leafColor = '#5DB056',
  veinColor = '#3D8B3D',
}: SanarchLogoProps) {
  const w = width ?? size;
  const h = height ?? size;

  const fontSize = Math.min(w, h) * 0.75;
  const leafSize = Math.min(w, h) * 0.40;

  // --- FINE-TUNING CONTROLS ---
  const leafTopOffset = -leafSize * 0;
  const leafRightOffset = -leafSize * 0.55;
  const leafRotation = '5deg';

  // Rounded terminal dots – match the stroke width of the bold S
  const dotSize = fontSize * 0.165;

  // Bottom terminal: where S stroke ends (bottom-left area)
  const bottomDotBottom = fontSize * 0.38;
  const bottomDotLeft = fontSize * 0.04;

  // --- Red Accent Dot Control ---
  const leafDotSize = fontSize * 0.31;
  const leafDotTop = fontSize * 0.19;
  const leafDotRight = fontSize * -0.05;
  // ----------------------------

  return (
    <View
      style={[
        styles.container,
        {
          width: w,
          height: h,
          backgroundColor,
          borderRadius: Math.min(w, h) * 0.10,
        },
      ]}
    >
      <View style={styles.iconWrapper}>
        {/* S letter with terminal modifiers */}
        <View style={{ position: 'relative' }}>
          <Text
            style={[
              styles.text,
              {
                color,
                fontSize,
                lineHeight: fontSize,
              },
            ]}
          >
            S
          </Text>

          {/* Bottom-left terminal dot */}
          <View
            style={{
              position: 'absolute',
              bottom: bottomDotBottom,
              left: bottomDotLeft,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
            }}
          />

          {/* Red Accent Dot near leaf */}
          <View
            style={{
              position: 'absolute',
              top: leafDotTop,
              right: leafDotRight,
              width: leafDotSize,
              height: leafDotSize,
              borderRadius: leafDotSize / 2,
              backgroundColor: backgroundColor,
            }}
          />
        </View>

        {/* Leaf container – icon + vein overlay stacked */}
        <View
          style={[
            styles.leaf,
            {
              width: leafSize,
              height: leafSize,
              top: leafTopOffset,
              right: leafRightOffset,
              transform: [{ rotate: leafRotation }],
            },
          ]}
        >
          {/* Original leaf icon */}
          <MaterialCommunityIcons
            name="leaf"
            size={leafSize}
            color={leafColor}
          />

          {/* Sub-vein overlay – same size, positioned on top */}
          <Svg
            width={leafSize}
            height={leafSize}
            viewBox="0 0 24 24"
            style={StyleSheet.absoluteFill}
          >
            {/* Sub-vein 1 – near the base, branching left */}
            <Path
              d="M 5.5 14 Q 4.7 12.5 4 11"
              stroke={veinColor}
              strokeWidth={0.7}
              fill="none"
              strokeLinecap="round"
            />
            {/* Sub-vein 2 – middle, branching right */}
            <Path
              d="M 10 13 Q 14 14.5 16.5 13"
              stroke={veinColor}
              strokeWidth={0.6}
              fill="none"
              strokeLinecap="round"
            />

          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -4 }],
  },
  text: {
    fontFamily: 'Outfit_700Bold',
    includeFontPadding: false,
    fontWeight: 'bold',
    textAlignVertical: 'center',
  },
  leaf: {
    position: 'absolute',
  },
});