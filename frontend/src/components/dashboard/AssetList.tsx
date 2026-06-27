"use client";

import { Search } from "lucide-react";
import type { Truck } from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

interface AssetListProps {
  trucks: Truck[];
  selectedId?: number | null;
  onSelect: (truck: Truck) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

export function AssetList({
  trucks,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: AssetListProps) {
  const filtered = trucks.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.driver_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#E5E7EB] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${trucks.length} assets`}
            className="w-full rounded-lg border border-[#E5E7EB] py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF]/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.map((truck) => (
          <button
            key={truck.id}
            type="button"
            onClick={() => onSelect(truck)}
            className={cn(
              "mb-2 w-full rounded-xl border p-3.5 text-left transition-all",
              selectedId === truck.id
                ? "border-[#0B5FFF] bg-[#E8F4FC] shadow-sm"
                : "border-[#E5E7EB] hover:border-[#0B5FFF]/30 hover:shadow-sm"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#1A2B4A]">{truck.name}</span>
              <StatusBadge status={truck.status} />
            </div>
            <p className="mt-1.5 text-xs text-[#6B7280]">{truck.driver_name}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-[#6B7280]">No assets match your search.</p>
        )}
      </div>
    </div>
  );
}
