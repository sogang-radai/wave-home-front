/** Max insight cards shown on a domain page (matches agent MIN_TOTAL_ITEMS). */
export const INSIGHT_CARD_LIMIT = 4;

/** @param {Array<{ kind?: string; label?: string }>} items */
export function filterInsightsByPeriod(items, period) {
  if (!period) return items;
  if (period === 'weekly') {
    return items.filter((item) => item.kind === 'goal' || item.label === '다음 주 목표');
  }
  if (period === 'daily') {
    return items.filter((item) => item.kind !== 'goal' && item.label !== '다음 주 목표');
  }
  return items;
}

/**
 * Keep only the newest `date` cohort (YYYY-MM-DD), then cap length.
 * Rows without `date` are treated as a single cohort (mock seeds).
 */
export function pickLatestDateInsights(items, { limit = INSIGHT_CARD_LIMIT } = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const dated = items.filter((item) => typeof item?.date === 'string' && item.date.length > 0);
  let pool = items;
  if (dated.length > 0) {
    const latest = dated.reduce((max, item) => (item.date > max ? item.date : max), dated[0].date);
    pool = items.filter((item) => item.date === latest);
  }
  return pool.slice(0, limit);
}
