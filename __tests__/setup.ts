// This file runs as a setupFile (before Jest globals).
// Do NOT import @testing-library/jest-native/extend-expect here — it requires expect to be defined first.

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('react-native-google-mobile-ads', () => ({
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn().mockReturnValue(jest.fn()),
      load: jest.fn(),
      show: jest.fn(),
    })),
  },
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn().mockReturnValue(jest.fn()),
      load: jest.fn(),
    })),
  },
  AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward', ERROR: 'error' },
  TestIds: { INTERSTITIAL: 'test-interstitial-id', REWARDED: 'test-rewarded-id' },
  AdsConsent: { requestInfoUpdate: jest.fn(), loadAndShowConsentFormIfRequired: jest.fn() },
  AdsConsentStatus: { OBTAINED: 'obtained', NOT_REQUIRED: 'not_required' },
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
    useIsFocused: () => true,
  };
});
