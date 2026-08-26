/**
 * Expo Go stub for react-native-purchases.
 *
 * The real SDK calls into a compiled native binary at require-time, which Expo Go
 * does not have. Metro swaps this in unless NATIVE_BUILD=1, mirroring how
 * react-native-google-mobile-ads and expo-location are handled.
 *
 * Everything resolves to "nothing available", which is what purchasesService
 * expects when purchasing is not configured — the paywall then shows its
 * coming-soon state instead of a buy button.
 */
const noop = async () => undefined;

const Purchases = {
  configure: noop,
  logIn: noop,
  logOut: noop,
  getOfferings: async () => ({ current: null, all: {} }),
  purchasePackage: async () => {
    throw Object.assign(new Error('Purchases unavailable in Expo Go'), {
      userCancelled: false,
    });
  },
  restorePurchases: noop,
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  setLogLevel: () => {},
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.LOG_LEVEL = { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };
