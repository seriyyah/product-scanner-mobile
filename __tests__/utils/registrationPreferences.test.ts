const mockSetItem = jest.fn();

// Called through a wrapper: the factory runs while the const above is still
// uninitialised, so capturing it directly would install `undefined` as setItem.
jest.mock('@/utils/storage', () => ({
  storage: {
    setItem: (...args: unknown[]) => mockSetItem(...args),
    getItem: jest.fn(),
    deleteItem: jest.fn(),
  },
}));

import { persistRegistrationPreferences } from '@/utils/registrationPreferences';

describe('persistRegistrationPreferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores the chosen language and currency', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await persistRegistrationPreferences('cs', 'CZK');
    expect(mockSetItem).toHaveBeenCalledWith('reg.language', 'cs');
    expect(mockSetItem).toHaveBeenCalledWith('reg.currency', 'CZK');
  });

  it('uses keys the native SecureStore will accept', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await persistRegistrationPreferences('cs', 'CZK');
    expect(mockSetItem.mock.calls.length).toBe(2);
    for (const [key] of mockSetItem.mock.calls) {
      expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
    }
  });

  it('never rejects, so a storage failure cannot fail an account that was created', async () => {
    // The account already exists on the server by the time this runs. Letting a
    // preference write reject told the user "Registration Failed" for an account
    // that had in fact been created, leaving them unable to register again.
    mockSetItem.mockRejectedValue(new Error('Invalid key provided to SecureStore.'));
    await expect(persistRegistrationPreferences('cs', 'CZK')).resolves.toBeUndefined();
  });

  it('still attempts the currency after the language write fails', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    await persistRegistrationPreferences('cs', 'CZK');
    expect(mockSetItem).toHaveBeenCalledWith('reg.currency', 'CZK');
  });
});
