import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
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

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'user-123', email: 'test@test.com', first_name: 'Jane', role: 'free_user' },
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
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('../../../src/contexts/AppContext', () => ({
  useApp: () => ({
    location: null,
    locationAsked: true,
    locationLoaded: true,
    setLocation: jest.fn(),
    markLocationAsked: jest.fn(),
    currencyRates: null,
    convertPrice: (amount: number) => amount,
    refreshRates: jest.fn(),
    setLanguage: jest.fn(),
  }),
  AppProvider: ({ children }: any) => children,
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

  it('shows warnings inside the explanation rather than as a second list', () => {
    // A separate "Warnings" card repeated what the breakdown already said, and
    // rendered method notes in the same red as real hazards.
    const { getByText, queryByText } = render(<ScanResultScreen />);
    expect(queryByText('Warnings')).toBeNull();
    expect(getByText('Why this rating')).toBeTruthy();
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

describe('getting back out of a scan result', () => {
  it('offers a back control at the top of the screen', async () => {
    // There was none. The only exit was the button at the very bottom, which
    // navigates to the scanner rather than returning where you came from.
    const { findByLabelText } = render(<ScanResultScreen />);
    expect(await findByLabelText('Go back')).toBeTruthy();
  });

  it('goes back rather than navigating somewhere new', async () => {
    const { findByLabelText } = render(<ScanResultScreen />);
    fireEvent.press(await findByLabelText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
