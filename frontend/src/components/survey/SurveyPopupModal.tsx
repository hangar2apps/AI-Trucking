"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/survey/ProgressBar";
import { StepRenderer } from "@/components/survey/StepRenderer";
import { SurveyModalNavigation } from "@/components/survey/SurveyModalNavigation";
import { submitLeadSurvey } from "@/lib/survey-submit";
import { surveySteps, validateStep } from "@/lib/survey-steps";
import { useSurveyStore } from "@/stores/survey-store";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";
import { PRODUCT_NAME } from "@/lib/brand";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function SurveyPopupModal() {
  const isOpen = useSurveyPopupStore((s) => s.isOpen);
  const close = useSurveyPopupStore((s) => s.close);
  const answers = useSurveyStore((s) => s.answers);
  const reset = useSurveyStore((s) => s.reset);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const config = surveySteps.find((s) => s.id === step);
  const canNext = config ? validateStep(step, answers) : false;
  const isLast = step === 10;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, submitting]);

  const handleClose = () => {
    if (submitting) return;
    close();
    if (done) {
      setStep(1);
      setDone(false);
      reset();
    }
  };

  const handleSubmit = async () => {
    if (!canNext || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitLeadSurvey(answers, "landing_popup");
      setEmailSent(result.email_sent);
      setSubmitMessage(result.message);
      setDone(true);
      sessionStorage.setItem(
        "survey-submit-result",
        JSON.stringify({
          email: answers.email,
          email_sent: result.email_sent,
          message: result.message,
        })
      );
    } catch {
      setError(
        "Could not submit. Add Supabase keys to .env.local or start the backend at localhost:8000."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLast) {
      void handleSubmit();
      return;
    }
    if (canNext) setStep((s) => s + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close survey"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-modal-title"
        className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-[#0B5FFF]">Survey · {PRODUCT_NAME}</p>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {done ? (
            <div className="text-center sm:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4FC] sm:mx-0">
                <CheckCircle2 className="h-8 w-8 text-[#0B5FFF]" />
              </div>
              <h2 id="survey-modal-title" className="text-2xl font-bold text-[#1A2B4A]">
                Thank you!
              </h2>
              <p className="mt-3 text-sm text-[#6B7280]">
                {emailSent
                  ? `We emailed a copy of your responses to ${answers.email}.`
                  : submitMessage ?? "Your responses were saved."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/demo" className="flex-1" onClick={handleClose}>
                  <Button variant="secondary" size="lg" className="w-full">
                    Try the demo
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={handleClose}>
                  <Button size="lg" className="w-full">
                    Create account
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            config && (
              <>
                <ProgressBar step={step} />
                <h2 id="survey-modal-title" className="mb-2 text-xl font-bold text-[#1A2B4A] sm:text-2xl">
                  {config.title}
                </h2>
                {config.subtitle && (
                  <p className="mb-6 text-sm text-[#6B7280]">{config.subtitle}</p>
                )}
                {!config.subtitle && <div className="mb-6" />}
                <StepRenderer config={config} />
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                <SurveyModalNavigation
                  step={step}
                  canNext={canNext && !submitting}
                  onBack={() => setStep((s) => s - 1)}
                  onNext={handleNext}
                  isLast={isLast}
                  submitLabel={submitting ? "Submitting..." : "Submit"}
                />
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
