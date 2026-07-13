import { delay, cloneDeep } from './utils';
import { smartPlugDevices, generatePowerComboTrend, generatePowerPeriodTrend } from '../../data/homeData';
import { InsightsApi } from './InsightsApi';

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

function findPlug(deviceId) {
  return smartPlugDevices.find((device) => device.id === deviceId);
}

const REPORT_PERIOD_MAP = { hour: '1h', day: '24h', week: '1w', month: '1mo', year: '1yr' };
// 한국전력 주택용(저압) 누진제 2단계(201~400kWh) 근사 단가 — 데모용 상수 (PowerPage.js TIER2_WON_PER_KWH와 동일).
const TIER2_WON_PER_KWH = 214.6;

function average(values) {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

function fmtWh(wh) {
  return wh >= 1000 ? `${(wh / 1000).toFixed(1)}kWh` : `${wh.toFixed(0)}Wh`;
}

function fmtWon(won) {
  return `${Math.round(won).toLocaleString()}원`;
}

// "-12분" / "-45s" / "지금" (combo trend label) → "12분 전" / "45초 전" / "방금"
function agoText(label) {
  if (label === '지금') return '방금';
  const m = label.match(/^-(\d+)(분|s)$/);
  if (!m) return label;
  return m[2] === '분' ? `${m[1]}분 전` : `${m[1]}초 전`;
}

// 최근 1시간(콤보 트렌드, 1분 간격 60포인트의 순간 W)을 분석 — 변동 폭과 추세를 근거로 든다.
function buildHourReport(plug) {
  const points = generatePowerComboTrend('hour', plug.power_w, plug.id);
  const values = points.map((p) => p.value);
  const totalWh = points.reduce((sum, p) => sum + p.wh, 0);
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a));
  const low = points.reduce((a, b) => (b.value < a.value ? b : a));
  const avg = average(values);
  const firstHalf = average(values.slice(0, 30));
  const secondHalf = average(values.slice(30));
  const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
  const trendComment = Math.abs(trendPct) < 8
    ? '전 구간에서 큰 변동 없이 안정적으로 유지됐어요'
    : trendPct > 0
      ? `초반 30분보다 후반 30분 사용량이 약 ${trendPct}% 늘며 점차 증가하는 흐름을 보였어요`
      : `초반 30분보다 후반 30분 사용량이 약 ${Math.abs(trendPct)}% 줄며 점차 감소하는 흐름을 보였어요`;
  const estimatedCostWon = (totalWh / 1000) * TIER2_WON_PER_KWH;

  return {
    metrics: { totalWh, peakW: peak.value, avgW: avg },
    text: `${plug.name}의 최근 1시간 전력 사용 패턴을 분석했어요. 이 시간 동안 총 ${fmtWh(totalWh)}를 사용했고 평균 ${avg.toFixed(1)}W 수준을 유지했어요. ${agoText(peak.label)} 시점에 ${peak.value.toFixed(1)}W로 가장 높았고, ${agoText(low.label)} 시점엔 ${low.value.toFixed(1)}W까지 낮아졌어요. ${trendComment}. 이 페이스가 하루 종일 이어진다면 하루 예상 전기요금은 약 ${fmtWon(estimatedCostWon * 24)}이에요.`,
  };
}

// 오늘 하루(24시간 시간대별 Wh) — 시간대 구간 비교로 언제 몰렸는지 짚는다.
function buildDayReport(plug) {
  const points = generatePowerPeriodTrend('day', plug.power_w, plug.id);
  const totalWh = points.reduce((sum, p) => sum + p.wh, 0);
  const peak = points.reduce((a, b) => (b.wh > a.wh ? b : a));
  const low = points.reduce((a, b) => (b.wh < a.wh ? b : a));
  const sumRange = (from, to) => points.slice(from, to + 1).reduce((sum, p) => sum + p.wh, 0);
  const segments = [
    ['새벽·오전(0~11시)', sumRange(0, 11)],
    ['오후(12~17시)', sumRange(12, 17)],
    ['저녁·밤(18~23시)', sumRange(18, 23)],
  ];
  const top = segments.reduce((a, b) => (b[1] > a[1] ? b : a));
  const topShare = totalWh > 0 ? Math.round((top[1] / totalWh) * 100) : 0;
  const estimatedCostWon = (totalWh / 1000) * TIER2_WON_PER_KWH;

  return {
    metrics: { totalWh, peakWh: peak.wh, peakHour: peak.label },
    text: `${plug.name}의 오늘 하루 전력 사용 패턴을 분석했어요. 24시간 동안 총 ${fmtWh(totalWh)}를 사용했고, 그중 ${top[0]}에 사용량의 약 ${topShare}%가 몰렸어요. 사용량이 가장 많았던 시간대는 ${peak.label}로 ${peak.wh.toFixed(1)}Wh를 기록했고, 가장 적었던 시간대는 ${low.label}(${low.wh.toFixed(1)}Wh)였어요. 오늘과 같은 패턴이 한 달간 반복된다면 예상 전기요금은 약 ${fmtWon(estimatedCostWon * 30)} 수준이에요.`,
  };
}

// 이번 주(요일별 Wh) — 평일 대 주말 비교가 핵심 근거.
function buildWeekReport(plug) {
  const points = generatePowerPeriodTrend('week', plug.power_w, plug.id);
  const totalWh = points.reduce((sum, p) => sum + p.wh, 0);
  const weekdayAvg = average(points.slice(0, 5).map((p) => p.wh));
  const weekendAvg = average(points.slice(5).map((p) => p.wh));
  const peak = points.reduce((a, b) => (b.wh > a.wh ? b : a));
  const diffPct = Math.min(weekdayAvg, weekendAvg) > 0
    ? Math.round((Math.abs(weekendAvg - weekdayAvg) / Math.min(weekdayAvg, weekendAvg)) * 100)
    : 0;
  const compareComment = diffPct < 5
    ? '평일과 주말의 하루 평균 사용량은 비슷한 수준이었어요'
    : weekendAvg > weekdayAvg
      ? `주말 하루 평균 사용량이 평일보다 약 ${diffPct}% 더 많았어요`
      : `평일 하루 평균 사용량이 주말보다 약 ${diffPct}% 더 많았어요`;
  const estimatedCostWon = (totalWh / 1000) * TIER2_WON_PER_KWH;

  return {
    metrics: { totalWh, peakWh: peak.wh, peakDay: peak.label },
    text: `${plug.name}의 이번 주 전력 사용 패턴을 분석했어요. 7일 동안 총 ${fmtWh(totalWh)}를 사용했고, ${compareComment}. 사용량이 가장 많았던 요일은 ${peak.label}요일로 ${fmtWh(peak.wh)}를 기록했어요. 이번 주 페이스가 이어진다면 한 달 예상 전기요금은 약 ${fmtWon((estimatedCostWon / 7) * 30)}이에요.`,
  };
}

// 이번 달(일별 Wh) — 월초 대비 월말 추세 비교.
function buildMonthReport(plug) {
  const points = generatePowerPeriodTrend('month', plug.power_w, plug.id);
  const totalWh = points.reduce((sum, p) => sum + p.wh, 0);
  const half = Math.floor(points.length / 2);
  const firstHalfAvg = average(points.slice(0, half).map((p) => p.wh));
  const secondHalfAvg = average(points.slice(half).map((p) => p.wh));
  const trendPct = firstHalfAvg > 0 ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0;
  const trendComment = Math.abs(trendPct) < 5
    ? '월초와 월말 사이 사용량은 큰 차이 없이 고르게 유지됐어요'
    : trendPct > 0
      ? `월초보다 월말로 갈수록 사용량이 약 ${trendPct}% 늘었어요`
      : `월초보다 월말로 갈수록 사용량이 약 ${Math.abs(trendPct)}% 줄었어요`;
  const peak = points.reduce((a, b) => (b.wh > a.wh ? b : a));
  const estimatedCostWon = (totalWh / 1000) * TIER2_WON_PER_KWH;

  return {
    metrics: { totalWh, peakWh: peak.wh, peakDay: peak.label },
    text: `${plug.name}의 이번 달 전력 사용 패턴을 분석했어요. 이번 달 총 사용량은 ${fmtWh(totalWh)}(약 ${(totalWh / 1000).toFixed(1)}kWh)이고, ${trendComment}. 사용량이 가장 많았던 날은 ${peak.label}일로 ${fmtWh(peak.wh)}를 기록했어요. 이번 달 사용량 기준 예상 전기요금은 약 ${fmtWon(estimatedCostWon)}이에요.`,
  };
}

// 올해(월별 kWh) — 계절 구간(여름/겨울) 비교.
function buildYearReport(plug) {
  const points = generatePowerPeriodTrend('year', plug.power_w, plug.id);
  const totalKwh = points.reduce((sum, p) => sum + p.wh, 0);
  const peak = points.reduce((a, b) => (b.wh > a.wh ? b : a));
  const low = points.reduce((a, b) => (b.wh < a.wh ? b : a));
  const summer = ['6월', '7월', '8월'];
  const winter = ['12월', '1월', '2월'];
  const summerAvg = average(points.filter((p) => summer.includes(p.label)).map((p) => p.wh));
  const winterAvg = average(points.filter((p) => winter.includes(p.label)).map((p) => p.wh));
  const diffPct = Math.min(summerAvg, winterAvg) > 0
    ? Math.round((Math.abs(summerAvg - winterAvg) / Math.min(summerAvg, winterAvg)) * 100)
    : 0;
  const seasonComment = diffPct < 5
    ? '여름철(6~8월)과 겨울철(12~2월)의 월평균 사용량은 비슷한 수준이었어요'
    : summerAvg > winterAvg
      ? `여름철(6~8월) 월평균 사용량이 겨울철(12~2월)보다 약 ${diffPct}% 더 많았어요`
      : `겨울철(12~2월) 월평균 사용량이 여름철(6~8월)보다 약 ${diffPct}% 더 많았어요`;
  const estimatedCostWon = totalKwh * TIER2_WON_PER_KWH;

  return {
    metrics: { totalKwh, peakKwh: peak.wh, peakMonth: peak.label },
    text: `${plug.name}의 올해 전력 사용 패턴을 분석했어요. 연간 총 사용량은 약 ${totalKwh.toFixed(1)}kWh이고, ${seasonComment}. 사용량이 가장 많았던 달은 ${peak.label}(${peak.wh.toFixed(1)}kWh)였고, 가장 적었던 달은 ${low.label}(${low.wh.toFixed(1)}kWh)였어요. 이 추세가 이어진다면 연간 예상 전기요금은 약 ${fmtWon(estimatedCostWon)} 수준이에요.`,
  };
}

const REPORT_BUILDERS = {
  hour: buildHourReport,
  day: buildDayReport,
  week: buildWeekReport,
  month: buildMonthReport,
  year: buildYearReport,
};

export class PowerApi {
  async getPlugs() {
    await delay();
    requireActiveAccount();
    return cloneDeep(smartPlugDevices.map((device) => ({
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
    const plug = findPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    return generatePowerComboTrend(range, plug.power_w, plug.id);
  }

  async getPeriodTrend({ deviceId, period }) {
    await delay();
    requireActiveAccount();
    const plug = findPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    return generatePowerPeriodTrend(period, plug.power_w, plug.id);
  }

  async getReport({ deviceId, period }) {
    await delay();
    requireActiveAccount();
    const plug = findPlug(deviceId);
    if (!plug) throw new MockApiError(404, 'NOT_FOUND', '전력 소스를 찾을 수 없습니다.');
    const apiPeriod = REPORT_PERIOD_MAP[period];
    const buildReport = REPORT_BUILDERS[period];
    if (!apiPeriod || !buildReport) {
      return { supported: false, text: '이 구간에서는 AI 리포트를 제공하지 않습니다.' };
    }
    const { metrics, text } = buildReport(plug);

    return { supported: true, period: apiPeriod, metrics, text };
  }

  // insight (surface='power') — same thin-wrapper pattern as SleepApi/PostureApi,
  // so the real v1 PowerApi below reuses the exact same GET/PATCH /insights contract.
  async getInsights() {
    await delay();
    requireActiveAccount();
    return insightsApi.listForSurface('power', {});
  }

  async updateInsight(insightId, { approved }) {
    await delay();
    requireActiveAccount();
    return insightsApi.updateInsight(insightId, { approved });
  }

  __setActiveAccountForTest(accountId) {
    activeAccountId = accountId;
  }
}
