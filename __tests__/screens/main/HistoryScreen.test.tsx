import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
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

// Import after mocks are set up
import HistoryScreen from '../../../src/screens/main/HistoryScreen';
import { scannerRepository } from '../../../src/services/apiService';

const mockGetHistory = scannerRepository.getScanHistory as jest.Mock;

const mockHistory = {
  items: [
    {
      id: '1',
      barcode: '1234567890123',
      product_name: 'Test Milk',
      brand: 'Dairy Co',
      safety_score: 88,
      safety_grade: 'A',
      scanned_at: '2026-06-01T10:00:00Z',
    },
    {
      id: '2',
      barcode: '9876543210987',
      product_name: 'Chips',
      brand: 'Snack Co',
      safety_score: 40,
      safety_grade: 'D',
      scanned_at: '2026-06-02T14:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  per_page: 20,
};

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHistory.mockResolvedValue(mockHistory);
  });

  it('renders without crashing', async () => {
    const { findByText } = render(<HistoryScreen />);
    await findByText('Scan History');
  });

  it('shows scan history items', async () => {
    const { findByText } = render(<HistoryScreen />);
    const milk = await findByText('Test Milk');
    expect(milk).toBeTruthy();
    const chips = await findByText('Chips');
    expect(chips).toBeTruthy();
  });

  it('shows empty state when no history', async () => {
    mockGetHistory.mockResolvedValueOnce({ items: [], total: 0, page: 1, per_page: 20 });
    const { findByText } = render(<HistoryScreen />);
    const empty = await findByText('No scans yet');
    expect(empty).toBeTruthy();
  });

  it('shows error state on API failure', async () => {
    mockGetHistory.mockRejectedValueOnce(new Error('Network error'));
    const { findByText } = render(<HistoryScreen />);
    const error = await findByText('Failed to load history. Tap to retry.');
    expect(error).toBeTruthy();
  });

  it('navigates to ProductDetail on item press', async () => {
    const { findByText } = render(<HistoryScreen />);
    const item = await findByText('Test Milk');
    fireEvent.press(item);
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetail', { barcode: '1234567890123' });
  });

  it('shows brands for items that have them', async () => {
    const { findByText } = render(<HistoryScreen />);
    const brand = await findByText('Dairy Co');
    expect(brand).toBeTruthy();
  });
});
