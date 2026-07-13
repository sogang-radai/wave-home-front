import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./landing.css";
import Nav from "./Nav";
import Hero from "./Hero";
import ValuePropSection from "./sections/ValuePropSection";
import WaveAISection from "./sections/WaveAISection";
import SleepSection from "./sections/SleepSection";
import SmartHomeSection from "./sections/SmartHomeSection";
import LifestyleSection from "./sections/LifestyleSection";
import DashboardSection from "./sections/DashboardSection";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onEnter }) {
  useEffect(() => {
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Web fonts (Geist, IBM Plex Sans KR, TAN New York) can finish loading
    // and swap in after ScrollTrigger has already measured pin/scrub
    // distances off the fallback-font layout, leaving every trigger below
    // the swapped text stale. Recalculating once fonts settle keeps them
    // in sync with the fonts' final metrics.
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    const raf = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  return (
    <div className="landing-page relative flex min-h-screen flex-col bg-background text-ink">
      <Nav onStart={onEnter} />
      <main className="flex-1">
        <Hero />
        <ValuePropSection />
        <WaveAISection onEnter={onEnter} />
        <SleepSection onEnter={onEnter} />
        <SmartHomeSection onEnter={onEnter} />
        <LifestyleSection onEnter={onEnter} />
        <DashboardSection onEnter={onEnter} />
      </main>
    </div>
  );
}
