"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/intelligence", icon: Radar, label: "Intelligence" },
  { href: "/app/assistant", icon: Bot, label: "AI Assistant" },
];

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active =
    href === "/app"
      ? pathname === "/app" || pathname.startsWith("/app/loads/")
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[#E8F4FC] text-[#0B5FFF]"
          : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A2B4A]"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-[#0B5FFF]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"
        )}
      />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 text-[#0B5FFF]/60" />}
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#E5E7EB] px-4 py-5">
        <Logo href="/app" showTagline size="md" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-[#E5E7EB] p-3 space-y-1">
        {user && (
          <p className="truncate px-3 py-2 text-xs text-[#6B7280]">
            Signed in as <span className="font-medium text-[#1A2B4A]">{user.name}</span>
          </p>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F9FAFB]"
        >
          Marketing site
        </Link>
        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.replace("/login"));
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F9FAFB]"
        >
          <LogOut className="h-5 w-5 text-[#9CA3AF]" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-[#E5E7EB] bg-white lg:flex lg:flex-col">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle =
    navItems.find((i) =>
      i.href === "/app"
        ? pathname === "/app" || pathname.startsWith("/app/loads/")
        : pathname === i.href || pathname.startsWith(`${i.href}/`)
    )?.label ?? "Dashboard";

  return (
    <>
      <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-[#4B5563] hover:bg-[#F9FAFB] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 lg:hidden">
            <Logo href="/app" size="sm" />
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="text-xs font-medium text-[#9CA3AF]">A-TMS Cloud</p>
            <h1 className="truncate text-base font-semibold text-[#1A2B4A]">{pageTitle}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/demo"
            className="hidden text-sm font-medium text-[#0B5FFF] hover:underline sm:inline"
          >
            Demo tour
          </Link>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-white shadow-xl">
            <div className="flex justify-end border-b border-[#E5E7EB] p-2">
              <button
                type="button"
                className="rounded-lg p-2 text-[#4B5563]"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
