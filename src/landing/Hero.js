import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import WaveCanvas from "./WaveCanvas";

gsap.registerPlugin(SplitText, ScrollTrigger);

function Sparkle({ className = "", delay = "0s" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`hero-sparkle ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <path
        d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const sceneRef = useRef(null);
  const contentRef = useRef(null);
  const headlineRef = useRef(null);

  useGSAP(() => {
    if (!headlineRef.current) return;
    const split = new SplitText(headlineRef.current, {
      type: "lines",
      linesClass: "overflow-hidden",
    });

    gsap.set(split.lines, { yPercent: 110, opacity: 0 });
    gsap.to(split.lines, {
      yPercent: 0,
      opacity: 1,
      duration: 1.1,
      stagger: 0.09,
      ease: "power4.out",
      delay: 0.3,
    });

    // Parallax scrub is desktop-only — on mobile it fights native scroll
    // and burns filters/transforms while the page is already heavy.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      if (!sectionRef.current || !sceneRef.current || !contentRef.current) return;
      const tl = gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        })
        .to(sceneRef.current, { scale: 1.18, yPercent: 9, filter: "blur(2px)", ease: "none" }, 0)
        .to(contentRef.current, { yPercent: -18, opacity: 0.18, ease: "none" }, 0);
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => {
      mm.revert();
      split.revert();
    };
  }, []);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background"
    >
      <div ref={sceneRef} className="absolute inset-0 origin-center will-change-transform">
        <WaveCanvas />
        {/* The water is bright periwinkle now, so white text needs its own dark
            scrim (not the old light wash) to stay legible — a soft vignette
            centered on the copy plus extra depth toward the bottom edge. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(20,28,58,0.38),transparent_58%),linear-gradient(to_bottom,rgba(15,22,48,0.16)_0%,rgba(15,22,48,0.08)_45%,rgba(15,22,48,0.42)_100%)]" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-28 will-change-transform lg:px-10"
      >
        <Sparkle className="left-[8%] top-[6%] h-8 w-8" delay="0s" />
        <Sparkle className="right-[10%] top-[18%] h-6 w-6" delay="0.6s" />
        <Sparkle className="left-[12%] top-[62%] h-5 w-5" delay="1.1s" />
        <Sparkle className="right-[7%] top-[54%] h-7 w-7" delay="0.3s" />

        <h1
          ref={headlineRef}
          className="mx-auto max-w-5xl text-balance text-center font-display text-6xl leading-[1.05] tracking-tight text-white drop-shadow-[0_0_45px_rgba(210,160,255,0.55)] sm:text-7xl lg:text-[110px]"
        >
          Wave<br />Home
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="font-plex-kr mx-auto mt-6 max-w-2xl text-center text-base font-normal text-white/78 drop-shadow sm:text-lg"
        >
          사용자의 수면과 행동 패턴을 이해하고, 맞춤형 스마트홈 제어가 가능한
          <br />
          홈 인텔리전스 솔루션과 함께 더 건강한 일상을 만들어보세요.
          <br />
          파도에 몸을 맡기듯, WaveHome이 당신의 일상을 자연스럽게 케어합니다.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="relative z-10 flex justify-center pb-10"
      >
        <ArrowDown className="h-16 w-16 animate-bounce text-white/60" />
      </motion.div>
    </section>
  );
}
