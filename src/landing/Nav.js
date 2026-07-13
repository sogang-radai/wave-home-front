import { motion, useScroll, useTransform } from "framer-motion";

export default function Nav({ onStart }) {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 140],
    ["rgba(5,7,10,0)", "rgba(5,7,10,0.92)"]
  );
  const borderColor = useTransform(
    scrollY,
    [0, 140],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]
  );

  return (
    <motion.header
      style={{ backgroundColor, borderColor }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md"
    >
      <div className="flex w-full items-center justify-between px-6 py-3 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2">
          <img
            src="/logo512.png"
            alt="WaveHome"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            WaveHome
          </span>
        </a>

        <button
          type="button"
          onClick={() => onStart()}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          Start now
        </button>
      </div>
    </motion.header>
  );
}
