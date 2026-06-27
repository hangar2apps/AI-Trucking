"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  sidebar: ReactNode;
  map?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

/** Responsive split: panel + map (stacks on mobile). */
export function DashboardShell({ sidebar, map, toolbar, className }: DashboardShellProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-[45vh] w-full shrink-0 overflow-y-auto border-b border-[#E5E7EB] bg-white lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r xl:w-96">
          {sidebar}
        </aside>
        <div className="relative min-h-[280px] flex-1 lg:min-h-0">{map}</div>
      </div>
    </div>
  );
}
