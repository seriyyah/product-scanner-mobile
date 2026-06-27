import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';

interface Props {
  onScanned: (barcode: string) => void;
  active: boolean;
}

const BarcodeScanner: React.FC<Props> = ({ onScanned, active }) => {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
      setGranted(status === 'granted');
    });
  }, []);

  if (granted === null) return null;

  if (!granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.title}>Camera Required</Text>
        <Text style={styles.body}>Allow camera access to scan barcodes.</Text>
      </View>
    );
  }

  return (
    <BarCodeScanner
      {...(active ? { onBarCodeScanned: ({ data }) => onScanned(data) } : {})}
      style={StyleSheet.absoluteFillObject}
      barCodeTypes={[
        BarCodeScanner.Constants.BarCodeType.ean13,
        BarCodeScanner.Constants.BarCodeType.ean8,
        BarCodeScanner.Constants.BarCodeType.qr,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.md,
    textAlign: 'center',
  },
});

export default BarcodeScanner;
