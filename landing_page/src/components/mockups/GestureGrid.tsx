"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const pairs = [
  { gesture: "👋", device: "조명" },
  { gesture: "✊", device: "에어컨" },
  { gesture: "☝️", device: "커튼" },
  { gesture: "✌️", device: "공기청정기" },
];

export default function GestureGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="grid grid-cols-2 gap-2.5">
      {pairs.map((p, i) => (
        <motion.div
          key={p.device}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.35, delay: i * 0.08, ease: "easeOut" }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-base">
            {p.gesture}
          </span>
          <span className="text-slate-400">→</span>
          <span className="truncate text-[12px] font-medium text-slate-900">
            {p.device}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
