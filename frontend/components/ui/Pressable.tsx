import React, { useRef } from 'react';
import { Animated, Pressable as RNPressable, ViewStyle, StyleProp, PressableProps } from 'react-native';

const AnimatedRNPressable = Animated.createAnimatedComponent(RNPressable);

interface AnimatedPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle> | any;
  scaleAmount?: number;
  activeOpacity?: number; // Accept but ignore to act as drop-in replacement for TouchableOpacity
}

export default function AnimatedPressable({
  onPress,
  children,
  style,
  disabled = false,
  scaleAmount = 0.95,
  activeOpacity, // ignored
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleAmount,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }),
      Animated.timing(opacity, {
        toValue: 0.85, // subtle blink instead of full fade
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    if (rest.onPressIn) rest.onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    if (rest.onPressOut) rest.onPressOut(e);
  };

  return (
    <AnimatedRNPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, { transform: [{ scale }], opacity }]}
      {...rest}
    >
      {typeof children === 'function' ? children({ pressed: false }) : children}
    </AnimatedRNPressable>
  );
}
