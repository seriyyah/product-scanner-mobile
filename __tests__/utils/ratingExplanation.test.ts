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

describe('explainRating with server warnings', () => {
  const details = [
    { code: 'ultra_processed', severity: 'danger', text: 'Ultra-processed food (NOVA Group 4)', params: {} },
    { code: 'banned_additive', severity: 'danger', text: 'Contains BANNED additive E171 (Titanium Dioxide)', params: { code_ref: 'E171', name: 'Titanium Dioxide' } },
    { code: 'derived_from_text', severity: 'info', text: 'Some data derived from ingredient text analysis', params: {} },
  ];

  it('shows a banned additive as a danger', () => {
    const reasons = explainRating({}, { warnings: details as any });
    expect(reasons.find((r) => r.id.startsWith('warning:banned_additive'))?.tone).toBe('negative');
  });

  it('does not present a note about method as a warning about the food', () => {
    // "Some data derived from ingredient text analysis" was rendered in the same
    // red as a banned additive, which made every product look alarming.
    const reasons = explainRating({}, { warnings: details as any });
    expect(reasons.find((r) => r.id.startsWith('warning:derived_from_text'))?.tone).toBe('unknown');
  });

  it('puts dangers above everything derived from the breakdown', () => {
    const reasons = explainRating(
      { nutriscore: { score: 80, grade: 'B' } },
      { warnings: details as any },
    );
    expect(reasons[0]?.tone).toBe('negative');
    expect(reasons[reasons.length - 1]?.id).toMatch(/^warning:derived_from_text/);
  });

  it('does not repeat a driver the breakdown already explains', () => {
    // NOVA 4 appears both as a component score and as a warning. Showing it twice
    // is what made the screen read as two lists saying the same thing.
    const reasons = explainRating(
      { nova_group: { score: 20, group: 4 } },
      { warnings: details as any },
    );
    const novaMentions = reasons.filter((r) => r.id === 'nova' || r.id.startsWith('warning:ultra_processed'));
    expect(novaMentions).toHaveLength(1);
  });

  it('keeps the server text when no translation exists for the code', () => {
    const reasons = explainRating({}, { warnings: details as any });
    expect(reasons.find((r) => r.id.startsWith('warning:banned_additive'))?.fallback)
      .toContain('Titanium Dioxide');
  });
});

describe('explainRating without severities', () => {
  it('still shows warnings when only the plain string list is present', () => {
    // A rating response predating warning_details, or any path that only fills the
    // legacy list, must not silently drop its warnings.
    const reasons = explainRating({}, { warningTexts: ['Contains added sugars'] });
    expect(reasons.map((r) => r.fallback)).toContain('Contains added sugars');
  });

  it('treats an unclassified warning as a caution, not a quiet note', () => {
    const reasons = explainRating({}, { warningTexts: ['Contains added sugars'] });
    expect(reasons[0]?.tone).toBe('neutral');
  });

  it('prefers the severity-tagged list when both are present', () => {
    const reasons = explainRating({}, {
      warnings: [{ code: 'ultra_processed', severity: 'danger', text: 'Ultra-processed', params: {} }] as any,
      warningTexts: ['Ultra-processed'],
    });
    expect(reasons.filter((r) => r.fallback === 'Ultra-processed')).toHaveLength(1);
    expect(reasons[0]?.tone).toBe('negative');
  });
});

describe('explainRating deduplication', () => {
  it('drops the generic additive count when a specific additive is named', () => {
    // "Contains 1 additive(s) of concern" alongside "Contains Aspartame (E951), a
    // high-risk additive" is the same fact twice, the vaguer one first.
    const reasons = explainRating(
      { additives: { score: 30, total_count: 9, high_risk: ['E951'] } },
      { warnings: [{ code: 'high_risk_additive', severity: 'danger', text: 'Contains Aspartame (E951)', params: {} }] as any },
    );
    expect(reasons.find((r) => r.id === 'additives')).toBeUndefined();
    expect(reasons.find((r) => r.id.startsWith('warning:high_risk_additive'))).toBeTruthy();
  });

  it('keeps the additive summary when no specific additive is named', () => {
    const reasons = explainRating(
      { additives: { score: 30, total_count: 9, high_risk: ['E951'] } },
      { warnings: [] },
    );
    expect(reasons.find((r) => r.id === 'additives')).toBeTruthy();
  });

  it('exposes allergen names as translation keys rather than source tags', () => {
    const reasons = explainRating(
      { allergens: { found: ['soybeans', 'milk'] } },
      {},
    );
    expect(reasons.find((r) => r.id === 'allergens')?.listKeys).toEqual({
      param: 'list',
      keys: ['allergen.soybeans', 'allergen.milk'],
    });
  });
});
