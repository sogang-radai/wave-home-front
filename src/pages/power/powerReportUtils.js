import { getNow } from '../../lib/demoClock';

const PERIOD_LABELS = {
  hour: '1시간',
  day: '일간',
  week: '주간',
  month: '월간',
  year: '연간',
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatAnchorDate(date = getNow()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return { y, m, d, dateStr: `${y}-${pad2(m)}-${pad2(d)}` };
}

export function getWeekDatesEnding(anchor = getNow()) {
  const end = new Date(anchor);
  end.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(end);
    day.setDate(end.getDate() - (6 - i));
    return day;
  });
}

function parseMonthLabel(label) {
  return parseInt(String(label).replace(/[^0-9]/g, ''), 10);
}

function barPeriodStart(bar) {
  if (!bar) return null;
  const raw = bar.periodStart ?? bar.period_start ?? bar.date ?? null;
  return typeof raw === 'string' && raw.length >= 10 ? raw : null;
}

/**
 * Wh 막대 선택·기간 탭에 따라 상단 리포트 API 요청과 헤더 문구를 결정한다.
 * period 값은 프론트 UI 키(hour/day/week/…) — 백엔드 query_report 가 1h/24h/… 로 매핑한다.
 */
export function resolvePowerReportRequest({ rangeTab, selectedBarIndex, chartData }) {
  const { y, m, d, dateStr } = formatAnchorDate();
  const dataLen = chartData?.length ?? 0;

  if (
    selectedBarIndex != null
    && selectedBarIndex >= 0
    && selectedBarIndex >= dataLen
  ) {
    return resolvePowerReportRequest({ rangeTab, selectedBarIndex: null, chartData });
  }

  if (selectedBarIndex == null || selectedBarIndex < 0) {
    let periodStart = dateStr;
    if (rangeTab === 'hour') {
      const hour = getNow().getHours();
      periodStart = `${dateStr} ${pad2(hour)}:00:00`;
    } else if (rangeTab === 'month') {
      periodStart = `${y}-${pad2(m)}-01`;
    } else if (rangeTab === 'year') {
      periodStart = `${y}-01-01`;
    } else if (rangeTab === 'week') {
      const weekDates = getWeekDatesEnding();
      periodStart = `${weekDates[0].getFullYear()}-${pad2(weekDates[0].getMonth() + 1)}-${pad2(weekDates[0].getDate())}`;
    }
    return {
      period: rangeTab,
      periodStart,
      header: `${m}월 ${d}일 기준 ${PERIOD_LABELS[rangeTab]} 리포트`,
    };
  }

  const bar = chartData[selectedBarIndex];
  if (!bar) {
    return resolvePowerReportRequest({ rangeTab, selectedBarIndex: null, chartData });
  }

  const fromBar = barPeriodStart(bar);

  if (rangeTab === 'day') {
    const periodStart = fromBar
      || `${dateStr} ${pad2(parseInt(bar.label, 10) || 0)}:00:00`;
    const hour = parseInt(String(periodStart).slice(11, 13), 10);
    return {
      period: 'hour',
      periodStart,
      header: `${m}월 ${d}일 ${hour}시 기준 1시간 리포트`,
    };
  }

  if (rangeTab === 'week') {
    let dayStr = fromBar ? fromBar.slice(0, 10) : null;
    if (!dayStr) {
      const weekDates = getWeekDatesEnding();
      const day = weekDates[selectedBarIndex];
      if (!day) {
        return resolvePowerReportRequest({ rangeTab, selectedBarIndex: null, chartData });
      }
      dayStr = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
    }
    const dm = parseInt(dayStr.slice(5, 7), 10);
    const dd = parseInt(dayStr.slice(8, 10), 10);
    return {
      period: 'day',
      periodStart: dayStr,
      header: `${dm}월 ${dd}일 기준 일간 리포트`,
    };
  }

  if (rangeTab === 'month') {
    const dayStr = fromBar
      ? fromBar.slice(0, 10)
      : `${y}-${pad2(m)}-${pad2(parseInt(bar.label, 10) || 1)}`;
    const dayNum = parseInt(dayStr.slice(8, 10), 10);
    const monthNum = parseInt(dayStr.slice(5, 7), 10);
    return {
      period: 'day',
      periodStart: dayStr,
      header: `${monthNum}월 ${dayNum}일 기준 일간 리포트`,
    };
  }

  if (rangeTab === 'year') {
    let monthStart = fromBar ? fromBar.slice(0, 10) : null;
    if (!monthStart) {
      const monthNum = parseMonthLabel(bar.label);
      if (!monthNum) {
        return resolvePowerReportRequest({ rangeTab, selectedBarIndex: null, chartData });
      }
      monthStart = `${y}-${pad2(monthNum)}-01`;
    }
    const monthNum = parseInt(monthStart.slice(5, 7), 10);
    return {
      period: 'month',
      periodStart: monthStart,
      header: `${monthNum}월 기준 월간 리포트`,
    };
  }

  return resolvePowerReportRequest({ rangeTab, selectedBarIndex: null, chartData });
}
