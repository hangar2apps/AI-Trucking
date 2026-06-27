"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, MapPin, Package, Truck } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { SidebarConsole } from "@/components/dashboard/SidebarConsole";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/loads", label: "Loads", icon: Package, exact: false },
  { href: "/app/map", label: "Map", icon: MapPin, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full w-72 shrink-0 flex-col border-r border-[#1f3a63] bg-[#1A2B4A] py-5">
      <Link href="/app" className="mb-6 flex items-center gap-2 px-5">
        <Truck className="h-5 w-5 text-[#0B5FFF]" />
        <span className="text-sm font-bold text-white">{PRODUCT_NAME}</span>
      </Link>

      <div className="flex flex-col gap-1 px-3">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive(pathname, href, exact)
                ? "bg-[#0B5FFF] text-white"
                : "text-[#9CA3AF] hover:bg-[#22375c] hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Always-visible live AI reasoning log */}
      <SidebarConsole />

      <Link
        href="/"
        className="mt-3 flex shrink-0 items-center gap-3 px-5 py-2 text-sm text-[#9CA3AF] transition hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Link>
    </nav>
  );
}
