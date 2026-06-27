import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-[#1A2B4A] sm:text-xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
