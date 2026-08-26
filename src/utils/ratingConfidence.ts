/**
 * Whether a score has enough behind it to be shown as a verdict.
 *
 * The engine falls back to a neutral 50 when it knows nothing about a product.
 * Rendered as a big red "D — Poor", that reads as a finding about the food
 * rather than about our data: a carton of fresh eggs was shown as Poor while
 * every line beneath it said nutrition, processing, ingredients and origin were
 * all unknown.
 */
interface RatingLike {
  data_quality?: string | null | undefined;
  confidence?: number | null | undefined;
  safety_score?: number | null | undefined;
  safety_grade?: string | null | undefined;
}

export const isRated = (r: RatingLike): boolean => {
  if (r.safety_score === null || r.safety_score === undefined) return false;
  if (r.data_quality === 'minimal') return false;
  if (typeof r.confidence === 'number' && r.confidence <= 0) return false;
  return true;
};

/** The grade to display, or '?' when the rating does not stand on evidence. */
export const displayGrade = (r: RatingLike): string =>
  isRated(r) && r.safety_grade ? r.safety_grade : '?';
