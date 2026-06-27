"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { TestimonialSidebar } from "@/components/marketing/TestimonialSidebar";
import { PRODUCT_NAME } from "@/lib/brand";

interface SubmitResult {
  email: string;
  email_sent: boolean;
  message: string;
}

export default function SurveyCompletePage() {
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("survey-submit-result");
    if (raw) {
      try {
        setResult(JSON.parse(raw) as SubmitResult);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="flex flex-1">
        <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center px-6 py-16">
          <h1 className="mb-4 text-3xl font-bold text-[#1A2B4A]">
            Thank you!
          </h1>
          {result?.email_sent ? (
            <p className="mb-4 text-[#4B5563]">
              Check your inbox at{" "}
              <strong className="text-[#1A2B4A]">{result.email}</strong> — we
              sent a copy of your survey questions and answers.
            </p>
          ) : result ? (
            <p className="mb-4 text-[#4B5563]">
              Your responses were saved. {result.message}
            </p>
          ) : (
            <p className="mb-10 text-[#4B5563]">
              We&apos;ll follow up soon. Explore how {PRODUCT_NAME} works below.
            </p>
          )}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="rounded-full border border-[#0B5FFF] px-8 py-3 text-center text-sm font-medium text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
            >
              Start Interactive Demo
            </Link>
            <Link
              href="/app"
              className="rounded-full bg-[#0B5FFF] px-8 py-3 text-center text-sm font-medium text-white hover:bg-[#0847CC]"
            >
              Go to Live Dashboard
            </Link>
          </div>
        </main>
        <TestimonialSidebar />
      </div>
      <Footer />
    </div>
  );
}
