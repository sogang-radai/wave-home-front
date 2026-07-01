import { useState } from 'react';
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
import {
  sleepScoreFactors,
  sleepDailyAnalysis,
  sleepHypnogramSegments,
  hypnogramTimeLabels,
  sleepStageBreakdown,
  snoringEpisodes,
  sleepStageLog,
  HYPNOGRAM_LANES,
  HYPNOGRAM_BAND_PX,
  stageColorVar,
  movementTicks,
} from '../../data/sleepData';

function sleepScoreStatus(score) {
  if (score >= 85) return { cls: 'excellent', label: 'Excellent' };
  if (score >= 70) return { cls: 'good',      label: 'Good' };
  if (score >= 55) return { cls: 'attention', label: 'Fair' };
  return              { cls: 'danger',     label: 'Bad' };
}

export function SleepHypnogram({ segments, timeLabels }) {
  const total = segments.reduce((sum, seg) => sum + seg.minutes, 0);

  let cursor = 0;
  const points = segments.map((seg) => {
    const x0 = cursor;
    cursor += seg.minutes;
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
          {movementTicks.map((height, index) => (
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
  const [typicalStart, typicalEnd] = stage.typical;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: stageColorVar[stage.tone] }} />
        <strong className="text-[13px] font-extrabold text-[var(--ink)]">{stage.label}</strong>
        <em className="font-extrabold not-italic text-[var(--sub)]">{stage.pct}%</em>
        <small className="ml-auto text-[var(--sub)]">{stage.time}</small>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,#cbd8df_0px,#cbd8df_2px,transparent_2px,transparent_4px)]"
          style={{ left: `${typicalStart}%`, width: `${typicalEnd - typicalStart}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${stage.pct}%`, background: stageColorVar[stage.tone] }}
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

  const score = 75;
  const { cls, label } = sleepScoreStatus(score);

  return (
    <>
      <StatusDateNavigator date={reportDate} latestDate={latestDate} onChange={setReportDate} />

      <section className={`sleep-score-hero ${cls}`}>
        <div className="sleep-score-hero-top">
          <div className="sleep-score-hero-number">
            {score}<span className={`tag ${cls}`}>{label}</span>
          </div>
          <button type="button" className="sleep-score-details-btn" onClick={() => setShowFactors((current) => !current)}>
            {showFactors ? '접기' : '상세 보기'}
          </button>
        </div>
        <div className="sleep-score-hero-times">
          <strong>6시간 25분</strong>
          <span>수면 시간 · 2:11 AM - 8:36 AM</span>
        </div>
        <div className="sleep-score-hero-actual">
          <strong>5시간 36분</strong>
          <span>실제 수면 시간</span>
        </div>
        <div className="care-analysis-grid" style={{ marginTop: 16 }}>
          {sleepDailyAnalysis.map(([lbl, value, detail]) => (
            <Metric key={lbl} label={lbl} value={value} detail={detail} />
          ))}
        </div>
      </section>

      {showFactors && (
        <Card title="수면 점수 요인">
          <div className="factor-grid">
            {sleepScoreFactors.map((factor) => (
              <div className={`factor-card ${factor.tone}`} key={factor.label}>
                <span>{factor.label}</span>
                <strong>{factor.value}</strong>
                <em className={`factor-tag ${factor.tone}`}>{factor.tag}</em>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="수면 단계"
        action={
          <button type="button" className="card-action-btn" onClick={() => setShowStages((current) => !current)}>
            {showStages ? '접기' : '상세 보기'}
          </button>
        }
      >
        <SleepHypnogram segments={sleepHypnogramSegments} timeLabels={hypnogramTimeLabels} />
        {showStages && (
          <div className="mt-6 flex flex-col gap-4">
            {sleepStageBreakdown.map((stage) => (
              <SleepStageBreakdownRow stage={stage} key={stage.label} />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card title="코골이" action={`${snoringEpisodes.length}회 감지`}>
          <div className="big-number">
            <small>어젯밤 총 코골이 시간</small>
            {snoringEpisodes.reduce((sum, item) => sum + item.duration, 0)}<span>분</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {snoringEpisodes.map((item) => (
              <div key={item.time} className="flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--wave-05)' }}>
                <span style={{ color: 'var(--sub)' }}>{item.time}</span>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>{item.duration}분</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="심박수" action="평균 61bpm">
          <ResponsiveContainer width="100%" height={140}>
            <RechartsAreaChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.heart }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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

        <Card title="호흡수" action="평균 14.0회/분">
          <ResponsiveContainer width="100%" height={140}>
            <RechartsAreaChart data={sleepStageLog.map((d) => ({ day: d.time, value: d.breath }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
}
