/**
 * The free tier's pressure valve: watch an ad, get five more scans this hour.
 *
 * In Expo Go the ads module is stubbed, so no ad can play. That is a limitation on
 * our side, and the user must not lose the scans they came for because of it — the
 * screen already treats a failed ad load as "grant anyway", and this proves the
 * stubbed environment reaches that path instead of hanging on a spinner.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockClaim = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/services/apiService', () => ({
  subscriptionRepository: { claimVideoReward: () => mockClaim() },
}));

// The same stub metro installs in Expo Go.
jest.mock('react-native-google-mobile-ads', () =>
  require('../../../src/mocks/react-native-google-mobile-ads'));

import VideoRewardScreen from '../../../src/screens/main/VideoRewardScreen';

describe('VideoRewardScreen where no ad can play', () => {
  beforeEach(() => jest.clearAllMocks());

  it('grants the reward rather than leaving the user waiting', async () => {
    mockClaim.mockResolvedValue({ granted: true, extra_scans: 5 });
    render(<VideoRewardScreen />);
    await waitFor(() => expect(mockClaim).toHaveBeenCalled());
  });

  it('confirms the scans were added', async () => {
    mockClaim.mockResolvedValue({ granted: true, extra_scans: 5 });
    const { findByText } = render(<VideoRewardScreen />);
    expect(await findByText('+5 Scans Granted!')).toBeTruthy();
  });

  it('does not sit on the loading spinner', async () => {
    mockClaim.mockResolvedValue({ granted: true, extra_scans: 5 });
    const { queryByText, findByText } = render(<VideoRewardScreen />);
    await findByText('+5 Scans Granted!');
    expect(queryByText(/Loading your ad/i)).toBeNull();
  });

  it('claims exactly once, however many ad events arrive', async () => {
    mockClaim.mockResolvedValue({ granted: true, extra_scans: 5 });
    render(<VideoRewardScreen />);
    await waitFor(() => expect(mockClaim).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 40));
    expect(mockClaim).toHaveBeenCalledTimes(1);
  });

  it('reports an hourly reward already taken without pretending it succeeded', async () => {
    mockClaim.mockResolvedValue({ granted: false, extra_scans: 0 });
    const { queryByText, findByText } = render(<VideoRewardScreen />);
    await waitFor(() => expect(mockClaim).toHaveBeenCalled());
    expect(queryByText('+5 Scans Granted!')).toBeNull();
    expect(await findByText('Already Claimed')).toBeTruthy();
  });
});
