import {
  sleepScoreFactors,
  sleepStageBreakdown,
  sleepHypnogramSegments,
  sleepStageLog,
  snoringEpisodes,
  sleepDailyAnalysis,
  movementTicks,
} from '../../data/sleepData';

const SEED = 0x5e1ee;
const RANGE_DAYS = 21;
const TZ = '+09:00';

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);
const SKIP_DAYS_BY_WEEK = Array.from({ length: 4 }, () => Math.floor(rng() * 7));

function pad2(n) {
  return `${n}`.padStart(2, '0');
}

function formatNightDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addLocalDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function nightDatesInRange() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = RANGE_DAYS; i >= 1; i--) {
    dates.push(addLocalDays(end, -i));
  }
  return dates;
}

function shouldSkipNight(index) {
  const weekIndex = Math.floor(index / 7);
  if (weekIndex >= SKIP_DAYS_BY_WEEK.length) return false;
  return index % 7 === SKIP_DAYS_BY_WEEK[weekIndex];
}

function cloneWithVariance(base, variance = 0.1) {
  return JSON.parse(JSON.stringify(base));
}

function varyScore(base, index) {
  const delta = Math.round((rng() - 0.5) * 16);
  return Math.max(55, Math.min(95, base + delta - (index % 3)));
}

function varyMinutes(minutes, spread = 8) {
  return Math.max(5, minutes + Math.round((rng() - 0.5) * spread));
}

function buildIso(nightDate, hour, minute) {
  const wakeDate = hour < 12 ? addLocalDays(nightDate, 1) : nightDate;
  const d = hour < 12 ? wakeDate : nightDate;
  return `${formatNightDate(d)}T${pad2(hour)}:${pad2(minute)}:00${TZ}`;
}

function toScoreFactor(item, index) {
  const keys = ['duration', 'deepSleep', 'remSleep', 'awake', 'sleepLatency'];
  return {
    key: keys[index] || item.label,
    label: item.label,
    value: item.value,
    tag: item.tag,
    tone: item.tone,
  };
}

function toStageBreakdown(item) {
  const hours = item.time.match(/(\d+)시간/)?.[1];
  const minutes = item.time.match(/(\d+)분/)?.[1];
  return {
    stage: item.tone,
    label: item.label,
    percent: item.pct,
    durationMinutes: (Number(hours || 0) * 60) + Number(minutes || 0),
    durationText: item.time,
    tone: item.tone,
    typicalPercentRange: item.typical,
  };
}

function toHypnogramSegment(item) {
  return { stage: item.stage, durationMinutes: item.durationMinutes ?? item.minutes };
}

function stageFromLabel(label) {
  if (label === '기상' || label === '각성') return 'awake';
  if (label === 'REM') return 'rem';
  if (label === '깊은 수면') return 'deep';
  return 'light';
}

function toStageLogPoint(item) {
  return {
    time: item.time,
    stage: stageFromLabel(item.stage),
    stageLabel: item.stage,
    breathRate: item.breath,
    heartRate: item.heart,
    level: item.level,
  };
}

function toSnoringEpisode(item) {
  return { time: item.time, durationMinutes: item.durationMinutes ?? item.duration };
}

function toAnalysisItem(item) {
  return { label: item[0], value: item[1], description: item[2] };
}

function buildSessionReport(nightDate, sessionId, label, scoreOffset = 0, timeShift = 0) {
  const bedHour = 23;
  const bedMin = Math.max(0, Math.min(59, 11 + timeShift));
  const wakeHour = 6;
  const wakeMin = Math.max(0, Math.min(59, 36 + timeShift));
  const startIso = buildIso(nightDate, bedHour, bedMin);
  const endIso = buildIso(nightDate, wakeHour, wakeMin);

  const segments = sleepHypnogramSegments.map((seg) => ({
    ...seg,
    minutes: varyMinutes(seg.minutes),
  }));

  const actualSleepMinutes = segments.reduce((sum, seg) => sum + (seg.minutes || seg.durationMinutes), 0);
  const score = varyScore(82, scoreOffset);

  return {
    sessionId,
    label,
    date: formatNightDate(nightDate),
    score,
    sleepWindow: { start: startIso, end: endIso },
    timeInBedMinutes: actualSleepMinutes + 60 + Math.round(rng() * 30),
    actualSleepMinutes,
    scoreFactors: cloneWithVariance(sleepScoreFactors).map(toScoreFactor),
    stageBreakdown: cloneWithVariance(sleepStageBreakdown).map(toStageBreakdown),
    hypnogram: {
      start: startIso,
      end: endIso,
      segments: segments.map(toHypnogramSegment),
      movementLevels: movementTicks.map((h) => Math.max(8, Math.min(95, h + Math.round((rng() - 0.5) * 20)))),
    },
    stageLog: cloneWithVariance(sleepStageLog).map((item, i) => toStageLogPoint({
      ...item,
      heart: item.heart + Math.round((rng() - 0.5) * 6),
      breath: item.breath + Math.round((rng() - 0.5) * 3),
    })),
    snoringEpisodes: sessionId === 'nap'
      ? []
      : cloneWithVariance(snoringEpisodes).map(toSnoringEpisode),
    analysis: cloneWithVariance(sleepDailyAnalysis).map(toAnalysisItem),
  };
}

function buildCatalog() {
  const catalog = {};
  const nights = nightDatesInRange();

  nights.forEach((nightDate, index) => {
    if (shouldSkipNight(index)) return;

    const dateKey = formatNightDate(nightDate);
    const sessions = [
      buildSessionReport(nightDate, 'main', '주 수면', index, 0),
    ];

    const dayOfWeek = nightDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      sessions.push(buildSessionReport(nightDate, 'nap', '낮잠', index + 3, 30));
    }

    catalog[dateKey] = sessions;
  });

  return catalog;
}

const sessionCatalog = buildCatalog();

export function listGeneratedNightDates() {
  return Object.keys(sessionCatalog).sort();
}

export function getGeneratedDailySessions(date) {
  const sessions = sessionCatalog[date];
  if (!sessions) return null;
  return {
    date,
    sessions: sessions.map(({ sessionId, label, score, sleepWindow }) => ({
      sessionId,
      label,
      score,
      sleepWindow,
    })),
  };
}

export function getGeneratedDailyReport(date, sessionId = 'main') {
  const sessions = sessionCatalog[date];
  if (!sessions) return null;
  const report = sessions.find((s) => s.sessionId === sessionId) || sessions[0];
  if (!report) return null;
  const { label, ...rest } = report;
  return rest;
}

export function hasGeneratedData(date) {
  return Boolean(sessionCatalog[date]);
}
