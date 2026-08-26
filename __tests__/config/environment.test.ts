/**
 * Which backend the app talks to.
 *
 * Two environments now exist: the stack on your Mac, and production on Oracle.
 * Pointing at the wrong one is easy and the symptoms are confusing — scans that
 * work locally and not on someone else's phone, or test data landing in the
 * database real users share. The choice is explicit and inspectable.
 */
import { resolveApiBaseUrl, ENVIRONMENTS, type EnvName } from '@/config/environment';

describe('resolveApiBaseUrl', () => {
  it('uses production when the environment says prod', () => {
    expect(resolveApiBaseUrl({ env: 'prod' })).toBe(ENVIRONMENTS.prod);
  });

  it('uses the local stack when the environment says local', () => {
    expect(resolveApiBaseUrl({ env: 'local' })).toBe(ENVIRONMENTS.local);
  });

  it('defaults to production, so a release build is never left pointing at a laptop', () => {
    // The dangerous default is the other way round: a shipped build talking to
    // localhost fails for every user and nobody notices until it is published.
    expect(resolveApiBaseUrl({})).toBe(ENVIRONMENTS.prod);
  });

  it('honours an explicit URL over everything else', () => {
    // The escape hatch — a tunnel, a colleague's machine, a staging box.
    const url = 'https://something-else.example.com';
    expect(resolveApiBaseUrl({ explicitUrl: url, env: 'local' })).toBe(url);
  });

  it('ignores an explicit URL that is blank or whitespace', () => {
    expect(resolveApiBaseUrl({ explicitUrl: '   ', env: 'local' })).toBe(ENVIRONMENTS.local);
    expect(resolveApiBaseUrl({ explicitUrl: '', env: 'prod' })).toBe(ENVIRONMENTS.prod);
  });

  it('trims a stray newline from the environment file', () => {
    expect(resolveApiBaseUrl({ explicitUrl: ' https://x.example.com \n' })).toBe(
      'https://x.example.com',
    );
  });

  it('falls back to production for an unrecognised environment name', () => {
    expect(resolveApiBaseUrl({ env: 'staging' as EnvName })).toBe(ENVIRONMENTS.prod);
  });

  it('never returns a trailing slash, which would double up in request paths', () => {
    for (const url of Object.values(ENVIRONMENTS)) {
      expect(url.endsWith('/')).toBe(false);
    }
    expect(resolveApiBaseUrl({ explicitUrl: 'https://x.example.com/' })).toBe(
      'https://x.example.com',
    );
  });

  it('points production at HTTPS, never plain HTTP', () => {
    // iOS blocks cleartext by default, and tokens must not cross the network bare.
    expect(ENVIRONMENTS.prod.startsWith('https://')).toBe(true);
  });
});
