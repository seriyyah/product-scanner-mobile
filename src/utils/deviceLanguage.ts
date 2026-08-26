/**
 * Which language to open the app in.
 *
 * i18n previously hardcoded `lng: 'en'`, so the app always started in English and
 * only changed if the user picked a language by hand. A phone set to Czech should
 * open a Czech app without being asked.
 */
export const SUPPORTED_CODES = [
  'en', 'cs', 'sk', 'de', 'fr', 'es', 'it', 'pl', 'nl',
  'pt', 'ro', 'hu', 'hr', 'bg', 'sv', 'da', 'fi', 'el',
] as const;

export type SupportedCode = (typeof SUPPORTED_CODES)[number];

const SUPPORTED = new Set<string>(SUPPORTED_CODES);

/** Maps a BCP-47 tag such as 'cs-CZ' onto a language the app ships. */
export const resolveLanguage = (locale: string | undefined | null): SupportedCode => {
  const base = locale?.split(/[-_]/)[0]?.toLowerCase();
  return base && SUPPORTED.has(base) ? (base as SupportedCode) : 'en';
};

/**
 * The device's locale. Hermes ships full ICU, so Intl is the reading that needs no
 * extra native dependency; anything unexpected falls through to English.
 */
export const deviceLanguage = (): SupportedCode => {
  try {
    return resolveLanguage(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'en';
  }
};
