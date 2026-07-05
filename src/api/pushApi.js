import { PushApi as RealPushApi } from './v1/PushApi';

// 나머지 도메인(sleep/posture/settings 등)은 아직 mock 백엔드가 대부분이라
// REACT_APP_USE_MOCK 전역 스위치를 따르지만, push는 실제 백엔드(FastAPI + FCM)가
// 이미 붙어있고 브라우저 알림 자체가 mock으로 흉내낼 수 없는 기능이라 스위치와 무관하게
// 항상 real API를 사용한다. 백엔드가 꺼져 있으면 호출 시점에 에러로 드러난다.
const pushApi = new RealPushApi();
export default pushApi;
