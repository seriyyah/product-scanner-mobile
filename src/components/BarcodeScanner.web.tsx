import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useZxing } from 'react-zxing';
import theme from '@/constants/theme';

interface Props {
  onScanned: (barcode: string) => void;
  active: boolean;
}

const BarcodeScanner: React.FC<Props> = ({ onScanned, active }) => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const lastScanned = useRef('');

  const { ref } = useZxing({
    paused: !active,
    constraints: {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    timeBetweenDecodingAttempts: 150,
    onDecodeResult(result: any) {
      const text: string = typeof result.getText === 'function' ? result.getText() : String(result);
      if (!active || text === lastScanned.current) return;
      lastScanned.current = text;
      onScanned(text);
      setTimeout(() => { lastScanned.current = ''; }, 3000);
    },
    onError() {
      setCameraError(true);
    },
  });

  const handleManualSubmit = () => {
    const trimmed = manualBarcode.trim();
    if (trimmed.length >= 8) {
      onScanned(trimmed);
      setManualBarcode('');
    }
  };

  return (
    <View style={styles.wrapper}>
      {!cameraError ? (
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <View style={styles.errorFallback}>
          <Text style={styles.errorText}>Camera unavailable</Text>
        </View>
      )}

      {/* Manual entry overlay at bottom */}
      <View style={styles.manualEntry}>
        <Text style={styles.manualLabel}>Or type barcode manually</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="e.g. 3017620422003"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity
            style={[styles.submitBtn, manualBarcode.length < 8 && styles.submitBtnDisabled]}
            onPress={handleManualSubmit}
            activeOpacity={0.8}
            disabled={manualBarcode.length < 8}
          >
            <Text style={styles.submitBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative' as any,
    backgroundColor: '#000',
  },
  errorFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
  },
  manualEntry: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  manualLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: theme.colors.text,
    fontWeight: '600' as const,
    fontSize: theme.typography.fontSizes.md,
  },
});

export default BarcodeScanner;
