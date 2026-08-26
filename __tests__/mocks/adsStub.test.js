/**
 * The Expo Go stub for react-native-google-mobile-ads.
 *
 * Expo Go has no compiled binary for the real module, so metro swaps in this stub.
 * It used to be inert — load() did nothing and no listener ever fired — so
 * VideoRewardScreen waited on a spinner forever and the user lost the extra scans
 * they had come for. An ad we cannot play is our problem, not theirs.
 */
const ads = require('../../src/mocks/react-native-google-mobile-ads');

const { RewardedAd, RewardedAdEventType, AdEventType } = ads;

jest.setTimeout(2000);

describe('ads stub', () => {
  it('reports an error rather than staying silent', (done) => {
    const ad = RewardedAd.createForAdRequest('test-id', {});
    ad.addAdEventListener(AdEventType.ERROR, () => done());
    ad.load();
  });

  it('never reports a loaded ad it cannot show', (done) => {
    const ad = RewardedAd.createForAdRequest('test-id', {});
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      done(new Error('claimed an ad was ready when none can play'));
    });
    ad.addAdEventListener(AdEventType.ERROR, () => done());
    ad.load();
  });

  it('never reports an earned reward, so nothing is granted on a false pretext', (done) => {
    const ad = RewardedAd.createForAdRequest('test-id', {});
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      done(new Error('claimed a reward was earned without an ad'));
    });
    ad.addAdEventListener(AdEventType.ERROR, () => done());
    ad.load();
  });

  it('stops calling a listener once it is unsubscribed', (done) => {
    const ad = RewardedAd.createForAdRequest('test-id', {});
    const unsub = ad.addAdEventListener(AdEventType.ERROR, () => {
      done(new Error('called a listener after unsubscribe'));
    });
    unsub();
    ad.load();
    setTimeout(done, 30);
  });

  it('returns an unsubscribe function from addAdEventListener', () => {
    const ad = RewardedAd.createForAdRequest('test-id', {});
    expect(typeof ad.addAdEventListener(AdEventType.ERROR, () => {})).toBe('function');
  });

  it('still exposes the surface the screen imports', () => {
    expect(ads.TestIds.REWARDED).toBeDefined();
    expect(typeof ads.MobileAds).toBe('function');
    expect(AdEventType.CLOSED).toBeDefined();
  });
});
