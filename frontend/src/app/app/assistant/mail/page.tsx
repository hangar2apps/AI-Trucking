"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAssistantInbox, isUsingMockData, simulateInboundEmail } from "@/lib/data-provider";
import type { InboxItem } from "@/lib/api";
import { Bot, Inbox, RefreshCw, Zap } from "lucide-react";

const DEMO_INQUIRIES = [
  {
    label: "Customer — vague delay question",
    from_email: "maria.chen@lonestarcomponents.example",
    sender_name: "Maria Chen",
    message: "hey any update on my shipment? worried it wont make it today",
  },
  {
    label: "Driver — unclear status",
    from_email: "sam.whitfield@drivers.aurorafreight.example",
    sender_name: "Sam Whitfield",
    message: "traffic bad near corsicana — what should i tell dispatch about LD-1042",
  },
  {
    label: "Customer — reply to AI email",
    from_email: "maria.chen@lonestarcomponents.example",
    sender_name: "Maria Chen",
    subject: "Re: Load LD-1042 update",
    message: "thanks — will the driver still make the dock before 6am?",
  },
];

function MailContent() {
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [aiInboxEmail, setAiInboxEmail] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [expandedInboxId, setExpandedInboxId] = useState<number | null>(null);

  const refreshInbox = async () => {
    setInboxLoading(true);
    try {
      const inbox = await getAssistantInbox();
      setInboxItems(inbox.items);
      setAiInboxEmail(inbox.ai_inbox_email);
      setAutoReplyEnabled(inbox.auto_reply_enabled);
      setMockMode(isUsingMockData());
    } catch {
      setMockMode(isUsingMockData());
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    void refreshInbox();
    const timer = setInterval(() => void refreshInbox(), 15000);
    return () => clearInterval(timer);
  }, []);

  const runDemoInquiry = async (demo: (typeof DEMO_INQUIRIES)[number]) => {
    setProcessing(true);
    setError(null);
    setStatusMessage(null);
    try {
      const result = await simulateInboundEmail({
        from_email: demo.from_email,
        sender_name: demo.sender_name,
        subject: demo.subject ?? "",
        body: demo.message,
      });
      setStatusMessage(
        result.auto_reply_sent
          ? `AI replied automatically to ${result.from_email}. ${result.send_message}`
          : result.send_message
      );
      setExpandedInboxId(result.event_id);
      await refreshInbox();
    } catch {
      setError(
        "Auto-reply failed. Set ANTHROPIC_API_KEY (and RESEND_API_KEY to deliver) in backend/.env, then restart the server."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="AI Mail Agent"
        description="Fully autonomous — every inbound email is understood and answered by AI. No human review or send buttons."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-[#0B5FFF]/20 bg-[#F8FBFF]">
            <CardBody className="flex flex-wrap items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B5FFF]/10">
                <Bot className="h-5 w-5 text-[#0B5FFF]" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-[#1A2B4A]">How it works</p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-[#6B7280]">
                  <li>
                    Mail arrives at{" "}
                    <span className="font-medium text-[#1A2B4A]">
                      {aiInboxEmail || "your AI inbox"}
                    </span>{" "}
                    (direct or reply to an AI-sent email).
                  </li>
                  <li>AI matches the sender to fleet records and understands intent.</li>
                  <li>
                    PDFs and images in the email are routed automatically — document processing
                    for PODs/BOLs, image inspection for freight photos.
                  </li>
                  <li>
                    AI sends the reply immediately —{" "}
                    {autoReplyEnabled ? (
                      <span className="font-medium text-emerald-700">auto-reply is ON</span>
                    ) : (
                      <span className="font-medium text-amber-700">auto-reply is OFF in config</span>
                    )}
                    .
                  </li>
                </ol>
                <p className="text-xs text-[#9CA3AF]">
                  Production webhook:{" "}
                  <code className="rounded bg-white px-1">POST /assistant/inbound/webhook</code>
                </p>
              </div>
            </CardBody>
          </Card>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-[#0B5FFF]" />
                <h2 className="text-lg font-semibold text-[#1A2B4A]">Processed mail log</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refreshInbox()}
                disabled={inboxLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${inboxLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {inboxItems.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-[#6B7280]">
                    No mail processed yet. Run a demo scenario below to see the autonomous pipeline.
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
                              item.load_id ? (
                                <Link
                                  href={`/app/loads/${item.load_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#374151] hover:bg-[#E8F4FC]"
                                >
                                  {item.load_reference}
                                </Link>
                              ) : (
                                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#374151]">
                                  {item.load_reference}
                                </span>
                              )
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.auto_reply_sent
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.auto_reply_sent ? "AI replied" : "Reply failed"}
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
                              <span className="font-medium text-[#1A2B4A]">AI understood:</span>{" "}
                              {item.inferred_intent}
                            </p>
                          )}
                          {item.reply_subject && (
                            <div>
                              <p className="text-xs font-medium text-[#374151]">AI sent</p>
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

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#0B5FFF]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Test autonomous pipeline</h2>
            </div>
            <p className="mb-4 text-sm text-[#6B7280]">
              Each button simulates an inbound email and triggers the same auto-reply flow as
              production — no human step.
            </p>
            <div className="flex flex-wrap gap-3">
              {DEMO_INQUIRIES.map((demo) => (
                <Button
                  key={demo.label}
                  variant="secondary"
                  disabled={processing}
                  onClick={() => void runDemoInquiry(demo)}
                >
                  {processing ? "Processing..." : demo.label}
                </Button>
              ))}
            </div>
          </section>

          {statusMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {statusMessage}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function MailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#6B7280]">Loading...</div>}>
      <MailContent />
    </Suspense>
  );
}
