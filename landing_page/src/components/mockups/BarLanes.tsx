"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const lanes = [
  { label: "각성", color: "bg-rose-300", blocks: [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0] },
  { label: "얕은수면", color: "bg-wave", blocks: [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1] },
  { label: "깊은수면", color: "bg-wave-deep", blocks: [0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0] },
  { label: "렘수면", color: "bg-violet-300", blocks: [0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1] },
];

export default function BarLanes() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {lanes.map((lane, laneIndex) => (
        <div key={lane.label} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[10px] text-slate-500">
            {lane.label}
          </span>
          <div className="flex flex-1 gap-0.5">
            {lane.blocks.map((on, i) => (
              <motion.span
                key={i}
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{
                  duration: 0.32,
                  delay: laneIndex * 0.1 + i * 0.02,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: "bottom" }}
                className={`h-3 flex-1 rounded-sm ${
                  on ? lane.color : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>23:40</span>
        <span>03:20</span>
        <span>07:00</span>
      </div>
    </div>
  );
}
