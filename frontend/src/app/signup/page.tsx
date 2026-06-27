"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signup(name, email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Sign up failed");
      return;
    }
    router.replace("/app/welcome");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-6">
        <Logo href="/" size="md" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#1A2B4A]">Create account</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Create your account. Live fleet data and analytics unlock once your operations are
            provisioned — you&apos;ll start on a setup page, not the full dashboard.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-[#374151]">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#0B5FFF]"
              />
            </div>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#0B5FFF]"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#0B5FFF] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
