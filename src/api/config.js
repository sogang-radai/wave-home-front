// 해커톤 mock/real 전환 스위치.
// .env(.local)에 REACT_APP_USE_MOCK=false 를 넣으면 real API 클래스가 사용된다.
// 값이 없으면 프론트 우선 개발 단계에 맞춰 기본값은 mock이다.
export const USE_MOCK_API = process.env.REACT_APP_USE_MOCK !== 'false';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api/v1';
