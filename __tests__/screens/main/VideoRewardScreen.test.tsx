import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockAddListener = jest.fn();
const mockLoad = jest.fn();

jest.mock('react-native-google-mobile-ads', () => ({
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: mockAddListener.mockReturnValue(jest.fn()),
      load: mockLoad,
    })),
  },
  AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' },
  TestIds: { INTERSTITIAL: 'test-interstitial-id' },
}));

const mockClaimVideoReward = jest.fn().mockResolvedValue({
  granted: true,
  extra_scans: 5,
  message: 'You earned 5 extra scans!',
});

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: { claimVideoReward: () => mockClaimVideoReward() },
}));

import VideoRewardScreen from '../../../src/screens/main/VideoRewardScreen';

describe('VideoRewardScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading state initially', () => {
    const { getByText } = render(<VideoRewardScreen />);
    expect(getByText('Loading your ad…')).toBeTruthy();
  });

  it('shows Watch & Earn header', () => {
    const { getByText } = render(<VideoRewardScreen />);
    expect(getByText('Watch & Earn')).toBeTruthy();
  });

  it('creates an interstitial ad on mount', () => {
    const { InterstitialAd } = require('react-native-google-mobile-ads');
    render(<VideoRewardScreen />);
    expect(InterstitialAd.createForAdRequest).toHaveBeenCalledWith(
      'test-interstitial-id',
      expect.objectContaining({ requestNonPersonalizedAdsOnly: true }),
    );
    expect(mockLoad).toHaveBeenCalled();
  });

  it('registers LOADED, CLOSED, and ERROR listeners', () => {
    render(<VideoRewardScreen />);
    const eventTypes = mockAddListener.mock.calls.map((c: any[]) => c[0]);
    expect(eventTypes).toContain('loaded');
    expect(eventTypes).toContain('closed');
    expect(eventTypes).toContain('error');
  });
});
