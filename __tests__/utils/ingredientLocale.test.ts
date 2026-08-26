import { pickIngredientsText } from '@/utils/ingredientLocale';

const I18N = {
  en: 'WHEAT flour 35%, sugar, vegetable oils',
  fr: 'Farine de blé 34,8 %, sucre, huiles végétales',
  bg: 'ксилитол, сорбитол, манитол',
};

describe('pickIngredientsText', () => {
  it('prefers the user language', () => {
    expect(pickIngredientsText(I18N, 'fr', 'fallback')).toBe(I18N.fr);
  });

  it('falls back to English when the user language is missing', () => {
    // A Czech user should read English before Bulgarian: English is the language
    // this app already falls back to everywhere else.
    expect(pickIngredientsText(I18N, 'cs', 'fallback')).toBe(I18N.en);
  });

  it('uses the product default only when neither is available', () => {
    expect(pickIngredientsText({ bg: I18N.bg }, 'cs', 'default text')).toBe('default text');
  });

  it('handles a regional tag by its base language', () => {
    expect(pickIngredientsText(I18N, 'fr-CA', 'fallback')).toBe(I18N.fr);
  });

  it('returns the default when nothing is localised at all', () => {
    expect(pickIngredientsText({}, 'cs', 'default text')).toBe('default text');
  });

  it('returns null when there is nothing to show', () => {
    expect(pickIngredientsText({}, 'cs', null)).toBeNull();
    expect(pickIngredientsText(undefined, 'cs', null)).toBeNull();
  });

  it('ignores blank entries rather than showing an empty list', () => {
    expect(pickIngredientsText({ cs: '   ', en: I18N.en }, 'cs', 'd')).toBe(I18N.en);
  });
});

import { ingredientList } from '@/utils/ingredientLocale';

describe('ingredientList', () => {
  const product = {
    ingredients: ['ксилитол', 'сорбитол', 'аспартам'],
    ingredients_text: 'ксилитол, сорбитол, аспартам',
    ingredients_text_i18n: {
      en: 'xylitol, sorbitol, aspartame',
      fr: 'xylitol, sorbitol, aspartame E951',
    },
  } as any;

  it('splits the localised text into a list', () => {
    expect(ingredientList(product, 'en')).toEqual(['xylitol', 'sorbitol', 'aspartame']);
  });

  it('uses the user language over English', () => {
    expect(ingredientList(product, 'fr')).toEqual(['xylitol', 'sorbitol', 'aspartame E951']);
  });

  it('falls back to English rather than the source language', () => {
    // A Czech user should not be shown Cyrillic just because the product record
    // happened to be entered in Bulgarian.
    expect(ingredientList(product, 'cs')).toEqual(['xylitol', 'sorbitol', 'aspartame']);
  });

  it('keeps the parsed list when nothing is localised', () => {
    const bare = { ingredients: ['water', 'sugar'] } as any;
    expect(ingredientList(bare, 'cs')).toEqual(['water', 'sugar']);
  });

  it('drops empty fragments from trailing separators', () => {
    const trailing = { ingredients: [], ingredients_text_i18n: { en: 'water, sugar, ,' } } as any;
    expect(ingredientList(trailing, 'en')).toEqual(['water', 'sugar']);
  });

  it('returns an empty list when there is nothing at all', () => {
    expect(ingredientList({} as any, 'en')).toEqual([]);
  });
});
