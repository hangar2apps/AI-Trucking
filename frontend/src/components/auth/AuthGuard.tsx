"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const init = useAuthStore((s) => s.init);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    init().finally(() => setChecking(false));
  }, [init]);

  useEffect(() => {
    if (checking || !initialized) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [checking, initialized, user, router, pathname]);

  if (checking || !initialized || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F3F4F6] text-sm text-[#6B7280]">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
