"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import WaveCanvas from "@/components/WaveCanvas";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

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

    if (sectionRef.current && sceneRef.current && contentRef.current) {
      gsap
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
    }

    return () => split.revert();
  }, []);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background"
    >
      <div ref={sceneRef} className="absolute inset-0 origin-center will-change-transform">
        <WaveCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.22),transparent_36%),linear-gradient(to_bottom,rgba(3,36,54,0.02),rgba(3,36,54,0.08)_58%,rgba(5,7,10,0.58)_100%)]" />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-28 will-change-transform lg:px-10"
      >
      
        <h1
          ref={headlineRef}
          className="mx-auto max-w-5xl text-balance text-center text-5xl font-semibold tracking-tight text-white drop-shadow-[0_10px_45px_rgba(0,34,48,0.5)] sm:text-6xl lg:text-[76px] lg:leading-[1.05]"
        >
          WaveHome
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mx-auto mt-6 max-w-2xl text-center text-base text-white/78 drop-shadow sm:text-lg"
        >
          사용자의 수면과 행동 패턴을 이해하고, 맞춤형 스마트홈 제어가 가능한<br/>
          홈 인텔리전스 솔루션과 함께 더 건강한 일상을 만들어보세요.
        </motion.p>

        {/* <motion.nav
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2"
        >
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/86 backdrop-blur transition-colors hover:border-wave-light hover:text-white"
            >
              {c.label}
            </a>
          ))}
        </motion.nav> */}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="relative z-10 flex justify-center pb-10"
      >
        <ArrowDown className="h-5 w-5 animate-bounce text-mist" />
      </motion.div>
    </section>
  );
}
