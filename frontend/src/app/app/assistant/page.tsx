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
  getAssistantInbox,
  getLoads,
  isUsingMockData,
  respondToInquiry,
  sendCustomerEmail,
  sendInquiryReply,
  simulateInboundEmail,
} from "@/lib/data-provider";
import type { EmailDraftResponse, InboxItem, InquiryReplyResponse, Load } from "@/lib/api";
import { Bot, Inbox, Mail, MessageSquare, RefreshCw, Send, User } from "lucide-react";

const DEMO_INQUIRIES = [
  {
    label: "Customer — vague delay question",
    from_email: "maria.chen@lonestarcomponents.example",
    sender_name: "Maria Chen",
    role: "customer" as const,
    message: "hey any update on my shipment? worried it wont make it today",
  },
  {
    label: "Driver — unclear status",
    from_email: "sam.whitfield@drivers.aurorafreight.example",
    sender_name: "Sam Whitfield",
    role: "driver" as const,
    message: "traffic bad near corsicana — what should i tell dispatch about LD-1042",
  },
];

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

  const [inquiryEmail, setInquiryEmail] = useState(DEMO_INQUIRIES[0].from_email);
  const [inquiryName, setInquiryName] = useState(DEMO_INQUIRIES[0].sender_name);
  const [inquiryRole, setInquiryRole] = useState<"customer" | "driver">("customer");
  const [inquiryMessage, setInquiryMessage] = useState(DEMO_INQUIRIES[0].message);
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryReply, setInquiryReply] = useState<InquiryReplyResponse | null>(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySendStatus, setInquirySendStatus] = useState<string | null>(null);

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [aiInboxEmail, setAiInboxEmail] = useState("");
  const [inboxLoading, setInboxLoading] = useState(false);
  const [expandedInboxId, setExpandedInboxId] = useState<number | null>(null);

  const refreshInbox = async () => {
    setInboxLoading(true);
    try {
      const inbox = await getAssistantInbox();
      setInboxItems(inbox.items);
      setAiInboxEmail(inbox.ai_inbox_email);
    } catch {
      /* inbox requires backend */
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    void refreshInbox();
    const timer = setInterval(() => void refreshInbox(), 15000);
    return () => clearInterval(timer);
  }, []);

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

  const applyDemoInquiry = (index: number) => {
    const demo = DEMO_INQUIRIES[index];
    setInquiryEmail(demo.from_email);
    setInquiryName(demo.sender_name);
    setInquiryRole(demo.role);
    setInquiryMessage(demo.message);
    setInquiryReply(null);
    setInquirySendStatus(null);
    setError(null);
  };

  const inquiryPayload = () => ({
    from_email: inquiryEmail.trim(),
    role: inquiryRole,
    message: inquiryMessage.trim(),
    sender_name: inquiryName.trim(),
    subject: inquirySubject.trim() || undefined,
  });

  const handleSimulateInbound = async () => {
    setInquiryLoading(true);
    setError(null);
    setInquirySendStatus(null);
    try {
      const result = await simulateInboundEmail({
        from_email: inquiryEmail.trim(),
        sender_name: inquiryName.trim(),
        subject: inquirySubject.trim(),
        body: inquiryMessage.trim(),
        auto_send: true,
      });
      setInquirySendStatus(
        result.auto_reply_sent
          ? `Auto-reply sent to ${result.from_email}. ${result.send_message}`
          : result.send_message
      );
      setInquiryReply({
        matched_load_id: result.matched_load_id,
        load_reference: result.load_reference,
        recipient_name: result.from_name,
        recipient_email: result.from_email,
        recipient_role: result.inferred_role,
        inferred_intent: result.inferred_intent,
        confidence: result.confidence,
        needs_clarification: result.needs_clarification,
        clarifying_questions: result.clarifying_questions,
        reply_subject: result.reply_subject,
        reply_body: result.reply_body,
        internal_summary: result.internal_summary,
        model: result.model,
      });
      await refreshInbox();
    } catch {
      setError(
        "Could not process inbound email. Set ANTHROPIC_API_KEY in backend/.env and restart the server."
      );
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleInquiryDraft = async () => {
    setInquiryLoading(true);
    setError(null);
    setInquirySendStatus(null);
    try {
      setInquiryReply(await respondToInquiry(inquiryPayload()));
    } catch {
      setError(
        "Could not draft inquiry reply. Set ANTHROPIC_API_KEY in backend/.env and restart the server."
      );
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleInquirySend = async () => {
    setInquiryLoading(true);
    setError(null);
    setInquirySendStatus(null);
    try {
      const result = await sendInquiryReply(inquiryPayload());
      setInquiryReply(result);
      setInquirySendStatus(
        result.email_sent
          ? `Reply sent to ${result.recipient_email}.`
          : result.send_message
      );
    } catch {
      setError(
        "Could not send inquiry reply. Requires ANTHROPIC_API_KEY and RESEND_API_KEY in backend/.env."
      );
    } finally {
      setInquiryLoading(false);
    }
  };

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
        description="Incoming emails are understood automatically and replied to. You can also draft manual replies or send proactive load updates."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading...</p>
        ) : (
          <div className="mx-auto max-w-6xl space-y-10">
            {/* Auto inbox */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-[#0B5FFF]" />
                  <h2 className="text-lg font-semibold text-[#1A2B4A]">AI inbox — auto-reply</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void refreshInbox()} disabled={inboxLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${inboxLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <p className="mb-4 max-w-3xl text-sm text-[#6B7280]">
                When someone emails{" "}
                <span className="font-medium text-[#1A2B4A]">
                  {aiInboxEmail || "your AI inbox address"}
                </span>{" "}
                — or replies to an AI-sent email — the assistant reads it, matches the sender to
                fleet records, and sends an automatic reply. Replies to outbound emails use the
                Reply-To header on every AI message.
              </p>

              {inboxItems.length === 0 ? (
                <Card>
                  <CardBody>
                    <p className="text-sm text-[#6B7280]">
                      No inbound emails processed yet. Use &quot;Simulate received email&quot; below
                      to test the auto-reply pipeline, or connect a Resend inbound webhook to{" "}
                      <code className="rounded bg-[#F3F4F6] px-1">POST /assistant/inbound/webhook</code>.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {inboxItems.map((item) => (
                    <li key={item.id}>
                      <Card>
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() =>
                            setExpandedInboxId(expandedInboxId === item.id ? null : item.id)
                          }
                        >
                          <CardHeader>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#1A2B4A]">
                                {item.from_name || item.from_email}
                              </span>
                              {item.load_reference && (
                                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#374151]">
                                  {item.load_reference}
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  item.auto_reply_sent
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.auto_reply_sent ? "Auto-reply sent" : "Reply not sent"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#9CA3AF]">
                              {new Date(item.created_at).toLocaleString()}
                              {item.subject ? ` · ${item.subject}` : ""}
                            </p>
                          </CardHeader>
                        </button>
                        {expandedInboxId === item.id && (
                          <CardBody className="space-y-3 border-t border-[#E5E7EB]">
                            <div>
                              <p className="text-xs font-medium text-[#374151]">Received</p>
                              <p className="text-sm text-[#4B5563]">{item.body_preview}</p>
                            </div>
                            {item.inferred_intent && (
                              <p className="text-sm text-[#6B7280]">
                                <span className="font-medium text-[#1A2B4A]">Understood:</span>{" "}
                                {item.inferred_intent}
                              </p>
                            )}
                            {item.reply_subject && (
                              <div>
                                <p className="text-xs font-medium text-[#374151]">Auto-reply</p>
                                <p className="font-medium text-[#1A2B4A]">{item.reply_subject}</p>
                                <pre className="mt-1 whitespace-pre-wrap text-sm text-[#4B5563]">
                                  {item.reply_body}
                                </pre>
                              </div>
                            )}
                            {item.send_message && (
                              <p className="text-xs text-[#6B7280]">{item.send_message}</p>
                            )}
                          </CardBody>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Inbound inquiries */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#0B5FFF]" />
                <h2 className="text-lg font-semibold text-[#1A2B4A]">
                  Reply to customer & driver inquiries
                </h2>
              </div>
              <p className="mb-4 max-w-3xl text-sm text-[#6B7280]">
                Simulate what happens when mail arrives — or manually draft/send without the
                auto-pipeline. Role is auto-detected from fleet email records when using simulate.
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {DEMO_INQUIRIES.map((demo, i) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => applyDemoInquiry(i)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:border-[#0B5FFF]/40"
                  >
                    Try: {demo.label}
                  </button>
                ))}
              </div>

              <Card>
                <CardBody className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#374151]">
                        Their email (must match fleet records)
                      </label>
                      <input
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                        placeholder="maria.chen@lonestarcomponents.example"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#374151]">
                        Name (optional)
                      </label>
                      <input
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#374151]">
                      Who is asking?
                    </label>
                    <div className="flex gap-3">
                      {(["customer", "driver"] as const).map((role) => (
                        <label
                          key={role}
                          className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]"
                        >
                          <input
                            type="radio"
                            name="inquiry-role"
                            checked={inquiryRole === role}
                            onChange={() => setInquiryRole(role)}
                          />
                          {role === "customer" ? "Customer / shipper" : "Driver"}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#374151]">
                      Subject (optional — use Re: when simulating a reply)
                    </label>
                    <input
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                      placeholder="Re: Load LD-1042 update"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#374151]">
                      Their message (can be incomplete)
                    </label>
                    <textarea
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                      placeholder="where is my load?? need eta asap"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={inquiryLoading || !inquiryEmail || !inquiryMessage}
                      onClick={handleSimulateInbound}
                    >
                      <Inbox className="mr-2 h-4 w-4" />
                      {inquiryLoading ? "Processing..." : "Simulate received email"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={inquiryLoading || !inquiryEmail || !inquiryMessage}
                      onClick={handleInquiryDraft}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      {inquiryLoading ? "Thinking..." : "Draft reply"}
                    </Button>
                    <Button
                      disabled={inquiryLoading || !inquiryEmail || !inquiryMessage}
                      onClick={handleInquirySend}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {inquiryLoading ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    Demo driver emails: sam.whitfield@drivers.aurorafreight.example (LD-1042),
                    marcus.bell@drivers.aurorafreight.example (LD-1043)
                  </p>
                </CardBody>
              </Card>

              {inquiryReply && (
                <Card className="mt-4">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <User className="h-4 w-4 text-[#0B5FFF]" />
                      <h3 className="font-semibold text-[#1A2B4A]">AI-framed reply</h3>
                      <span className="rounded-full bg-[#E8F4FC] px-2 py-0.5 text-xs text-[#0B5FFF]">
                        {inquiryReply.confidence} confidence
                      </span>
                      {inquiryReply.load_reference && (
                        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#374151]">
                          {inquiryReply.load_reference}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <p className="text-sm text-[#6B7280]">
                      <span className="font-medium text-[#1A2B4A]">Understood:</span>{" "}
                      {inquiryReply.inferred_intent}
                    </p>
                    {inquiryReply.load_reference && (
                      <p className="text-sm text-[#6B7280]">
                        Matched load:{" "}
                        <Link
                          href={`/app/loads/${inquiryReply.matched_load_id}`}
                          className="font-medium text-[#0B5FFF] hover:underline"
                        >
                          {inquiryReply.load_reference}
                        </Link>
                      </p>
                    )}
                    {inquiryReply.needs_clarification &&
                      inquiryReply.clarifying_questions.length > 0 && (
                        <ul className="list-inside list-disc text-sm text-amber-800">
                          {inquiryReply.clarifying_questions.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      )}
                    <p className="text-xs text-[#6B7280]">
                      To: {inquiryReply.recipient_name} &lt;{inquiryReply.recipient_email}&gt;
                    </p>
                    <p className="font-medium text-[#1A2B4A]">{inquiryReply.reply_subject}</p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#4B5563]">
                      {inquiryReply.reply_body}
                    </pre>
                    <p className="text-xs italic text-[#6B7280]">
                      Internal: {inquiryReply.internal_summary}
                    </p>
                  </CardBody>
                </Card>
              )}
              {inquirySendStatus && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {inquirySendStatus}
                </div>
              )}
            </section>

            {/* Proactive outreach */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#0B5FFF]" />
                <h2 className="text-lg font-semibold text-[#1A2B4A]">
                  Proactive customer updates
                </h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-[#1A2B4A]">Select load</h3>
                  </CardHeader>
                  <CardBody>
                    <ul className="max-h-[360px] space-y-2 overflow-y-auto">
                      {loads.map((load) => (
                        <li key={load.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(load);
                              setDraft(null);
                              setSendStatus(null);
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
                      Draft customer email
                    </Button>
                    <Button disabled={!selected || drafting || sending} onClick={handleSend}>
                      Send to customer
                    </Button>
                  </div>
                  {draft && (
                    <Card>
                      <CardBody>
                        <p className="font-medium text-[#1A2B4A]">{draft.draft.subject}</p>
                        <pre className="mt-3 whitespace-pre-wrap text-sm text-[#4B5563]">
                          {draft.draft.body}
                        </pre>
                      </CardBody>
                    </Card>
                  )}
                  {sendStatus && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {sendStatus}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
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
