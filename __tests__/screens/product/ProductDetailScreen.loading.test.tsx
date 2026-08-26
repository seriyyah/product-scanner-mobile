/**
 * Renders the screen the way the app does when opening a product from history:
 * with no scanResult in the route, so it goes loading -> loaded.
 *
 * The other suite passes a scanResult in route params, so it only ever rendered
 * the loaded branch. That hid a hook called after the early returns, which changed
 * the hook count between renders and crashed the screen with "Rendered more hooks
 * than during the previous render".
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetProductDetails = jest.fn();
const mockGetDiscovery = jest.fn();
let currentRole = 'free_user';
const mockRole = () => currentRole;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { barcode: '1234567890123' } }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: { user: { id: 'u1', role: mockRole() }, isAuthenticated: true, isLoading: false, error: null },
  }),
}));

jest.mock('../../../src/contexts/AppContext', () => ({
  useApp: () => ({
    location: null, locationAsked: true, locationLoaded: true,
    setLocation: jest.fn(), markLocationAsked: jest.fn(),
    currencyRates: null, convertPrice: (a: number) => a,
    refreshRates: jest.fn(), setLanguage: jest.fn(),
  }),
  AppProvider: ({ children }: any) => children,
}));

jest.mock('../../../src/services/apiService', () => ({
  scannerRepository: { getProductDetails: (...a: unknown[]) => mockGetProductDetails(...a) },
  discoveryRepository: { getDiscovery: (...a: unknown[]) => mockGetDiscovery(...a) },
  mlRepository: { getRecommendations: jest.fn().mockResolvedValue(null) },
  behaviorRepository: { track: jest.fn().mockResolvedValue(undefined) },
  priceRepository: { getPrices: jest.fn().mockResolvedValue(null) },
  UserRole: {},
}));

import ProductDetailScreen from '../../../src/screens/product/ProductDetailScreen';

describe('ProductDetailScreen opened from history', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders through loading into the loaded product without a hook-order change', async () => {
    mockGetProductDetails.mockResolvedValue({
      product: {
        barcode: '1234567890123', name: 'Prince', brand: 'LU',
        ingredients: ['wheat flour', 'sugar'], ingredients_text: 'wheat flour, sugar',
        images: [],
      },
      safety_score: 45, safety_grade: 'D',
      rating_breakdown: {
        nutriscore: { score: 60, weight: 0.35, grade: 'C' },
        nova_group: { score: 20, weight: 0.3, group: 4 },
      },
      warning_details: [
        { code: 'ultra_processed', severity: 'danger', text: 'Ultra-processed food', params: {} },
      ],
      warnings: ['Ultra-processed food'],
      data_quality: 'partial',
    });

    const { findAllByText, findByText } = render(<ProductDetailScreen />);
    // The name renders in both the header and the product card.
    expect((await findAllByText('Prince')).length).toBeGreaterThan(0);
    // The explanation renders, which is the branch that reads the reason params.
    expect(await findByText('Why this rating')).toBeTruthy();
  });

  it('renders an allergen reason, which resolves translation keys at render time', async () => {
    mockGetProductDetails.mockResolvedValue({
      product: { barcode: '1', name: 'Gum', images: [], ingredients: [], ingredients_text: 'x' },
      safety_score: 42, safety_grade: 'D',
      rating_breakdown: { allergens: { found: ['soybeans'] } },
      warnings: [], warning_details: [], data_quality: 'full',
    });

    const { findByText } = render(<ProductDetailScreen />);
    await waitFor(() => expect(mockGetProductDetails).toHaveBeenCalled());
    expect(await findByText(/soy/i)).toBeTruthy();
  });
});


describe('Safer Alternatives on the detail screen', () => {
  const DISCOVERY = {
    barcode: '1234567890123',
    explanation: 'Prince scores D. Gerble is a safer choice in the same category.',
    alternatives: [
      { barcode: '3175681226111', name: 'Gerble sans sucres', grade: 'D', safety_score: 57.3,
        similarity_score: 0.85, prices: [{ price: 3.05, currency: 'EUR', shop_name: 'Carrefour', location_name: 'Carrefour' }] },
      { barcode: '3175681226112', name: 'Petits chocos', grade: 'D', safety_score: 54.7,
        similarity_score: 0.8, prices: [] },
    ],
    prices: [], search_results: [],
  };

  const PRODUCT = {
    product: { barcode: '1234567890123', name: 'Prince', images: [], ingredients: [], ingredients_text: 'flour' },
    safety_score: 45, safety_grade: 'D', warnings: [], warning_details: [], data_quality: 'full',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentRole = 'super_admin';
    mockGetProductDetails.mockResolvedValue(PRODUCT);
  });

  afterEach(() => { currentRole = 'free_user'; });

  it('lists alternatives when a product is opened from history', async () => {
    // This is the screen History links to. Only the scan-result screen was covered,
    // so the same list failing here would have gone unnoticed.
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    const { findByText } = render(<ProductDetailScreen />);
    expect(await findByText('Gerble sans sucres')).toBeTruthy();
    expect(await findByText('Petits chocos')).toBeTruthy();
  });

  it('does not show a paywall to a user who already has access', async () => {
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    const { queryByText, findByText } = render(<ProductDetailScreen />);
    await findByText('Gerble sans sucres');
    expect(queryByText('Premium feature')).toBeNull();
  });

  it('survives an alternative with no prices', async () => {
    mockGetDiscovery.mockResolvedValue({
      ...DISCOVERY,
      alternatives: [{ barcode: '1', name: 'No price product', grade: 'C', safety_score: 60 }],
    });
    const { findByText } = render(<ProductDetailScreen />);
    expect(await findByText('No price product')).toBeTruthy();
  });
});
