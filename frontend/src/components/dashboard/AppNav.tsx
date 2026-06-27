"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Film,
  Home,
  MapPin,
  Package,
  PlayCircle,
  Search,
  Settings,
  Truck,
} from "lucide-react";
import { PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", icon: MapPin, label: "Fleet Map" },
  { href: "/app/loads", icon: Package, label: "Loads" },
  { href: "/app/proximity", icon: Search, label: "Proximity" },
  { href: "/app/trip-media", icon: Film, label: "Trip Media" },
  { href: "/app/demo-climax", icon: PlayCircle, label: "Demo Climax" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-3 border-r bg-[#1A2B4A] py-4">
      <Link
        href="/survey/1"
        className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B5FFF] text-xs font-bold text-white"
        title="Home"
      >
        a
      </Link>
      <Link
        href="/survey/1"
        title="Home — start survey"
        className="rounded-lg p-2 text-[#9CA3AF] hover:text-white"
      >
        <Home className="h-5 w-5" />
      </Link>
      {links.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className={cn(
            "rounded-lg p-2",
            pathname === href
              ? "bg-[#0B5FFF] text-white"
              : "text-[#9CA3AF] hover:text-white"
          )}
        >
          <Icon className="h-5 w-5" />
        </Link>
      ))}
      <div className="mt-auto flex flex-col items-center gap-2">
        <Link href="/demo" className="rounded-lg p-2 text-[#9CA3AF] hover:text-white">
          <BarChart3 className="h-5 w-5" />
        </Link>
        <Link href="/survey/1" className="rounded-lg p-2 text-[#9CA3AF] hover:text-white">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </nav>
  );
}

export function AppHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-[#0B5FFF]" />
        <span className="font-semibold text-[#1A2B4A]">{PRODUCT_NAME} Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/survey/1" className="text-sm text-[#0B5FFF] hover:underline">
          Home
        </Link>
        <Link href="/demo" className="text-sm text-[#0B5FFF] hover:underline">
          View demo tour
        </Link>
      </div>
    </header>
  );
}
