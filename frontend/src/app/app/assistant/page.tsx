"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  draftEmail,
  findDemoLoad,
  getLoads,
  isUsingMockData,
  sendCustomerEmail,
} from "@/lib/data-provider";
import type { EmailDraftResponse, Load } from "@/lib/api";
import { Bot, Mail, Send } from "lucide-react";

function AssistantContent() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("load");

  const [loads, setLoads] = useState<Load[]>([]);
  const [selected, setSelected] = useState<Load | null>(null);
  const [draft, setDraft] = useState<EmailDraftResponse | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoads()
      .then(async (data) => {
        setLoads(data);
        setMockMode(isUsingMockData());
        const fromQuery = preselectId
          ? data.find((l) => l.id === parseInt(preselectId, 10))
          : null;
        setSelected(fromQuery ?? (await findDemoLoad()) ?? data[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [preselectId]);

  const handleDraft = async () => {
    if (!selected) return;
    setDrafting(true);
    setError(null);
    setSendStatus(null);
    try {
      setDraft(await draftEmail(selected.id));
    } catch {
      setError(
        "Failed to draft email. Set ANTHROPIC_API_KEY in backend/.env and restart the server."
      );
    } finally {
      setDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError(null);
    setSendStatus(null);
    try {
      const result = await sendCustomerEmail(selected.id);
      setDraft(result);
      setSendStatus(
        result.email_sent
          ? `Email sent to ${result.to_email}.`
          : result.send_message
      );
    } catch {
      setError(
        "Failed to send. Requires ANTHROPIC_API_KEY and RESEND_API_KEY in backend/.env."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="AI Assistant"
        description="Draft and send proactive customer emails for any load — powered by Claude."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading loads...</p>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#0B5FFF]" />
                  <h2 className="font-semibold text-[#1A2B4A]">Select load</h2>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                  {loads.map((load) => (
                    <li key={load.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(load);
                          setDraft(null);
                          setSendStatus(null);
                          setError(null);
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                          selected?.id === load.id
                            ? "border-[#0B5FFF] bg-[#E8F4FC]"
                            : "border-[#E5E7EB] hover:border-[#0B5FFF]/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#1A2B4A]">
                            {load.reference}
                          </span>
                          <StatusBadge status={load.status} />
                        </div>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {load.origin_name} → {load.dest_name}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <div className="space-y-4">
              {selected && (
                <Card>
                  <CardBody>
                    <p className="text-sm text-[#6B7280]">Working on</p>
                    <p className="text-lg font-semibold text-[#1A2B4A]">
                      {selected.reference}
                    </p>
                    <p className="text-sm text-[#4B5563]">
                      {selected.origin_name} → {selected.dest_name}
                    </p>
                    <Link
                      href={`/app/loads/${selected.id}`}
                      className="mt-2 inline-block text-sm text-[#0B5FFF] hover:underline"
                    >
                      View load details →
                    </Link>
                  </CardBody>
                </Card>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  disabled={!selected || drafting || sending}
                  onClick={handleDraft}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {drafting ? "Drafting..." : "Draft customer email"}
                </Button>
                <Button disabled={!selected || drafting || sending} onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Sending..." : "Send to customer"}
                </Button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              {sendStatus && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {sendStatus}
                </div>
              )}

              {draft && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-[#1A2B4A]">AI-drafted email</h2>
                  </CardHeader>
                  <CardBody>
                    <p className="text-xs text-[#6B7280]">
                      Model: {draft.model} · To: {draft.to_name} &lt;{draft.to_email}&gt;
                    </p>
                    <p className="mt-3 font-medium text-[#1A2B4A]">{draft.draft.subject}</p>
                    <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#4B5563]">
                      {draft.draft.body}
                    </pre>
                    <p className="mt-4 text-xs italic text-[#6B7280]">
                      Internal: {draft.draft.internal_summary}
                    </p>
                  </CardBody>
                </Card>
              )}

              {!draft && selected && !error && (
                <p className="text-sm text-[#6B7280]">
                  Choose a load, then draft a proactive status email or send it directly
                  to the customer.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#6B7280]">Loading...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
