/**
 * Safer Alternatives for an ai_premium / admin / super_admin user.
 *
 * The existing suite only covers free_user, which renders the upgrade prompt, so
 * nothing exercised the branch that actually fetches and lists alternatives.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGetDiscovery = jest.fn();
const mockGetAlternatives = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      scanResult: {
        product: { barcode: '7622210449283', name: 'Prince', brand: 'LU', images: [], ingredients: [] },
        safety_score: 45, safety_grade: 'D',
        saved_to_history: true, cached: false,
      },
    },
  }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'u1', email: 'a@b.com', first_name: 'A', role: 'super_admin' },
      isAuthenticated: true, isLoading: false, error: null,
    },
  }),
  AuthProvider: ({ children }: any) => children,
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
  discoveryRepository: { getDiscovery: (...a: unknown[]) => mockGetDiscovery(...a) },
  mlRepository: { getAlternatives: (...a: unknown[]) => mockGetAlternatives(...a) },
  behaviorRepository: { track: jest.fn().mockResolvedValue(undefined) },
  preferencesRepository: { get: jest.fn().mockResolvedValue({ default_currency: 'CZK' }) },
  ApiError: class ApiError extends Error { statusCode = 0; },
  UserRole: {},
}));

import ScanResultScreen from '../../../src/screens/product/ScanResultScreen';

const DISCOVERY = {
  barcode: '7622210449283',
  explanation: 'Prince scores D. Gerble is a safer choice in the same category.',
  alternatives: [
    { barcode: '3175681000000', name: 'Gerble sans sucres', grade: 'D', safety_score: 57.3, similarity_score: 0.85,
      prices: [{ price: 3.05, currency: 'EUR', shop_name: 'Carrefour', location_name: 'Carrefour' }] },
    { barcode: '3175681000001', name: 'Petits chocos', grade: 'D', safety_score: 54.7, similarity_score: 0.8,
      prices: [] },
  ],
  prices: [], search_results: [],
};

describe('Safer Alternatives for a super_admin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches discovery for a privileged user', async () => {
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    render(<ScanResultScreen />);
    await waitFor(() => expect(mockGetDiscovery).toHaveBeenCalled());
    // Privileged users get the marketplace discovery, not the ML-only endpoint.
    expect(mockGetAlternatives).not.toHaveBeenCalled();
  });

  it('lists the alternatives it received', async () => {
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    const { findByText } = render(<ScanResultScreen />);
    expect(await findByText('Gerble sans sucres')).toBeTruthy();
    expect(await findByText('Petits chocos')).toBeTruthy();
  });

  it('shows the explanation above the list', async () => {
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    const { findByText } = render(<ScanResultScreen />);
    expect(await findByText(/safer choice in the same category/)).toBeTruthy();
  });

  it('does not offer an upgrade prompt to a user who already has access', async () => {
    mockGetDiscovery.mockResolvedValue(DISCOVERY);
    const { queryByText } = render(<ScanResultScreen />);
    await waitFor(() => expect(mockGetDiscovery).toHaveBeenCalled());
    expect(queryByText('Premium feature')).toBeNull();
  });
});

describe('alternatives with incomplete data', () => {
  it('still lists an alternative that carries no prices', async () => {
    // alt.prices.length was read unguarded, so a single alternative without a
    // prices array threw during render and took the whole screen down.
    mockGetDiscovery.mockResolvedValue({
      ...DISCOVERY,
      alternatives: [{ barcode: '1', name: 'No price product', grade: 'C', safety_score: 60 }],
    });
    const { findByText } = render(<ScanResultScreen />);
    expect(await findByText('No price product')).toBeTruthy();
  });

  it('survives an alternative missing its grade', async () => {
    mockGetDiscovery.mockResolvedValue({
      ...DISCOVERY,
      alternatives: [{ barcode: '1', name: 'Ungraded product', safety_score: 60, prices: [] }],
    });
    const { findByText } = render(<ScanResultScreen />);
    expect(await findByText('Ungraded product')).toBeTruthy();
  });

  it('survives an alternative missing its score', async () => {
    mockGetDiscovery.mockResolvedValue({
      ...DISCOVERY,
      alternatives: [{ barcode: '1', name: 'Unscored product', grade: 'C', prices: [] }],
    });
    const { findByText } = render(<ScanResultScreen />);
    expect(await findByText('Unscored product')).toBeTruthy();
  });
});
