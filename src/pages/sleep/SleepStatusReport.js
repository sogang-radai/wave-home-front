import { useEffect, useState } from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Metric } from '../../components/ui/Metric';
import { StatusDateNavigator, getToday } from '../../components/report/StatusDateNavigator';
import sleepApi from '../../api/sleepApi';

// Chart layout/color constants — presentation only, not part of the API contract.
const HYPNOGRAM_LANES = { awake: 14, rem: 38, light: 62, deep: 86 };
const HYPNOGRAM_BAND_PX = 5;
const stageColorVar = {
  awake: 'var(--accent-stage-awake)',
  rem: 'var(--accent-plum)',
  light: 'var(--accent-stage-light)',
  deep: 'var(--accent-stage-deep)',
};
function sleepScoreStatus(score) {
  if (score >= 85) return { cls: 'excellent', label: 'Excellent' };
  if (score >= 70) return { cls: 'good',      label: 'Good' };
  if (score >= 55) return { cls: 'attention', label: 'Fair' };
  return              { cls: 'danger',     label: 'Bad' };
}

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The calendar date shown in the navigator is the morning-after; the API's daily report
// is keyed by the night's start date, one calendar day earlier.
function toReportDateParam(uiDate) {
  const start = new Date(uiDate);
  start.setDate(start.getDate() - 1);
  return formatDateParam(start);
}

function formatHm(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

function formatClockLabel(iso) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
}

function buildHypnogramTimeLabels(start, end, count = 4) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Array.from({ length: count }, (_, i) => {
    const t = startMs + ((endMs - startMs) * (i + 1)) / (count + 1);
    return formatClockLabel(new Date(t).toISOString());
  });
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function SleepHypnogram({ segments, timeLabels, movementLevels }) {
  const total = segments.reduce((sum, seg) => sum + seg.durationMinutes, 0);

  let cursor = 0;
  const points = segments.map((seg) => {
    const x0 = cursor;
    cursor += seg.durationMinutes;
    return { ...seg, x0, x1: cursor, y: HYPNOGRAM_LANES[seg.stage] };
  });

  return (
    <div>
      <div className="relative h-24 w-full">
        {Object.values(HYPNOGRAM_LANES).map((y) => (
          <div key={y} className="absolute inset-x-0 border-t border-[var(--line)]" style={{ top: `${y}%` }} />
        ))}
        {points.map((seg, index) => {
          const prev = points[index - 1];
          const topY = prev ? Math.min(prev.y, seg.y) : seg.y;
          const bottomY = prev ? Math.max(prev.y, seg.y) : seg.y;
          const topColor = prev && prev.y > seg.y ? stageColorVar[seg.stage] : prev && stageColorVar[prev.stage];
          const bottomColor = prev && prev.y > seg.y ? stageColorVar[prev.stage] : prev && stageColorVar[seg.stage];

          return (
            <div key={index}>
              {prev && (
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${(seg.x0 / total) * 100}%`,
                    top: `${topY}%`,
                    height: `${bottomY - topY}%`,
                    width: HYPNOGRAM_BAND_PX,
                    transform: 'translateX(-50%)',
                    background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
                  }}
                />
              )}
              <div
                className="absolute rounded-full"
                style={{
                  left: `${(seg.x0 / total) * 100}%`,
                  width: `${((seg.x1 - seg.x0) / total) * 100}%`,
                  top: `${seg.y}%`,
                  height: HYPNOGRAM_BAND_PX,
                  transform: 'translateY(-50%)',
                  background: stageColorVar[seg.stage],
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 border-t border-[var(--line)] pt-2">
        <p className="mb-1.5 text-[11px] font-bold text-[var(--sub)]">움직임</p>
        <div className="flex h-3 w-full items-end justify-between">
          {movementLevels.map((height, index) => (
            <div
              key={index}
              className="w-px rounded-sm bg-[var(--neutral-dot)]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between border-t border-[var(--line)] pt-2 text-[11px] text-[var(--sub)]">
        {timeLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-[var(--sub)]">
        <span className="inline-block h-2.5 w-4 rounded-sm bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]" />
        일반적인 범위
      </div>
    </div>
  );
}

export function SleepStageBreakdownRow({ stage }) {
  const [typicalStart, typicalEnd] = stage.typicalPercentRange;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: stageColorVar[stage.tone] }} />
        <strong className="text-[13px] font-extrabold text-[var(--ink)]">{stage.label}</strong>
        <em className="font-extrabold not-italic text-[var(--sub)]">{stage.percent}%</em>
        <small className="ml-auto text-[var(--sub)]">{stage.durationText}</small>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]"
          style={{ left: `${typicalStart}%`, width: `${typicalEnd - typicalStart}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${stage.percent}%`, background: stageColorVar[stage.tone] }}
        />
      </div>
    </div>
  );
}

export function SleepStatusReport() {
  const [reportDate, setReportDate] = useState(getToday);
  const [latestDate] = useState(getToday);
  const [showFactors, setShowFactors] = useState(false);
  const [showStages, setShowStages] = useState(false);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    setReport(null);
    setReportError(null);
    sleepApi
      .getDailyReport(toReportDateParam(reportDate))
      .then(setReport)
      .catch((err) => setReportError(err.message || '해당 날짜의 수면 기록이 없습니다.'));
  }, [reportDate]);

  return (
    <>
      <StatusDateNavigator date={reportDate} latestDate={latestDate} onChange={setReportDate} />

      {reportError && (
        <Card title="수면 리포트">
          <p style={{ color: 'var(--sub)', fontSize: '0.85rem' }}>{reportError}</p>
        </Card>
      )}

      {report && (
        <>
          {(() => {
            const { cls, label } = sleepScoreStatus(report.score);
            const timeLabels = buildHypnogramTimeLabels(report.hypnogram.start, report.hypnogram.end);
            const avgHeart = average(report.stageLog.map((point) => point.heartRate));
            const avgBreath = average(report.stageLog.map((point) => point.breathRate));

            return (
              <>
                <section className={`sleep-score-hero ${cls}`}>
                  <div className="sleep-score-hero-top">
                    <div className="sleep-score-hero-number">
                      {report.score}<span className={`tag ${cls}`}>{label}</span>
                    </div>
                    <button type="button" className="sleep-score-details-btn" onClick={() => setShowFactors((current) => !current)}>
                      {showFactors ? '접기' : '상세 보기'}
                    </button>
                  </div>
                  <div className="sleep-score-hero-times">
                    <strong>{formatHm(report.timeInBedMinutes)}</strong>
                    <span>수면 시간 · {formatClockLabel(report.sleepWindow.start)} - {formatClockLabel(report.sleepWindow.end)}</span>
                  </div>
                  <div className="sleep-score-hero-actual">
                    <strong>{formatHm(report.actualSleepMinutes)}</strong>
                    <span>실제 수면 시간</span>
                  </div>
                  <div className="care-analysis-grid" style={{ marginTop: 16 }}>
                    {report.analysis.map((item) => (
                      <Metric key={item.label} label={item.label} value={item.value} detail={item.description} />
                    ))}
                  </div>

                  {showFactors && (
                    <div className="sleep-score-factor-panel">
                      <div className="sleep-score-factor-head">
                        <strong>수면 점수 요인</strong>
                      </div>
                      <div className="sleep-factor-grid">
                        {report.scoreFactors.map((factor) => (
                          <div className={`sleep-factor-card ${factor.tone}`} key={factor.key}>
                            <span>{factor.label}</span>
                            <strong>{factor.value}</strong>
                            <em className={`sleep-factor-tag ${factor.tone}`}>{factor.tag}</em>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <Card
                  title="수면 단계"
                  action={
                    <button type="button" className="card-action-btn" onClick={() => setShowStages((current) => !current)}>
                      {showStages ? '접기' : '상세 보기'}
                    </button>
                  }
                >
                  <SleepHypnogram
                    segments={report.hypnogram.segments}
                    timeLabels={timeLabels}
                    movementLevels={report.hypnogram.movementLevels}
                  />
                  {showStages && (
                    <div className="mt-6 flex flex-col gap-4">
                      {report.stageBreakdown.map((stage) => (
                        <SleepStageBreakdownRow stage={stage} key={stage.label} />
                      ))}
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Card title="코골이" action={`${report.snoringEpisodes.length}회 감지`}>
                    <div className="big-number">
                      <small>어젯밤 총 코골이 시간</small>
                      {report.snoringEpisodes.reduce((sum, item) => sum + item.durationMinutes, 0)}<span>분</span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {report.snoringEpisodes.map((item) => (
                        <div key={item.time} className="flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--wave-05)' }}>
                          <span style={{ color: 'var(--sub)' }}>{item.time}</span>
                          <span className="font-bold" style={{ color: 'var(--ink)' }}>{item.durationMinutes}분</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="심박수" action={`평균 ${Math.round(avgHeart)}bpm`}>
                    <ResponsiveContainer width="100%" height={140}>
                      <RechartsAreaChart data={report.stageLog.map((d) => ({ day: d.time, value: d.heartRate }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="heartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[45, 85]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                          labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                          itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                          formatter={(value) => [`${value} bpm`, '심박']}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#heartFill)" dot={{ fill: 'var(--wave)', r: 3, strokeWidth: 0 }} />
                      </RechartsAreaChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card title="호흡수" action={`평균 ${avgBreath.toFixed(1)}회/분`}>
                    <ResponsiveContainer width="100%" height={140}>
                      <RechartsAreaChart data={report.stageLog.map((d) => ({ day: d.time, value: d.breathRate }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="breathFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[8, 22]} tick={{ fontSize: 10, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--wave-20)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                          labelStyle={{ color: 'var(--ink)', fontWeight: 800 }}
                          itemStyle={{ color: 'var(--ink)', fontWeight: 700 }}
                          formatter={(value) => [`${value}회/분`, '호흡']}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#breathFill)" dot={{ fill: 'var(--wave)', r: 3, strokeWidth: 0 }} />
                      </RechartsAreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>
            );
          })()}
        </>
      )}
    </>
  );
}
