import React from 'react';
import { View, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  AvatarType,
  AvatarDetectionParams,
  getAvatarSource,
  AVATAR_IMAGES,
} from '../../utils/avatar';

export interface ProfileAvatarProps extends AvatarDetectionParams {
  size?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export default function ProfileAvatar({
  size = 64,
  borderRadius,
  borderWidth = 3,
  borderColor = '#E8F5E9',
  backgroundColor = '#E8F5E9',
  gender,
  dob,
  age,
  relation,
  avatarType,
  style,
}: ProfileAvatarProps) {
  const radius = borderRadius ?? size / 2;
  const source = avatarType && avatarType in AVATAR_IMAGES
    ? AVATAR_IMAGES[avatarType as AvatarType]
    : getAvatarSource({ gender, dob, age, relation, avatarType });

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor,
          backgroundColor,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius - borderWidth,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004D36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
