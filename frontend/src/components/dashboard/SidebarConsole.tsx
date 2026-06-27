"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Mail,
  PackageCheck,
  Play,
  Radar,
  Search,
  Truck as TruckIcon,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getEvents } from "@/lib/data-provider";
import { api } from "@/lib/api";
import type { FleetEvent } from "@/lib/api";

const LEVEL: Record<string, { Icon: LucideIcon; cls: string }> = {
  scan: { Icon: Radar, cls: "text-slate-400" },
  check: { Icon: Search, cls: "text-slate-300" },
  info: { Icon: Search, cls: "text-slate-400" },
  alert: { Icon: AlertTriangle, cls: "text-red-400" },
  decision: { Icon: GitBranch, cls: "text-sky-400" },
  action: { Icon: Zap, cls: "text-amber-400" },
  success: { Icon: CheckCircle2, cls: "text-emerald-400" },
};

const KIND: Record<string, { Icon: LucideIcon; cls: string }> = {
  reassignment: { Icon: TruckIcon, cls: "text-indigo-300" },
  email_sent: { Icon: Mail, cls: "text-sky-300" },
  delivered: { Icon: PackageCheck, cls: "text-emerald-300" },
  delay_detected: { Icon: AlertTriangle, cls: "text-amber-300" },
};

function meta(e: FleetEvent): { Icon: LucideIcon; cls: string } {
  if (e.kind === "reasoning") {
    return LEVEL[(e.data?.level as string) ?? "info"] ?? LEVEL.info;
  }
  return KIND[e.kind] ?? { Icon: Zap, cls: "text-slate-300" };
}

export function SidebarConsole() {
  const [shown, setShown] = useState<FleetEvent[]>([]);
  const [running, setRunning] = useState(false);

  const pending = useRef<FleetEvent[]>([]);
  const lastId = useRef(0);
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    // Only stream events that happen after the console mounts.
    (async () => {
      const existing = await getEvents(0);
      lastId.current = existing.length ? existing[existing.length - 1].id : 0;
    })();

    const poll = setInterval(async () => {
      const evs = await getEvents(lastId.current);
      if (!active || evs.length === 0) return;
      lastId.current = evs[evs.length - 1].id;
      pending.current.push(...evs);
    }, 1500);

    const reveal = setInterval(() => {
      const next = pending.current.shift();
      if (next) setShown((s) => [...s.slice(-80), next]);
    }, 350);

    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(reveal);
    };
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [shown.length]);

  async function run() {
    setRunning(true);
    try {
      await api.monitorTick();
    } catch {
      /* backend down — ignore */
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col px-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B82A8]">
          AI Console
        </span>
        <button
          type="button"
          onClick={run}
          disabled={running}
          title="Run the autonomous monitor"
          className="flex items-center gap-1 rounded-full bg-[#0B5FFF] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#0847CC] disabled:opacity-50"
        >
          <Play className="h-3 w-3" />
          {running ? "…" : "Run"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-[#0B1220]/80 p-2.5 font-mono text-[11px] leading-snug">
        {shown.length === 0 ? (
          <p className="text-slate-500">Idle — press Run to watch the AI assess the fleet.</p>
        ) : (
          <div className="space-y-1.5">
            {shown.map((e, i) => {
              const { Icon, cls } = meta(e);
              return (
                <div key={`${e.id}-${i}`} className="flex items-start gap-1.5">
                  <Icon className={`mt-0.5 h-3 w-3 shrink-0 ${cls}`} />
                  <span
                    className={
                      e.kind === "reasoning" ? "text-slate-300" : `font-medium ${cls}`
                    }
                  >
                    {e.summary}
                  </span>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>
        )}
      </div>
    </div>
  );
}
