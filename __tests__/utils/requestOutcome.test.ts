/**
 * Telling "still working" apart from "failed".
 *
 * Discovery can take minutes on the free-tier host: it searches Open Food Facts,
 * embeds the product and compares it against the index. The client gives up after
 * 30 seconds and showed "alternatives unavailable" — an error — while the server
 * was still working and would cache the result moments later.
 *
 * A timeout is not a failure. The work continues and the answer is there on the
 * next visit, so the screen should say so rather than report a dead end.
 */
import { classifyFailure } from '@/utils/requestOutcome';

describe('classifyFailure', () => {
  it('treats an axios timeout as still pending', () => {
    expect(classifyFailure({ code: 'ECONNABORTED' })).toBe('pending');
  });

  it('treats a timeout message as still pending', () => {
    expect(classifyFailure({ message: 'timeout of 30000ms exceeded' })).toBe('pending');
  });

  it('treats a gateway timeout as still pending', () => {
    expect(classifyFailure({ statusCode: 504 })).toBe('pending');
  });

  it('treats a server error as a real failure', () => {
    expect(classifyFailure({ statusCode: 500 })).toBe('error');
  });

  it('treats a refusal as a real failure', () => {
    expect(classifyFailure({ statusCode: 403 })).toBe('error');
  });

  it('treats an unknown problem as a real failure rather than hiding it', () => {
    // Reporting "still working" for something that never completes is worse than
    // an honest error, so anything unrecognised stays an error.
    expect(classifyFailure({})).toBe('error');
    expect(classifyFailure(new Error('boom'))).toBe('error');
  });

  it('survives a null error', () => {
    expect(classifyFailure(null)).toBe('error');
  });
});
