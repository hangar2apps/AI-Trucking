"use client";

import type { Truck } from "@/lib/api";
import { boundsFromPoints, projectToPercent } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface FleetMapProps {
  trucks: Truck[];
  selectedId?: number | null;
  onSelect?: (truck: Truck) => void;
  clickPoint?: { lat: number; lng: number } | null;
  radiusMeters?: number;
  route?: { lat: number; lng: number }[];
}

export function FleetMap({
  trucks,
  selectedId,
  onSelect,
  clickPoint,
  radiusMeters,
  route,
}: FleetMapProps) {
  const truckPoints = trucks
    .filter((t) => t.current_lat != null && t.current_lng != null)
    .map((t) => ({ lat: t.current_lat!, lng: t.current_lng! }));

  const allPoints = [...truckPoints];
  if (clickPoint) allPoints.push(clickPoint);
  if (route) allPoints.push(...route);

  const bounds = boundsFromPoints(allPoints);

  const routePath =
    route && route.length > 1
      ? route
          .map((p) => {
            const { x, y } = projectToPercent(p.lat, p.lng, bounds);
            return `${x},${y}`;
          })
          .join(" ")
      : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#E8F4FC] via-[#F0FDF4] to-[#DBEAFE]">
      <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94A3B8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {routePath && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={routePath}
            fill="none"
            stroke="#0B5FFF"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {clickPoint && radiusMeters && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-[#0B5FFF]/50 bg-[#0B5FFF]/10"
          style={{
            left: `${projectToPercent(clickPoint.lat, clickPoint.lng, bounds).x}%`,
            top: `${projectToPercent(clickPoint.lat, clickPoint.lng, bounds).y}%`,
            width: `${Math.min(radiusMeters / 500, 30)}%`,
            height: `${Math.min(radiusMeters / 500, 30)}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {trucks.map((truck) => {
        if (truck.current_lat == null || truck.current_lng == null) return null;
        const pos = projectToPercent(truck.current_lat, truck.current_lng, bounds);
        const isSelected = truck.id === selectedId;

        return (
          <button
            key={truck.id}
            type="button"
            onClick={() => onSelect?.(truck)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div
              className={cn(
                "h-4 w-4 rounded-full ring-4 ring-white",
                truck.status === "available"
                  ? "bg-[#0B5FFF]"
                  : truck.status === "en_route"
                    ? "bg-[#22C55E]"
                    : "bg-[#9CA3AF]"
              )}
            />
            <span
              className={cn(
                "absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-xs text-white",
                isSelected ? "bg-[#0B5FFF]" : "bg-[#1A2B4A]"
              )}
            >
              {truck.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
