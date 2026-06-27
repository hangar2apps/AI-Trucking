"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePricingPopupStore } from "@/stores/pricing-popup-store";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";

const plans = [
  {
    name: "Pilot",
    price: "Free",
    period: "during early access",
    description: "For the first fleets helping us validate the product.",
    features: [
      "Up to 5 trucks",
      "Live fleet map & loads dashboard",
      "AI email draft & send",
      "Direct founder support",
    ],
    cta: "Apply for pilot",
    highlighted: true,
  },
  {
    name: "Starter",
    price: "$10–25",
    period: "per truck / month",
    description: "Small fleets ready to automate dispatch communication.",
    features: [
      "Everything in Pilot",
      "Proactive delay alerts",
      "Route & weather intelligence",
      "Email confirmation on every survey lead",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$25–50",
    period: "per truck / month",
    description: "Growing operations that need AI across more lanes.",
    features: [
      "Everything in Starter",
      "Automatic load reassignment suggestions",
      "Operations event feed",
      "Priority support",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
];

export function PricingModal() {
  const isOpen = usePricingPopupStore((s) => s.isOpen);
  const close = usePricingPopupStore((s) => s.close);
  const openSurvey = useSurveyPopupStore((s) => s.open);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const handlePlanCta = () => {
    close();
    openSurvey();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close pricing"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-[#0B5FFF]">Pricing</p>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="pricing-modal-title" className="text-2xl font-bold text-[#1A2B4A] sm:text-3xl">
              Simple pricing for a new platform
            </h2>
            <p className="mt-3 text-sm text-[#6B7280] sm:text-base">
              We&apos;re in early access — pilot fleets join free. Paid tiers reflect what
              operators told us they&apos;d expect to pay per truck once we prove value.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-[#0B5FFF] bg-[#F0F7FF] shadow-md"
                    : "border-[#E5E7EB] bg-white"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#0B5FFF] px-3 py-0.5 text-xs font-semibold text-white">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#1A2B4A]">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-[#1A2B4A]">{plan.price}</span>
                  <span className="ml-1 text-sm text-[#6B7280]">{plan.period}</span>
                </p>
                <p className="mt-3 text-sm text-[#6B7280]">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#4B5563]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0B5FFF]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "primary" : "secondary"}
                  className="mt-6 w-full"
                  onClick={handlePlanCta}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-[#9CA3AF]">
            Enterprise / 100+ trucks — custom pricing. No long-term contracts during pilot.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/demo" className="text-[#0B5FFF] hover:underline" onClick={close}>
              See the demo first
            </Link>
            <Link href="/login" className="text-[#0B5FFF] hover:underline" onClick={close}>
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
