import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

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
              background:
                `radial-gradient(circle at 30% 26%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 32%),` +
                `radial-gradient(circle at 50% 50%, rgba(${tint},0.28) 0%, rgba(${tint},0.06) 65%, rgba(${tint},0) 82%)`,
              animation: `wh-float-bubble ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function GetStartedSection({ onEnter }) {
  const sectionRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const parts = gsap.utils.toArray("[data-cta-reveal]", section);
      gsap.fromTo(
        parts,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="get-started"
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-background"
    >
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="hidden h-full lg:block">
          <FloatingBubbles />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center px-6 py-24 text-center lg:px-10">
        <span
          data-cta-reveal
          className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-wave-light"
        >  
        </span>

        <h2
          data-cta-reveal
          className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[42px] lg:leading-[1.1]"
        >
          WaveHome과 함께
          <br />
          스마트한 하루를 시작해 보세요
        </h2>

        <p
          data-cta-reveal
          className="mt-4 max-w-lg text-[15px] leading-relaxed text-white"
        >
          수면·습관·스마트홈이 하나로 이어진 대시보드에서<br />
          당신만의 라이프스타일 케어를 바로 경험할 수 있어요.
        </p>

        <div data-cta-reveal className="mt-10">
          <button
            type="button"
            onClick={() => onEnter("main")}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-background transition-opacity hover:opacity-90 sm:px-10 sm:py-5 sm:text-[16px]"
          >
            시작하기
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
