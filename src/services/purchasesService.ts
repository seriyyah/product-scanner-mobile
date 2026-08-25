/**
 * RevenueCat integration.
 *
 * Subscriptions are sold through the App Store and Google Play, so purchases happen
 * on-device: RevenueCat validates the receipt with the store and posts the resulting
 * entitlement to our backend webhook, which updates the user's tier.
 *
 * The SDK is a native module, so it is unavailable in Expo Go and absent until an
 * EAS development build is made. Every call here degrades to a no-op when the SDK or
 * the API key is missing, which is also the correct behaviour before the stores are
 * configured — the backend reports `purchasable: false` in exactly that state.
 *
 * The app user id handed to RevenueCat MUST be our own user UUID. Without it the
 * webhook cannot link a purchase to an account and the entitlement is dropped.
 */
import { Platform } from 'react-native';

export interface PurchasePackage {
  identifier: string;
  productId: string;
  priceString: string;
  title: string;
}

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

type PurchasesModule = typeof import('react-native-purchases').default;

let cachedModule: PurchasesModule | null | undefined;

/** Loads the native SDK, or null where it is unavailable (Expo Go, web, tests). */
const loadSdk = (): PurchasesModule | null => {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // Required lazily so the app still starts without a native build present.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedModule = require('react-native-purchases').default as PurchasesModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
};

export class PurchasesService {
  private configured = false;

  /** False until an API key is supplied and the native SDK is present. */
  public get isAvailable(): boolean {
    return Boolean(API_KEY) && loadSdk() !== null;
  }

  /** Idempotent — safe to call on every auth transition. */
  public async configure(userId?: string): Promise<boolean> {
    const sdk = loadSdk();
    if (!API_KEY || !sdk) return false;
    try {
      if (!this.configured) {
        await sdk.configure({ apiKey: API_KEY, appUserID: userId ?? null });
        this.configured = true;
      } else if (userId) {
        await sdk.logIn(userId);
      }
      return true;
    } catch {
      // A purchase failure must never prevent someone using the app.
      return false;
    }
  }

  /**
   * Ties the store account to our user, so the webhook can resolve the purchase.
   */
  public async identify(userId: string): Promise<void> {
    if (!userId) return;
    const sdk = loadSdk();
    if (!API_KEY || !sdk) return;
    try {
      await (this.configured ? sdk.logIn(userId) : this.configure(userId));
    } catch {
      /* non-fatal */
    }
  }

  public async forgetUser(): Promise<void> {
    const sdk = loadSdk();
    if (!API_KEY || !sdk || !this.configured) return;
    try {
      await sdk.logOut();
    } catch {
      /* non-fatal */
    }
  }

  /** Packages available to buy, or an empty list when purchasing is unavailable. */
  public async getPackages(): Promise<PurchasePackage[]> {
    const sdk = loadSdk();
    if (!API_KEY || !sdk) return [];
    try {
      const offerings = await sdk.getOfferings();
      const current = offerings?.current;
      if (!current) return [];
      return current.availablePackages.map((pkg: any) => ({
        identifier: pkg.identifier,
        productId: pkg.product?.identifier ?? '',
        priceString: pkg.product?.priceString ?? '',
        title: pkg.product?.title ?? '',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Runs the store purchase flow.
   *
   * Entitlement state is authoritative on the backend, which learns about the
   * purchase from RevenueCat's webhook — this only reports whether the store
   * transaction completed.
   */
  public async purchase(packageIdentifier: string): Promise<'purchased' | 'cancelled' | 'unavailable'> {
    const sdk = loadSdk();
    if (!API_KEY || !sdk) return 'unavailable';
    try {
      const offerings = await sdk.getOfferings();
      const target = offerings?.current?.availablePackages.find(
        (pkg: any) => pkg.identifier === packageIdentifier,
      );
      if (!target) return 'unavailable';
      await sdk.purchasePackage(target as any);
      return 'purchased';
    } catch (error: any) {
      if (error?.userCancelled) return 'cancelled';
      return 'unavailable';
    }
  }

  /** Restores a subscription bought on another device or after a reinstall. */
  public async restore(): Promise<boolean> {
    const sdk = loadSdk();
    if (!API_KEY || !sdk) return false;
    try {
      await sdk.restorePurchases();
      return true;
    } catch {
      return false;
    }
  }
}

export const purchasesService = new PurchasesService();
