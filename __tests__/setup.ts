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

// The screens were translated in "feat: i18n, GPS location, currency conversion"
// but the tests still assert English copy, and jest never initialises i18next — so
// every t() call rendered empty. Resolving against the real English resources keeps
// those assertions meaningful and exercises the translation layer rather than a stub.
jest.mock('react-i18next', () => {
  const en = jest.requireActual('../src/locales/en.json');

  const lookup = (key: string): string | undefined =>
    key.split('.').reduce<any>((node, part) => (node == null ? undefined : node[part]), en);

  const translate = (key: string, options?: any): string => {
    const found = lookup(key);
    const fallback =
      typeof options === 'string' ? options : options?.defaultValue;
    let result = typeof found === 'string' ? found : (fallback ?? key);
    if (options && typeof options === 'object') {
      for (const [name, value] of Object.entries(options)) {
        result = result.split(`{{${name}}}`).join(String(value));
      }
    }
    return result;
  };

  return {
    useTranslation: () => ({
      t: translate,
      i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: jest.fn() },
    Trans: ({ children }: any) => children,
  };
});
