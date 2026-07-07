// mock/real API 전환.
// - 개발(npm start): 기본 mock. REACT_APP_USE_MOCK=false 로 real API.
// - 프로덕션(npm run build): 기본 real API. REACT_APP_USE_MOCK=true 로 mock(site-test).
export const USE_MOCK_API = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_USE_MOCK === 'true'
  : process.env.REACT_APP_USE_MOCK !== 'false';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
