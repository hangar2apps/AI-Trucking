"use client";

import { useEffect, useState } from "react";
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics";
import { LoadTable } from "@/components/dashboard/LoadTable";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { getLoads, getTrucks, isUsingMockData } from "@/lib/data-provider";
import type { Load, Truck } from "@/lib/api";

export default function DashboardPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLoads(), getTrucks()])
      .then(([loadData, truckData]) => {
        setLoads(loadData);
        setTrucks(truckData);
        setMockMode(isUsingMockData());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Dashboard"
        description="Operations overview, fleet analytics, and active loads."
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading dashboard...</p>
        ) : (
          <>
            <DashboardAnalytics loads={loads} trucks={trucks} />
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A2B4A]">Loads</h2>
                  <p className="text-sm text-[#6B7280]">
                    Active shipments synced from the A-TMS backend.
                  </p>
                </div>
              </div>
              <LoadTable loads={loads} />
            </section>
          </>
        )}
      </div>
    </>
  );
}
