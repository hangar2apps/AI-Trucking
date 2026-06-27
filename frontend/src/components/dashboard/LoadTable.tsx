"use client";

import Link from "next/link";
import type { Load } from "@/lib/api";
import { DEMO_LOAD_REFERENCE } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface LoadTableProps {
  loads: Load[];
}

export function LoadTable({ loads }: LoadTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Reference
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Route
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold tracking-wide text-[#6B7280] uppercase">
                Deliver by
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {loads.map((load) => (
              <tr
                key={load.id}
                className={cn(
                  "transition-colors hover:bg-[#F9FAFB]",
                  load.reference === DEMO_LOAD_REFERENCE && "bg-amber-50/40"
                )}
              >
                <td className="px-5 py-4 font-medium text-[#1A2B4A]">
                  <span className="flex items-center gap-2">
                    {load.reference}
                    {load.reference === DEMO_LOAD_REFERENCE && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 uppercase">
                        Hero load
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#4B5563]">
                  {load.origin_name} → {load.dest_name}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={load.status} />
                </td>
                <td className="px-5 py-4 text-[#4B5563]">
                  {new Date(load.deliver_by).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/app/loads/${load.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0B5FFF] hover:underline"
                  >
                    View
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loads.map((load) => (
          <Link
            key={load.id}
            href={`/app/loads/${load.id}`}
            className={cn(
              "block rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
              load.reference === DEMO_LOAD_REFERENCE && "border-amber-200 bg-amber-50/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-[#1A2B4A]">{load.reference}</span>
              <StatusBadge status={load.status} />
            </div>
            <p className="mt-2 text-sm text-[#6B7280]">
              {load.origin_name} → {load.dest_name}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
