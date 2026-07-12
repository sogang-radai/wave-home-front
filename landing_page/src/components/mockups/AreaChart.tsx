"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

export default function AreaChart({
  label,
  value,
  points,
  color = "#0ea5e9",
}: {
  label: string;
  value: string;
  points: string;
  color?: string;
}) {
  const gradId = `grad-${label.replace(/\s/g, "")}`;
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>
      <svg
        ref={ref}
        viewBox="0 0 240 70"
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,70 ${points} 240,70`}
          fill={`url(#${gradId})`}
          className={inView ? "chart-area" : ""}
          style={!inView ? { opacity: 0 } : undefined}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          className={inView ? "chart-line" : ""}
          style={!inView ? { strokeDasharray: 1, strokeDashoffset: 1 } : undefined}
        />
      </svg>
    </div>
  );
}
