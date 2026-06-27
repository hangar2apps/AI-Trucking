"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MARKET_SURVEY_URL } from "@/lib/brand";

const pillars = [
  {
    title: "Safety",
    description: "AI that flags risks before they become incidents — built into every load",
    bullets: [
      "Proactive delay detection",
      "Weather-hazard alerts on routes",
      "Driver coaching signals",
      "Audit-ready event logging",
    ],
    href: "/demo",
  },
  {
    title: "Efficiency",
    description: "Less dispatcher busywork, more time moving freight",
    bullets: [
      "Route & ETA optimization",
      "Automated customer updates",
      "Load reassignment suggestions",
      "One view of fleet status",
    ],
    href: "/login",
  },
  {
    title: "Reliability",
    description: "Dependable from day one — we’re new, not untested",
    bullets: [
      "Transparent AI actions",
      "Human approval when you want it",
      "Secure cloud platform",
      "Direct founder support during pilot",
    ],
    href: "/signup",
  },
];

export function WhySection() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4FC] px-3 py-1 text-xs font-medium text-[#0B5FFF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
            About Aurora Freight
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            A new platform for fleets that can&apos;t afford to miss a delivery
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6B7280] sm:text-lg">
            We&apos;re launching A-TMS — an AI assistant that watches every load, catches
            delays before your customer does, and handles the emails and reroutes that
            eat up your dispatch team. Honest stage: early product, real problem, looking
            for pilot partners.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex flex-col rounded-2xl bg-[#1E2A3B] p-8 text-white"
            >
              <h3 className="text-xl font-bold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {pillar.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {pillar.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B5FFF]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={pillar.href}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#0B5FFF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0847CC]"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={MARKET_SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0B5FFF] hover:underline"
          >
            Tell us about your fleet — market survey
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
