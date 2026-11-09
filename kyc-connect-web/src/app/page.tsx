import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Roles } from "@/components/sections/Roles";
import { Trust } from "@/components/sections/Trust";
import { Services } from "@/components/sections/Services";
import { MissionSteps } from "@/components/sections/MissionSteps";
import { PilotPartners } from "@/components/sections/PilotPartners";
import { Community, FinalCta } from "@/components/sections/Community";
import { VehicleBand } from "@/components/sections/VehicleBand";
import { RiderBand } from "@/components/sections/RiderBand";
import { LanesBand } from "@/components/sections/LanesBand";
import { Faq } from "@/components/sections/Faq";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Features />
        <Services />
        <HowItWorks />
        <VehicleBand />
        <RiderBand />
        <Community />
        <PilotPartners />
        <MissionSteps />
        <Roles />
        <LanesBand />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
