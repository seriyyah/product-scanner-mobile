import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'user-1', email: 'test@test.com', first_name: 'Jane', role: 'free_user' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  }),
}));

jest.mock('../../../src/services/apiService', () => ({
  scannerRepository: {
    getScanHistory: jest.fn(),
    scanBarcode: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import HomeScreen from '../../../src/screens/main/HomeScreen';
import { scannerRepository } from '../../../src/services/apiService';

const mockScanHistory = scannerRepository.getScanHistory as jest.Mock;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScanHistory.mockResolvedValue({ scans: [], total: 0 });
  });

  it('renders without crashing', async () => {
    const { findByText } = render(<HomeScreen />);
    const hello = await findByText(/Hello, Jane!/);
    expect(hello).toBeTruthy();
  });

  it('shows Scan Product button', async () => {
    const { findByText } = render(<HomeScreen />);
    const btn = await findByText('Scan Product');
    expect(btn).toBeTruthy();
  });

  it('shows empty state when no scans', async () => {
    const { findByText } = render(<HomeScreen />);
    const empty = await findByText('No scans yet');
    expect(empty).toBeTruthy();
  });

  it('shows recent scans when history is available', async () => {
    mockScanHistory.mockResolvedValueOnce({
      scans: [
        {
          id: '1',
          barcode: '123',
          product_name: 'Milk',
          brand: 'Brand A',
          safety_score: 90,
          safety_grade: 'A',
          scanned_at: '2026-06-01T10:00:00Z',
        },
      ],
      total: 1,
    });

    const { findByText } = render(<HomeScreen />);
    const product = await findByText('Milk');
    expect(product).toBeTruthy();
  });

  it('shows Recent Scans section title', async () => {
    const { findByText } = render(<HomeScreen />);
    const title = await findByText('Recent Scans');
    expect(title).toBeTruthy();
  });
});
