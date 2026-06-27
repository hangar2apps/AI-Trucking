"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { usePricingPopupStore } from "@/stores/pricing-popup-store";

export function LandingNavbar() {
  const openPricing = usePricingPopupStore((s) => s.open);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo href="/" size="md" />

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          <Link
            href="#about"
            className="text-sm font-medium text-[#374151] hover:text-[#0B5FFF]"
          >
            About
          </Link>
          <Link
            href="#usecases"
            className="text-sm font-medium text-[#374151] hover:text-[#0B5FFF]"
          >
            Use cases
          </Link>
          <Link
            href="#services"
            className="text-sm font-medium text-[#374151] hover:text-[#0B5FFF]"
          >
            Services
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#374151] hover:text-[#0B5FFF] sm:inline"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="hidden text-sm font-medium text-[#374151] hover:text-[#0B5FFF] sm:inline"
          >
            Sign up
          </Link>
          <button
            type="button"
            onClick={openPricing}
            className={cn(
              "rounded-full bg-[#0B5FFF] px-4 py-2 text-xs font-medium text-white",
              "hover:bg-[#0847CC] sm:text-sm"
            )}
          >
            Check our prices
          </button>
        </div>
      </div>
    </header>
  );
}
