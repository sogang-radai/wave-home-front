// Simulates real network round-trip latency. Keeps the same async signature as real API classes.
export function delay(ms = 80) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
