import React from 'react';
import { render } from '@testing-library/react-native';

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
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: mockAddListener.mockReturnValue(jest.fn()),
      load: mockLoad,
    })),
  },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' },
  AdEventType: { CLOSED: 'closed', ERROR: 'error' },
  TestIds: { REWARDED: 'test-rewarded-id' },
}));

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: {
    claimVideoReward: jest.fn().mockResolvedValue({ granted: true, extra_scans: 5, message: 'ok' }),
  },
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

  it('creates a rewarded ad on mount with GDPR flag', () => {
    const { RewardedAd } = require('react-native-google-mobile-ads');
    render(<VideoRewardScreen />);
    expect(RewardedAd.createForAdRequest).toHaveBeenCalledWith(
      'test-rewarded-id',
      expect.objectContaining({ requestNonPersonalizedAdsOnly: true }),
    );
    expect(mockLoad).toHaveBeenCalled();
  });

  it('registers LOADED, EARNED_REWARD, CLOSED, and ERROR listeners', () => {
    render(<VideoRewardScreen />);
    const eventTypes = mockAddListener.mock.calls.map((c: any[]) => c[0]);
    expect(eventTypes).toContain('loaded');
    expect(eventTypes).toContain('earned_reward');
    expect(eventTypes).toContain('closed');
    expect(eventTypes).toContain('error');
  });
});
