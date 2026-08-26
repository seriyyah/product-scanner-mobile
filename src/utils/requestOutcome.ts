/**
 * Whether a failed request means "still working" or "gave up".
 *
 * Discovery can take minutes on the free-tier host. The client gives up after
 * 30 seconds, but the server keeps going and caches the answer — so a timeout
 * means the result will be there shortly, not that it cannot be had.
 */
export type Outcome = 'pending' | 'error';

export const classifyFailure = (error: unknown): Outcome => {
  const e = (error ?? {}) as { code?: string; message?: string; statusCode?: number };
  if (e.code === 'ECONNABORTED') return 'pending';
  if (typeof e.message === 'string' && /timeout/i.test(e.message)) return 'pending';
  if (e.statusCode === 504 || e.statusCode === 408) return 'pending';
  // Anything unrecognised stays an error: claiming work is still running when it
  // is not leaves someone waiting for a result that will never arrive.
  return 'error';
};
