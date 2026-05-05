import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

import QRCode from 'react-native-qrcode-svg';

interface QRDisplayProps {
  value: string;
  durationSeconds?: number;
  onExpired: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const QRDisplay: React.FC<QRDisplayProps> = ({
  value,
  durationSeconds = 600,
  onExpired,
}) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setRemaining(durationSeconds);
    hasExpiredRef.current = false;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [durationSeconds]);

  const isExpired = remaining === 0;

  return (
    <View style={styles.container}>
      {isExpired ? (
        <View style={styles.expiredContainer}>
          <MaterialCommunityIcons
            name="refresh"
            size={48}
            color={COLORS.slate400}
          />
          <Text style={styles.expiredText}>QR Expired</Text>
          <Text style={styles.expiredSubtext}>
            Generate a new code to continue sharing
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.qrPlaceholder}>
            <QRCode value={value} size={220} color="#143832" backgroundColor="white" />
          </View>

          {/* Countdown */}
          <Text style={styles.timer}>{formatTime(remaining)}</Text>
          <Text style={styles.timerLabel}>
            Scan expires in {formatTime(remaining)}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  timer: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.slate500,
  },
  expiredContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  expiredText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: COLORS.slate900,
    marginTop: 12,
    marginBottom: 4,
  },
  expiredSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: COLORS.slate500,
  },
});

export default QRDisplay;
