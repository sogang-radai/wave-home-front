"use client";

import { motion } from "framer-motion";

function FloatWrap({
  children,
  duration,
  delay,
}: {
  children: React.ReactNode;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration, delay, ease: "easeInOut", repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

export default function ChatBubbles() {
  return (
    <div className="flex flex-col gap-2.5">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-[80%]"
      >
        <FloatWrap duration={3.2} delay={0.35}>
          <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-900">
            어젯밤 왜 깊은 수면이 줄었어?
          </div>
        </FloatWrap>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35, delay: 0.22, ease: "easeOut" }}
        className="ml-auto max-w-[85%]"
      >
        <FloatWrap duration={3.6} delay={0.6}>
          <div className="rounded-2xl rounded-tr-sm bg-wave-deep px-3.5 py-2.5 text-[12.5px] text-background">
            새벽 2시경 실내 온도가 26도까지 올라가면서 각성이 2회
            감지됐어요. 취침 전 에어컨 자동화를 26분 더 연장해볼까요?
          </div>
        </FloatWrap>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35, delay: 0.5 }}
        className="ml-auto flex gap-1.5"
      >
        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
          자동화 적용
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          나중에
        </span>
      </motion.div>
    </div>
  );
}
