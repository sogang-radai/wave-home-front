import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Apple Health-style accent: each section's own background is a vertical
// white-to-accent gradient (white up top, deepening toward the bottom),
// while cards themselves stay plain white boxes around the media with the
// caption text sitting directly on that gradient below the photo.
const DEFAULT_ACCENT = { text: "#3d5590", from: "#f2f4fb", to: "#dbe2f4" };

export default function PinnedCategorySection({
  id,
  index,
  eyebrow,
  title,
  description,
  cards,
  onEnter,
  overlapPrevious = false,
  accent = DEFAULT_ACCENT,
}) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const copyRef = useRef(null);
  const stageRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      setCanScrollPrev(stage.scrollLeft > 4);
      setCanScrollNext(stage.scrollLeft + stage.clientWidth < stage.scrollWidth - 4);
    };
    update();
    stage.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      stage.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cards]);

  const scrollByCard = (direction) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollBy({ left: direction * stage.clientWidth * 0.85, behavior: "smooth" });
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const lines = gsap.utils.toArray("[data-reveal]", section);
      const eyebrowEl = section.querySelector("[data-eyebrow]");
      const descEl = section.querySelector("[data-desc]");

      // Whole copy block reveal (eyebrow -> title lines -> description).
      // Fires as soon as the section's top just touches the bottom of the
      // viewport (as early as a trigger can go) rather than waiting until
      // it's mostly scrolled into place.
      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
        },
      });
      if (eyebrowEl) {
        revealTl.from(eyebrowEl, { opacity: 0, y: 16, duration: 0.5, ease: "power3.out" }, 0);
      }
      revealTl.from(
        lines,
        { yPercent: 105, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" },
        0.08
      );
      if (descEl) {
        revealTl.from(descEl, { opacity: 0, y: 16, duration: 0.5, ease: "power3.out" }, 0.34);
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative isolate overflow-hidden lg:h-screen${
        overlapPrevious ? " lg:-mt-[100vh]" : ""
      }`}
      style={{
        background: `linear-gradient(180deg, #ffffff 0%, ${accent.from} 58%, ${accent.to} 100%)`,
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col justify-center gap-6 px-6 py-16 lg:px-10 lg:py-0">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div ref={copyRef} className="min-w-0 shrink-0 lg:w-[30%]">
            <span
              data-eyebrow
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide"
              style={{ color: accent.text }}
            >
              <span className="text-slate-400">
                {String(index).padStart(2, "0")}
              </span>
              {eyebrow}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.1]">
              {title.split(" ").map((word, wordIndex) => (
                <span
                  key={`${title}-${word}-${wordIndex}`}
                  className="inline-block overflow-hidden pr-2"
                >
                  <span data-reveal className="inline-block">
                    {word}
                  </span>
                </span>
              ))}
            </h2>
            <p data-desc className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-600">
              {description}
            </p>
          </div>

          {/* Native horizontal scroll on every breakpoint — a trackpad swipe
              or a finger drag both just scroll this row directly, snapping
              card-by-card, instead of the old scroll-jack that hijacked
              vertical page scroll to slide it. */}
          <div
            ref={stageRef}
            className="wh-hide-scrollbar min-w-0 flex-1 overflow-x-auto"
          >
            <div
              ref={trackRef}
              className="flex w-max snap-x snap-mandatory gap-5 pb-4 lg:pb-0"
            >
              {cards.map((card) => (
                <Card key={card.title} card={card} onEnter={onEnter} accent={accent} />
              ))}
              <div className="w-1 shrink-0 lg:w-24" aria-hidden />
            </div>
          </div>
        </div>

        {/* Prev/next toggle for the card row — mirrors the horizontal swipe
            gesture for anyone who'd rather click than drag/scroll. */}
        <div className="flex justify-center gap-3 lg:justify-end">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollPrev}
            aria-label="이전 카드"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/8 text-slate-500 transition hover:bg-slate-900/14 disabled:opacity-30 disabled:hover:bg-slate-900/8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollNext}
            aria-label="다음 카드"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/8 text-slate-500 transition hover:bg-slate-900/14 disabled:opacity-30 disabled:hover:bg-slate-900/8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Card({ card, onEnter, accent = DEFAULT_ACCENT }) {
  // A "bleed" card is a self-contained visual (its own background + copy
  // baked into the artwork) meant to close out a row — no white photo box,
  // no separate caption underneath.
  if (card.bleed) {
    return (
      <motion.div
        data-card
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`flex shrink-0 snap-start self-start ${
          card.wide ? "w-[92vw] sm:w-[760px]" : "w-[82vw] sm:w-[380px]"
        }`}
      >
        <div className="relative w-4/5 overflow-hidden rounded-[20px] shadow-xl shadow-black/10">
          {card.media}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-card
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex w-[82vw] shrink-0 snap-start flex-col sm:w-[380px]"
    >
      {/* Photo-only white card, Apple Health style — the caption lives below
          it, directly on the section's own gradient, not inside a colored
          box. */}
      <div className="relative overflow-hidden rounded-[20px] bg-white p-4 shadow-xl shadow-black/10">
        {card.media}
      </div>

      <div data-card-copy className="flex flex-1 flex-col px-1 pt-5">
        <span className="text-[12px] font-semibold" style={{ color: accent.text }}>
          {card.eyebrow}
        </span>
        <h3 className="mt-1.5 text-[19px] font-semibold leading-snug text-slate-900">
          {card.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{card.description}</p>

        {card.bullets && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {card.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: accent.text }}
                />
                {b}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onEnter(card.target)}
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
          style={{ color: accent.text }}
        >
          자세히 보기
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
