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
import { weeklyScoreStatus } from './CareReport';

export function postureScoreColor(score) {
  return score >= 85 ? 'var(--wave)' : score >= 78 ? 'var(--wave-40)' : 'var(--wave-20)';
}

export function PostureScoreTooltip({ active, payload, xKey, valueKey, noteKey }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border bg-[var(--surface)] px-3 py-2 text-xs shadow-md" style={{ borderColor: 'var(--wave-20)' }}>
      <p className="font-extrabold" style={{ color: 'var(--ink)' }}>
        {point[xKey]}{point.label ? ` · ${point.label}` : ''}
      </p>
      <p style={{ color: 'var(--ink)' }}>자세 점수: {point[valueKey]}점</p>
      {noteKey && point[noteKey] !== undefined && <p style={{ color: 'var(--ink)' }}>거북목 {point[noteKey]}회</p>}
      <p style={{ color: 'var(--sub)' }}>{weeklyScoreStatus(point[valueKey])}</p>
    </div>
  );
}

export function PostureScoreChart({ data, xKey, valueKey = 'value', noteKey }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <RechartsBarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<PostureScoreTooltip xKey={xKey} valueKey={valueKey} noteKey={noteKey} />} cursor={{ fill: 'var(--wave-10)' }} />
        <Bar dataKey={valueKey} radius={[8, 8, 0, 0]} maxBarSize={36} isAnimationActive={false}>
          <LabelList
            dataKey={valueKey}
            position="top"
            formatter={(value) => `${value}점`}
            style={{ fill: 'var(--ink)', fontSize: 12, fontWeight: 700 }}
            isAnimationActive={false}
          />
          {data.map((d) => (
            <Cell key={d[xKey]} fill={postureScoreColor(d[valueKey])} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
