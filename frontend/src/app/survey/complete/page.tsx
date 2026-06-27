"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4FC]">
        <CheckCircle2 className="h-8 w-8 text-[#0B5FFF]" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#1A2B4A]">
        Thank you!
      </h1>
      <Card className="mb-8">
        <CardBody>
          {result?.email_sent ? (
            <p className="text-[#4B5563]">
              Check your inbox at{" "}
              <strong className="text-[#1A2B4A]">{result.email}</strong> — we sent a
              copy of your survey responses from {PRODUCT_NAME}.
            </p>
          ) : result ? (
            <p className="text-[#4B5563]">
              Your responses were saved. {result.message}
            </p>
          ) : (
            <p className="text-[#4B5563]">
              We&apos;ll follow up soon. Explore how {PRODUCT_NAME} runs your fleet below.
            </p>
          )}
        </CardBody>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/demo" className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">
            Interactive demo
          </Button>
        </Link>
        <Link href="/app" className="flex-1">
          <Button size="lg" className="w-full">
            Open dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
