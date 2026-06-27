"use client";

import { AnnouncementBar } from "./AnnouncementBar";
import { CtaSection } from "./CtaSection";
import { HeroSection } from "./HeroSection";
import { IndustryLeaderSection } from "./IndustryLeaderSection";
import { LandingFooter } from "./LandingFooter";
import { LandingNavbar } from "./LandingNavbar";
import { LogoBarSection } from "./LogoBarSection";
import { ProvenResultsSection } from "./ProvenResultsSection";
import { ResourcesSection } from "./ResourcesSection";
import { WhySection } from "./WhySection";
import { PricingModal } from "./PricingModal";
import { SurveyPopupHost } from "@/components/survey/SurveyPopupHost";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <LandingNavbar />
      <SurveyPopupHost />
      <PricingModal />
      <main>
        <HeroSection />
        <LogoBarSection />
        <WhySection />
        <ProvenResultsSection />
        <IndustryLeaderSection />
        <ResourcesSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
