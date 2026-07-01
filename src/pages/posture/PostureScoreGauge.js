export function PostureScoreGauge({ score }) {
  const pct = score / 100;
  const cx = 100;
  const cy = 72;
  const r = 65;
  const ang = Math.PI * (1 - pct);
  const nx = cx + r * Math.cos(ang);
  const ny = cy - r * Math.sin(ang);
  const bgArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fgArc =
    pct <= 0
      ? ''
      : pct >= 1
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
      : `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(2)} ${ny.toFixed(2)}`;
  const status = score > 80 ? '양호!' : score > 60 ? '주의' : '위험';
  const statusTone = score > 80 ? 'good' : score > 60 ? 'attention' : 'danger';
  const sparkles = [
    { x: 50, y: 32, s: 9 },
    { x: 152, y: 42, s: 7 },
    { x: 100, y: 6, s: 6 },
    { x: 66, y: 14, s: 5 },
    { x: 140, y: 16, s: 5 },
  ];

  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 200 78" className="mb-3 w-44 overflow-visible">
        <path d={bgArc} fill="none" stroke="var(--wave-20)" strokeWidth="11" strokeLinecap="round" />
        {fgArc && <path d={fgArc} fill="none" stroke="var(--wave)" strokeWidth="11" strokeLinecap="round" />}
        <circle cx={nx.toFixed(2)} cy={ny.toFixed(2)} r="7" fill="var(--surface)" stroke="var(--wave)" strokeWidth="3" />

        {sparkles.map((sp, i) => (
          <text key={i} x={sp.x} y={sp.y} fontSize={sp.s} fill="var(--wave)" textAnchor="middle" dominantBaseline="middle" opacity="0.8">
            ✦
          </text>
        ))}

        <circle cx={cx} cy={cy} r="30" fill="var(--wave)" />
        <circle cx={cx} cy={cy} r="30" fill="rgba(255,255,255,0.15)" />

        {score > 80 ? (
          <>
            <path d={`M ${cx - 13} ${cy - 8} Q ${cx - 9} ${cy - 13} ${cx - 5} ${cy - 8}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M ${cx + 5} ${cy - 8} Q ${cx + 9} ${cy - 13} ${cx + 13} ${cy - 8}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={cx - 9} cy={cy - 8} r="3.5" fill="var(--ink)" />
            <circle cx={cx + 9} cy={cy - 8} r="3.5" fill="var(--ink)" />
          </>
        )}

        {score > 80 ? (
          <path d={`M ${cx - 11} ${cy + 6} Q ${cx} ${cy + 17} ${cx + 11} ${cy + 6}`} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        ) : score > 60 ? (
          <line x1={cx - 11} y1={cy + 10} x2={cx + 11} y2={cy + 10} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d={`M ${cx - 11} ${cy + 10} Q ${cx} ${cy + 4} ${cx + 11} ${cy + 10}`} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>

      <p className={`posture-status-pill ${statusTone} mt-5`}>
        {status}
      </p>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--sub)' }}>
        자세 점수 <span className="font-bold" style={{ color: 'var(--ink)' }}>{score}점</span> / 100
      </p>
    </div>
  );
}
