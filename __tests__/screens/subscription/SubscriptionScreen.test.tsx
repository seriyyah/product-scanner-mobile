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
const mockGetProducts = jest.fn().mockResolvedValue({
  purchasable: false,
  status: 'coming_soon',
  tiers: {},
});

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: {
    getStatus: () => mockGetStatus(),
    getProducts: () => mockGetProducts(),
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

  it('shows a coming-soon label while store purchases are unavailable', async () => {
    const { findAllByText } = render(<SubscriptionScreen />);
    // The backend reports purchasable: false until the stores are configured.
    expect((await findAllByText('Coming soon')).length).toBeGreaterThan(0);
  });

  it('offers the upgrade action once purchases are available', async () => {
    mockGetProducts.mockResolvedValueOnce({
      purchasable: true,
      status: 'available',
      tiers: {},
    });
    const { findByText } = render(<SubscriptionScreen />);
    expect(await findByText('Upgrade to Premium')).toBeTruthy();
  });

  it('states that billing goes through the app stores', async () => {
    const { findByText } = render(<SubscriptionScreen />);
    expect(
      await findByText(/billed through the App Store or Google Play/i),
    ).toBeTruthy();
  });

  // The staff view is covered in SubscriptionScreen.admin.test.tsx: useAuth is
  // mocked at module scope here, so a different role needs its own file.
});

describe('plan descriptions', () => {
  it('does not advertise both an hourly cap and unlimited scans on Premium', async () => {
    // Premium listed "20 scans per hour" and "Unlimited scans" as included at once,
    // which contradicted itself. The cap belongs to Free only.
    mockGetProducts.mockResolvedValue({ purchasable: false, status: 'coming_soon', tiers: {} });
    const { queryAllByText } = render(<SubscriptionScreen />);
    await waitFor(() => {
      expect(queryAllByText('20 scans per hour')).toHaveLength(1);
    });
  });
});

describe('most popular badge', () => {
  const catalogue = (most_popular: string | null) => ({
    purchasable: true,
    status: 'available',
    most_popular,
    tiers: {},
  });

  it('badges the tier the backend reports', async () => {
    mockGetProducts.mockResolvedValue(catalogue('premium'));
    const { queryByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(queryByText('Most Popular')).toBeTruthy());
  });

  it('shows no popularity badge when the backend reports none', async () => {
    // Nobody has subscribed yet, so claiming a most popular plan would be untrue.
    mockGetProducts.mockResolvedValue(catalogue(null));
    const { queryByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(queryByText('Most Popular')).toBeNull());
  });

  it('does not badge Premium when AI Premium is the popular one', async () => {
    mockGetProducts.mockResolvedValue(catalogue('ai_premium'));
    const { queryAllByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(queryAllByText('Most Popular')).toHaveLength(1));
    // Premium keeps no badge; the claim moved to the tier that earned it.
    expect(queryAllByText('Best Value')).toHaveLength(0);
  });

  it('shows no popularity badge when the catalogue cannot be loaded', async () => {
    mockGetProducts.mockRejectedValue(new Error('offline'));
    const { queryByText } = render(<SubscriptionScreen />);
    await waitFor(() => expect(queryByText('Most Popular')).toBeNull());
  });
});
