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

  async getPeriodTrend({ deviceId, period }) {
    await delay();
    requireActiveAccount();
    const plug = findDemoPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    return generatePowerPeriodTrend(period, plug.power_w, plug.id);
  }

  async getReport({ deviceId, period }) {
    await delay();
    requireActiveAccount();
    const plug = findDemoPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    const apiPeriod = REPORT_PERIOD_MAP[period];
    if (!apiPeriod) {
      return { supported: false, text: '이 구간에서는 AI 리포트를 제공하지 않습니다.' };
    }
    return {
      supported: true,
      period: apiPeriod,
      metrics: {
        energyWh: plug.power_w * 3.2,
        peakW: plug.power_w * 1.15,
        onRatio: plug.switch ? 0.72 : 0.02,
      },
      text: `${plug.name}의 ${period} 전력 사용 패턴을 분석했습니다. 피크 전력은 ${(plug.power_w * 1.15).toFixed(0)}W였습니다.`,
    };
  }

  async getInsights() {
    await delay();
    requireActiveAccount();
    return insightsApi.listForSurface('power', {});
  }

  async updateInsight(insightId, { approved }) {
    if (!guardDemoWrite()) return null;
    await delay();
    requireActiveAccount();
    return insightsApi.updateInsight(insightId, { approved });
  }
}
