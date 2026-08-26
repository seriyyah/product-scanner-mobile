import type { StackNavigationOptions } from '@react-navigation/stack';

/**
 * How each pushed screen is presented.
 *
 * Everything you navigate *into and back out of* is a card: on iOS that gives the
 * horizontal swipe-back people reach for without thinking. Presenting these as
 * modals gave a vertical dismiss gesture instead, and with no header there was no
 * back control at all — the only exit from a scan result was to scroll to the
 * bottom and tap "Scan Another", which goes somewhere else rather than back.
 *
 * The video reward stays a modal because it genuinely is one: a task you complete
 * or abandon, not a place you came from.
 */

/** Wide enough to catch a thumb reaching from the edge of a large phone. */
const EDGE_SWIPE_WIDTH = 60;

const swipeBack: StackNavigationOptions = {
  presentation: 'card',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  gestureResponseDistance: EDGE_SWIPE_WIDTH,
};

/** Screens the main stack pushes on top of the tabs. */
export type PushedScreen =
  | 'Subscription'
  | 'Preferences'
  | 'ScanResult'
  | 'ProductDetail'
  | 'VideoReward';

// Keyed by literal name rather than string, so a lookup is never possibly
// undefined and the navigator gets a concrete options object.
export const SCREEN_OPTIONS: Record<PushedScreen, StackNavigationOptions> = {
  Subscription: { ...swipeBack },
  Preferences: { ...swipeBack },
  ScanResult: { ...swipeBack },
  ProductDetail: { ...swipeBack },
  VideoReward: {
    presentation: 'modal',
    gestureEnabled: true,
    gestureDirection: 'vertical',
  },
};
