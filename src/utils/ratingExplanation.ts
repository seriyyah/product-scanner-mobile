import type { RatingBreakdown } from '@/types';

export type ReasonTone = 'positive' | 'neutral' | 'negative' | 'unknown';

export interface RatingReason {
  id: string;
  tone: ReasonTone;
  /** i18n key; `fallback` is the English text used when a locale lacks it. */
  key: string;
  fallback: string;
  params?: Record<string, string | number>;
  /**
   * Translation keys the caller must resolve and join into `params[name]` before
   * rendering — allergen names have to pass through t() themselves.
   */
  listKeys?: { param: string; keys: string[] };
}

export interface ServerWarning {
  code: string;
  severity: 'danger' | 'caution' | 'info';
  text: string;
  params?: Record<string, string | number>;
}

interface ExplainOptions {
  dataQuality?: string | null | undefined;
  /** False when the product had no ingredient list to analyse. */
  hasIngredients?: boolean | undefined;
  /** Severity-tagged warnings from the rating service. */
  warnings?: ServerWarning[] | undefined;
  /** Plain warning strings, used only when no severity-tagged list is available. */
  warningTexts?: string[] | undefined;
}

const SEVERITY_TONE: Record<ServerWarning['severity'], ReasonTone> = {
  danger: 'negative',
  caution: 'neutral',
  info: 'unknown',
};

/**
 * Warnings the breakdown already accounts for. Showing "NOVA group 4" as a
 * component and "Ultra-processed food (NOVA Group 4)" as a warning turned one fact
 * into two list items and made the screen read as though it were repeating itself.
 */
const WARNING_SUPERSEDES: Record<string, string> = {
  ultra_processed: 'nova',
  poor_nutrition: 'nutriscore',
  allergens_declared: 'allergens',
  // "Contains 1 additive(s) of concern" says less than "Contains Aspartame
  // (E951), a high-risk additive", and saying both says it twice.
  banned_additive: 'additives',
  high_risk_additive: 'additives',
};

/**
 * Allergen names arrive as Open Food Facts tags in the product's own language.
 * They are a fixed, short list, so they resolve to translation keys; anything
 * unrecognised passes through unchanged rather than being dropped.
 */
const allergenKey = (name: string): string => {
  const slug = name.trim().toLowerCase().replace(/^[a-z]{2}:/, '').replace(/[^a-z]/g, '');
  return slug ? `allergen.${slug}` : name;
};

const GOOD_GRADES = ['a', 'b'];
const POOR_GRADES = ['d', 'e', 'f'];

const gradeTone = (grade?: string | null): ReasonTone => {
  if (!grade) return 'unknown';
  const g = grade.toLowerCase();
  if (GOOD_GRADES.includes(g)) return 'positive';
  if (POOR_GRADES.includes(g)) return 'negative';
  return 'neutral';
};

/**
 * Hazards first, then what we know, then what we don't. An unknown is the weakest
 * kind of information and must not outrank a real finding either way.
 */
const TONE_ORDER: Record<ReasonTone, number> = {
  negative: 0,
  neutral: 1,
  positive: 2,
  unknown: 3,
};

/**
 * Turns the rating service's per-component breakdown into the handful of sentences
 * that explain the score.
 *
 * The service scores a component it knows nothing about as a neutral 50, and reports
 * zero additives for a product whose ingredient list it never had. Both are absence
 * of data, and presenting either as a good result would tell the user a product is
 * clean when nothing about it is known — so they surface as 'unknown' instead.
 */
export const explainRating = (
  breakdown: RatingBreakdown | null | undefined,
  options: ExplainOptions = {},
): RatingReason[] => {
  if (!breakdown) return [];

  const { dataQuality, hasIngredients = true } = options;
  const reasons: RatingReason[] = [];

  const nutriscore = breakdown.nutriscore;
  if (nutriscore) {
    const tone = gradeTone(nutriscore.grade);
    reasons.push({
      id: 'nutriscore',
      tone,
      key: `ratingReason.nutriscore.${tone}`,
      fallback:
        tone === 'unknown'
          ? 'Nutritional quality could not be assessed.'
          : `Nutritional quality is rated {{grade}}.`,
      params: { grade: (nutriscore.grade ?? '?').toUpperCase() },
    });
  }

  const nova = breakdown.nova_group;
  if (nova) {
    const group = nova.group ?? null;
    const tone: ReasonTone =
      group === null ? 'unknown' : group >= 4 ? 'negative' : group === 3 ? 'neutral' : 'positive';
    reasons.push({
      id: 'nova',
      tone,
      key: `ratingReason.nova.${tone}`,
      fallback:
        tone === 'unknown'
          ? 'How heavily this product is processed is not known.'
          : 'Processing level: NOVA group {{group}}.',
      params: { group: group ?? 0 },
    });
  }

  const additives = breakdown.additives;
  if (additives) {
    const highRisk = additives.high_risk?.length ?? 0;
    const total = additives.total_count ?? 0;
    let tone: ReasonTone;
    if (highRisk > 0) tone = 'negative';
    else if (!hasIngredients) tone = 'unknown';
    else if (total === 0) tone = 'positive';
    else tone = 'neutral';

    reasons.push({
      id: 'additives',
      tone,
      key: `ratingReason.additives.${tone}`,
      fallback:
        tone === 'negative'
          ? 'Contains {{count}} additive(s) of concern.'
          : tone === 'unknown'
            ? 'No ingredient list was available, so additives could not be checked.'
            : tone === 'positive'
              ? 'No additives of concern were found.'
              : 'Contains {{total}} additive(s), none flagged as high risk.',
      params: { count: highRisk, total },
    });
  }

  const eco = breakdown.eco_score;
  if (eco) {
    const tone = gradeTone(eco.grade);
    reasons.push({
      id: 'eco',
      tone,
      key: `ratingReason.eco.${tone}`,
      fallback:
        tone === 'unknown'
          ? 'No environmental data is available for this product.'
          : 'Environmental impact is rated {{grade}}.',
      params: { grade: (eco.grade ?? '?').toUpperCase() },
    });
  }

  const allergens = breakdown.allergens;
  if (allergens?.found?.length) {
    reasons.push({
      id: 'allergens',
      // A caution, matching the rating service: a declared allergen matters a great
      // deal to some readers and not at all to others, so it must not outrank a
      // banned additive. The personalised score is what reacts to the user's own
      // declared allergies.
      tone: 'neutral',
      key: 'ratingReason.allergens.negative',
      fallback: 'Declares {{count}} allergen(s): {{list}}.',
      params: {
        count: allergens.found.length,
        list: allergens.found.join(', '),
      },
      listKeys: { param: 'list', keys: allergens.found.map(allergenKey) },
    });
  }

  // Server warnings carry their own severity and name specific hazards — a banned
  // additive is more use to a reader than "additives: 9 total".
  // Fall back to the plain list so a response without severities still shows its
  // warnings; unclassified means caution, never a quiet note.
  const warnings: ServerWarning[] = options.warnings?.length
    ? options.warnings
    : (options.warningTexts ?? []).map((text, index) => ({
        code: `legacy_${index}`,
        severity: 'caution' as const,
        text,
      }));
  const superseded = new Set(
    warnings.map((w) => WARNING_SUPERSEDES[w.code]).filter(Boolean) as string[],
  );

  const kept = reasons.filter((reason) => !superseded.has(reason.id));
  kept.push(
    ...warnings.map((warning, index) => ({
      // The index is part of the identity because a code is not unique: a
      // product with three hazardous substances sends three `hazard` warnings,
      // and React drops or duplicates rows that share a key.
      id: `warning:${warning.code}:${index}`,
      tone: SEVERITY_TONE[warning.severity] ?? 'neutral',
      key: `ratingWarning.${warning.code}`,
      // The service always sends readable English, so an untranslated code still
      // shows the real sentence rather than an identifier.
      fallback: warning.text,
      params: warning.params ?? {},
    })),
  );

  reasons.length = 0;
  reasons.push(...kept);

  reasons.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);

  // Always last: it qualifies everything above rather than being a driver itself.
  if (dataQuality && dataQuality !== 'full') {
    reasons.push({
      id: 'dataQuality',
      tone: 'unknown',
      key: 'ratingReason.dataQuality',
      fallback: 'This score is based on incomplete data and may change as more is found.',
    });
  }

  return reasons;
};
