import './report.css';
import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  LabelList,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import { Metric } from '../ui/Metric';
import { InsightCard } from './InsightCard';

export function weeklyScoreStatus(value) {
  return value >= 85 ? '좋음' : value >= 78 ? '보통 이상' : '관리 필요';
}

export function weeklyHoursColor(hours) {
  return hours >= 7 ? 'var(--wave)' : hours >= 6 ? 'var(--wave-40)' : 'var(--wave-20)';
}

export function WeeklyTrendSummary({ trendData, valueKey = 'hours', unit = 'h', label = '7일 평균 수면 시간', goal = 7.5, decimals = 1 }) {
  const avgValue = trendData.reduce((sum, d) => sum + d[valueKey], 0) / trendData.length;
  const goalPercent = Math.round((avgValue / goal) * 100);

  return (
    <div className="weekly-trend-summary">
      <span>{label}</span>
      <strong>{avgValue.toFixed(decimals)}{unit}</strong>
      <span>
        목표 {goal}{unit} 대비 <strong>{goalPercent}%</strong>
      </span>
    </div>
  );
}

export function WeeklyTrendTooltip({ active, payload, valueKey = 'hours', unit = 'h', valueLabel = '수면', scoreKey = 'score' }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const score = point[scoreKey];

  return (
    <div className="rounded-lg border bg-[var(--surface)] px-3 py-2 text-xs shadow-md" style={{ borderColor: 'var(--wave-20)' }}>
      <p className="font-extrabold" style={{ color: 'var(--ink)' }}>{point.day}</p>
      <p style={{ color: 'var(--ink)' }}>{valueLabel}: {point[valueKey]}{unit}</p>
      {score !== undefined && score !== point[valueKey] && <p style={{ color: 'var(--ink)' }}>점수: {score}점</p>}
      {score !== undefined && <p style={{ color: 'var(--sub)' }}>{weeklyScoreStatus(score)}</p>}
    </div>
  );
}

export function CareReport({
  type,
  title,
  score,
  summary,
  analysis,
  insights,
  visual,
  visualAction = 'Graph',
  trendData,
  trendValueKey = 'hours',
  trendUnit = 'h',
  trendDomain = [0, 9],
  trendSummaryLabel = '7일 평균 수면 시간',
  trendGoal = 7.5,
  trendDecimals = 1,
  trendColorFn = weeklyHoursColor,
  trendTooltipLabel = '수면',
  showTrendSummary = true,
  averageScore,
  dateNav,
  extra,
  header,
}) {
  const isWeekly = type === 'weekly';

  return (
    <div className="care-report-layout">
      {header || (
        <>
          {dateNav}
          {visual && (
            <Card title={title} action={visualAction} wide>
              <p className="report-summary-only">{summary}</p>
              {visual}
            </Card>
          )}
          {extra}
        </>
      )}
      {isWeekly && (
        <Card title={title} wide>
          <p className="report-summary-only">{summary}</p>
          {showTrendSummary && (
            <WeeklyTrendSummary
              trendData={trendData}
              valueKey={trendValueKey}
              unit={trendUnit}
              label={trendSummaryLabel}
              goal={trendGoal}
              decimals={trendDecimals}
            />
          )}
          <div className="weekly-trend-chart" style={{ marginTop: 18 }}>
            <ResponsiveContainer width="100%" height={210}>
              <RechartsBarChart data={trendData} margin={{ top: 16, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                <YAxis domain={trendDomain} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={<WeeklyTrendTooltip valueKey={trendValueKey} unit={trendUnit} valueLabel={trendTooltipLabel} />}
                  cursor={{ fill: 'var(--wave-10)' }}
                />
                <Bar dataKey={trendValueKey} radius={[8, 8, 0, 0]} maxBarSize={36}>
                  <LabelList
                    dataKey={trendValueKey}
                    position="top"
                    formatter={(value) => `${value}${trendUnit}`}
                    style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 700 }}
                  />
                  {trendData.map((d) => (
                    <Cell key={d.day} fill={trendColorFn(d[trendValueKey])} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="weekly-bottom-grid">
            <div className="weekly-score-average">
              <span>평균 점수</span>
              <strong>{averageScore || score}</strong>
              <p>7일 점수 기준</p>
            </div>
            {analysis.map(([label, value, detail]) => (
              <Metric key={label} label={label} value={value} detail={detail} />
            ))}
          </div>
        </Card>
      )}

      {insights && insights.length > 0 && (
        <Card title="권장 액션">
          <div className="insight-list">
            {insights.map((item) => (
              <InsightCard key={item.id} id={item.id} label={item.label} title={item.title} text={item.text} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
