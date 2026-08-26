/**
 * How each screen is presented, and whether you can get out of it.
 *
 * ScanResult and ProductDetail were presented as modals. On this stack a modal
 * gets a vertical dismiss gesture rather than the horizontal swipe-back people
 * expect, and with headerShown false ScanResult had no back control of any kind —
 * the only way out was to scroll to the bottom and tap "Scan Another", which
 * navigates somewhere else entirely rather than going back.
 */
import { SCREEN_OPTIONS, type PushedScreen } from '@/navigation/screenOptions';

const opts = (name: string) => SCREEN_OPTIONS[name as PushedScreen];

describe('screens you navigate into and back out of', () => {
  it.each(['ScanResult', 'ProductDetail', 'Subscription', 'Preferences'])(
    '%s is a card, so the swipe goes back rather than dismissing downward',
    (screen) => {
      expect(opts(screen)?.presentation).toBe('card');
    },
  );

  it.each(['ScanResult', 'ProductDetail', 'Subscription', 'Preferences'])(
    '%s can be swiped back',
    (screen) => {
      expect(opts(screen)?.gestureEnabled).toBe(true);
    },
  );

  it.each(['ScanResult', 'ProductDetail'])(
    '%s swipes horizontally, matching the platform convention',
    (screen) => {
      expect(opts(screen)?.gestureDirection).toBe('horizontal');
    },
  );

  it('keeps the video reward as a modal, because it is a task you dismiss', () => {
    // It is not somewhere you navigated from and want to return to — you either
    // finish watching or abandon it.
    expect(SCREEN_OPTIONS.VideoReward?.presentation).toBe('modal');
  });

  it('gives the swipe a wide enough edge target to be usable', () => {
    // The default edge strip is narrow and easy to miss on a large phone.
    for (const screen of ['ScanResult', 'ProductDetail']) {
      const width = opts(screen)?.gestureResponseDistance;
      expect(typeof width).toBe('number');
      expect(width as number).toBeGreaterThanOrEqual(50);
    }
  });

  it('defines options for every screen the main stack pushes', () => {
    const pushed = ['Subscription', 'VideoReward', 'Preferences', 'ScanResult', 'ProductDetail'];
    expect(Object.keys(SCREEN_OPTIONS).sort()).toEqual(pushed.sort());
  });
});
