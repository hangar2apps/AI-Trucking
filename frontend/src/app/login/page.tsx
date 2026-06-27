"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") ?? "/app";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed");
      return;
    }
    const ops = useAuthStore.getState().user?.operationsAvailable ?? false;
    if (ops && next.startsWith("/app") && next !== "/app/welcome") {
      router.replace(next);
    } else if (ops) {
      router.replace("/app");
    } else {
      router.replace("/app/welcome");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-6">
        <Logo href="/" size="md" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#1A2B4A]">Sign in</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Access your A-TMS dashboard, intelligence tools, and AI assistant.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#374151]">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#0B5FFF]"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#374151]">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#0B5FFF]"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            No account?{" "}
            <Link href="/signup" className="font-medium text-[#0B5FFF] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#6B7280]">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
