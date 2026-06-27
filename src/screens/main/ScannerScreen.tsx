import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { scannerRepository } from '@/services/apiService';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestPermission();
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  const requestPermission = async (): Promise<void> => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setPermissionStatus(status as PermissionStatus);
  };

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }): Promise<void> => {
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
      }, 2000);
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

  const openSettings = (): void => {
    Linking.openSettings();
  };

  if (permissionStatus === 'undetermined') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.deniedTitle}>Camera Access Required</Text>
        <Text style={styles.deniedText}>
          Please allow camera access to scan product barcodes.
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings} activeOpacity={0.8}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        {...(!scanned && { onBarCodeScanned: handleBarCodeScanned })}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[
          BarCodeScanner.Constants.BarCodeType.ean13,
          BarCodeScanner.Constants.BarCodeType.ean8,
          BarCodeScanner.Constants.BarCodeType.qr,
        ]}
      />

      {/* Dark overlay with transparent center */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlaySection} />

        {/* Middle row: dark | transparent | dark */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark area */}
        <View style={styles.overlaySection}>
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Scanning...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Text style={styles.tapText}>Tap to scan again</Text>
            </View>
          ) : scanned ? (
            <View style={styles.scanAgainContainer}>
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={handleScanAgain}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.text} />
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.instructionText}>Point camera at barcode</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const SCAN_WINDOW = 280;
const CORNER_SIZE = 24;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
  },
  deniedTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  deniedText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  settingsButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.md,
  },
  settingsButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
  overlay: {
    flex: 1,
    flexDirection: 'column',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_WINDOW,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  loadingOverlay: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500' as const,
  },
  errorContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  tapText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.xs,
    marginTop: theme.spacing.xs,
  },
  scanAgainContainer: {
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
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
  instructionText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500' as const,
    paddingTop: theme.spacing.xl,
  },
});

export default ScannerScreen;
