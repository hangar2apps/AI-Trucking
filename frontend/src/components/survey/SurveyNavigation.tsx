"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SurveyNavigationProps {
  step: number;
  canNext: boolean;
  onNext: () => void;
  isLast?: boolean;
  submitLabel?: string;
}

export function SurveyNavigation({
  step,
  canNext,
  onNext,
  isLast,
  submitLabel = "Submit",
}: SurveyNavigationProps) {
  return (
    <div className="mt-10 flex gap-4">
      {step > 1 ? (
        <Link
          href={`/survey/${step - 1}`}
          className="rounded-full border border-[#0B5FFF] px-8 py-3 text-sm font-medium text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
        >
          Back
        </Link>
      ) : (
        <div />
      )}
      {isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={cn(
            "rounded-full px-8 py-3 text-sm font-medium transition-colors",
            canNext
              ? "border border-[#0B5FFF] text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
              : "cursor-not-allowed bg-[#D1D5DB] text-white"
          )}
        >
          {submitLabel}
        </button>
      ) : (
        <Link
          href={canNext ? `/survey/${step + 1}` : "#"}
          onClick={(e) => {
            if (!canNext) e.preventDefault();
          }}
          className={cn(
            "rounded-full px-8 py-3 text-sm font-medium transition-colors",
            canNext
              ? "border border-[#0B5FFF] text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
              : "pointer-events-none cursor-not-allowed bg-[#D1D5DB] text-white"
          )}
        >
          Next
        </Link>
      )}
    </div>
  );
}
