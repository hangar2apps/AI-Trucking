"use client";

import { ArrowRight } from "lucide-react";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";

const stats = [
  {
    value: "8X",
    label: " target",
    description:
      "Projected ROI for fleets that cut manual dispatch work and late-delivery penalties.",
  },
  {
    value: "4–5",
    label: " min",
    description:
      "To share how you run dispatch today — helps us build what fleets actually need.",
  },
  {
    value: "3",
    label: " pillars",
    description:
      "Safety, efficiency, and reliability — the core of everything we ship at launch.",
  },
  {
    value: "24/7",
    label: "",
    description:
      "AI monitoring every load in the background — so your team isn't glued to the phone.",
  },
];

const launchGoals = [
  {
    title: "Early pilot",
    stat: "Open",
    label: "Join the first fleets testing A-TMS before general release",
  },
  {
    title: "Your feedback",
    stat: "Direct",
    label: "Shape the roadmap — we talk to operators, not just executives",
  },
  {
    title: "No lock-in",
    stat: "Simple",
    label: "Start with one lane or a handful of trucks — scale when it works",
  },
];

export function ProvenResultsSection() {
  const openSurvey = useSurveyPopupStore((s) => s.open);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4FC] px-3 py-1 text-xs font-medium text-[#0B5FFF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
            Launch focus
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            What we&apos;re building — and why it matters
          </h2>
          <p className="mt-3 text-sm text-[#6B7280]">
            We&apos;re new. These are the outcomes we&apos;re designing for with early
            fleets — not decade-old case studies.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.value + stat.label} className="text-center lg:text-left">
              <p className="text-4xl font-bold text-[#111827] sm:text-5xl">
                {stat.value}
                {stat.label && (
                  <span className="ml-1 text-2xl font-semibold">{stat.label}</span>
                )}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={openSurvey}
            className="inline-flex items-center gap-2 rounded-full bg-[#0B5FFF] px-6 py-3 text-sm font-medium text-white hover:bg-[#0847CC]"
          >
            Join early access
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {launchGoals.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6"
            >
              <p className="text-sm font-bold tracking-wide text-[#0B5FFF] uppercase">
                {item.title}
              </p>
              <p className="mt-3 text-3xl font-bold text-[#111827]">{item.stat}</p>
              <p className="mt-1 text-sm text-[#6B7280]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
