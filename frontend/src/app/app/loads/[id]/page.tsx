"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEMO_LOAD_REFERENCE,
  draftEmail,
  getLoad,
  isUsingMockData,
  sendCustomerEmail,
} from "@/lib/data-provider";
import type { EmailDraftResponse } from "@/lib/api";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LoadDetailPage({ params }: PageProps) {
  const [load, setLoad] = useState<
    Awaited<ReturnType<typeof getLoad>> | null
  >(null);
  const [draft, setDraft] = useState<EmailDraftResponse | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      getLoad(parseInt(id, 10))
        .then((data) => {
          setLoad(data);
          setMockMode(isUsingMockData());
        })
        .catch(() => setError("Could not load this shipment."));
    });
  }, [params]);

  const handleDraftEmail = async () => {
    if (!load) return;
    setDrafting(true);
    setError(null);
    setSendStatus(null);
    try {
      const result = await draftEmail(load.id);
      setDraft(result);
    } catch {
      setError(
        "Failed to draft email. Set ANTHROPIC_API_KEY in backend/.env and restart the server."
      );
    } finally {
      setDrafting(false);
    }
  };

  const handleSendCustomerEmail = async () => {
    if (!load) return;
    setSending(true);
    setError(null);
    setSendStatus(null);
    try {
      const result = await sendCustomerEmail(load.id);
      setDraft(result);
      setSendStatus(
        result.email_sent
          ? `AI email sent to ${result.to_email}.`
          : result.send_message
      );
    } catch {
      setError(
        "Failed to send. Requires ANTHROPIC_API_KEY (AI draft) and RESEND_API_KEY (delivery) in backend/.env."
      );
    } finally {
      setSending(false);
    }
  };

  if (error && !load) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/app/loads" className="mt-4 inline-block text-[#0B5FFF]">
          ← Back to loads
        </Link>
      </div>
    );
  }

  if (!load) {
    return <div className="p-6 text-sm text-[#6B7280]">Loading load details...</div>;
  }

  const isDemoLoad = load.reference === DEMO_LOAD_REFERENCE;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-6">
        <Link href="/app/loads" className="text-sm text-[#0B5FFF] hover:underline">
          ← Back to loads
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1A2B4A]">{load.reference}</h1>
              {isDemoLoad && (
                <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-700">
                  Demo climax load
                </span>
              )}
            </div>
            <p className="text-[#4B5563]">
              {load.origin_name} → {load.dest_name}
            </p>
            <p className="mt-1 text-sm capitalize text-[#6B7280]">
              Status: {load.status.replace("_", " ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isDemoLoad && (
              <Link
                href="/app/demo-climax"
                className="rounded-full border border-[#0B5FFF] px-6 py-2 text-sm font-medium text-[#0B5FFF] hover:bg-[#0B5FFF]/5"
              >
                Run demo climax
              </Link>
            )}
            <button
              type="button"
              onClick={handleDraftEmail}
              disabled={drafting || sending}
              className="rounded-full border border-[#0B5FFF] px-6 py-2 text-sm font-medium text-[#0B5FFF] hover:bg-[#0B5FFF]/5 disabled:opacity-50"
            >
              {drafting ? "Drafting..." : "Preview AI Email"}
            </button>
            <button
              type="button"
              onClick={handleSendCustomerEmail}
              disabled={drafting || sending}
              className="rounded-full bg-[#0B5FFF] px-6 py-2 text-sm font-medium text-white hover:bg-[#0847CC] disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send AI Email to Customer"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold text-[#1A2B4A]">Customer</h2>
            <p>{load.customer.name}</p>
            <p className="text-sm text-[#6B7280]">{load.customer.company}</p>
            <p className="text-sm text-[#0B5FFF]">{load.customer.email}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold text-[#1A2B4A]">Assigned Truck</h2>
            {load.truck ? (
              <>
                <p>{load.truck.name}</p>
                <p className="text-sm text-[#6B7280]">{load.truck.driver_name}</p>
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">Unassigned</p>
            )}
          </div>
          {load.notes && (
            <div className="rounded-lg border bg-white p-4 md:col-span-2">
              <h2 className="mb-2 font-semibold text-[#1A2B4A]">Notes</h2>
              <p className="text-sm text-[#4B5563]">{load.notes}</p>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {sendStatus && (
          <p
            className={`mt-4 text-sm ${sendStatus.includes("sent") ? "text-green-700" : "text-amber-700"}`}
          >
            {sendStatus}
          </p>
        )}

        {draft && (
          <div className="mt-8 rounded-lg border border-[#0B5FFF]/30 bg-[#E8F4FC] p-6">
            <h2 className="mb-2 font-semibold text-[#1A2B4A]">
              AI-drafted customer email
            </h2>
            <p className="text-xs text-[#6B7280]">
              Written by Claude ({draft.model}) — clear, professional status update
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              To: {draft.to_name} &lt;{draft.to_email}&gt;
            </p>
            <p className="mt-3 font-medium">{draft.draft.subject}</p>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-[#4B5563]">
              {draft.draft.body}
            </pre>
            <p className="mt-4 text-xs text-[#6B7280] italic">
              Internal note: {draft.draft.internal_summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
