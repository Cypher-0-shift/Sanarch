import React, { useRef, useState } from 'react';
import { View, TextInput, Text } from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function OTPInput({ length = 4, value, onChange }: OTPInputProps) {
  return (
    <View className="mt-2">
      <TextInput
        style={{ letterSpacing: 16 }}
        className="h-16 px-4 text-center text-3xl font-display-bold rounded-xl border-2 border-[#E5E2DE] bg-white text-[#004D36]"
        keyboardType="number-pad"
        maxLength={length}
        value={value}
        onChangeText={onChange}
        placeholder={Array(length).fill('·').join(' ')}
        placeholderTextColor="#C8D5CA"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
      />
    </View>
  );
}
