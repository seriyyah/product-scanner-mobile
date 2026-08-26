/**
 * These rules must stay identical to auth-service's UserCredentials validator.
 * When they drift, the form accepts a password the server rejects — which is how a
 * registration silently failed and left an account that never existed.
 */
import {
  PASSWORD_MIN_LENGTH,
  checkPassword,
  isPasswordAcceptable,
  unmetRules,
} from '../../src/utils/passwordPolicy';

describe('password policy', () => {
  it('matches the backend minimum length', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  it('accepts a fully compliant password', () => {
    expect(isPasswordAcceptable('TestPass123!')).toBe(true);
  });

  it('rejects the password that triggered the original report', () => {
    // 12 characters, but no uppercase and no special character.
    expect(isPasswordAcceptable('passwordsss1')).toBe(false);
    expect(unmetRules('passwordsss1')).toEqual(['uppercase', 'special']);
  });

  it.each([
    ['Short1!', ['length']],
    ['alllowercase123!', ['uppercase']],
    ['ALLUPPERCASE123!', ['lowercase']],
    ['NoDigitsHere!!!!', ['digit']],
    ['NoSpecialChar123', ['special']],
  ])('%s is missing %s', (password, missing) => {
    expect(unmetRules(password as string)).toEqual(missing);
  });

  it('reports every rule for an empty password', () => {
    expect(unmetRules('')).toEqual(['length', 'uppercase', 'lowercase', 'digit', 'special']);
  });

  it('rejects a password beyond the maximum length', () => {
    expect(isPasswordAcceptable(`Aa1!${'x'.repeat(200)}`)).toBe(false);
  });

  it('returns a rule entry for every requirement', () => {
    expect(checkPassword('TestPass123!').map((r) => r.id)).toEqual([
      'length', 'uppercase', 'lowercase', 'digit', 'special',
    ]);
  });

  it('treats a missing value as failing everything', () => {
    expect(isPasswordAcceptable(undefined as unknown as string)).toBe(false);
  });
});
