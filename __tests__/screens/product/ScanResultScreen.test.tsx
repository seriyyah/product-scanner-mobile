import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      scanResult: {
        product: {
          barcode: '1234567890123',
          name: 'Organic Apple Juice',
          brand: 'Health Brand',
          category: 'Beverages',
          ingredients: ['Apple juice', 'Water', 'Vitamin C'],
          nutrition: {
            energy_kcal: 45,
            fat_g: 0.1,
            carbohydrates_g: 11,
            sugars_g: 10,
            proteins_g: 0.5,
            salt_g: 0.01,
          },
          images: [],
          allergens: [],
          additives: [],
          ingredients_analysis: ['vegan'],
        },
        safety_score: 85,
        safety_grade: 'B',
        rating_breakdown: {
          nutriscore: { score: 80, grade: 'B', weighted_score: 24 },
          nova: { score: 90, group: 1, weighted_score: 18 },
          additives: { score: 100, count: 0, high_risk_count: 0, weighted_score: 20 },
        },
        warnings: ['Contains added sugars'],
        saved_to_history: true,
        cached: false,
      },
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ScanResultScreen from '../../../src/screens/product/ScanResultScreen';

describe('ScanResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Organic Apple Juice')).toBeTruthy();
  });

  it('shows product name and brand', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Organic Apple Juice')).toBeTruthy();
    expect(getByText('Health Brand')).toBeTruthy();
  });

  it('shows safety score', () => {
    const { getByText, getAllByText } = render(<ScanResultScreen />);
    expect(getByText('85')).toBeTruthy();
    // Grade 'B' appears multiple times (score circle + breakdown chip) — just verify it exists
    expect(getAllByText('B').length).toBeGreaterThan(0);
  });

  it('shows safety grade label', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText(/Grade B — Good/)).toBeTruthy();
  });

  it('shows warnings section', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Warnings')).toBeTruthy();
    expect(getByText('Contains added sugars')).toBeTruthy();
  });

  it('shows Rating Breakdown section', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Rating Breakdown')).toBeTruthy();
  });

  it('shows Nutrition Facts section', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Nutrition per 100g')).toBeTruthy();
  });

  it('shows Ingredients section', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Ingredients')).toBeTruthy();
    expect(getByText('• Apple juice')).toBeTruthy();
  });

  it('shows Scan Another button', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Scan Another')).toBeTruthy();
  });

  it('navigates to Scanner on Scan Another press', () => {
    const { getByText } = render(<ScanResultScreen />);
    fireEvent.press(getByText('Scan Another'));
    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Scanner' });
  });

  it('shows ingredients analysis chips', () => {
    const { getByText } = render(<ScanResultScreen />);
    expect(getByText('Ingredients Analysis')).toBeTruthy();
    expect(getByText('vegan')).toBeTruthy();
  });
});
