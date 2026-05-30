import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useAlertStore } from '../../store/alertStore';

export function CustomAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={hideAlert}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 24, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }}>
          
          <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2D3A2F', marginBottom: message ? 8 : 24, textAlign: 'center' }}>
            {title}
          </Text>
          
          {!!message && (
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: '#5C6E60', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              {message}
            </Text>
          )}

          <View style={{ flexDirection: 'column', gap: 12 }}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              const bgColor = isDestructive ? '#EF4444' : isCancel ? '#F5F3F0' : '#004D36';
              const textColor = isDestructive ? 'white' : isCancel ? '#2D3A2F' : 'white';
              const borderColor = isCancel ? '#E5E2DE' : bgColor;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: 20,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}
                >
                  <Text style={{ color: textColor, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
