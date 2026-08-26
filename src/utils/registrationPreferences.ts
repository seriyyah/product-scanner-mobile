import { storage } from '@/utils/storage';

/** Keys the user picked at sign-up, read back by PreferencesScreen after first login. */
const LANGUAGE_KEY = 'reg.language';
const CURRENCY_KEY = 'reg.currency';

const persist = async (key: string, value: string): Promise<void> => {
  try {
    await storage.setItem(key, value);
  } catch (error) {
    // Deliberately swallowed. These are display defaults the user can change in
    // Preferences at any time, and by the time this runs the account already exists
    // on the server — so a failure here must not surface as a failed registration.
    console.warn(`Could not persist ${key}:`, error);
  }
};

/**
 * Records the language and currency chosen during sign-up. Never rejects.
 */
export const persistRegistrationPreferences = async (
  language: string,
  currency: string,
): Promise<void> => {
  await persist(LANGUAGE_KEY, language);
  await persist(CURRENCY_KEY, currency);
};
