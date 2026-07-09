import { ANCHOR_DATE } from '../api/config';

/**
 * Demo mode: calendar date is fixed (ANCHOR_DATE), time-of-day follows the real clock.
 */
export function getNow() {
  const real = new Date();
  if (!ANCHOR_DATE) return real;

  const [year, month, day] = ANCHOR_DATE.split('-').map(Number);
  return new Date(
    year,
    month - 1,
    day,
    real.getHours(),
    real.getMinutes(),
    real.getSeconds(),
    real.getMilliseconds(),
  );
}

export function getToday() {
  const now = getNow();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return today;
}
