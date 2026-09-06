/**
 * Which country's shops a scan gets.
 *
 * "Where to Buy" offered one Lidl link on lidl.com — a domain with no search
 * page — because the marketplace service was never told a country and fell back
 * to a guess. The country came from the app's language alone, and English maps
 * to nothing, so an English-speaking user in Prague looked like a user from
 * nowhere. Ukrainian was never in the table at all, despite shipping as a
 * locale.
 */
import { resolveDiscoveryCountry } from '@/utils/discoveryCountry';
import { countryFromLang } from '@/utils/countryFromLang';

describe('what the user chose comes first', () => {
  it('uses the country saved in preferences', () => {
    expect(resolveDiscoveryCountry({ saved: 'de', language: 'cs', hasLocation: false })).toBe('de');
  });

  it('beats their location, because it is a statement rather than a guess', () => {
    expect(resolveDiscoveryCountry({ saved: 'de', language: 'cs', hasLocation: true })).toBe('de');
  });

  it('is normalised to what the backend matches on', () => {
    expect(resolveDiscoveryCountry({ saved: ' CZ ', language: 'en', hasLocation: false })).toBe('cz');
  });

  it('ignores a stored value that is not a country code', () => {
    for (const saved of ['', '   ', 'x', 'CZE']) {
      expect(resolveDiscoveryCountry({ saved, language: 'cs', hasLocation: false })).toBe('cz');
    }
  });
});

describe('failing that, their location', () => {
  it('sends no hint, because a hint stops the backend geocoding', () => {
    expect(resolveDiscoveryCountry({ saved: null, language: 'cs', hasLocation: true })).toBeUndefined();
  });
});

describe('language is the last resort', () => {
  it('is used when there is nothing better', () => {
    expect(resolveDiscoveryCountry({ saved: null, language: 'cs', hasLocation: false })).toBe('cz');
  });

  it('gives nothing for a language that names no country', () => {
    // The exact case that produced the fallback link.
    expect(resolveDiscoveryCountry({ saved: null, language: 'en', hasLocation: false })).toBeUndefined();
  });

  it('handles a regional tag', () => {
    expect(resolveDiscoveryCountry({ saved: null, language: 'cs-CZ', hasLocation: false })).toBe('cz');
  });

  it('copes with no language at all', () => {
    expect(resolveDiscoveryCountry({ saved: null, hasLocation: false })).toBeUndefined();
  });
});

describe('every locale we ship', () => {
  it('maps Ukrainian, which shipped as a locale but named no country', () => {
    expect(countryFromLang('uk')).toBe('ua');
  });

  it.each(['en', 'ru'])('leaves %s unmapped, as it names no one country', (lang) => {
    expect(countryFromLang(lang)).toBeUndefined();
  });
});
