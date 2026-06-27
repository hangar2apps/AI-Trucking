"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEMO_LOAD_REFERENCE,
  draftEmail,
  findDemoLoad,
  getLoad,
  isUsingMockData,
} from "@/lib/data-provider";
import type { EmailDraftResponse, Load, LoadDetail } from "@/lib/api";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";

const STEPS = [
  "Detecting delayed shipment...",
  "Loading LD-1042 customer details...",
  "Drafting proactive customer email...",
  "Identifying backup truck nearby...",
  "Demo climax complete.",
];

export default function DemoClimaxPage() {
  const [phase, setPhase] = useState(0);
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [draft, setDraft] = useState<EmailDraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setPhase(0);
        await pause(800);
        if (cancelled) return;

        const demoLoad: Load | undefined = await findDemoLoad();
        if (!demoLoad) throw new Error("Demo load not found");

        setPhase(1);
        await pause(600);
        const detail = await getLoad(demoLoad.id);
        setLoad(detail);
        setMockMode(isUsingMockData());
        if (cancelled) return;

        setPhase(2);
        await pause(800);
        try {
          const result = await draftEmail(demoLoad.id);
          setDraft(result);
        } catch {
          setError(
            "AI email draft requires backend with ANTHROPIC_API_KEY. Showing scripted preview."
          );
          setDraft({
            load_reference: DEMO_LOAD_REFERENCE,
            to_email: detail.customer.email,
            to_name: detail.customer.name,
            model: "demo",
            draft: {
              subject: `Update on shipment ${DEMO_LOAD_REFERENCE}`,
              body: `Hi ${detail.customer.name},\n\nYour shipment ${DEMO_LOAD_REFERENCE} is running approximately 1h45 behind schedule due to an I-45 closure. We've identified backup capacity and will keep you updated.\n\nBest,\nAurora Freight Operations`,
              internal_summary: "Delayed load — customer notified, backup truck available.",
            },
          });
        }

        setPhase(3);
        await pause(700);
        setPhase(4);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Demo failed");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-8">
        <Link href="/app/loads" className="text-sm text-[#0B5FFF] hover:underline">
          ← Back to loads
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#1A2B4A]">Demo Climax</h1>
        <p className="mt-2 text-[#4B5563]">
          Scripted sequence: late truck → AI emails customer → backup truck ready.
        </p>

        <ol className="mt-8 space-y-3">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                i <= phase ? "border-[#0B5FFF] bg-[#E8F4FC]" : "border-[#E5E7EB] opacity-50"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i < phase
                    ? "bg-[#22C55E] text-white"
                    : i === phase
                      ? "bg-[#0B5FFF] text-white"
                      : "bg-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                {i < phase ? "✓" : i + 1}
              </span>
              <span className="text-[#1A2B4A]">{label}</span>
            </li>
          ))}
        </ol>

        {load && phase >= 1 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="font-semibold">{load.reference}</h2>
              <p className="text-sm text-red-600 capitalize">{load.status.replace("_", " ")}</p>
              <p className="mt-2 text-sm">{load.origin_name} → {load.dest_name}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <h2 className="font-semibold">Backup available</h2>
              <p className="text-sm text-[#0B5FFF]">Truck 23 — Lena Ortiz</p>
              <p className="text-xs text-[#6B7280]">Available near the lane</p>
            </div>
          </div>
        )}

        {draft && phase >= 2 && (
          <div className="mt-8 rounded-lg border border-[#0B5FFF]/30 bg-[#E8F4FC] p-6">
            <h2 className="mb-2 font-semibold text-[#1A2B4A]">Customer email</h2>
            <p className="text-sm font-medium">{draft.draft.subject}</p>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-[#4B5563]">
              {draft.draft.body}
            </pre>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-amber-700">{error}</p>
        )}

        {phase >= 4 && (
          <div className="mt-8 flex gap-4">
            <Link
              href="/app"
              className="rounded-full bg-[#0B5FFF] px-6 py-2 text-sm font-medium text-white"
            >
              View fleet map
            </Link>
            <Link
              href="/app/trip-media"
              className="rounded-full border border-[#0B5FFF] px-6 py-2 text-sm text-[#0B5FFF]"
            >
              Trip media
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function pause(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
