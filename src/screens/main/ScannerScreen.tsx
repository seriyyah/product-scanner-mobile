import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { scannerRepository } from '@/services/apiService';
import BarcodeScanner from '@/components/BarcodeScanner';

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  const handleBarCodeScanned = async (data: string): Promise<void> => {
    if (scanned || isLoading) return;

    setScanned(true);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await scannerRepository.scanBarcode(data);
      navigation.navigate('ScanResult', { scanResult: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scan product. Please try again.';
      setErrorMessage(message);
      retryTimeout.current = setTimeout(() => {
        setScanned(false);
        setErrorMessage('');
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAgain = (): void => {
    setScanned(false);
    setIsLoading(false);
    setErrorMessage('');
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
  };

  return (
    <View style={styles.container}>
      <BarcodeScanner
        onScanned={handleBarCodeScanned}
        active={!scanned && !isLoading}
      />

      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top area — back button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Product</Text>
          <View style={styles.backButton} />
        </View>

        {/* Scan window (visual only) */}
        <View style={styles.overlayMiddle} pointerEvents="none">
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom status */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.statusText}>Looking up product...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusBox}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleScanAgain} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : scanned ? (
            <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color={theme.colors.text} />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.instructionText}>
              {Platform.OS === 'web'
                ? 'Point camera at barcode or enter below'
                : 'Point camera at barcode'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const SCAN_WINDOW = 260;
const CORNER_SIZE = 22;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    color: '#fff',
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_WINDOW,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanWindow: {
    width: SCAN_WINDOW,
    height: SCAN_WINDOW,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: theme.colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
  },
  bottomBar: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statusBox: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: theme.typography.fontSizes.md,
  },
  instructionText: {
    color: '#fff',
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.medium,
  },
  retryBtnText: {
    color: theme.colors.text,
    fontWeight: '600' as const,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.sm,
  },
  scanAgainText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
});

export default ScannerScreen;
