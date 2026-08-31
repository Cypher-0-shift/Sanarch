import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SanarchIconProps {
  size?: number;
  backgroundColor?: string;
  borderRadius?: number;
  color?: string;
  leafColor?: string;
  veinColor?: string;
}

export default function SanarchIcon({
  size = 24,
  backgroundColor = 'rgba(255, 255, 255, 0.16)',
  borderRadius,
  color = '#FFFFFF',
  leafColor = '#5DB056',
  veinColor = '#388E3C',
}: SanarchIconProps) {
  const radius = borderRadius ?? Math.round(size * 0.25);
  const iconSize = size * 0.72;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
      >
        {/* The 'S' character path - bold, rounded endpoints */}
        <Path
          d="M20.5 10.2C20.5 7.8 18.6 6 16.2 6C13.5 6 11.5 8.2 11.5 10.8C11.5 13.4 13.6 14.8 16.2 15.9C19 17.1 21.5 18.5 21.5 21.4C21.5 24.2 19.2 26.5 16.2 26.5C13.2 26.5 10.8 24.4 10.5 21.8"
          stroke={color}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Leaf at top-right curving naturally over the S */}
        <Path
          d="M19.5 10.2C20.2 6.8 23.8 4.8 26 4.8C26 7 24.8 10.2 21.2 11.2C20.4 11.4 19.5 10.9 19.5 10.2Z"
          fill={leafColor}
        />
        {/* Leaf main stem / vein */}
        <Path
          d="M20 10.2C21.6 8.8 24 6.8 25.5 5.2"
          stroke={veinColor}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
