import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const tiles = [
  { label: "수면 점수", value: "86", unit: "점", tone: "bg-wave" },
  { label: "심박수", value: "58", unit: "bpm", tone: "bg-emerald-300" },
  { label: "활동량", value: "6,200", unit: "걸음", tone: "bg-amber-300" },
  { label: "오늘 할 일", value: "3", unit: "/5", tone: "bg-sky-300" },
];

export default function StatGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3">
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${t.tone}`} />
            <span className="text-[11px] text-slate-500">{t.label}</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-semibold text-slate-900">{t.value}</span>
            <span className="text-[11px] text-slate-500">{t.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
