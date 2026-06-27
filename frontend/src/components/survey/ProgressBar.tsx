"use client";

interface ProgressBarProps {
  step: number;
  total?: number;
}

export function ProgressBar({ step, total = 10 }: ProgressBarProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center justify-between text-sm text-[#6B7280]">
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full bg-[#0B5FFF] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
