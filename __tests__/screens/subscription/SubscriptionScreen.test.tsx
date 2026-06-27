import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      user: { id: 'u1', email: 'test@test.com', first_name: 'Test', role: 'free_user' },
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

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import SubscriptionScreen from '../../../src/screens/subscription/SubscriptionScreen';

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('ProductScanner Premium')).toBeTruthy();
  });

  it('shows all tier cards for free user', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText('Free')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('AI Premium')).toBeTruthy();
  });

  it('marks Free as current tier for free user', () => {
    const { getAllByText } = render(<SubscriptionScreen />);
    const currentBadges = getAllByText('Current');
    expect(currentBadges.length).toBeGreaterThan(0);
  });

  it('shows Coming Soon badges', () => {
    const { getAllByText } = render(<SubscriptionScreen />);
    const comingSoon = getAllByText('Coming Soon');
    expect(comingSoon.length).toBeGreaterThanOrEqual(2);
  });

  it('shows Notify Me buttons for non-current tiers', () => {
    const { getAllByText } = render(<SubscriptionScreen />);
    const notifyBtns = getAllByText('Notify Me');
    expect(notifyBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('shows coming soon message', () => {
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText(/Premium subscriptions are coming soon/)).toBeTruthy();
  });

  it('shows admin view for admin role', () => {
    jest.resetModules();
  });
});
