import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore keys may contain only alphanumerics, ".", "-" and "_". Anything else
 * makes the native module throw, and it throws on read as well as write — so a single
 * bad key takes down whatever flow touched it. Callers should not have to know that,
 * so keys are encoded here instead.
 */
const NATIVE_KEY_RULE = /^[A-Za-z0-9._-]+$/;
const ENCODED_PREFIX = 'enc_';

/**
 * Leaves already-legal keys untouched, so tokens stored by earlier builds stay
 * readable. Anything else becomes a hex-encoded form under a reserved prefix. Keys
 * that already start with that prefix are encoded too, which is what keeps the
 * mapping one-to-one: no encoded key can collide with a raw one.
 */
const nativeKey = (key: string): string => {
  if (NATIVE_KEY_RULE.test(key) && !key.startsWith(ENCODED_PREFIX)) {
    return key;
  }
  let hex = '';
  for (let i = 0; i < key.length; i += 1) {
    hex += key.charCodeAt(i).toString(16).padStart(4, '0');
  }
  return `${ENCODED_PREFIX}${hex}`;
};

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(nativeKey(key));
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(nativeKey(key), value);
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(nativeKey(key));
  },
};
