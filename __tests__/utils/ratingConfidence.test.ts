/**
 * Whether a score is worth showing as a verdict.
 *
 * A carton of fresh eggs displayed "50 — Grade D — Poor" in red, while every
 * line beneath it said the opposite: nutrition could not be assessed, processing
 * unknown, no ingredient list, no environmental data. 50 is the neutral midpoint
 * the engine falls back to when it knows nothing — it is not a finding, and
 * showing it as "Poor" tells someone in a shop that eggs are bad for them.
 */
import { isRated, displayGrade } from '@/utils/ratingConfidence';

describe('isRated', () => {
  it('is false when the data is minimal', () => {
    expect(isRated({ data_quality: 'minimal', safety_score: 50 })).toBe(false);
  });

  it('is false when confidence is zero', () => {
    expect(isRated({ data_quality: 'partial', confidence: 0, safety_score: 50 })).toBe(false);
  });

  it('is true for a fully documented product', () => {
    expect(isRated({ data_quality: 'full', confidence: 0.92, safety_score: 45 })).toBe(true);
  });

  it('is true for partial data with real confidence behind it', () => {
    // Partial is normal and still informative — most products are partial.
    expect(isRated({ data_quality: 'partial', confidence: 0.4, safety_score: 67 })).toBe(true);
  });

  it('is false when there is no score at all', () => {
    expect(isRated({ data_quality: 'full', safety_score: null })).toBe(false);
    expect(isRated({})).toBe(false);
  });
});

describe('displayGrade', () => {
  it('shows a question mark rather than a letter when nothing is known', () => {
    expect(displayGrade({ data_quality: 'minimal', safety_grade: 'D', safety_score: 50 })).toBe('?');
  });

  it('shows the real grade when the rating stands on evidence', () => {
    expect(displayGrade({ data_quality: 'full', confidence: 0.9, safety_grade: 'E', safety_score: 35 })).toBe('E');
  });

  it('never invents a letter for a missing grade', () => {
    expect(displayGrade({ data_quality: 'full', confidence: 0.9, safety_score: 35 })).toBe('?');
  });
});
