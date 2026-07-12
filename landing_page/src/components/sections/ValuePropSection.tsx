"use client";

import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const LINE1 = "Introducing WaveHome";
const LINE2 = "Your Personalized Lifestyle AI Agent";
const LINE3 = "Private. Effortless. Sustainable.";

const BUBBLE_COLS = 10;
const BUBBLE_ROWS = 6;

const BUBBLES = (() => {
  const items: { x: number; y: number; size: number; isSky: boolean }[] = [];
  for (let row = 0; row < BUBBLE_ROWS; row++) {
    for (let col = 0; col < BUBBLE_COLS; col++) {
      const seed = (row * BUBBLE_COLS + col) * 7.31;
      const jitterX = Math.sin(seed) * (100 / BUBBLE_COLS) * 0.3;
      const jitterY = Math.cos(seed * 1.7) * (100 / BUBBLE_ROWS) * 0.3;
      const x = Math.round((((col + 0.5) / BUBBLE_COLS) * 100 + jitterX) * 100) / 100;
      const y = Math.round((((row + 0.5) / BUBBLE_ROWS) * 100 + jitterY) * 100) / 100;
      const size = 18 + ((row * BUBBLE_COLS + col) % 5) * 2;
      items.push({ x, y, size, isSky: (row + col) % 2 === 0 });
    }
  }
  return items;
})();

export default function ValuePropSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bubbleLayerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLHeadingElement>(null);
  const line3Ref = useRef<HTMLParagraphElement>(null);

  const bubbles = useMemo(() => BUBBLES, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;
      const bubbleLayer = bubbleLayerRef.current;
      if (!section || !panel || !bubbleLayer) return;

      const bubbleEls = gsap.utils.toArray<HTMLElement>("[data-bubble]", bubbleLayer);

      gsap.set(line1Ref.current, { opacity: 0, y: 12 });
      gsap.set(line2Ref.current, { opacity: 0, xPercent: -6 });
      gsap.set(line3Ref.current, { opacity: 0, y: 12 });
      gsap.set(bubbleEls, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=220%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Text reveals over the first ~half of the pinned scroll.
      tl.to(line1Ref.current, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, 0)
        .to(line2Ref.current, { opacity: 1, xPercent: 0, duration: 0.2, ease: "power2.out" }, 0.1)
        .to(line3Ref.current, { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }, 0.28)
        // The screen dissolves into bubbles: the panel fades/blurs away
        // while a field of bubbles grows in to cover it...
        .to(panel, { opacity: 0, filter: "blur(6px)", duration: 0.32, ease: "power1.in" }, 0.5)
        .to(
          bubbleEls,
          {
            scale: 1,
            opacity: 0.95,
            duration: 0.4,
            ease: "power2.out",
            stagger: { each: 0.006, from: "random" },
          },
          0.5
        )
        // ...then the bubbles themselves clear away. This is positioned
        // with ">" (right after the previous tween, stagger tail and all)
        // instead of a fixed number, so it's automatically the timeline's
        // last tween and lines up exactly with the pin releasing — no gap
        // before the next section is revealed underneath.
        .to(bubbleEls, {
          scale: 0,
          opacity: 0,
          duration: 0.4,
          ease: "power1.in",
          stagger: { each: 0.005, from: "random" },
        });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="intro"
      className="relative h-screen overflow-hidden bg-background"
    >
      <div ref={panelRef} className="absolute inset-0 z-10 flex items-center">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(255,255,255,0.14), transparent 68%), radial-gradient(ellipse 60% 50% at 75% 25%, rgba(130,170,255,0.32), transparent 62%), radial-gradient(ellipse 55% 60% at 20% 78%, rgba(255,150,90,0.22), transparent 65%), radial-gradient(ellipse 70% 70% at 50% 105%, rgba(190,120,255,0.16), transparent 70%), linear-gradient(160deg, #16141c 0%, #221f2b 55%, #16141c 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-10">
          <div
            ref={line1Ref}
            className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80 sm:text-base"
          >
            {LINE1}
          </div>
          <h2
            ref={line2Ref}
            className="mt-4 text-[48px] font-semibold leading-[1.02] tracking-tight text-white sm:text-[84px] lg:text-[126px]"
          >
            {LINE2}
          </h2>
          <p
            ref={line3Ref}
            className="mt-6 max-w-xl text-lg text-white/75 sm:text-xl"
          >
            {LINE3}
          </p>
        </div>
      </div>

      <div
        ref={bubbleLayerRef}
        className="pointer-events-none absolute inset-0 z-20"
        aria-hidden
      >
        {bubbles.map((b, i) => (
          <span
            key={i}
            data-bubble
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}vmin`,
              height: `${b.size}vmin`,
              border: "1px solid rgba(255,255,255,0.28)",
              background: b.isSky
                ? "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 26%), radial-gradient(circle at 50% 50%, rgba(149,217,248,0.55) 0%, rgba(149,217,248,0.2) 60%, rgba(149,217,248,0.05) 85%)"
                : "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 26%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 60%, rgba(255,255,255,0.04) 85%)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
