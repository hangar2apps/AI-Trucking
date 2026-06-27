"use client";

import { cn } from "@/lib/utils";

interface SurveyModalNavigationProps {
  step: number;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  isLast?: boolean;
  submitLabel?: string;
}

export function SurveyModalNavigation({
  step,
  canNext,
  onBack,
  onNext,
  isLast,
  submitLabel = "Submit",
}: SurveyModalNavigationProps) {
  return (
    <div className="mt-8 flex gap-3 sm:gap-4">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[#0B5FFF] px-6 py-2.5 text-sm font-medium text-[#0B5FFF] hover:bg-[#0B5FFF]/5 sm:px-8 sm:py-3"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={cn(
          "ml-auto rounded-full px-6 py-2.5 text-sm font-medium transition-colors sm:px-8 sm:py-3",
          canNext
            ? "border border-[#0B5FFF] text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
            : "cursor-not-allowed bg-[#D1D5DB] text-white"
        )}
      >
        {isLast ? submitLabel : "Next"}
      </button>
    </div>
  );
}
