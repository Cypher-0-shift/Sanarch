import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
}) => {
  const containerStyle: ViewStyle[] = [
    styles.base,
    variant === 'primary' && styles.primaryContainer,
    variant === 'outline' && styles.outlineContainer,
    variant === 'ghost' && styles.ghostContainer,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ].filter(Boolean) as ViewStyle[];

  const textColor =
    variant === 'primary' ? COLORS.white : COLORS.primary;

  const textStyle: TextStyle[] = [
    styles.text,
    { color: textColor },
    variant === 'ghost' && styles.ghostText,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={textColor}
              style={styles.icon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 9999,
    paddingHorizontal: 24,
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    height: 48,
    borderRadius: 9999,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  ghostText: {
    fontSize: 14,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;
