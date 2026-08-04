/**
 * Sleep score + factor cards shared by mock (site-test) and mirrored in
 * wave-server SleepStore (demo/production). Keep formulas in sync.
 *
 * Weights: duration 0.30, efficiency 0.25, deep 0.15, rem 0.15, awake 0.15.
 * Missing stage totals drop those weights and renormalize.
 */

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function factorTagTone(subscore, lowTag) {
  if (subscore >= 90) return { tag: '최고', tone: 'excellent' };
  if (subscore >= 75) return { tag: '좋음', tone: 'good' };
  if (subscore >= 50) return { tag: '주의', tone: 'attention' };
  return { tag: lowTag, tone: 'danger' };
}

export function formatDurationText(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `${hours}시간 ${remainder}분`;
  if (hours > 0) return `${hours}시간`;
  return `${remainder}분`;
}

function scoreDurationMinutes(minutes) {
  if (minutes < 420) return (100 * minutes) / 420;
  if (minutes <= 540) return 100;
  return clampScore(100 - (25 * (minutes - 540)) / 120);
}

function scoreEfficiencyValue(efficiency) {
  return clampScore((100 * (efficiency - 0.7)) / 0.25);
}

function scoreDeepPercent(pct) {
  return clampScore((100 * (pct - 5)) / 13);
}

function scoreRemPercent(pct) {
  return clampScore((100 * (pct - 8)) / 14);
}

function scoreAwakePercent(pct) {
  return clampScore((100 * (15 - pct)) / 12);
}

function makeFactor(key, label, value, subscore, lowTag) {
  const { tag, tone } = factorTagTone(subscore, lowTag);
  return {
    key,
    label,
    value,
    tag,
    tone,
    subscore: Math.round(subscore),
  };
}

/**
 * @param {{
 *   asleepSeconds: number,
 *   timeInBedSeconds: number,
 *   efficiency?: number|null,
 *   stageTotalsSeconds?: { deep?: number, rem?: number, awake?: number, light?: number }|null,
 * }} input
 */
export function evaluateSleepScore({
  asleepSeconds,
  timeInBedSeconds,
  efficiency = null,
  stageTotalsSeconds = null,
}) {
  const asleepS = Math.max(0, Math.round(asleepSeconds || 0));
  const tibS = Math.max(0, Math.round(timeInBedSeconds || 0));
  const asleepMinutes = Math.round(asleepS / 60);

  let eff = Number(efficiency);
  if (!Number.isFinite(eff) || eff <= 0 || eff > 1) {
    eff = tibS > 0 ? asleepS / tibS : 0;
  }
  eff = Math.max(0, Math.min(1, eff));

  const factors = [];
  const parts = [];

  const durationSub = scoreDurationMinutes(asleepMinutes);
  parts.push({ weight: 0.3, subscore: durationSub, present: true });
  factors.push(makeFactor(
    'duration',
    '실제 수면 시간',
    formatDurationText(asleepS),
    durationSub,
    '부족',
  ));

  const efficiencyPresent = tibS > 0 || (Number.isFinite(Number(efficiency)) && Number(efficiency) > 0);
  const efficiencySub = scoreEfficiencyValue(eff);
  parts.push({ weight: 0.25, subscore: efficiencySub, present: efficiencyPresent });
  if (efficiencyPresent) {
    factors.push(makeFactor(
      'efficiency',
      '수면 효율',
      `${Math.round(eff * 100)}%`,
      efficiencySub,
      '주의',
    ));
  }

  let deepPart = { weight: 0.15, subscore: 0, present: false };
  let remPart = { weight: 0.15, subscore: 0, present: false };
  let awakePart = { weight: 0.15, subscore: 0, present: false };

  if (stageTotalsSeconds && asleepS > 0) {
    const deepS = Math.max(0, Math.round(stageTotalsSeconds.deep || 0));
    const remS = Math.max(0, Math.round(stageTotalsSeconds.rem || 0));
    const awakeS = Math.max(0, Math.round(stageTotalsSeconds.awake || 0));
    const deepPct = (100 * deepS) / asleepS;
    const remPct = (100 * remS) / asleepS;
    const awakePct = tibS > 0 ? (100 * awakeS) / tibS : 0;

    deepPart = { weight: 0.15, subscore: scoreDeepPercent(deepPct), present: true };
    remPart = { weight: 0.15, subscore: scoreRemPercent(remPct), present: true };
    awakePart = { weight: 0.15, subscore: scoreAwakePercent(awakePct), present: true };

    factors.push(makeFactor('deepSleep', '깊은 수면', formatDurationText(deepS), deepPart.subscore, '부족'));
    factors.push(makeFactor('remSleep', 'REM 수면', formatDurationText(remS), remPart.subscore, '부족'));
    factors.push(makeFactor('awake', '각성', formatDurationText(awakeS), awakePart.subscore, '주의'));
  }

  parts.push(deepPart, remPart, awakePart);

  let weightSum = 0;
  let weighted = 0;
  parts.forEach((part) => {
    if (!part.present) return;
    weightSum += part.weight;
    weighted += part.weight * part.subscore;
  });

  return {
    score: weightSum > 0 ? Math.round(weighted / weightSum) : 0,
    scoreFactors: factors,
  };
}
