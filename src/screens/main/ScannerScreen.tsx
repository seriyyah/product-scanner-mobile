import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { scannerRepository } from '@/services/apiService';

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManual, setShowManual] = useState(Platform.OS === 'web');
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref-based lock: synchronous unlike state, so rapid camera frames can't slip through
  const scanLock = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setHasPermission(status === 'granted');
      });
    }
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reset scan state every time this screen comes into focus so the
      // camera is ready immediately after returning from history/home.
      scanLock.current = false;
      setScanned(false);
      setErrorMessage('');
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    }, [])
  );

  const scanProduct = async (barcode: string): Promise<void> => {
    const code = barcode.trim();
    if (!code || scanLock.current) return;
    scanLock.current = true;
    setScanned(true);
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await scannerRepository.scanBarcode(code);
      navigation.navigate('ScanResult', { scanResult: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to scan product. Please try again.';
      setErrorMessage(message);
      retryTimeout.current = setTimeout(() => {
        scanLock.current = false;
        setScanned(false);
        setErrorMessage('');
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAgain = (): void => {
    scanLock.current = false;
    setScanned(false);
    setIsLoading(false);
    setErrorMessage('');
    setManualBarcode('');
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
  };

  const manualInput = (
    <View style={styles.manualInputRow}>
      <TextInput
        style={styles.manualInput}
        placeholder="Enter barcode number…"
        placeholderTextColor={theme.colors.textSecondary}
        value={manualBarcode}
        onChangeText={setManualBarcode}
        keyboardType="default"
        returnKeyType="search"
        onSubmitEditing={() => scanProduct(manualBarcode)}
        editable={!isLoading}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.manualSubmit, (!manualBarcode.trim() || isLoading) && styles.manualSubmitDisabled]}
        onPress={() => scanProduct(manualBarcode)}
        disabled={!manualBarcode.trim() || isLoading}
        activeOpacity={0.8}
      >
        {isLoading
          ? <ActivityIndicator size="small" color={theme.colors.text} />
          : <Ionicons name="search" size={20} color={theme.colors.text} />}
      </TouchableOpacity>
    </View>
  );

  // ── Web: manual entry only ─────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <KeyboardAvoidingView style={styles.centered} behavior="padding">
        <Ionicons name="barcode-outline" size={64} color={theme.colors.primary} />
        <Text style={styles.deniedTitle}>Scan a Product</Text>
        <Text style={styles.deniedText}>
          Enter the barcode number from the product packaging.
        </Text>
        {manualInput}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </KeyboardAvoidingView>
    );
  }

  // ── Native: waiting for permission ────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // ── Native: permission denied ─────────────────────────────────────────────
  if (hasPermission === false) {
    return (
      <KeyboardAvoidingView style={styles.centered} behavior="padding">
        <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.deniedTitle}>Camera Access Required</Text>
        <Text style={styles.deniedText}>
          Allow camera access to scan barcodes, or enter them manually below.
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>— or —</Text>
        {manualInput}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </KeyboardAvoidingView>
    );
  }

  // ── Native: manual mode ───────────────────────────────────────────────────
  if (showManual) {
    return (
      <KeyboardAvoidingView style={styles.centered} behavior="padding">
        <Ionicons name="barcode-outline" size={64} color={theme.colors.primary} />
        <Text style={styles.deniedTitle}>Enter Barcode</Text>
        <Text style={styles.deniedText}>Type the barcode number from the product.</Text>
        {manualInput}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TouchableOpacity onPress={() => { setShowManual(false); handleScanAgain(); }} activeOpacity={0.8} style={styles.switchLink}>
          <Ionicons name="camera-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.switchLinkText}>Use camera instead</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // ── Native: camera scanner ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => scanProduct(data)}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlaySection} />

        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        <View style={styles.overlaySection}>
          {isLoading ? (
            <View style={styles.feedbackBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.feedbackText}>Scanning…</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.feedbackBox}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : scanned ? (
            <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain} activeOpacity={0.8}>
              <Ionicons name="refresh" size={20} color={theme.colors.text} />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.instructionText}>Point camera at barcode</Text>
          )}

          {/* Manual entry toggle */}
          {!isLoading && (
            <TouchableOpacity onPress={() => setShowManual(true)} activeOpacity={0.8} style={styles.switchLink}>
              <Ionicons name="keypad-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.switchLinkText}>Enter manually</Text>
            </TouchableOpacity>
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
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
  },
  deniedTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    textAlign: 'center',
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
  },
  settingsButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600' as const,
  },
  orText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
  },
  manualInputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.sm,
  },
  manualInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
  },
  manualSubmit: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  manualSubmitDisabled: {
    opacity: 0.4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
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
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
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
  cornerTopLeft:     { top: 0,    left: 0,  borderTopWidth: CORNER_BORDER,    borderLeftWidth: CORNER_BORDER },
  cornerTopRight:    { top: 0,    right: 0, borderTopWidth: CORNER_BORDER,    borderRightWidth: CORNER_BORDER },
  cornerBottomLeft:  { bottom: 0, left: 0,  borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER },
  feedbackBox: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  feedbackText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500' as const,
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
  },
  switchLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  switchLinkText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
  },
});

export default ScannerScreen;
