import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/ui/Card';
import homeApi from '../api/homeApi';
import './HomeControlPage.css';

const powerRanges = [
  { id: 'hour', label: '시간' },
  { id: 'day', label: '일간' },
  { id: 'week', label: '주간' },
  { id: 'month', label: '월간' },
];

export function PowerPage() {
  const [plugs, setPlugs] = useState([]);
  const [selectedPlugId, setSelectedPlugId] = useState('all');
  const [powerRange, setPowerRange] = useState('hour');

  useEffect(() => {
    homeApi.getPowerPlugs().then(setPlugs);
  }, []);

  const selectedPlug = plugs.find((d) => d.id === selectedPlugId) || plugs[0];

  if (!selectedPlug) return <div className="page-stack" />;

  return (
    <div className="page-stack">
      <Card title="WaveAI 요약" wide>
        <div className="power-agent-summary">
          <div>
            <span>{selectedPlug.name}</span>
            <strong>{selectedPlug.summary}</strong>
            <p>
              {powerRange === 'hour'
                ? '현재 2초 단위 상태 쿼리를 기준으로 전력 변동을 추적 중입니다.'
                : '선택한 기간의 누적 사용량 흐름과 장치별 특이점을 함께 비교합니다.'}
            </p>
          </div>
          <div className="power-agent-total">
            <span>현재 전력</span>
            <strong>{selectedPlug.powerW.toFixed(1)}W</strong>
          </div>
        </div>
      </Card>

      <Card title={`${selectedPlug.name} 사용량`} wide>
        <div className="power-chart-head">
          <div>
            <strong>{selectedPlugId === 'all' ? '전체 콘센트' : selectedPlug.room}</strong>
            <span>선택 카드 기준으로 차트가 변경됩니다.</span>
          </div>
          <div className="power-range-tabs">
            {powerRanges.map((range) => (
              <button
                type="button"
                key={range.id}
                className={powerRange === range.id ? 'active' : ''}
                onClick={() => setPowerRange(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="power-chart">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={selectedPlug.trend[powerRange]} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wave)" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="var(--wave)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--wave-10)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--sub)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--wave-20)' }}
                formatter={(value) => [`${value}${powerRange === 'hour' ? 'W' : 'kWh'}`, powerRange === 'hour' ? '전력' : '사용량']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--wave)" strokeWidth={2.5} fill="url(#powerFill)" dot={{ r: 3, strokeWidth: 0, fill: 'var(--wave)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="power-device-grid">
        {plugs.map((device) => (
          <button
            type="button"
            key={device.id}
            className={`power-device-card ${selectedPlugId === device.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlugId(device.id)}
          >
            <span>{device.room}</span>
            <strong>{device.name}</strong>
            <div className="power-device-value">
              {device.powerW.toFixed(1)}<small>W</small>
            </div>
            <div className="power-device-meta">
              <span>{device.voltageV.toFixed(1)}V</span>
              <span>{(device.currentMa / 1000).toFixed(3)}A</span>
              <span>시간당 약 {device.hourlyCostWon.toFixed(1)}원</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
