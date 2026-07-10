import { delay, cloneDeep } from './utils';
import { dailyMessage } from '../../data/overviewData';
import { getNow } from '../../lib/demoClock';
import { AlarmApi } from './AlarmApi';
import { IotApi } from './IotApi';

const alarmApi = new AlarmApi();
const iotApi = new IotApi();

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

// alarm.md 의 daysOfWeek/timeMinute 규칙과 동일하게 다음 발동 시각을 계산한다.
function computeNextFireDate(alarm, now) {
  const hour = Math.floor(alarm.timeMinute / 60);
  const minute = alarm.timeMinute % 60;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

  const days = alarm.daysOfWeek || [];
  if (days.length === 0) {
    if (base.getTime() <= now.getTime()) base.setDate(base.getDate() + 1);
    return base;
  }

  const targetIndices = days.map((d) => DAY_INDEX[d]);
  for (let add = 0; add <= 7; add += 1) {
    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + add);
    if (!targetIndices.includes(candidate.getDay())) continue;
    if (add === 0 && candidate.getTime() <= now.getTime()) continue;
    return candidate;
  }
  return base;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// 오늘 안에 울리거나, 내일 정오(12:00) 이전에 울리는 알람만 대시보드에 노출한다.
function isRingingSoon(nextFire, now) {
  const diffDays = Math.round((startOfDay(nextFire) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return true;
  if (diffDays === 1) return nextFire.getHours() < 12;
  return false;
}

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

  async getUpcomingAlarms() {
    await delay();
    requireActiveAccount();
    const now = getNow();
    const alarms = await alarmApi.getAlarms();
    return alarms
      .filter((alarm) => alarm.enabled)
      .map((alarm) => ({ ...alarm, nextFire: computeNextFireDate(alarm, now) }))
      .filter((alarm) => isRingingSoon(alarm.nextFire, now))
      .sort((a, b) => a.nextFire - b.nextFire)
      .map(({ id, name, timeMinute, daysOfWeek, nextFire }) => ({
        id,
        name,
        timeMinute,
        daysOfWeek,
        nextFireAt: nextFire.toISOString(),
      }));
  }

  async getActiveGestureRules() {
    await delay();
    requireActiveAccount();
    const rules = await iotApi.getRules();
    return rules
      .filter((rule) => rule.enabled && rule.trigger?.kind === 'gesture')
      .map((rule) => {
        // 실제 automation_rule.actions_json 은 배열이라 백엔드는 actions_json[0] 을 대표
        // 액션으로 쓴다. mock 의 rule.action 은 이 mock 안에서만 쓰는 단일 액션 표현이라
        // rule.action === actions_json[0] 과 동일하게 취급한다.
        const primaryAction = rule.action;
        return {
          id: rule.externalId, // automation_rule.external_id — 공개 룰 id
          gestureSetId: rule.trigger.gestureSetPath ? rule.trigger.gestureSetPath.split('/')[1] : null,
          classId: rule.trigger.classId,
          actionDeviceId: primaryAction.deviceId,
          actionDeviceName: rule.actionDeviceName,
          actionName: primaryAction.name,
        };
      });
  }

  // 테스트에서 activeAccount required 경로를 확인할 때만 사용한다.
  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
