import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
}: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleTextChange = (text: string) => {
    // Only accept numeric input and clamp to max length
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* 6 Individual OTP Boxes */}
      <View style={styles.boxesRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          const isCurrent = isFocused && index === value.length;
          const isFilled = digit.length > 0;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFilled && styles.boxFilled,
                isCurrent && styles.boxActive,
              ]}
            >
              {isFilled ? (
                <Text style={styles.digitText}>{digit}</Text>
              ) : isCurrent ? (
                <View style={styles.cursor} />
              ) : (
                <View style={styles.dot} />
              )}
            </View>
          );
        })}
      </View>

      {/* Hidden Full-Overlay TextInput that captures all typing, paste & autofill */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    marginVertical: 4,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E2DE',
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: '#004D36',
    backgroundColor: '#F0F7F4',
    shadowColor: '#004D36',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  boxFilled: {
    borderColor: '#004D36',
    backgroundColor: 'white',
    shadowColor: '#004D36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  digitText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#004D36',
    textAlign: 'center',
  },
  cursor: {
    width: 2,
    height: 22,
    backgroundColor: '#004D36',
    borderRadius: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C8D5CA',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
  },
});
