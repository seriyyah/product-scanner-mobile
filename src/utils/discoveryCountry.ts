/**
 * Which country's shops to show for a scan.
 *
 * "Where to Buy" was offering a single Lidl link on lidl.com — a domain with no
 * search page — because the marketplace service was never told a country and
 * fell back. The country was derived from the app's language alone, and English
 * maps to no country at all, so an English-speaking user in Prague looked
 * exactly like a user from nowhere.
 *
 * The order below is what somebody would expect. A country the user chose in
 * Preferences is a statement, not a guess, so it wins. Failing that their
 * location is where they are actually standing, and the backend geocodes it —
 * so we deliberately send no hint, because a hint suppresses the lookup. Only
 * with neither do we fall back to inferring from language, which is weak: it is
 * right for Czech and useless for English.
 */
import { countryFromLang } from './countryFromLang';

interface Inputs {
  /** ISO 3166-1 alpha-2 from the user's saved preferences, if they set one. */
  readonly saved?: string | null | undefined;
  readonly language?: string | undefined;
  readonly hasLocation: boolean;
}

/**
 * The country hint to send, or undefined to let the backend geocode.
 *
 * Undefined is a meaningful answer, not a failure: the service resolves the
 * country from lat/lng only when no hint was given.
 */
export function resolveDiscoveryCountry({ saved, language, hasLocation }: Inputs): string | undefined {
  const chosen = (saved ?? '').trim().toLowerCase();
  if (chosen.length === 2) return chosen;

  // Their coordinates beat anything we could infer from a language setting.
  if (hasLocation) return undefined;

  return language ? countryFromLang(language) : undefined;
}
