import { delay } from '../mock/utils';
import { InsightsApi } from '../mock/InsightsApi';
import { PowerApi as RealPowerApi } from '../v1/PowerApi';
import {
  findDemoPlug,
  generatePowerPeriodTrend,
} from './powerProfiles';

const insightsApi = new InsightsApi();
const realPowerApi = new RealPowerApi();

class MockApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
  }
}

const ACTIVE_ACCOUNT_ID = 1;
let activeAccountId = ACTIVE_ACCOUNT_ID;

function requireActiveAccount() {
  if (!activeAccountId) {
    throw new MockApiError(409, 'ACTIVE_ACCOUNT_REQUIRED', '활성 구성원을 먼저 선택해주세요.');
  }
}

const REPORT_PERIOD_MAP = { hour: '1h', day: '24h', week: '1w', month: '1mo', year: '1yr' };

export class PowerApi {
  async getPlugs() {
    requireActiveAccount();
    return realPowerApi.getPlugs();
  }

  async getComboTrend({ deviceId, range, metric = 'w' }) {
    requireActiveAccount();
    return realPowerApi.getComboTrend({ deviceId, range, metric });
  }

  async getPeriodTrend({ deviceId, period, refDate }) {
    await delay();
    requireActiveAccount();
    try {
      return await realPowerApi.getPeriodTrend({ deviceId, period, refDate });
    } catch {
      const plug = findDemoPlug(deviceId);
      if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
      return generatePowerPeriodTrend(period, plug.power_w, plug.id);
    }
  }

  async getReport({ deviceId, period, periodStart }) {
    await delay();
    requireActiveAccount();
    try {
      return await realPowerApi.getReport({ deviceId, period, periodStart });
    } catch {
      const plug = findDemoPlug(deviceId);
      if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
      const apiPeriod = REPORT_PERIOD_MAP[period];
      if (!apiPeriod) {
        return { supported: false, text: '선택한 시간 간격은 AI 리포트를 제공하지 않습니다.' };
      }
      return { supported: true, period: apiPeriod, text: '리포트 준비 중입니다.' };
    }
  }

  async getInsights() {
    await delay();
    requireActiveAccount();
    try {
      const { InsightsApi: RealInsightsApi } = await import('../v1/InsightsApi');
      const real = new RealInsightsApi();
      return real.listForSurface('power', {});
    } catch {
      return insightsApi.listForSurface('power', {});
    }
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    requireActiveAccount();
    return insightsApi.updateInsight(insightId, { approved });
  }
}
