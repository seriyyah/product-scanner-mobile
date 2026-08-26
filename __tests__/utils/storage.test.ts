/**
 * SecureStore accepts only [A-Za-z0-9._-] in a key and throws on anything else.
 * The mocks used elsewhere in this suite accept any string, which is how five keys
 * containing ':' shipped and failed only on a real device. These tests reproduce the
 * native validation so that can't happen again.
 */
const mockStore = new Map<string, string>();

const mockAssertNativeKey = (key: string): void => {
  if (!key || !/^[A-Za-z0-9._-]+$/.test(key)) {
    throw new Error(
      'Invalid key provided to SecureStore. Keys must not be empty and contain only ' +
        'alphanumeric characters, ".", "-", and "_".',
    );
  }
};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    mockAssertNativeKey(key);
    return mockStore.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockAssertNativeKey(key);
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockAssertNativeKey(key);
    mockStore.delete(key);
  }),
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { storage } from '../../src/utils/storage';

describe('storage', () => {
  beforeEach(() => mockStore.clear());

  it('round-trips a plain key', async () => {
    await storage.setItem('auth_token', 'abc');
    expect(await storage.getItem('auth_token')).toBe('abc');
  });

  it.each(['reg:language', 'reg:currency', 'app:user_location', 'app:language'])(
    'accepts %s, which the native module would reject verbatim',
    async (key) => {
      await expect(storage.setItem(key, 'value')).resolves.not.toThrow();
      expect(await storage.getItem(key)).toBe('value');
    },
  );

  it('deletes what it wrote under a namespaced key', async () => {
    await storage.setItem('app:language', 'cs');
    await storage.deleteItem('app:language');
    expect(await storage.getItem('app:language')).toBeNull();
  });

  it('keeps distinct keys distinct after sanitising', async () => {
    await storage.setItem('app:language', 'cs');
    await storage.setItem('app.language', 'de');
    expect(await storage.getItem('app:language')).toBe('cs');
    expect(await storage.getItem('app.language')).toBe('de');
  });

  it('returns null rather than throwing when a key was never written', async () => {
    expect(await storage.getItem('never:written')).toBeNull();
  });
});
