import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

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
              animation: `wh-float-bubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
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
  onEnter,
  overlapPrevious = false,
}) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const copyRef = useRef(null);
  const stageRef = useRef(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const section = sectionRef.current;
      const copy = copyRef.current;
      const stage = stageRef.current;
      if (!track || !section || !copy || !stage) return;

      const lines = gsap.utils.toArray("[data-reveal]", section);
      const eyebrowEl = section.querySelector("[data-eyebrow]");
      const descEl = section.querySelector("[data-desc]");

      // Whole copy block reveal (eyebrow -> title lines -> description) —
      // same on every breakpoint, independent of the desktop-only pin/scrub
      // below so it never depends on that timeline. Fires as soon as the
      // section's top just touches the bottom of the viewport (as early as
      // a trigger can go) rather than waiting until it's mostly scrolled
      // into place — otherwise the section's whole natural entrance (the
      // ~1 viewport height of ordinary scrolling before its own pin can
      // engage) plays out with nothing on screen yet, which reads as a
      // dead/blank stretch to scroll through.
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

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const distance = Math.max(
          track.scrollWidth - track.parentElement.clientWidth,
          0
        );
        if (distance <= 0) return;

        const cardCount = cards.length;
        // 2-card tracks have a short horizontal distance, so the default pin
        // length feels like a hard snap. Hold longer and pad the scrub range.
        const introHold = cardCount <= 2 ? 0.48 : 0.32;
        const vhPad = cardCount <= 2 ? 2.85 : cardCount === 3 ? 1.85 : 1.25;
        const scrub = cardCount <= 2 ? 1.05 : 0.75;
        const slideStart = introHold;
        const slideEnd = 1;

        const cardCopies = gsap.utils.toArray("[data-card-copy]", section);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance + window.innerHeight * vhPad}`,
            scrub,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Cards sit fully visible from the start — nothing to "wait" for.
        // Scrolling only slides the track and gives each card's text a
        // quick, playful bob as it passes through, instead of the old
        // fade/scale-in reveal that read as slow rendering to some users.
        tl.to(copy, { yPercent: -8, ease: "none", duration: 1 }, 0)
          .to(track, { x: 0, ease: "none", duration: introHold }, 0)
          .to(track, { x: -distance, ease: "none", duration: slideEnd - slideStart }, slideStart)
          .to(
            cardCopies,
            {
              y: -8,
              rotate: -0.6,
              stagger: cardCount <= 2 ? 0.2 : 0.12,
              ease: "power1.inOut",
              duration: cardCount <= 2 ? 0.4 : 0.3,
              yoyo: true,
              repeat: 1,
            },
            slideStart + 0.04
          );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative isolate overflow-hidden bg-background lg:h-screen${
        overlapPrevious ? " lg:-mt-[100vh]" : ""
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-background">
        {/* CSS bubble loops are expensive on mobile; keep them desktop-only. */}
        <div className="hidden h-full lg:block">
          <FloatingBubbles />
        </div>
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
              <Card key={card.title} card={card} onEnter={onEnter} />
            ))}
            <div className="w-1 shrink-0 lg:w-24" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ card, onEnter }) {
  return (
    <motion.div
      data-card
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex w-[82vw] shrink-0 flex-col overflow-hidden rounded-[8px] border border-white/12 bg-surface shadow-2xl shadow-black/35 sm:w-[380px]"
    >
      <div className="relative bg-white p-4">{card.media}</div>

      <div data-card-copy className="flex flex-1 flex-col p-5">
        <span className="text-[12px] font-semibold text-wave-light">{card.eyebrow}</span>
        <h3 className="mt-1.5 text-[19px] font-semibold leading-snug text-ink">{card.title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mist">{card.description}</p>

        {card.bullets && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {card.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[12.5px] text-ink/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wave" />
                {b}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onEnter(card.target)}
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-wave-light hover:underline"
        >
          자세히 보기
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
