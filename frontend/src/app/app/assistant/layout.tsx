"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bot, CheckSquare, FileText, LayoutGrid, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/assistant", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/app/assistant/mail", label: "Mail", icon: Mail },
  { href: "/app/assistant/documents", label: "Documents", icon: FileText },
  { href: "/app/assistant/inspections", label: "Inspections", icon: Bot },
  { href: "/app/assistant/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/app/assistant/activity", label: "Activity", icon: Activity },
];

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-[#E5E7EB] bg-white px-3 sm:px-6">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-[#0B5FFF] text-[#0B5FFF]"
                  : "border-transparent text-[#6B7280] hover:text-[#1A2B4A]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[#0B5FFF]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"
                )}
              />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
