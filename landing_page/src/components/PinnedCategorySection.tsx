"use client";

import { ReactNode, useRef } from "react";
import { motion, Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export type CategoryCard = {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  media: ReactNode;
};

const BUBBLES = Array.from({ length: 15 }, (_, i) => {
  const seed = i * 12.9898;
  const x = Math.round((((Math.sin(seed) + 1) / 2) * 100) * 100) / 100;
  const y = Math.round((((Math.sin(seed * 1.7 + 3.1) + 1) / 2) * 100) * 100) / 100;
  const size = 12 + ((i * 7) % 18);
  const isSky = i % 2 === 0;
  const duration = 9 + ((i * 5) % 10);
  const delay = Math.round(-((i * 3.3) % duration) * 100) / 100;
  return { x, y, size, isSky, duration, delay };
});

function FloatingBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BUBBLES.map((b, i) => {
        const tint = b.isSky ? "149,217,248" : "255,255,255";
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              border: `1px solid rgba(${tint},0.35)`,
              boxShadow: `inset 0 0 ${Math.max(4, b.size * 0.3)}px rgba(${tint},0.2)`,
              background: `radial-gradient(circle at 30% 26%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at 50% 50%, rgba(${tint},0.28) 0%, rgba(${tint},0.06) 65%, rgba(${tint},0) 82%)`,
              animation: `float-bubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function PinnedCategorySection({
  id,
  index,
  eyebrow,
  title,
  description,
  cards,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  cards: CategoryCard[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const section = sectionRef.current;
      const copy = copyRef.current;
      const stage = stageRef.current;
      if (!track || !section || !copy || !stage) return;

      const lines = gsap.utils.toArray<HTMLElement>("[data-reveal]", section);
      const eyebrowEl = section.querySelector<HTMLElement>("[data-eyebrow]");
      const descEl = section.querySelector<HTMLElement>("[data-desc]");

      // Whole copy block reveal (eyebrow -> title lines -> description) —
      // same on every breakpoint, independent of the desktop-only pin/scrub
      // below so it never depends on that timeline.
      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
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

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const distance = Math.max(
          track.scrollWidth - track.parentElement!.clientWidth,
          0
        );
        if (distance <= 0) return;

        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", section);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance + window.innerHeight * 0.9}`,
            scrub: 0.75,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        gsap.set(cards, {
          opacity: 0.42,
          scale: 0.86,
          rotateY: -8,
          transformPerspective: 1200,
          transformOrigin: "50% 50%",
        });
        gsap.set(cards[0], { opacity: 1, scale: 1, rotateY: 0 });

        tl.to(copy, { yPercent: -8, ease: "none" }, 0)
          .to(track, { x: -distance, ease: "none", duration: 1 }, 0.12)
          .to(
            cards,
            {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              stagger: 0.12,
              ease: "power2.out",
              duration: 0.32,
            },
            0.14
          )
          .to(
            cards,
            {
              opacity: (i) => (i === cards.length - 1 ? 1 : 0.58),
              scale: (i) => (i === cards.length - 1 ? 1.03 : 0.92),
              rotateY: 6,
              stagger: 0.12,
              ease: "power2.inOut",
              duration: 0.32,
            },
            0.58
          );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      mm.add("(max-width: 1023px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", section);
        gsap.from(cards, {
          y: 34,
          opacity: 0,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 72%",
          },
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-background lg:h-screen"
    >
      <div className="absolute inset-0 -z-10 bg-background">
        <FloatingBubbles />
      </div>

      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:py-0">
        <div ref={copyRef} className="min-w-0 shrink-0 lg:w-[30%] lg:will-change-transform">
          <span
            data-eyebrow
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-wave-light"
          >
            <span className="text-mist">
              {String(index).padStart(2, "0")}
            </span>
            {eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.1]">
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
          <p data-desc className="mt-4 max-w-sm text-[15px] leading-relaxed text-white">
            {description}
          </p>
        </div>

        {/* overflow-hidden clips the scrubbed/scaled cards at this box's own
            edge, so they can never paint over the copy column to the left. */}
        <div ref={stageRef} className="min-w-0 flex-1 overflow-x-auto lg:overflow-hidden lg:will-change-transform">
          <div
            ref={trackRef}
            className="flex w-max gap-5 pb-4 lg:pb-0 lg:will-change-transform"
          >
            {cards.map((card) => (
              <Card key={card.title} card={card} />
            ))}
            <div className="w-1 shrink-0 lg:w-24" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

const cardContentVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const bulletVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

function Card({ card }: { card: CategoryCard }) {
  return (
    <motion.div
      data-card
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex w-[82vw] shrink-0 flex-col overflow-hidden rounded-[8px] border border-white/12 bg-surface shadow-2xl shadow-black/35 sm:w-[380px]"
    >
      <motion.div
        variants={cardContentVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4, margin: "0px -60px 0px 0px" }}
      >
        <motion.div variants={itemVariants} className="relative bg-white p-4">
          {card.media}
        </motion.div>

        <div className="flex flex-1 flex-col p-5">
          <motion.span variants={itemVariants} className="text-[12px] font-semibold text-wave-light">
            {card.eyebrow}
          </motion.span>
          <motion.h3 variants={itemVariants} className="mt-1.5 text-[19px] font-semibold leading-snug text-ink">
            {card.title}
          </motion.h3>
          <motion.p variants={itemVariants} className="mt-2 text-[13.5px] leading-relaxed text-mist">
            {card.description}
          </motion.p>

          {card.bullets && (
            <motion.ul variants={bulletVariants} className="mt-3 flex flex-col gap-1.5">
              {card.bullets.map((b) => (
                <motion.li
                  key={b}
                  variants={itemVariants}
                  className="flex items-start gap-2 text-[12.5px] text-ink/80"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wave" />
                  {b}
                </motion.li>
              ))}
            </motion.ul>
          )}

          <motion.a
            variants={itemVariants}
            href="#signup"
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-wave-light hover:underline"
          >
            자세히 보기
            <ArrowUpRight className="h-3.5 w-3.5" />
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}
