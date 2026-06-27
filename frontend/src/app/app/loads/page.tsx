"use client";

import { useEffect, useState } from "react";
import { LoadTable } from "@/components/dashboard/LoadTable";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getLoads, isUsingMockData } from "@/lib/data-provider";
import type { Load } from "@/lib/api";

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoads()
      .then((data) => {
        setLoads(data);
        setMockMode(isUsingMockData());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-6">
        <h1 className="mb-6 text-xl font-semibold text-[#1A2B4A]">Loads</h1>
        {loading && <p className="text-sm text-[#6B7280]">Loading...</p>}
        {!loading && <LoadTable loads={loads} />}
      </div>
    </div>
  );
}
