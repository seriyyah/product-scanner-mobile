/**
 * Staff hold every feature without paying, so the paywall must not be shown to
 * them. useAuth is mocked at module scope, so covering this role needs its own
 * file rather than a re-mock inside the main suite.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'a1', email: 'admin@test.com', first_name: 'Root', role: 'super_admin' },
      isAuthenticated: true, isLoading: false, error: null,
    },
  }),
}));

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: {
    getStatus: jest.fn().mockResolvedValue({ tier: 'ai_premium', is_active: true, features: [] }),
    getProducts: jest.fn().mockResolvedValue({ purchasable: true, status: 'available', most_popular: 'premium', tiers: {} }),
  },
  UserRole: {},
}));

jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

import SubscriptionScreen from '../../../src/screens/subscription/SubscriptionScreen';

describe('SubscriptionScreen for staff', () => {
  it('states that access needs no subscription', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText(/No Subscription Needed/i)).toBeTruthy();
  });

  it('offers no upgrade buttons', () => {
    const { queryByText } = render(<SubscriptionScreen />);
    expect(queryByText('Upgrade to Premium')).toBeNull();
    expect(queryByText('Upgrade to AI Premium')).toBeNull();
  });

  it('shows no popularity badge, because there is no plan to sell them', () => {
    const { queryByText } = render(<SubscriptionScreen />);
    expect(queryByText('Most Popular')).toBeNull();
  });
});
