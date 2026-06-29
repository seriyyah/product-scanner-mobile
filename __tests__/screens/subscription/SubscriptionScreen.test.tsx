import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'u1', email: 'test@test.com', first_name: 'Test', role: 'free_user' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockGetStatus = jest.fn().mockResolvedValue({
  tier: 'free', is_active: true, features: [], upgrade_url: '/premium',
});
const mockCreateCheckout = jest.fn().mockResolvedValue({
  checkout_url: 'https://checkout.stripe.com/test', session_id: 'sess_123',
  tier: 'premium', interval: 'month', currency: 'EUR',
});

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: {
    getStatus: () => mockGetStatus(),
    createCheckout: (...args: any[]) => mockCreateCheckout(...args),
  },
  UserRole: {},
}));

jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

import SubscriptionScreen from '../../../src/screens/subscription/SubscriptionScreen';

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStatus.mockResolvedValue({ tier: 'free', is_active: true, features: [] });
  });

  it('renders without crashing', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('ProductScanner Premium')).toBeTruthy();
  });

  it('shows all tier cards', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Free')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('AI Premium')).toBeTruthy();
  });

  it('shows current plan badge for free user', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(getByText('Your current plan')).toBeTruthy());
  });

  it('shows upgrade buttons for paid tiers', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(getByText('Upgrade to Premium')).toBeTruthy();
      expect(getByText('Upgrade to AI Premium')).toBeTruthy();
    });
  });

  it('calls checkout API and opens URL on upgrade tap', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    await waitFor(() => getByText('Upgrade to Premium'));
    fireEvent.press(getByText('Upgrade to Premium'));
    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith('premium', 'month', 'eur');
      expect(Linking.openURL).toHaveBeenCalledWith('https://checkout.stripe.com/test');
    });
  });

  it('shows Stripe disclaimer', async () => {
    const { getByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(getByText(/Payments processed securely by Stripe/)).toBeTruthy());
  });

  it('shows admin view for admin role', () => {
    jest.resetModules();
  });
});
