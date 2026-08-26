import { resolveLanguage, SUPPORTED_CODES } from '@/utils/deviceLanguage';

describe('resolveLanguage', () => {
  it('uses the device language when the app supports it', () => {
    // The app used to hardcode lng: 'en', so a Czech phone opened an English app.
    expect(resolveLanguage('cs-CZ')).toBe('cs');
  });

  it('matches a bare language tag', () => {
    expect(resolveLanguage('de')).toBe('de');
  });

  it('is case insensitive', () => {
    expect(resolveLanguage('PT-BR')).toBe('pt');
  });

  it('falls back to English for an unsupported language', () => {
    expect(resolveLanguage('ja-JP')).toBe('en');
  });

  it('falls back to English when the locale is unreadable', () => {
    expect(resolveLanguage(undefined)).toBe('en');
    expect(resolveLanguage('')).toBe('en');
  });

  it('resolves every language the picker offers', () => {
    // A language offered in Settings must be a language the app can actually switch to.
    for (const code of SUPPORTED_CODES) {
      expect(resolveLanguage(`${code}-XX`)).toBe(code);
    }
  });
});
