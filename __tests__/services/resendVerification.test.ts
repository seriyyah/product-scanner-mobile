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
