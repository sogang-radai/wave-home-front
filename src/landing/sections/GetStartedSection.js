import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

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
          수면·습관·스마트홈이 하나로 통합된<br />
          당신만의 라이프스타일 케어를 바로 경험할 수 있습니다.
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
