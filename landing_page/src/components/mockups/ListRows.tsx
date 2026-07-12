"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Row = {
  label: string;
  meta: string;
  tone?: "wave" | "mist" | "amber";
};

export default function ListRows({ rows }: { rows: Row[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const toneClass = {
    wave: "bg-sky-100 text-sky-700",
    mist: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.35, delay: i * 0.08, ease: "easeOut" }}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
        >
          <span className="text-[13px] font-medium text-slate-900">{r.label}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              toneClass[r.tone ?? "wave"]
            }`}
          >
            {r.meta}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
