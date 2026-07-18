import { motion, useScroll, useTransform } from "framer-motion";
import logo from "../img/logo.png";
import logoDark from "../img/logo_dark.png";

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
        <a href="#top" className="group flex shrink-0 items-center gap-2">
          <span className="relative block h-7 w-7">
            <img
              src={logo}
              alt="WaveHome"
              width={28}
              height={28}
              className="absolute inset-0 h-7 w-7 rounded-full object-contain opacity-100 transition-opacity duration-150 group-hover:opacity-0"
            />
            <img
              src={logoDark}
              alt=""
              width={28}
              height={28}
              className="absolute inset-0 h-7 w-7 rounded-full object-contain opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white transition-colors duration-150 group-hover:text-wave">
            WaveHome
          </span>
        </a>

        <button
          type="button"
          onClick={() => onStart()}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          시작하기
        </button>
      </div>
    </motion.header>
  );
}
