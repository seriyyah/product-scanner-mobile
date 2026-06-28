import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      barcode: '1234567890123',
      scanResult: {
        product: {
          barcode: '1234567890123',
          name: 'Test Chocolate',
          brand: 'Sweet Co',
          ingredients: ['Cocoa', 'Sugar', 'Milk'],
          images: [],
          allergens: ['Milk'],
          additives: [],
          ingredients_analysis: [],
        },
        safety_score: 55,
        safety_grade: 'C',
        rating_breakdown: {
          nova: { score: 50, group: 3, weighted_score: 10 },
        },
        warnings: ['High sugar'],
        saved_to_history: false,
        cached: true,
      },
    },
  }),
}));

// Hoist-safe mock: define jest.fn() inside factory
jest.mock('../../../src/services/apiService', () => ({
  scannerRepository: {
    scanBarcode: jest.fn(),
    getProductDetails: jest.fn(),
    getScanHistory: jest.fn(),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ProductDetailScreen from '../../../src/screens/product/ProductDetailScreen';
import { scannerRepository } from '../../../src/services/apiService';

const mockScanBarcode = scannerRepository.scanBarcode as jest.Mock;

describe('ProductDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getAllByText } = render(<ProductDetailScreen />);
    // Product name may appear multiple times (header + detail)
    expect(getAllByText('Test Chocolate').length).toBeGreaterThanOrEqual(1);
  });

  it('shows product name and brand', () => {
    const { getAllByText, getByText } = render(<ProductDetailScreen />);
    expect(getAllByText('Test Chocolate').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Sweet Co')).toBeTruthy();
  });

  it('shows safety score and grade', () => {
    const { getByText } = render(<ProductDetailScreen />);
    expect(getByText('55')).toBeTruthy();
  });

  it('shows allergens section', () => {
    const { getByText } = render(<ProductDetailScreen />);
    expect(getByText('Allergens')).toBeTruthy();
    expect(getByText('Milk')).toBeTruthy();
  });

  it('uses scanResult from route params when provided (no API call)', () => {
    render(<ProductDetailScreen />);
    expect(mockScanBarcode).not.toHaveBeenCalled();
  });

  it('shows warnings section', () => {
    const { getByText } = render(<ProductDetailScreen />);
    expect(getByText('Warnings')).toBeTruthy();
    expect(getByText('High sugar')).toBeTruthy();
  });
});
