"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FleetMapPanel } from "@/components/dashboard/intelligence/FleetMapPanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  checkWeatherForLoad,
  computeEtaForLoad,
  findDemoLoad,
  getLoads,
  isUsingMockData,
} from "@/lib/data-provider";
import { routePolyline } from "@/lib/geo";
import type { ComputeEtaResult, Load, WeatherRouteResult } from "@/lib/api";
import { CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "map", label: "Fleet map" },
  { id: "routes", label: "Routes & ETA" },
  { id: "weather", label: "Weather" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function RoutesPanel() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selected, setSelected] = useState<Load | null>(null);
  const [eta, setEta] = useState<ComputeEtaResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLoads()
      .then(async (data) => {
        setLoads(data);
        setMockMode(isUsingMockData());
        setSelected((await findDemoLoad()) ?? data[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const route =
    selected != null
      ? routePolyline(
          { lat: selected.origin_lat, lng: selected.origin_lng },
          { lat: selected.dest_lat, lng: selected.dest_lng }
        )
      : undefined;

  return (
    <DashboardShell
      sidebar={
        <div className="p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-[#6B7280]">Loading loads...</p>
          ) : (
            <>
              <ul className="space-y-2">
                {loads.map((load) => (
                  <li key={load.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(load);
                        setEta(null);
                      }}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-all",
                        selected?.id === load.id
                          ? "border-[#0B5FFF] bg-[#E8F4FC] shadow-sm"
                          : "border-[#E5E7EB] hover:border-[#0B5FFF]/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#1A2B4A]">{load.reference}</span>
                        <StatusBadge status={load.status} />
                      </div>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {load.origin_name} → {load.dest_name}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {selected && (
                <div className="mt-5 space-y-3 border-t border-[#E5E7EB] pt-5">
                  <Button
                    className="w-full"
                    disabled={!selected.assigned_truck_id || computing || mockMode}
                    onClick={async () => {
                      if (!selected.assigned_truck_id) return;
                      setComputing(true);
                      setError(null);
                      try {
                        setEta(
                          await computeEtaForLoad(selected, selected.assigned_truck_id)
                        );
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "ETA request failed");
                      } finally {
                        setComputing(false);
                      }
                    }}
                  >
                    {computing ? "Computing..." : "Compute ETA"}
                  </Button>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  {eta && !eta.error && (
                    <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p>
                        {eta.distance_mi} mi · {eta.drive_hours} hr drive
                      </p>
                      <p className="mt-1 font-semibold">
                        ETA {eta.eta ? new Date(eta.eta).toLocaleString() : "—"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      }
      map={
        selected ? (
          <FleetMap trucks={[]} route={route} />
        ) : (
          <div className="flex h-full items-center justify-center text-[#6B7280]">
            Select a load
          </div>
        )
      }
    />
  );
}

function WeatherPanel() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [selected, setSelected] = useState<Load | null>(null);
  const [weather, setWeather] = useState<WeatherRouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLoads()
      .then(async (data) => {
        setLoads(data);
        setMockMode(isUsingMockData());
        setSelected((await findDemoLoad()) ?? data[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected || mockMode) return;
    let cancelled = false;
    void (async () => {
      setChecking(true);
      setError(null);
      try {
        const result = await checkWeatherForLoad(selected);
        if (!cancelled) setWeather(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Weather check failed");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, mockMode]);

  const route =
    selected != null
      ? routePolyline(
          { lat: selected.origin_lat, lng: selected.origin_lng },
          { lat: selected.dest_lat, lng: selected.dest_lng }
        )
      : undefined;

  const severe = weather?.status === "severe";

  return (
    <DashboardShell
      sidebar={
        <div className="p-4 sm:p-5">
          {loading ? (
            <p className="text-sm text-[#6B7280]">Loading...</p>
          ) : (
            <>
              <ul className="mb-4 space-y-2">
                {loads.map((load) => (
                  <li key={load.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(load)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all",
                        selected?.id === load.id
                          ? "border-[#0B5FFF] bg-[#E8F4FC]"
                          : "border-[#E5E7EB]"
                      )}
                    >
                      <span className="font-medium text-[#1A2B4A]">{load.reference}</span>
                      <p className="mt-0.5 text-[#6B7280]">
                        {load.origin_name} → {load.dest_name}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {checking && (
                <p className="text-sm text-[#6B7280]">Checking route conditions...</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {weather && !mockMode && (
                <Card>
                  <CardBody>
                    <div className="mb-3 flex items-center gap-2">
                      <CloudRain className="h-5 w-5 text-[#0B5FFF]" />
                      <StatusBadge status={weather.status} />
                    </div>
                    {weather.incidents.map((inc, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <p className="font-medium text-[#1A2B4A]">{inc.label}</p>
                        <p className="text-xs text-[#6B7280]">
                          {inc.severity}
                          {inc.eta_impact_minutes != null &&
                            ` · +${inc.eta_impact_minutes} min impact`}
                        </p>
                      </div>
                    ))}
                    <p className="mt-3 text-xs text-[#9CA3AF]">{weather.note}</p>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      }
      map={
        selected ? (
          <FleetMap
            trucks={[]}
            route={route}
            clickPoint={
              severe
                ? {
                    lat: (selected.origin_lat + selected.dest_lat) / 2,
                    lng: (selected.origin_lng + selected.dest_lng) / 2,
                  }
                : null
            }
            radiusMeters={severe ? 80000 : undefined}
          />
        ) : null
      }
    />
  );
}

function IntelligenceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? (tabParam as TabId) : "map"
  );
  const mockMode = isUsingMockData();

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Intelligence"
        description="Live fleet map, route optimization, and weather-aware routing."
      />
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-[#0B5FFF] text-[#0B5FFF]"
                : "border-transparent text-[#6B7280] hover:text-[#1A2B4A]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "map" && <FleetMapPanel />}
        {tab === "routes" && <RoutesPanel />}
        {tab === "weather" && <WeatherPanel />}
      </div>
    </>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#6B7280]">Loading...</div>}>
      <IntelligenceContent />
    </Suspense>
  );
}
