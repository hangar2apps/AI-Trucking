"use client";

import type { Load, Truck } from "@/lib/api";
import { SpeedChart } from "@/components/dashboard/SpeedChart";

interface DashboardAnalyticsProps {
  loads: Load[];
  trucks: Truck[];
}

export function DashboardAnalytics({ loads, trucks }: DashboardAnalyticsProps) {
  const activeLoads = loads.filter((l) =>
    ["assigned", "in_transit", "delayed"].includes(l.status)
  ).length;
  const delayed = loads.filter((l) => l.status === "delayed").length;
  const enRoute = trucks.filter((t) => t.status === "en_route").length;
  const delivered = loads.filter((l) => l.status === "delivered").length;
  const onTimePct =
    loads.length > 0
      ? Math.round(((loads.length - delayed) / loads.length) * 100)
      : 0;

  const metrics = [
    { label: "Active loads", value: String(activeLoads), hint: "Assigned or in transit" },
    { label: "Delayed", value: String(delayed), hint: "Needs attention" },
    { label: "Trucks en route", value: String(enRoute), hint: "Live on the road" },
    { label: "Delivered", value: String(delivered), hint: "Completed shipments" },
    { label: "On-time rate", value: `${onTimePct}%`, hint: "Fleet performance" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
              {m.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-[#1A2B4A]">{m.value}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="font-semibold text-[#1A2B4A]">Fleet analytics</h2>
          <p className="text-sm text-[#6B7280]">Average speed trend across active trucks</p>
        </div>
        <div className="p-5">
          <SpeedChart />
        </div>
        <div className="overflow-x-auto border-t border-[#E5E7EB]">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">
                  Metric
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">
                  Today
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">
                  7-day avg
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {[
                ["Miles driven", "12,480", "11,920", "↑ 4.7%"],
                ["Fuel efficiency", "6.8 mpg", "6.6 mpg", "↑ 3.0%"],
                ["Idle time", "2.1 hr", "2.4 hr", "↓ 12%"],
                ["Customer emails sent", "18", "14", "↑ 29%"],
              ].map(([metric, today, avg, trend]) => (
                <tr key={metric} className="hover:bg-[#F9FAFB]">
                  <td className="px-5 py-3 font-medium text-[#1A2B4A]">{metric}</td>
                  <td className="px-5 py-3 text-[#4B5563]">{today}</td>
                  <td className="px-5 py-3 text-[#4B5563]">{avg}</td>
                  <td className="px-5 py-3 text-emerald-600">{trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
