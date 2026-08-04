import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import powerApi from '../../api/powerApi';
import { TIER2_WON_PER_KWH, formatAnchorDate } from './powerReportUtils';

function CostTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="power-tooltip">
      <div className="power-tooltip-label">{label}일</div>
      <div className="power-tooltip-row">
        <span>예상 요금</span>
        <strong>{Math.round(payload[0].value).toLocaleString('ko-KR')}원</strong>
      </div>
    </div>
  );
}

export function MonthlyCostTrendCard() {
  const [points, setPoints] = useState(null);
  const { m, dateStr } = formatAnchorDate();

  useEffect(() => {
    let cancelled = false;
    powerApi.getPeriodTrend({ deviceId: 'all', period: 'month', refDate: dateStr })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setPoints(list.map((d) => ({ label: d.label, won: (d.wh / 1000) * TIER2_WON_PER_KWH })));
      })
      .catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, [dateStr]);

  const totalWon = useMemo(() => (points || []).reduce((sum, p) => sum + p.won, 0), [points]);

  if (points === null || points.length === 0) return null;

  return (
    <div className="power-cost-trend-card">
      <div className="power-cost-trend-head">
        <h4 className="power-cost-trend-title">이번달 전기요금 추이</h4>
        <span className="power-cost-trend-total">
          {m}월 누적 예상 {Math.round(totalWon).toLocaleString('ko-KR')}원
        </span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
          <XAxis
            dataKey="label"
            interval={Math.max(0, Math.ceil(points.length / 6) - 1)}
            tick={{ fontSize: 10, fill: 'var(--sub)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, (max) => (max > 0 ? max * 1.15 : 10)]} />
          <Tooltip content={<CostTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} cursor={{ stroke: 'var(--line)' }} />
          <Area
            type="monotone"
            dataKey="won"
            stroke="var(--power-green)"
            strokeWidth={2}
            dot={false}
            fill="var(--power-green)"
            fillOpacity={0.18}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="power-cost-trend-caption">누진 2단계 단가 기준 근사치이며, 실제 청구 요금과 다를 수 있어요.</p>
    </div>
  );
}
