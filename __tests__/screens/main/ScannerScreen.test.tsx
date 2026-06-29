import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), addListener: jest.fn(() => jest.fn()) }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../src/services/apiService', () => ({
  scannerRepository: {
    scanBarcode: jest.fn(),
    getScanHistory: jest.fn(),
  },
}));

// Mock expo-camera — create the mock fn inside the factory so it's available
// when the factory runs (jest.mock is hoisted above variable declarations).
jest.mock('expo-camera', () => {
  const mockRequestPermissions = jest.fn(() => Promise.resolve({ status: 'granted' }));
  const MockCameraView = ({ children }: any) => children ?? null;
  return {
    CameraView: MockCameraView,
    Camera: { requestCameraPermissionsAsync: mockRequestPermissions },
  };
});

import ScannerScreen from '../../../src/screens/main/ScannerScreen';
import { Camera } from 'expo-camera';
import { scannerRepository } from '../../../src/services/apiService';

const mockRequestPermissions = (Camera as any).requestCameraPermissionsAsync as jest.Mock;
const mockScanBarcode = scannerRepository.scanBarcode as jest.Mock;

describe('ScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
  });

  it('shows permission request state initially', () => {
    mockRequestPermissions.mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<ScannerScreen />);
    expect(getByText('Requesting camera permission...')).toBeTruthy();
  });

  it('shows denied state when permission is denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
    const { findByText } = render(<ScannerScreen />);
    expect(await findByText('Camera Access Required')).toBeTruthy();
  });

  it('shows Open Settings button when permission denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' });
    const { findByText } = render(<ScannerScreen />);
    expect(await findByText('Open Settings')).toBeTruthy();
  });

  it('shows instruction text when permission granted', async () => {
    mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' });
    const { findByText } = render(<ScannerScreen />);
    expect(await findByText('Point camera at barcode')).toBeTruthy();
  });

  it('requests permissions on mount', async () => {
    render(<ScannerScreen />);
    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalled();
    });
  });

  it('scanBarcode function is available', () => {
    expect(mockScanBarcode).toBeDefined();
  });
});
