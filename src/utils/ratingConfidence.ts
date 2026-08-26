/**
 * Whether a score has enough behind it to be shown as a verdict.
 *
 * This began as a client-side guess, because the engine fell back to a neutral
 * 50 when it knew nothing about a product. Rendered as a big red "D — Poor",
 * that read as a finding about the food rather than about our data: a carton of
 * fresh eggs was shown as Poor while every line beneath it said nutrition,
 * processing, ingredients and origin were all unknown.
 *
 * The engine now answers the question itself and sends `rated`, so we use that
 * when it is there. The guess stays as a fallback for a response from a service
 * that has not been redeployed yet — but it is only a fallback, because it was
 * wrong in one direction too: a product with a published NutriScore and nothing
 * else is genuinely rated, and still reports `data_quality: 'minimal'`.
 */
interface RatingLike {
  rated?: boolean | null | undefined;
  data_quality?: string | null | undefined;
  confidence?: number | null | undefined;
  safety_score?: number | null | undefined;
  safety_grade?: string | null | undefined;
  product_kind?: string | null | undefined;
}

export const isRated = (r: RatingLike): boolean => {
  if (typeof r.rated === 'boolean') return r.rated;

  if (r.safety_score === null || r.safety_score === undefined) return false;
  if (r.data_quality === 'minimal') return false;
  if (typeof r.confidence === 'number' && r.confidence <= 0) return false;
  return true;
};

/** The grade to display, or '?' when the rating does not stand on evidence. */
export const displayGrade = (r: RatingLike): string =>
  isRated(r) && r.safety_grade ? r.safety_grade : '?';

/**
 * Why there is no grade, in the user's terms.
 *
 * There are two different reasons and they deserve different words. A sweater
 * has no safety scale at all and never will have one; a bag of eggs simply has
 * no data yet, and we are off looking for it.
 */
export const unratedReason = (r: RatingLike): 'unsupported' | 'researching' =>
  r.product_kind === 'other' ? 'unsupported' : 'researching';
