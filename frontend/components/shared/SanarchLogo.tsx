import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SanarchLogoProps {
  size?: number;
  color?: string;
}

export default function SanarchLogo({ size = 40, color = '#143832' }: SanarchLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* S curve */}
      <Path
        d="M 75 32 C 75 12, 25 12, 25 36 C 25 56, 75 56, 75 76 C 75 96, 25 96, 25 76"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf Top Half */}
      <Path
        d="M 54 22 C 60 5, 92 5, 92 5 C 92 5, 85 15, 68 28 C 62 25, 54 22, 54 22 Z"
        fill={color}
      />
      {/* Leaf Bottom Half */}
      <Path
        d="M 95 8 C 95 25, 80 42, 68 31 C 78 20, 95 8, 95 8 Z"
        fill={color}
      />
    </Svg>
  );
}
