import React, { useRef, useState } from 'react';
import { View, TextInput, Text } from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function OTPInput({ length = 4, value, onChange }: OTPInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    const newOTP = value.split('');
    newOTP[index] = text;
    const combined = newOTP.join('');
    onChange(combined);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newOTP = value.split('');
      newOTP[index - 1] = '';
      onChange(newOTP.join(''));
    }
  };

  return (
    <View className="flex-row justify-between mt-2">
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            style={{ width: '22%' }}
            className="h-14 text-center text-xl font-display-bold rounded-xl border border-slate-200 bg-white text-primary focus:border-primary/50"
            keyboardType="number-pad"
            maxLength={1}
            value={value[index] || ''}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
          />
        ))}
    </View>
  );
}
