"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAgentActions, isUsingMockData } from "@/lib/data-provider";
import type { AgentActionItem } from "@/lib/api";

const CAP_TONE: Record<string, string> = {
  document: "bg-blue-50 text-blue-700",
  image: "bg-purple-50 text-purple-700",
  comms: "bg-emerald-50 text-emerald-700",
  brain: "bg-indigo-50 text-indigo-700",
};

function confidenceTone(confidence: string | null): string {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700";
  if (confidence === "medium") return "bg-amber-50 text-amber-700";
  if (confidence === "low") return "bg-red-50 text-red-700";
  return "bg-gray-50 text-gray-600";
}

export default function ActivityPage() {
  const [actions, setActions] = useState<AgentActionItem[]>([]);
  const [mockMode, setMockMode] = useState(false);

  const refresh = async () => {
    setActions(await getAgentActions(200));
    setMockMode(isUsingMockData());
  };

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Activity Log"
        description="Every action the agent takes across all capabilities — with timestamp, load, confidence, and result."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          {actions.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-sm text-[#6B7280]">No agent activity logged yet.</p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-[#E5E7EB]">
                {actions.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        CAP_TONE[a.capability] ?? "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {a.capability}
                    </span>
                    <span className="text-sm font-medium text-[#1A2B4A]">{a.action}</span>
                    {a.load_ref && <span className="text-xs text-[#6B7280]">{a.load_ref}</span>}
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
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
