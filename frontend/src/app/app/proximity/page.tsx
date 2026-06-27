"use client";

import { useEffect, useState } from "react";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getTrucks, isUsingMockData } from "@/lib/data-provider";
import { haversineMeters } from "@/lib/geo";
import type { Truck } from "@/lib/api";

export default function ProximityPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [clickPoint, setClickPoint] = useState<{ lat: number; lng: number } | null>({
    lat: 31.55,
    lng: -96.2,
  });
  const [distance, setDistance] = useState(100000);
  const [nearby, setNearby] = useState<Truck[]>([]);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    getTrucks()
      .then((data) => {
        setTrucks(data);
        setMockMode(isUsingMockData());
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!clickPoint) {
      setNearby([]);
      return;
    }
    setNearby(
      trucks.filter((t) => {
        if (t.current_lat == null || t.current_lng == null) return false;
        return (
          haversineMeters(
            clickPoint.lat,
            clickPoint.lng,
            t.current_lat,
            t.current_lng
          ) <= distance
        );
      })
    );
  }, [trucks, clickPoint, distance]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 overflow-y-auto border-r bg-white p-4">
          <h1 className="text-lg font-semibold text-[#1A2B4A]">Proximity Search</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Search for assets near a map location.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6B7280]">
                Distance (meters)
              </label>
              <select
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value={50000}>50,000</option>
                <option value={100000}>100,000</option>
                <option value={200000}>200,000</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B7280]">
                Map center
              </label>
              <p className="mt-1 text-xs text-[#4B5563]">
                {clickPoint
                  ? `${clickPoint.lat.toFixed(2)}, ${clickPoint.lng.toFixed(2)}`
                  : "Select a preset below"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-[#1A2B4A]">
              Nearby assets ({nearby.length})
            </h2>
            <ul className="mt-2 space-y-2">
              {nearby.map((t) => (
                <li key={t.id} className="rounded border p-2 text-sm">
                  {t.name} — {t.driver_name}
                </li>
              ))}
              {nearby.length === 0 && (
                <li className="text-sm text-[#6B7280]">No assets in range</li>
              )}
            </ul>
          </div>
        </aside>
        <div className="relative flex-1">
          <FleetMap trucks={trucks} clickPoint={clickPoint} radiusMeters={distance} />
          <div className="absolute bottom-4 left-4 flex gap-2">
            {[
              { lat: 31.55, lng: -96.2, label: "Dallas area" },
              { lat: 30.27, lng: -97.74, label: "Austin area" },
            ].map((pt) => (
              <button
                key={pt.label}
                type="button"
                onClick={() => setClickPoint({ lat: pt.lat, lng: pt.lng })}
                className="rounded-full bg-white px-3 py-1 text-xs shadow hover:bg-[#E8F4FC]"
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
