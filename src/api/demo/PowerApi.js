import { delay, cloneDeep } from '../mock/utils';
import { InsightsApi } from '../mock/InsightsApi';
import { guardDemoWrite } from '../../lib/demoGuard';
import {
  DEMO_POWER_PLUGS,
  findDemoPlug,
  generatePowerComboTrend,
  generatePowerPeriodTrend,
} from './powerProfiles';

const insightsApi = new InsightsApi();

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
    await delay();
    requireActiveAccount();
    return cloneDeep(DEMO_POWER_PLUGS.map((device) => ({
      id: device.id,
      name: device.name,
      room: device.room,
      summary: device.summary,
      powerW: device.power_w,
      voltageV: device.voltage_v,
      currentMa: device.current_ma,
      switchOn: device.switch,
      hourlyCostWon: device.hourlyCost,
      trend: cloneDeep(device.trend),
    })));
  }

  async getComboTrend({ deviceId, range }) {
    await delay();
    requireActiveAccount();
    const plug = findDemoPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    return generatePowerComboTrend(range, plug.power_w, plug.id);
  }

  async getPeriodTrend({ deviceId, period, refDate }) {
    await delay();
    requireActiveAccount();
    try {
      const { PowerApi: RealPowerApi } = await import('../v1/PowerApi');
      const real = new RealPowerApi();
      return real.getPeriodTrend({ deviceId, period, refDate });
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
      const { PowerApi: RealPowerApi } = await import('../v1/PowerApi');
      const real = new RealPowerApi();
      return real.getReport({ deviceId, period, periodStart });
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
    if (!guardDemoWrite()) return null;
    await delay();
    requireActiveAccount();
    return insightsApi.updateInsight(insightId, { approved });
  }
}
