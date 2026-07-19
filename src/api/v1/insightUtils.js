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
 * Sort newest `date` (YYYY-MM-DD) first, then cap length. Previously this
 * kept only the single newest date's cohort, which silently dropped every
 * other insight whenever items were spread across different dates — now it
 * just orders by recency so all kinds (tip/goal/action/banner) surface up
 * to `limit`. Rows without `date` sort last but are still kept.
 */
export function pickLatestDateInsights(items, { limit = INSIGHT_CARD_LIMIT } = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const aDate = typeof a?.date === 'string' ? a.date : '';
    const bDate = typeof b?.date === 'string' ? b.date : '';
    return bDate.localeCompare(aDate);
  });
  return sorted.slice(0, limit);
}
