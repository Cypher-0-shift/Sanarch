import React from 'react';
import { Animated, Pressable as RNPressable, ViewStyle } from 'react-native';

interface AnimatedPressableProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  disabled?: boolean;
  scaleAmount?: number; // default 0.97
  haptic?: boolean; // default false for now
}

export default function AnimatedPressable({
  onPress,
  children,
  style,
  className,
  disabled = false,
  scaleAmount = 0.97,
  haptic = false,
}: AnimatedPressableProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleAmount,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  return (
    <RNPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className={className}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </RNPressable>
  );
}
