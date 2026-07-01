export function SemiGauge({ value, max, label, tone = 'default' }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const deg = pct * 180;
  const fillColor = tone === 'warn' ? '#f5b84b' : '#95d9f8';

  return (
    <div className="semi-gauge">
      <div
        className="semi-gauge-fill"
        style={{
          background: `conic-gradient(from 270deg, ${fillColor} 0deg, ${fillColor} ${deg}deg, #eaf6fc ${deg}deg, #eaf6fc 180deg, transparent 180deg)`,
        }}
      />
      <div className="semi-gauge-hole" />
      <div className="semi-gauge-label">
        <strong>{label}</strong>
      </div>
    </div>
  );
}
