"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck as TruckIcon,
} from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getEvents, getLoads, getTrucks, isUsingMockData } from "@/lib/data-provider";
import type { FleetEvent, Load, Truck } from "@/lib/api";

const LOAD_STATUS_COLORS: Record<string, string> = {
  pending: "#6B7280",
  assigned: "#0B5FFF",
  in_transit: "#0B5FFF",
  delayed: "#DC2626",
  delivered: "#22C55E",
  cancelled: "#9CA3AF",
};

function isAtRisk(l: Load): boolean {
  if (l.status === "delayed") return true;
  if (l.status === "delivered" || l.status === "cancelled") return false;
  return l.eta != null && new Date(l.eta) > new Date(l.deliver_by);
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const [l, t, e] = await Promise.all([getLoads(), getTrucks(), getEvents()]);
      if (!active) return;
      setLoads(l);
      setTrucks(t);
      setEvents(e);
      setMockMode(isUsingMockData());
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const activeLoads = loads.filter((l) => l.status !== "delivered" && l.status !== "cancelled");
  const atRisk = loads.filter(isAtRisk);
  const enRoute = trucks.filter((t) => t.status === "en_route");
  const available = trucks.filter((t) => t.status === "available");

  const stats = [
    { label: "Active loads", value: activeLoads.length, icon: Package, color: "#0B5FFF" },
    { label: "At risk", value: atRisk.length, icon: AlertTriangle, color: "#DC2626" },
    { label: "Trucks en route", value: enRoute.length, icon: TruckIcon, color: "#1A2B4A" },
    { label: "Trucks available", value: available.length, icon: CheckCircle2, color: "#22C55E" },
  ];

  const byStatus = Object.entries(
    loads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {})
  );
  // Milestones only — the granular reasoning trace lives in the sidebar console.
  const recent = [...events].filter((e) => e.kind !== "reasoning").reverse().slice(0, 8);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-[#1A2B4A]">Operations overview</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Live fleet and load status.</p>

        {/* KPI cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">{label}</span>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <p className="mt-2 text-3xl font-bold" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Loads by status */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-[#1A2B4A]">Loads by status</h2>
              <Link href="/app/loads" className="text-sm text-[#0B5FFF] hover:underline">
                View loads →
              </Link>
            </div>
            {byStatus.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No loads.</p>
            ) : (
              <div className="space-y-3">
                {byStatus.map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-24 text-sm capitalize text-[#4B5563]">
                      {status.replace("_", " ")}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / loads.length) * 100}%`,
                          backgroundColor: LOAD_STATUS_COLORS[status] ?? "#6B7280",
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-medium text-[#1A2B4A]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI activity */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="mb-4 font-semibold text-[#1A2B4A]">AI activity</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                No agent actions yet. Reassignments and customer emails will appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {recent.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: e.kind === "reassignment" ? "#0B5FFF" : "#22C55E" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#1A2B4A]">{e.summary}</p>
                      <p className="text-xs text-[#9CA3AF]">{timeAgo(e.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
