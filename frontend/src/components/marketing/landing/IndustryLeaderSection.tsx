"use client";

import Link from "next/link";
import { ArrowRight, Rocket, Shield, Users } from "lucide-react";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";

const roadmap = [
  {
    phase: "Now",
    title: "Market validation",
    description: "Talking to fleet owners and dispatchers. Your survey answers directly shape v1.",
    icon: Users,
  },
  {
    phase: "Next",
    title: "Pilot fleets",
    description: "Small groups run live loads on A-TMS — AI emails, maps, and load tools.",
    icon: Rocket,
  },
  {
    phase: "Soon",
    title: "General availability",
    description: "Broader rollout with the reliability and guardrails early pilots helped us harden.",
    icon: Shield,
  },
];

export function IndustryLeaderSection() {
  const openSurvey = useSurveyPopupStore((s) => s.open);

  return (
    <section className="bg-[#0F172A] py-16 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-[#93C5FD]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
              New launch
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              We&apos;re not an industry giant — we&apos;re building one fleet at a time
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              No G2 badges, no Fortune 500 logos yet. Aurora Freight is a new company with
              a clear bet: AI should catch late loads and talk to customers before your
              dispatch team has to. Reliable architecture, honest stage, founder-led support.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSurvey}
                className="inline-flex items-center gap-2 rounded-full bg-[#0B5FFF] px-5 py-2.5 text-sm font-medium hover:bg-[#0847CC]"
              >
                Take the 4-min survey
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                Try the demo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Early access", "Pilot program", "Founder support", "No partners yet"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1E293B] p-6">
            <p className="mb-6 text-sm font-semibold text-white/90">Where we are today</p>
            <ul className="space-y-5">
              {roadmap.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.phase} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B5FFF]/20">
                        <Icon className="h-5 w-5 text-[#93C5FD]" />
                      </div>
                      {i < roadmap.length - 1 && (
                        <div className="mt-2 h-full w-px flex-1 bg-white/10" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-bold tracking-wide text-[#93C5FD] uppercase">
                        {step.phase}
                      </p>
                      <p className="mt-1 font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-white/60">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            "We're validating whether proactive delay emails and auto-reroutes would genuinely help — or solve the wrong problem.",
            "Reliability for us means transparent AI, optional human approval, and direct access to the team building the product.",
            "If you run a fleet and hate chasing customers about late loads, we want to hear from you — especially if you'd never use AI dispatch.",
          ].map((quote) => (
            <blockquote
              key={quote.slice(0, 48)}
              className="rounded-xl border border-white/10 bg-[#1E293B] p-5 text-sm leading-relaxed text-white/80"
            >
              {quote}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
