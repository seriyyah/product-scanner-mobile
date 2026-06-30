/**
 * Maps i18n language codes to ISO 3166-1 alpha-2 country codes.
 * Used as a fallback when no GPS location is available.
 * The backend geocodes lat/lng when available and overrides this hint.
 */
const LANG_TO_COUNTRY: Record<string, string> = {
  cs: 'cz',
  sk: 'sk',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pl: 'pl',
  nl: 'nl',
  pt: 'pt',
  ro: 'ro',
  hu: 'hu',
  hr: 'hr',
  bg: 'bg',
  sv: 'se',
  da: 'dk',
  fi: 'fi',
  el: 'gr',
  en: '',
};

export function countryFromLang(lang: string): string | undefined {
  const base = lang.split('-')[0].toLowerCase();
  const cc = LANG_TO_COUNTRY[base];
  return cc || undefined;
}
