/**
 * Chooses which language to show an ingredient list in.
 *
 * Open Food Facts stores a product's list in whichever language it was entered in,
 * so a Bulgarian record was shown in Cyrillic to every user whatever their locale.
 */
export const pickIngredientsText = (
  byLanguage: Record<string, string> | undefined | null,
  language: string,
  fallback: string | null | undefined,
): string | null => {
  const available = byLanguage ?? {};
  const usable = (value?: string): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  // 'fr-CA' and 'fr' are the same ingredient list as far as Open Food Facts is concerned.
  const base = language?.split('-')[0]?.toLowerCase() ?? '';

  return usable(available[base]) ?? usable(available.en) ?? usable(fallback ?? undefined);
};

/**
 * The ingredient list to display, in the reader's language where one exists.
 *
 * Prefers the localised text over the parsed `ingredients` array, because that
 * array is built from whichever language the product record was entered in.
 */
export const ingredientList = (
  product: {
    ingredients?: string[];
    ingredients_text?: string | null;
    ingredients_text_i18n?: Record<string, string> | null;
  },
  language: string,
): string[] => {
  const localised = pickIngredientsText(product.ingredients_text_i18n, language, null);
  if (localised) {
    return localised
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return product.ingredients ?? [];
};
