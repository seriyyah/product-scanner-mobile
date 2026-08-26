import type { RatingBreakdown } from '@/types';

export type ReasonTone = 'positive' | 'neutral' | 'negative' | 'unknown';

export interface RatingReason {
  id: string;
  tone: ReasonTone;
  /** i18n key; `fallback` is the English text used when a locale lacks it. */
  key: string;
  fallback: string;
  params?: Record<string, string | number>;
}

interface ExplainOptions {
  dataQuality?: string | null | undefined;
  /** False when the product had no ingredient list to analyse. */
  hasIngredients?: boolean | undefined;
}

const GOOD_GRADES = ['a', 'b'];
const POOR_GRADES = ['d', 'e', 'f'];

const gradeTone = (grade?: string | null): ReasonTone => {
  if (!grade) return 'unknown';
  const g = grade.toLowerCase();
  if (GOOD_GRADES.includes(g)) return 'positive';
  if (POOR_GRADES.includes(g)) return 'negative';
  return 'neutral';
};

const TONE_ORDER: Record<ReasonTone, number> = {
  negative: 0,
  unknown: 1,
  neutral: 2,
  positive: 3,
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
      tone: 'negative',
      key: 'ratingReason.allergens.negative',
      fallback: 'Declares {{count}} allergen(s): {{list}}.',
      params: { count: allergens.found.length, list: allergens.found.join(', ') },
    });
  }

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
