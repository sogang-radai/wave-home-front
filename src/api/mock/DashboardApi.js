import { delay, cloneDeep } from './utils';
import { dailyMessage } from '../../data/overviewData';

class MockApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}

function apiError(status, code, message, extra) {
  return new MockApiError(status, code, message, extra);
}

const ACTIVE_ACCOUNT_ID = 1;
let activeAccountId = ACTIVE_ACCOUNT_ID;

function requireActiveAccount() {
  if (!activeAccountId) {
    throw apiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

const currentStateSeed = {
  indoorEnvironment: { label: '쾌적', detail: '온도 24℃ · 조도 낮음' },
  controlMode: { label: '집중 모드', activatedAt: '2026-07-02T13:00:00+09:00' },
  radar: { connected: true, name: '방 1' },
};

export class DashboardApi {
  async getDailyMessage() {
    await delay();
    requireActiveAccount();
    return cloneDeep(dailyMessage);
  }

  async getCurrentState() {
    await delay();
    requireActiveAccount();
    return cloneDeep(currentStateSeed);
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
