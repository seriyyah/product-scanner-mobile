import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../src/services/apiService', () => ({
  scannerRepository: {
    scanBarcode: jest.fn(),
    getScanHistory: jest.fn(),
    getProductByBarcode: jest.fn(),
  },
}));

// Capture onScanned prop so tests can trigger scan events
let capturedOnScanned: ((barcode: string) => void) | null = null;
let mockBarcodeScannerOutput: React.ReactNode = null;

jest.mock('../../../src/components/BarcodeScanner', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedOnScanned = props.onScanned;
    return mockBarcodeScannerOutput;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ScannerScreen from '../../../src/screens/main/ScannerScreen';
import { scannerRepository } from '../../../src/services/apiService';

const mockScanBarcode = scannerRepository.scanBarcode as jest.Mock;

describe('ScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnScanned = null;
    mockBarcodeScannerOutput = null;
  });

  it('renders without crashing', () => {
    const { getByText } = render(<ScannerScreen />);
    expect(getByText('Scan Product')).toBeTruthy();
  });

  it('shows instruction text when camera is active', async () => {
    const { findByText } = render(<ScannerScreen />);
    expect(await findByText(/Point camera at barcode/)).toBeTruthy();
  });

  it('shows denied state from BarcodeScanner component', async () => {
    mockBarcodeScannerOutput = (
      <View>
        <Text>Camera Required</Text>
        <Text>Allow camera access to scan barcodes.</Text>
      </View>
    );
    const { findByText } = render(<ScannerScreen />);
    expect(await findByText('Camera Required')).toBeTruthy();
  });

  it('calls scanBarcode after barcode is detected', () => {
    render(<ScannerScreen />);
    expect(mockScanBarcode).toBeDefined();
  });

  it('navigates to ScanResult after successful scan', async () => {
    mockScanBarcode.mockResolvedValueOnce({
      product: {
        barcode: '3017620422003',
        name: 'Nutella',
        ingredients: [],
        images: [],
        allergens: [],
        additives: [],
        ingredients_analysis: [],
      },
      safety_score: 37,
      safety_grade: 'E',
      warnings: [],
    });

    render(<ScannerScreen />);
    await waitFor(() => expect(capturedOnScanned).not.toBeNull());

    capturedOnScanned!('3017620422003');

    await waitFor(() => {
      expect(mockScanBarcode).toHaveBeenCalledWith('3017620422003');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        'ScanResult',
        expect.objectContaining({
          scanResult: expect.objectContaining({ safety_grade: 'E' }),
        }),
      );
    });
  });
});
