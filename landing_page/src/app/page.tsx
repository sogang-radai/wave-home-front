import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ValuePropSection from "@/components/sections/ValuePropSection";
import WaveAISection from "@/components/sections/WaveAISection";
import SleepSection from "@/components/sections/SleepSection";
import SmartHomeSection from "@/components/sections/SmartHomeSection";
import LifestyleSection from "@/components/sections/LifestyleSection";
import DashboardSection from "@/components/sections/DashboardSection";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <ValuePropSection />
        <WaveAISection />
        <SleepSection />
        <SmartHomeSection />
        <LifestyleSection />
        <DashboardSection />
      </main>
    </>
  );
}
