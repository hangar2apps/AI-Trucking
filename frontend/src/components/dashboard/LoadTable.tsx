"use client";

import Link from "next/link";
import type { Load } from "@/lib/api";
import { DEMO_LOAD_REFERENCE } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  delayed: "bg-red-100 text-red-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  pending: "bg-gray-100 text-gray-700",
  assigned: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
};

interface LoadTableProps {
  loads: Load[];
}

export function LoadTable({ loads }: LoadTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-[#F9FAFB]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Reference</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Route</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Status</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Deliver by</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]"></th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load) => (
            <tr
              key={load.id}
              className={cn(
                "border-b last:border-0 hover:bg-[#F9FAFB]",
                load.reference === DEMO_LOAD_REFERENCE && "bg-red-50/50"
              )}
            >
              <td className="px-4 py-3 font-medium text-[#1A2B4A]">
                <span className="flex items-center gap-2">
                  {load.reference}
                  {load.reference === DEMO_LOAD_REFERENCE && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Demo
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-[#4B5563]">
                {load.origin_name} → {load.dest_name}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    statusColors[load.status] ?? "bg-gray-100"
                  )}
                >
                  {load.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-[#4B5563]">
                {new Date(load.deliver_by).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/app/loads/${load.id}`}
                  className="text-[#0B5FFF] hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
