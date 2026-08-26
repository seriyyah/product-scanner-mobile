// Stub for react-native-google-mobile-ads — used in Expo Go, which has no compiled
// native binary for it. Real ads require expo run:ios / EAS Build with NATIVE_BUILD=1.
//
// This stub reports ERROR as soon as load() is called. It used to do nothing at all,
// so no listener ever fired and the reward screen waited on a spinner forever — the
// user lost the extra scans they came for because of a limitation on our side.
// Reporting an error routes them into the screen's existing "ad unavailable, don't
// penalise the user" path. It never reports LOADED or EARNED_REWARD, so nothing is
// granted on the pretext of an ad that was never shown.

const AdEventType = { CLOSED: 'closed', ERROR: 'error', OPENED: 'opened' };
const RewardedAdEventType = { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' };

const createForAdRequest = () => {
  const listeners = new Map();

  return {
    addAdEventListener(type, handler) {
      const forType = listeners.get(type) || new Set();
      forType.add(handler);
      listeners.set(type, forType);
      return () => forType.delete(handler);
    },
    load() {
      // Asynchronous, like the real module: a listener registered on the line after
      // load() must still receive the event.
      setTimeout(() => {
        const forType = listeners.get(AdEventType.ERROR);
        if (!forType) return;
        const error = new Error('Ads are unavailable in Expo Go');
        for (const handler of Array.from(forType)) handler(error);
      }, 0);
    },
    show() {},
  };
};

const RewardedAd = { createForAdRequest };
const InterstitialAd = { createForAdRequest };
const TestIds = { REWARDED: 'test', INTERSTITIAL: 'test', BANNER: 'test' };
const MobileAds = () => ({ initialize: () => Promise.resolve([]) });

module.exports = {
  RewardedAd,
  InterstitialAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
  MobileAds,
};
