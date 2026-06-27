import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getLoads, getTrucks, isUsingMockData } from "@/lib/data-provider";
import type { Load, Truck } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-50 text-blue-700",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-red-100 text-red-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-400",
};

type Filter = "all" | "at_risk" | "active" | "delivered";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "at_risk", label: "At risk" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
];

function isAtRisk(l: Load): boolean {
  if (l.status === "delayed") return true;
  if (l.status === "delivered" || l.status === "cancelled") return false;
  return l.eta != null && new Date(l.eta) > new Date(l.deliver_by);
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function lateBy(l: Load): string | null {
  if (!isAtRisk(l) || !l.eta) return null;
  const mins = Math.round((new Date(l.eta).getTime() - new Date(l.deliver_by).getTime()) / 60000);
  if (mins <= 0) return null;
  return mins < 60 ? `+${mins}m late` : `+${(mins / 60).toFixed(1)}h late`;
}

export default function LoadsPage() {
  const router = useRouter();
  const [loads, setLoads] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    async function load() {
      const [l, t] = await Promise.all([getLoads(), getTrucks()]);
      if (!active) return;
      setLoads(l);
      setTrucks(t);
      setMockMode(isUsingMockData());
      setLoading(false);
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const truckNumber = useMemo(() => {
    const map = new Map(trucks.map((t) => [t.id, t.name.replace(/^Truck\s+/i, "")]));
    return (id: number | null) => (id != null ? map.get(id) ?? `${id}` : "—");
  }, [trucks]);

  const atRiskCount = useMemo(() => loads.filter(isAtRisk).length, [loads]);

  const visible = loads.filter((l) => {
    if (filter === "at_risk") return isAtRisk(l);
    if (filter === "active") return l.status !== "delivered" && l.status !== "cancelled";
    if (filter === "delivered") return l.status === "delivered";
    return true;
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold text-[#1A2B4A]">Loads</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {loads.length} total · {atRiskCount} at risk
        </p>

        {/* Filters */}
        <div className="mt-5 flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                filter === key
                  ? "bg-[#0B5FFF] text-white"
                  : "border border-[#E5E7EB] text-[#4B5563] hover:border-[#0B5FFF]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <tr>
                {["Load #", "Lane", "Truck", "Status", "ETA", "Deliver by"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-[#6B7280]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
                    Loading loads…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
                    No loads match this filter.
                  </td>
                </tr>
              ) : (
                visible.map((l) => {
                  const late = lateBy(l);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => router.push(`/app/loads/${l.id}`)}
                      className="cursor-pointer border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB]"
                    >
                      <td className="px-4 py-3 font-medium text-[#1A2B4A]">{l.reference}</td>
                      <td className="px-4 py-3 text-[#4B5563]">
                        {l.origin_name} → {l.dest_name}
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{truckNumber(l.assigned_truck_id)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            STATUS_PILL[l.status] ?? "bg-gray-100 text-gray-600"
                          )}
                        >
                          {l.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(late ? "font-medium text-red-600" : "text-[#4B5563]")}>
                          {fmt(l.eta)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{fmt(l.deliver_by)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}
