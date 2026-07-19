import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import background from "../background.png";

gsap.registerPlugin(ScrollTrigger);

const LINE1 = "WaveHome을 소개합니다";
const LINE2 = "Your Lifestyle AI Agent";
const LINE3 = "Convenient. Intuitive. Personalized. Private.";

export default function ValuePropSection() {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const overlayRef = useRef(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;
      const line1 = line1Ref.current;
      const line2 = line2Ref.current;
      const line3 = line3Ref.current;
      const overlay = overlayRef.current;
      if (!section || !panel || !line1 || !line2 || !line3 || !overlay) return;

      gsap.set(line1, { opacity: 0, y: 12 });
      gsap.set(line2, { opacity: 0, xPercent: -6 });
      gsap.set(line3, { opacity: 0, y: 12 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=125%",
          scrub: 0.35,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // This section keeps its own z-10 stacking even after the pin
          // releases, so once it unpins it would otherwise stay on top of
          // the next section (z-index: auto) while it scrolls itself off —
          // a full viewport's worth of extra scroll — slowly uncovering
          // that section's background from the bottom up instead of
          // revealing it instantly. Hiding this section the moment it's
          // left/re-entered makes the swap the instant cut it's meant to be.
          onLeave: () => gsap.set(section, { autoAlpha: 0 }),
          onEnterBack: () => gsap.set(section, { autoAlpha: 1 }),
        },
      });

      // Reveal text early, hold it readable for most of the pin, then
      // crossfade the panel straight into the overlay (same start time and
      // duration for both) so there's never a gap where the panel has faded
      // but the overlay hasn't caught up yet — that gap used to be filled by
      // the particle shatter; without it, it read as a blank black frame.
      tl.to(line1, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0)
        .to(line2, { opacity: 1, xPercent: 0, duration: 0.14, ease: "power2.out" }, 0.06)
        .to(line3, { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" }, 0.16)
        .to(panel, { opacity: 0, duration: 0.22, ease: "power1.in" }, 0.72)
        .to(overlay, { opacity: 1, duration: 0.22, ease: "power1.in" }, 0.72);

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
      className="relative z-10 h-screen overflow-hidden bg-background"
    >
      <div ref={panelRef} className="absolute inset-0 z-10 flex items-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Scrim: pulls contrast back toward the copy (left/center) while
            leaving the artwork bright toward the right edge, and settles
            the top/bottom into the section's own background color. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(3,10,18,0.75) 0%, rgba(3,10,18,0.55) 38%, rgba(3,10,18,0.18) 62%, rgba(3,10,18,0) 82%)," +
              "linear-gradient(to bottom, rgba(2,6,12,0.4) 0%, rgba(2,6,12,0) 24%, rgba(2,6,12,0) 76%, rgba(2,6,12,0.5) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10">
          <div
            ref={line1Ref}
            className="font-plex-kr text-base font-normal text-white/78 drop-shadow sm:text-lg"
          >
            {LINE1}
          </div>
          <h2
            ref={line2Ref}
            className="
font-sf-pro
font-black
text-[36px]
sm:text-[56px]
lg:text-[80px]
leading-[0.98]
tracking-[-0.03em]
origin-left
scale-x-[0.96]
text-white
"
          >
            {LINE2}
          </h2>
          <p
            ref={line3Ref}
            className="font-geist tracking-[0.08em] mt-6 max-w-xl text-xl text-white/85 sm:text-2xl"
          >
            {LINE3}
          </p>
        </div>
      </div>

      {/* Solid cover that fades in as the panel fades out and holds while the
          next section secretly settles into place behind it — this whole
          section scrolls away with it the instant the pin releases, so the
          swap reads as instantaneous, not a slide-up. */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-30 bg-[#f7f8fb] opacity-0"
        aria-hidden
      />
    </section>
  );
}
