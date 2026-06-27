"use client";

import type { Truck } from "@/lib/api";
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
    <div className="flex h-full flex-col border-r bg-white">
      <div className="border-b p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${trucks.length} assets`}
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((truck) => (
          <button
            key={truck.id}
            type="button"
            onClick={() => onSelect(truck)}
            className={cn(
              "mb-2 w-full rounded-lg border p-3 text-left transition-colors",
              selectedId === truck.id
                ? "border-[#0B5FFF] bg-[#0B5FFF]/5"
                : "border-[#E5E7EB] hover:border-[#0B5FFF]/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#1A2B4A]">{truck.name}</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs text-white",
                  truck.status === "en_route"
                    ? "bg-[#22C55E]"
                    : truck.status === "available"
                      ? "bg-[#0B5FFF]"
                      : "bg-[#9CA3AF]"
                )}
              >
                {truck.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">{truck.driver_name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
