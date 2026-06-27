"use client";

import { Check } from "lucide-react";
import { FeaturePicker } from "@/components/survey/FeaturePicker";
import type { StepConfig } from "@/lib/survey-steps";
import { useSurveyStore } from "@/stores/survey-store";
import { cn, isValidEmail } from "@/lib/utils";

interface StepRendererProps {
  config: StepConfig;
}

export function StepRenderer({ config }: StepRendererProps) {
  const { answers, setAnswer, toggleFeature } = useSurveyStore();
  const value = answers[config.field];

  switch (config.type) {
    case "select":
      return (
        <div className="space-y-3">
          {config.options?.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAnswer(config.field, opt.value as never)}
              className={cn(
                "block w-full rounded-xl border-2 px-5 py-4 text-left text-[#1A2B4A] transition-all",
                value === opt.value
                  ? "border-[#0B5FFF] bg-[#0B5FFF]/5"
                  : "border-[#E5E7EB] hover:border-[#0B5FFF]/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "multi-card":
      return (
        <FeaturePicker
          options={config.options ?? []}
          selected={answers.features}
          onToggle={toggleFeature}
        />
      );

    case "textarea":
      return (
        <textarea
          value={answers.painPoint}
          onChange={(e) => setAnswer("painPoint", e.target.value)}
          rows={4}
          placeholder="Tell us about your challenge..."
          className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-3 text-[#1A2B4A] outline-none focus:border-[#0B5FFF]"
        />
      );

    case "text":
      return (
        <input
          type="text"
          value={answers.currentTools}
          onChange={(e) => setAnswer("currentTools", e.target.value)}
          placeholder="e.g. spreadsheets, legacy TMS..."
          className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-4 text-[#1A2B4A] outline-none focus:border-[#0B5FFF]"
        />
      );

    case "email":
      return (
        <div className="relative">
          <input
            type="email"
            value={answers.email}
            onChange={(e) => setAnswer("email", e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-4 pr-12 text-[#1A2B4A] outline-none focus:border-[#0B5FFF]"
          />
          {isValidEmail(answers.email) && (
            <Check className="absolute top-1/2 right-4 h-6 w-6 -translate-y-1/2 text-[#22C55E]" />
          )}
        </div>
      );

    case "phone-consent":
      return (
        <div className="space-y-6">
          <input
            type="tel"
            value={answers.phone}
            onChange={(e) => setAnswer("phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full rounded-xl border-2 border-[#E5E7EB] px-4 py-4 text-[#1A2B4A] outline-none focus:border-[#0B5FFF]"
          />
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={answers.consent}
              onChange={(e) => setAnswer("consent", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#E5E7EB] accent-[#0B5FFF]"
            />
            <span className="text-sm text-[#4B5563]">
              I agree to be contacted about {process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "app"}{" "}
              products and services.
            </span>
          </label>
        </div>
      );

    default:
      return null;
  }
}
