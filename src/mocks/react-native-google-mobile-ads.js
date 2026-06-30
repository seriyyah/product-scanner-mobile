// Stub for react-native-google-mobile-ads — used in Expo Go (no native binary).
// Real ads require expo run:ios / EAS Build.
const noop = () => {};
const noopUnsub = () => noop;

const RewardedAd = {
  createForAdRequest: () => ({
    addAdEventListener: () => noopUnsub,
    load: noop,
    show: noop,
  }),
};

const RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' };
const AdEventType = { CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' };
const TestIds = { REWARDED: 'test', INTERSTITIAL: 'test', BANNER: 'test' };
const MobileAds = () => ({ initialize: () => Promise.resolve([]) });

module.exports = { RewardedAd, RewardedAdEventType, AdEventType, TestIds, MobileAds };
