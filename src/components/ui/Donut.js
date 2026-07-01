export function Donut({ pct, r = 38, sw = 8, color = 'var(--wave)', bg = 'var(--wave-10)', children }) {
  const circ = 2 * Math.PI * r;
  const sz = (r + sw) * 2 + 4;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: sz, height: sz }}>
      <svg width={sz} height={sz} className="-rotate-90" viewBox={`0 0 ${sz} ${sz}`}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={bg} strokeWidth={sw} />
        <circle
          cx={sz / 2}
          cy={sz / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
