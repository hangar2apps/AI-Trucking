"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProgressBar } from "@/components/survey/ProgressBar";
import { StepRenderer } from "@/components/survey/StepRenderer";
import { SurveyNavigation } from "@/components/survey/SurveyNavigation";
import { api } from "@/lib/api";
import { surveySteps, validateStep } from "@/lib/survey-steps";
import { useSurveyStore } from "@/stores/survey-store";

interface SurveyStepClientProps {
  step: number;
}

export function SurveyStepClient({ step }: SurveyStepClientProps) {
  const router = useRouter();
  const answers = useSurveyStore((s) => s.answers);
  const config = surveySteps.find((s) => s.id === step);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!config) return null;

  const canNext = validateStep(step, answers);
  const isLast = step === 10;

  const handleSubmit = async () => {
    if (!canNext || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.submitSurvey({
        company_size: answers.companySize,
        industry: answers.industry,
        fleet_size: answers.fleetSize,
        features: answers.features,
        pain_point: answers.painPoint,
        current_tools: answers.currentTools,
        timeline: answers.timeline,
        role: answers.role,
        email: answers.email,
        phone: answers.phone,
        consent: answers.consent,
      });

      sessionStorage.setItem(
        "survey-submit-result",
        JSON.stringify({
          email: answers.email,
          email_sent: result.email_sent,
          message: result.message,
        })
      );
      router.push("/survey/complete");
    } catch {
      setError(
        "Could not submit survey. Make sure the backend is running at localhost:8000."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-12">
      <ProgressBar step={step} />
      <h1 className="mb-2 text-2xl font-bold text-[#1A2B4A] md:text-3xl">
        {config.title}
      </h1>
      {config.subtitle && (
        <p className="mb-8 text-sm text-[#6B7280]">{config.subtitle}</p>
      )}
      {!config.subtitle && <div className="mb-8" />}
      <StepRenderer config={config} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <SurveyNavigation
        step={step}
        canNext={canNext && !submitting}
        onNext={handleSubmit}
        isLast={isLast}
        submitLabel={submitting ? "Submitting..." : "Submit"}
      />
    </div>
  );
}
