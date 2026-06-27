"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TourCoachProps {
  step: number;
  total: number;
  title: string;
  body: string;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  isLast?: boolean;
}

export function TourCoach({
  step,
  total,
  title,
  body,
  onBack,
  onNext,
  onClose,
  isLast,
}: TourCoachProps) {
  return (
    <div className="absolute top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border-t-4 border-[#0B5FFF] bg-white p-6 shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#1A2B4A]"
        aria-label="Close tour"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="mb-3 pr-8 text-lg font-semibold text-[#1A2B4A]">{title}</h2>
      <p className="mb-6 text-sm leading-relaxed text-[#4B5563]">{body}</p>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          className={cn(
            "rounded-full border border-[#0B5FFF] px-5 py-2 text-sm text-[#0B5FFF]",
            step === 1 && "invisible"
          )}
        >
          Back
        </button>
        <span className="text-xs text-[#6B7280]">
          {step} of {total}
        </span>
        {isLast ? (
          <Link
            href="/app"
            className="rounded-full bg-[#0B5FFF] px-5 py-2 text-sm font-medium text-white hover:bg-[#0847CC]"
          >
            Enter Dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-[#0B5FFF] px-5 py-2 text-sm font-medium text-white hover:bg-[#0847CC]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
