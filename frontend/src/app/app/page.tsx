"use client";

import { useEffect, useState } from "react";
import { AssetList } from "@/components/dashboard/AssetList";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getTrucks, isUsingMockData } from "@/lib/data-provider";
import { DEMO_ROUTE } from "@/lib/mock-data";
import type { Truck } from "@/lib/api";

export default function FleetMapPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [search, setSearch] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrucks()
      .then((data) => {
        setTrucks(data);
        setMockMode(isUsingMockData());
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0">
          {loading ? (
            <div className="p-4 text-sm text-[#6B7280]">Loading fleet...</div>
          ) : (
            <AssetList
              trucks={trucks}
              selectedId={selected?.id}
              onSelect={setSelected}
              search={search}
              onSearchChange={setSearch}
            />
          )}
        </div>
        <div className="relative flex-1">
          <FleetMap
            trucks={trucks}
            selectedId={selected?.id}
            onSelect={setSelected}
            route={DEMO_ROUTE}
          />
        </div>
      </div>
    </>
  );
}
