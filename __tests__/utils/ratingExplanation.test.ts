import { explainRating } from '@/utils/ratingExplanation';
import type { RatingBreakdown } from '@/types';

const ids = (reasons: ReturnType<typeof explainRating>) => reasons.map((r) => r.id);
const byId = (reasons: ReturnType<typeof explainRating>, id: string) =>
  reasons.find((r) => r.id === id);

describe('explainRating', () => {
  it('returns nothing when there is no breakdown to explain', () => {
    expect(explainRating(null)).toEqual([]);
    expect(explainRating(undefined)).toEqual([]);
    expect(explainRating({})).toEqual([]);
  });

  describe('nutrition', () => {
    it('reads a good grade as a positive driver', () => {
      const b: RatingBreakdown = { nutriscore: { score: 84, grade: 'B' } };
      expect(byId(explainRating(b), 'nutriscore')?.tone).toBe('positive');
    });

    it('reads a poor grade as a negative driver', () => {
      const b: RatingBreakdown = { nutriscore: { score: 20, grade: 'E' } };
      expect(byId(explainRating(b), 'nutriscore')?.tone).toBe('negative');
    });

    it('does not claim a nutrition verdict without a grade', () => {
      const b: RatingBreakdown = { nutriscore: { score: 50, grade: null } };
      expect(byId(explainRating(b), 'nutriscore')?.tone).toBe('unknown');
    });
  });

  describe('processing', () => {
    it('treats NOVA 4 as a negative driver', () => {
      const b: RatingBreakdown = { nova_group: { score: 20, group: 4 } };
      expect(byId(explainRating(b), 'nova')?.tone).toBe('negative');
    });

    it('treats NOVA 1 as a positive driver', () => {
      const b: RatingBreakdown = { nova_group: { score: 100, group: 1 } };
      expect(byId(explainRating(b), 'nova')?.tone).toBe('positive');
    });

    it('reports an absent NOVA group as unknown, not as good', () => {
      // The service scores a missing group as a neutral 50. Presenting that as a
      // clean result would tell the user the product is unprocessed when in fact
      // nothing is known about it.
      const b: RatingBreakdown = { nova_group: { score: 50, group: null } };
      expect(byId(explainRating(b), 'nova')?.tone).toBe('unknown');
    });
  });

  describe('additives', () => {
    it('names high-risk additives as a negative driver', () => {
      const b: RatingBreakdown = {
        additives: { score: 30, total_count: 3, high_risk: ['E621', 'E951'] },
      };
      const reason = byId(explainRating(b), 'additives');
      expect(reason?.tone).toBe('negative');
      expect(reason?.params?.count).toBe(2);
    });

    it('treats a clean additive list as positive when ingredients were known', () => {
      const b: RatingBreakdown = { additives: { score: 100, total_count: 0, high_risk: [] } };
      expect(byId(explainRating(b), 'additives')?.tone).toBe('positive');
    });

    it('does not claim "no additives" when no ingredients were available', () => {
      // Zero additives found in an empty ingredient list is absence of data, not
      // absence of harm, and must not read as a clean bill of health.
      const b: RatingBreakdown = { additives: { score: 100, total_count: 0, high_risk: [] } };
      expect(byId(explainRating(b, { hasIngredients: false }), 'additives')?.tone).toBe('unknown');
    });
  });

  describe('data quality', () => {
    it('adds a caveat when the rating rests on partial data', () => {
      const b: RatingBreakdown = { nutriscore: { score: 84, grade: 'B' } };
      expect(ids(explainRating(b, { dataQuality: 'partial' }))).toContain('dataQuality');
    });

    it('adds no caveat when the data is complete', () => {
      const b: RatingBreakdown = { nutriscore: { score: 84, grade: 'B' } };
      expect(ids(explainRating(b, { dataQuality: 'full' }))).not.toContain('dataQuality');
    });

    it('puts the caveat last so the drivers read first', () => {
      const b: RatingBreakdown = {
        nutriscore: { score: 84, grade: 'B' },
        nova_group: { score: 50, group: null },
      };
      const result = ids(explainRating(b, { dataQuality: 'partial' }));
      expect(result[result.length - 1]).toBe('dataQuality');
    });
  });

  it('orders negative drivers before positive ones', () => {
    // What lowered the score is the part worth reading first.
    const b: RatingBreakdown = {
      nutriscore: { score: 84, grade: 'A' },
      nova_group: { score: 20, group: 4 },
    };
    expect(ids(explainRating(b))).toEqual(['nova', 'nutriscore']);
  });

  it('gives every reason a translation key and an English fallback', () => {
    const b: RatingBreakdown = {
      nutriscore: { score: 84, grade: 'B' },
      nova_group: { score: 20, group: 4 },
      additives: { score: 30, total_count: 2, high_risk: ['E621'] },
      eco_score: { score: 50, grade: null },
    };
    for (const reason of explainRating(b, { dataQuality: 'partial' })) {
      expect(reason.key).toMatch(/^ratingReason\./);
      expect(reason.fallback.length).toBeGreaterThan(0);
    }
  });
});
