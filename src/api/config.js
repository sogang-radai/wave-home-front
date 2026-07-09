// API mode: mock (site-test) | real (production) | demo (site-demo).
// Legacy REACT_APP_USE_MOCK still works when REACT_APP_API_MODE is unset.
function resolveApiMode() {
  const explicit = process.env.REACT_APP_API_MODE;
  if (explicit === 'mock' || explicit === 'real' || explicit === 'demo') {
    return explicit;
  }

  const useMock = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_USE_MOCK === 'true'
    : process.env.REACT_APP_USE_MOCK !== 'false';
  return useMock ? 'mock' : 'real';
}

export const API_MODE = resolveApiMode();
export const IS_DEMO_MODE = API_MODE === 'demo';

/** @deprecated Prefer API_MODE === 'mock' */
export const USE_MOCK_API = API_MODE === 'mock';

/** Client-side power simulation (mock + demo builds). */
export const USE_CLIENT_POWER_SIM = API_MODE === 'mock' || API_MODE === 'demo';

export const ANCHOR_DATE = process.env.REACT_APP_ANCHOR_DATE || null;

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
