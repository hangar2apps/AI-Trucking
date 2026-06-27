"use client";

interface ProgressBarProps {
  step: number;
  total?: number;
}

export function ProgressBar({ step, total = 10 }: ProgressBarProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-[#1A2B4A]">
          Step {step} of {total}
        </span>
        <span className="text-[#6B7280]">{pct}% complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0B5FFF] to-[#0847CC] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
