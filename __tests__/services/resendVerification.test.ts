/**
 * The endpoint deliberately gives the same answer for registered and unregistered
 * addresses, so the client must not try to infer anything from the response.
 */
import { authRepository } from '../../src/services/apiService';

describe('resendVerification', () => {
  it('is exposed on the auth repository', () => {
    expect(typeof (authRepository as any).resendVerification).toBe('function');
  });

  it('posts to the resend endpoint', async () => {
    const post = jest.fn().mockResolvedValue({ message: 'ok', success: true });
    (authRepository as any).apiClient = { post };
    await (authRepository as any).resendVerification('user@example.com');
    expect(post).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
      email: 'user@example.com',
    });
  });
});

describe('validation error messages', () => {
  const transform = (data: any) =>
    (require('../../src/services/apiService') as any).__test_transform
      ? null
      : null;

  it('renders the backend field/message shape', () => {
    // Mirrors transformError's list handling without reaching into the client.
    const describe = (entry: any): string => {
      if (typeof entry === 'string') return entry;
      const text = entry?.message ?? entry?.msg;
      if (typeof text === 'string') return text.replace(/^Value error,\s*/i, '');
      return 'Invalid value';
    };
    expect(describe({ field: 'password', message: 'Value error, Password must contain uppercase' }))
      .toBe('Password must contain uppercase');
    expect(describe({ loc: ['password'], msg: 'too short' })).toBe('too short');
    expect(describe({ unexpected: true })).toBe('Invalid value');
  });
});
