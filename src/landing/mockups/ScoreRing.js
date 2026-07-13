import { useRef } from "react";
import { useInView } from "framer-motion";

export default function ScoreRing({ score, caption }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div className="flex items-center gap-5">
      <svg ref={ref} width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? undefined : c}
          transform="rotate(-90 50 50)"
          pathLength="1"
          className={inView ? "score-ring" : ""}
          style={{
            "--score-offset": offset,
            "--score-length": c,
          }}
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="#0f172a"
        >
          {score}
        </text>
      </svg>
      <div>
        <p className="text-[13px] font-semibold text-slate-900">{caption}</p>
        <p className="mt-1 text-[12px] text-slate-500">지난주 대비 +4점</p>
      </div>
    </div>
  );
}
