/**
 * Every key the app asks for must exist in English.
 *
 * i18next falls back to `en`, but a key missing from `en` too has nothing to fall
 * back to, so it renders the key itself — which is how "product.upgradeSubscription"
 * ended up printed on a button in the shipped app.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', 'src');
const LOCALES = path.join(SRC, 'locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'));

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });

const resolve = (source: any, key: string): unknown =>
  key.split('.').reduce<any>((node, part) => (node == null ? undefined : node[part]), source);

/** Only literal keys: dynamic ones like t(`grades.${x}`) can't be checked statically. */
const KEY_CALL = /\bt\(\s*['"]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)['"]/g;

const usedKeys = (): Map<string, string[]> => {
  const found = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(KEY_CALL)) {
      const key = match[1] as string;
      found.set(key, [...(found.get(key) ?? []), path.relative(SRC, file)]);
    }
  }
  return found;
};

describe('translations', () => {
  it('defines every literal key the app renders', () => {
    const missing = [...usedKeys()].filter(([key]) => typeof resolve(en, key) !== 'string');
    expect(missing.map(([key, files]) => `${key} (${files.join(', ')})`)).toEqual([]);
  });

  it('finds a meaningful number of keys, so the scan itself is working', () => {
    // Guards against the regex silently matching nothing and the test passing empty.
    expect(usedKeys().size).toBeGreaterThan(20);
  });

  const ALL_LOCALES = ['bg', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'hr',
                       'hu', 'it', 'nl', 'pl', 'pt', 'ro', 'sk', 'sv'];

  it.each(ALL_LOCALES)('%s translates every key English defines', (lang) => {
    // The app offers 18 languages in Settings. Offering a language and then showing
    // English for part of the screen is worse than not offering it.
    const locale = JSON.parse(fs.readFileSync(path.join(LOCALES, `${lang}.json`), 'utf8'));
    const enKeys: string[] = [];
    const collect = (node: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(node)) {
        if (value && typeof value === 'object') collect(value, `${prefix}${key}.`);
        else enKeys.push(`${prefix}${key}`);
      }
    };
    collect(en);
    expect(enKeys.filter((key) => typeof resolve(locale, key) !== 'string')).toEqual([]);
  });

  describe.each(ALL_LOCALES)('%s', (lang) => {
    const locale = JSON.parse(fs.readFileSync(path.join(LOCALES, `${lang}.json`), 'utf8'));

    it('translates the rating explanations', () => {
      // These are the sentences justifying a product's score. Falling back to
      // English here would be conspicuous in the middle of a translated screen.
      const missing = [...usedKeys().keys()]
        .filter((key) => key.startsWith('ratingReason.') || key === 'product.whyThisRating')
        .filter((key) => typeof resolve(locale, key) !== 'string');
      expect(missing).toEqual([]);
    });

    it('translates the paywall copy shown to free users', () => {
      const keys = [
        'product.featureNotAvailable',
        'product.featureNotAvailableAlternatives',
        'product.featureNotAvailableWhereToBuy',
        'product.upgradeSubscription',
        'product.scanAnother',
      ];
      expect(keys.filter((key) => typeof resolve(locale, key) !== 'string')).toEqual([]);
    });
  });
});
