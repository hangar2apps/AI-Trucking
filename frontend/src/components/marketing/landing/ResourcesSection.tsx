"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MARKET_SURVEY_URL } from "@/lib/brand";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";

const updates = [
  {
    title: "Why we're building an AI dispatch assistant for trucking",
    tag: "Launch story",
    gradient: "from-[#1E3A5F] to-[#0B5FFF]",
  },
  {
    title: "What we learned from 20+ fleet operator conversations",
    tag: "Research",
    gradient: "from-[#374151] to-[#1F2937]",
  },
  {
    title: "How early pilots will work — and what we won't automate without you",
    tag: "Pilot program",
    gradient: "from-[#1E293B] to-[#334155]",
  },
];

export function ResourcesSection() {
  const openSurvey = useSurveyPopupStore((s) => s.open);

  return (
    <section className="bg-[#0F172A] py-16 text-white sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#93C5FD]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
          Building in public
        </span>
        <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Follow the launch — no polished analyst reports yet
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-white/60">
          Updates from a new company finding product-market fit with real fleet operators.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <button
            type="button"
            onClick={openSurvey}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] text-left transition-colors hover:border-[#0B5FFF]/40"
          >
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15,23,42,0.5), rgba(11,95,255,0.25)), url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop')",
              }}
            />
            <div className="p-6">
              <span className="text-xs font-medium text-[#93C5FD]">● Featured</span>
              <h3 className="mt-2 text-xl font-semibold">
                Help us validate the product — 4–5 minute survey
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Fleet operators only. Honest answers welcome — including &quot;I&apos;d never
                use this.&quot;
              </p>
            </div>
          </button>

          <div className="flex flex-col gap-4">
            {updates.map((item) => (
              <Link
                key={item.title}
                href={MARKET_SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 rounded-xl border border-white/10 bg-[#1E293B] p-4 transition-colors hover:border-[#0B5FFF]/40"
              >
                <div
                  className={`h-20 w-24 shrink-0 rounded-lg bg-gradient-to-br ${item.gradient}`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#93C5FD]">● {item.tag}</span>
                  <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#93C5FD] group-hover:underline">
                    Share your perspective
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
