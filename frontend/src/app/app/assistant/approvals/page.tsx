"use client";

import { useEffect, useState } from "react";
import { CheckSquare, RefreshCw } from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { approveItem, getApprovals, isUsingMockData, rejectItem } from "@/lib/data-provider";
import type { ApprovalItem } from "@/lib/api";

const ACTION_LABELS: Record<string, string> = {
  send_invoice: "Send invoice",
  flag_damage: "Flag freight damage",
  respond_to_complaint: "Respond to complaint",
  escalate_to_human: "Manual follow-up",
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const refresh = async () => {
    setItems(await getApprovals(showResolved ? undefined : "pending", 100));
    setMockMode(isUsingMockData());
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResolved]);

  const handle = async (id: number, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (action === "approve") await approveItem(id);
      else await rejectItem(id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Approval Queue"
        description="High-stakes or low-confidence actions wait here for a human. Approving runs the action (e.g. sends the prepared email); rejecting cancels it."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showResolved ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowResolved((v) => !v)}
            >
              {showResolved ? "Show pending only" : "Show all"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardBody className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-[#6B7280]">
                  Nothing waiting. The agent is acting autonomously within its confidence limits.
                </p>
              </CardBody>
            </Card>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const payload = item.payload ?? {};
                const pending = item.status === "pending";
                return (
                  <li key={item.id}>
                    <Card>
                      <CardHeader className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#1A2B4A]">
                          {ACTION_LABELS[item.action_type] ?? item.action_type}
                        </span>
                        {item.load_ref && (
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#374151]">
                            {item.load_ref}
                          </span>
                        )}
                        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium capitalize text-[#374151]">
                          {item.capability}
                        </span>
                        <StatusBadge status={item.status} className="ml-auto" />
                      </CardHeader>
                      <CardBody className="space-y-3">
                        {item.reason && (
                          <p className="text-sm text-[#4B5563]">
                            <span className="font-medium text-[#1A2B4A]">Why review: </span>
                            {item.reason}
                          </p>
                        )}
                        {typeof payload.subject === "string" && (
                          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
                            <p className="text-xs font-medium text-[#374151]">
                              Prepared email → {String(payload.to_email ?? "")}
                            </p>
                            <p className="mt-1 font-medium text-[#1A2B4A]">
                              {String(payload.subject)}
                            </p>
                            {typeof payload.body === "string" && (
                              <pre className="mt-1 whitespace-pre-wrap text-sm text-[#4B5563]">
                                {String(payload.body)}
                              </pre>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {pending ? (
                            <>
                              <Button
                                size="sm"
                                disabled={busyId === item.id}
                                onClick={() => void handle(item.id, "approve")}
                              >
                                Approve & run
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={busyId === item.id}
                                onClick={() => void handle(item.id, "reject")}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">
                              {item.resolved_at
                                ? `Resolved ${new Date(item.resolved_at).toLocaleString()}`
                                : "Resolved"}
                            </span>
                          )}
                          {item.confidence && (
                            <span className="ml-auto text-xs text-[#9CA3AF]">
                              confidence: {item.confidence}
                            </span>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
