"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckSquare,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getAgentActions,
  getApprovals,
  getAssistantInbox,
  getDocuments,
  getInspections,
  isUsingMockData,
} from "@/lib/data-provider";
import type { AgentActionItem } from "@/lib/api";

interface Counts {
  mail: number;
  documents: number;
  inspections: number;
  approvals: number;
  actions: number;
}

const CAPABILITIES = [
  {
    href: "/app/assistant/mail",
    icon: Mail,
    title: "Customer Mail",
    description: "Auto-reply, route by intent, escalate complaints, send milestones.",
    key: "mail" as const,
    countLabel: "processed",
  },
  {
    href: "/app/assistant/documents",
    icon: FileText,
    title: "Documents",
    description: "Read PODs, BOLs & rate cons. Match to loads, auto-invoice.",
    key: "documents" as const,
    countLabel: "processed",
  },
  {
    href: "/app/assistant/inspections",
    icon: Bot,
    title: "Image Inspection",
    description: "Detect freight damage, read seals, build condition reports.",
    key: "inspections" as const,
    countLabel: "inspections",
  },
  {
    href: "/app/assistant/approvals",
    icon: CheckSquare,
    title: "Approvals",
    description: "Human review for high-stakes or low-confidence actions.",
    key: "approvals" as const,
    countLabel: "pending",
  },
  {
    href: "/app/assistant/activity",
    icon: Activity,
    title: "Activity Log",
    description: "Every action the agent takes, with confidence and result.",
    key: "actions" as const,
    countLabel: "logged",
  },
];

function confidenceTone(confidence: string | null): string {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700";
  if (confidence === "medium") return "bg-amber-50 text-amber-700";
  if (confidence === "low") return "bg-red-50 text-red-700";
  return "bg-gray-50 text-gray-600";
}

export default function AssistantOverviewPage() {
  const [counts, setCounts] = useState<Counts>({
    mail: 0,
    documents: 0,
    inspections: 0,
    approvals: 0,
    actions: 0,
  });
  const [recent, setRecent] = useState<AgentActionItem[]>([]);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [inbox, documents, inspections, approvals, actions] = await Promise.all([
        getAssistantInbox(100).catch(() => ({ items: [] })),
        getDocuments(200),
        getInspections(200),
        getApprovals("pending", 200),
        getAgentActions(100),
      ]);
      setCounts({
        mail: inbox.items.length,
        documents: documents.length,
        inspections: inspections.length,
        approvals: approvals.length,
        actions: actions.length,
      });
      setRecent(actions.slice(0, 8));
      setMockMode(isUsingMockData());
    };
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="AI Agent"
        description="One agent, many capabilities. It receives events, picks the right capability, chains them together, and asks for approval when the stakes are high."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <Card className="border-[#0B5FFF]/20 bg-[#F8FBFF]">
            <CardBody className="flex flex-wrap items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B5FFF]/10">
                <ShieldCheck className="h-5 w-5 text-[#0B5FFF]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1A2B4A]">
                  {counts.approvals > 0
                    ? `${counts.approvals} action${counts.approvals === 1 ? "" : "s"} waiting for your approval`
                    : "No actions waiting for approval"}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  High-stakes actions (flagging damage, large invoices, complaint replies) and
                  low-confidence decisions are queued for a human instead of acting alone.
                </p>
              </div>
              <Link
                href="/app/assistant/approvals"
                className="self-center rounded-full bg-[#0B5FFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0847CC]"
              >
                Review queue
              </Link>
            </CardBody>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              const count = counts[cap.key];
              return (
                <Link key={cap.href} href={cap.href}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardBody className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F4FC]">
                          <Icon className="h-5 w-5 text-[#0B5FFF]" />
                        </div>
                        <span className="text-right">
                          <span className="block text-2xl font-semibold text-[#1A2B4A]">
                            {count}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">{cap.countLabel}</span>
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A2B4A]">{cap.title}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">{cap.description}</p>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#0B5FFF]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Recent agent activity</h2>
            </div>
            {recent.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-[#6B7280]">
                    No agent actions yet. Upload a document, run an inspection, or send a customer
                    email to see the agent work.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <ul className="space-y-2">
                {recent.map((a) => (
                  <li key={a.id}>
                    <Card>
                      <CardBody className="flex flex-wrap items-center gap-3 py-3">
                        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium capitalize text-[#374151]">
                          {a.capability}
                        </span>
                        <span className="text-sm font-medium text-[#1A2B4A]">{a.action}</span>
                        {a.load_ref && (
                          <span className="text-xs text-[#6B7280]">{a.load_ref}</span>
                        )}
                        <span className="text-xs text-[#6B7280]">→ {a.result}</span>
                        {a.confidence && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceTone(
                              a.confidence
                            )}`}
                          >
                            {a.confidence}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-[#9CA3AF]">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
