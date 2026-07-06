const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeDate(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(a, b) {
  return normalizeDate(a).getTime() === normalizeDate(b).getTime();
}

export function isInForwardWeek(anchor, cell) {
  if (!anchor) return false;
  const start = normalizeDate(anchor).getTime();
  const target = normalizeDate(cell).getTime();
  return target >= start && target < start + 7 * DAY_MS;
}

export function buildMonthCalendarCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = daysInPrevMonth - startWeekday + 1 + i;
    cells.push({ date: new Date(year, month - 1, d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      cells.push({ date: new Date(year, month + 1, d), inMonth: false });
    }
  }

  const firstDate = normalizeDate(cells[0].date);
  const lastDate = normalizeDate(cells[cells.length - 1].date);
  const leading = [];
  for (let i = 7; i >= 1; i--) {
    leading.push({
      date: new Date(firstDate.getTime() - i * DAY_MS),
      inMonth: false,
    });
  }
  const trailing = [];
  for (let i = 1; i <= 7; i++) {
    trailing.push({
      date: new Date(lastDate.getTime() + i * DAY_MS),
      inMonth: false,
    });
  }

  return [...leading, ...cells, ...trailing];
}

export function formatDayLabel(date, latestDate) {
  if (isSameDay(date, latestDate)) return '오늘';
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function getToday() {
  return normalizeDate(new Date());
}
