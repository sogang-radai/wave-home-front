const listeners = new Set();
let clearTimer = null;

/**
 * Show a short-lived toast message. Safe to call outside React (e.g. API guards).
 */
export function showToast(message, durationMs = 2200) {
  if (!message) return;
  listeners.forEach((listener) => listener(message));
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    listeners.forEach((listener) => listener(''));
  }, durationMs);
}

export function subscribeToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
