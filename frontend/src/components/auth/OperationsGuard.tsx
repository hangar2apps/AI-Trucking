"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const WELCOME_PATH = "/app/welcome";

/** Routes that stay available before fleet operations are provisioned. */
const PENDING_ALLOWED = new Set([WELCOME_PATH]);

export function OperationsGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const operationsAvailable = useAuthStore((s) => s.user?.operationsAvailable ?? false);

  useEffect(() => {
    if (operationsAvailable) {
      if (pathname === WELCOME_PATH) {
        router.replace("/app");
      }
      return;
    }

    if (!PENDING_ALLOWED.has(pathname)) {
      router.replace(WELCOME_PATH);
    }
  }, [operationsAvailable, pathname, router]);

  if (!operationsAvailable && !PENDING_ALLOWED.has(pathname)) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F3F4F6] text-sm text-[#6B7280]">
        Checking account...
      </div>
    );
  }

  return <>{children}</>;
}
