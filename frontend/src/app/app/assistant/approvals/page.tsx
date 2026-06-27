"use client";

import { useEffect, useState } from "react";
import { CheckSquare, RefreshCw } from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAgentActions, isUsingMockData } from "@/lib/data-provider";
import type { AgentActionItem } from "@/lib/api";

const HIGH_STAKES_ACTIONS = new Set([
  "flag_damage",
  "send_invoice",
  "respond_to_complaint",
  "attachment_ack",
]);

const ACTION_LABELS: Record<string, string> = {
  send_invoice: "Invoice sent",
  flag_damage: "Damage alert sent",
  respond_to_complaint: "Complaint reply sent",
  attachment_ack: "Attachment processed",
  escalate_to_human: "Escalation logged",
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<AgentActionItem[]>([]);
  const [mockMode, setMockMode] = useState(false);

  const refresh = async () => {
    const actions = await getAgentActions(200);
    setItems(actions.filter((a) => HIGH_STAKES_ACTIONS.has(a.action)));
    setMockMode(isUsingMockData());
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="High-stakes actions"
        description="Damage alerts, invoices, complaint replies, and email attachments — all executed automatically by the agent. No human approval step."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardBody className="flex items-start gap-3">
              <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p className="text-sm text-emerald-900">
                This agent runs fully autonomously. High-stakes actions that would normally need a
                human are executed immediately and logged here for visibility.
              </p>
            </CardBody>
          </Card>

          {items.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-sm text-[#6B7280]">
                  No high-stakes actions yet. They appear here when the agent sends an invoice,
                  flags damage, replies to a complaint, or processes an email attachment.
                </p>
              </CardBody>
            </Card>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Card>
                    <CardBody className="flex flex-wrap items-center gap-3 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        auto-executed
                      </span>
                      <span className="font-medium text-[#1A2B4A]">
                        {ACTION_LABELS[item.action] ?? item.action}
                      </span>
                      <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs capitalize text-[#374151]">
                        {item.capability}
                      </span>
                      {item.load_ref && (
                        <span className="text-xs text-[#6B7280]">{item.load_ref}</span>
                      )}
                      <span className="text-xs text-[#6B7280]">→ {item.result}</span>
                      <span className="ml-auto text-xs text-[#9CA3AF]">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
