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
