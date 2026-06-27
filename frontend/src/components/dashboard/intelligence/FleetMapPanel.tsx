"use client";

import { useEffect, useState } from "react";
import { AssetList } from "@/components/dashboard/AssetList";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  findDemoLoad,
  getSimStatus,
  getTrucks,
  isUsingMockData,
  startSimulation,
  stopSimulation,
} from "@/lib/data-provider";
import { routePolyline } from "@/lib/geo";
import type { Load, Truck } from "@/lib/api";

export function FleetMapPanel() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [demoLoad, setDemoLoad] = useState<Load | null>(null);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [search, setSearch] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simRunning, setSimRunning] = useState(false);

  const refreshFleet = async () => {
    const [data, load] = await Promise.all([getTrucks(), findDemoLoad()]);
    setTrucks(data);
    setDemoLoad(load ?? null);
    setMockMode(isUsingMockData());
    setSelected((prev) => prev ?? data[0] ?? null);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshFleet();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mockMode) return;
    getSimStatus()
      .then((s) => setSimRunning(s.running))
      .catch(() => undefined);
    const id = window.setInterval(() => {
      refreshFleet().catch(() => undefined);
      getSimStatus()
        .then((s) => setSimRunning(s.running))
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(id);
  }, [mockMode]);

  const route =
    demoLoad != null
      ? routePolyline(
          { lat: demoLoad.origin_lat, lng: demoLoad.origin_lng },
          { lat: demoLoad.dest_lat, lng: demoLoad.dest_lng }
        )
      : undefined;

  const toggleSim = async () => {
    const status = simRunning ? await stopSimulation() : await startSimulation();
    setSimRunning(status.running);
    await refreshFleet();
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[#6B7280]">Live fleet</span>
        {demoLoad && (
          <>
            <span className="text-[#D1D5DB]">·</span>
            <span className="font-medium text-[#1A2B4A]">{demoLoad.reference}</span>
            <StatusBadge status={demoLoad.status} />
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={simRunning ? "text-sm text-emerald-600" : "text-sm text-[#6B7280]"}>
          Simulation {simRunning ? "on" : "off"}
        </span>
        {!mockMode && (
          <Button variant="secondary" size="sm" onClick={toggleSim}>
            {simRunning ? "Stop" : "Start"} sim
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell
      toolbar={toolbar}
      sidebar={
        loading ? (
          <div className="p-6 text-sm text-[#6B7280]">Loading fleet...</div>
        ) : (
          <AssetList
            trucks={trucks}
            selectedId={selected?.id}
            onSelect={setSelected}
            search={search}
            onSearchChange={setSearch}
          />
        )
      }
      map={
        <FleetMap
          trucks={trucks}
          selectedId={selected?.id}
          onSelect={setSelected}
          route={route}
        />
      }
    />
  );
}
