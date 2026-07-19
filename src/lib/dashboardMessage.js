import { getNow } from './demoClock';

function formatRefDate(date = getNow()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Matches wave-server InsightsStore::dashboardDailyMessage (latest row on or before ref date). */
export function pickDashboardDailyMessage(insights, refDate = formatRefDate()) {
  const rows = insights
    .filter((item) => item.surface === 'dashboard_banner' && item.date <= refDate)
    .sort((a, b) => (a.date === b.date ? b.id - a.id : b.date.localeCompare(a.date)));
  const latest = rows[0];
  if (!latest) return null;
  return {
    headline: latest.title,
    body: latest.text,
  };
}
