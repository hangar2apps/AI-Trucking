"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Fuel,
  Home,
  MapPin,
  Settings,
  Shield,
  Truck as TruckIcon,
  Wrench,
} from "lucide-react";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { formatTruckStatus, truckStatusColor } from "@/components/dashboard/truck-utils";
import { TourCoach } from "@/components/tour/TourCoach";
import { tourSteps } from "@/lib/tour-steps";
import { PRODUCT_NAME } from "@/lib/brand";
import { getTrucks, isUsingMockData } from "@/lib/data-provider";
import { DEMO_ROUTE } from "@/lib/mock-data";
import type { Truck } from "@/lib/api";
import { cn } from "@/lib/utils";

const navIcons = [
  { icon: Home, label: "Home" },
  { icon: MapPin, label: "Map", active: true },
  { icon: TruckIcon, label: "Assets" },
  { icon: FileText, label: "Documents" },
  { icon: Wrench, label: "Maintenance" },
  { icon: Shield, label: "Safety" },
  { icon: Fuel, label: "Fuel" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

export function DemoTourClient() {
  const [step, setStep] = useState(1);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [mockMode, setMockMode] = useState(false);
  const [featured, setFeatured] = useState<Truck | null>(null);

  useEffect(() => {
    getTrucks().then((data) => {
      setTrucks(data);
      setMockMode(isUsingMockData());
      const hero =
        data.find((t) => t.name === "Truck 17") ??
        data.find((t) => t.status === "en_route") ??
        data[0] ??
        null;
      setFeatured(hero);
    });
  }, []);

  const current = tourSteps[step - 1];
  const highlight = current.highlight;

  return (
    <div className="flex h-screen flex-col bg-[#F3F4F6]">
      {mockMode && <MockDataBanner />}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B5FFF] text-xs font-bold text-white">
            a
          </div>
          <span className="font-semibold text-[#1A2B4A]">{PRODUCT_NAME}</span>
          <span className="ml-2 rounded bg-[#E8F4FC] px-2 py-0.5 text-xs text-[#0B5FFF]">
            Interactive Demo
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/survey/1" className="text-sm text-[#0B5FFF] hover:underline">
            Home
          </Link>
          {(highlight === "video" || highlight === "trip-media" || step >= 8) && (
            <Link
              href="/app/trip-media"
              className="text-sm text-[#0B5FFF] hover:underline"
            >
              Trip media →
            </Link>
          )}
          <Link href="/app" className="text-sm text-[#0B5FFF] hover:underline">
            Skip to live dashboard →
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="flex w-14 flex-col items-center gap-4 border-r bg-[#1A2B4A] py-4">
          {navIcons.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              title={label}
              className={cn(
                "rounded-lg p-2",
                active ? "bg-[#0B5FFF] text-white" : "text-[#9CA3AF] hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </nav>

        <aside
          className={cn(
            "w-72 overflow-y-auto border-r bg-white p-4 transition-all",
            (highlight === "diagnostics" || highlight === "proximity") &&
              "ring-2 ring-[#0B5FFF] ring-inset"
          )}
        >
          <h2 className="mb-4 text-sm font-semibold text-[#1A2B4A]">
            Search {trucks.length || 4} assets
          </h2>
          {featured && (
            <div
              className={cn(
                "mb-3 rounded-lg border p-3",
                highlight === "vehicle" || highlight === "card"
                  ? "border-[#0B5FFF] bg-[#0B5FFF]/5"
                  : "border-[#E5E7EB]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1A2B4A]">{featured.name}</span>
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs capitalize text-white",
                    truckStatusColor(featured.status)
                  )}
                >
                  {formatTruckStatus(featured.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">{featured.driver_name}</p>
            </div>
          )}

          {(highlight === "diagnostics" || step >= 5) && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded border border-[#0B5FFF] p-3">
                <h3 className="font-semibold text-[#1A2B4A]">Diagnostics</h3>
                <dl className="mt-2 space-y-1 text-xs text-[#4B5563]">
                  <div className="flex justify-between">
                    <dt>Engine State</dt>
                    <dd>Running</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Fuel</dt>
                    <dd>67%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Odometer</dt>
                    <dd>35,968 mi</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded border border-red-200 bg-red-50 p-3">
                <h3 className="font-semibold text-[#1A2B4A]">Active Faults</h3>
                <p className="mt-1 text-xs text-red-700">
                  SPN: 5031 — Aftertreatment sensor fault
                </p>
              </div>
            </div>
          )}

          {(highlight === "proximity" || step >= 6) && (
            <div className="mt-4 rounded border p-3">
              <h3 className="text-sm font-semibold">Proximity Search</h3>
              <p className="mt-1 text-xs text-[#6B7280]">
                Search for assets near a map location
              </p>
              <Link
                href="/app/proximity"
                className="mt-2 inline-block text-xs text-[#0B5FFF] hover:underline"
              >
                Open proximity search →
              </Link>
            </div>
          )}
        </aside>

        <main
          className={cn(
            "relative flex-1",
            (highlight === "map" || highlight === "map-click") &&
              "ring-4 ring-[#0B5FFF]/30 ring-inset"
          )}
        >
          <FleetMap
            trucks={trucks}
            selectedId={featured?.id}
            onSelect={setFeatured}
            route={DEMO_ROUTE}
          />

          {(highlight === "traffic" || step >= 2) && (
            <div className="absolute top-4 right-4 z-10 rounded-lg bg-white/90 p-4 shadow">
              <p className="mb-2 text-xs font-semibold uppercase">Overlay</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked readOnly />
                Traffic
              </label>
            </div>
          )}
          {(highlight === "card" || step >= 4) && (
            <div className="absolute top-20 right-8 z-10 w-56 rounded-lg bg-white p-3 shadow-lg">
              <video
                className="h-24 w-full rounded object-cover"
                src="/demo/dashcam.mp4"
                muted
                loop
                autoPlay
                playsInline
              />
              <p className="mt-2 text-xs text-[#6B7280]">Live dashcam preview</p>
            </div>
          )}

          <TourCoach
            step={step}
            total={tourSteps.length}
            title={current.title}
            body={current.body}
            onBack={() => setStep((s) => Math.max(1, s - 1))}
            onNext={() => setStep((s) => Math.min(tourSteps.length, s + 1))}
            onClose={() => setStep(1)}
            isLast={step === tourSteps.length}
          />
        </main>
      </div>
    </div>
  );
}
