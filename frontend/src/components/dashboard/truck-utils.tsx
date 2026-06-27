import type { Truck } from "@/lib/api";
import { cn } from "@/lib/utils";

export function truckStatusColor(status: Truck["status"]) {
  switch (status) {
    case "available":
      return "bg-[#0B5FFF]";
    case "en_route":
      return "bg-[#22C55E]";
    default:
      return "bg-[#9CA3AF]";
  }
}

export function formatTruckStatus(status: Truck["status"]) {
  return status.replace("_", " ");
}

export function TruckDetailsTooltip({
  truck,
  className,
}: {
  truck: Truck;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white p-3 text-left shadow-lg",
        className
      )}
    >
      <p className="font-semibold text-[#1A2B4A]">{truck.name}</p>
      <p className="mt-1 text-xs text-[#6B7280]">{truck.driver_name}</p>
      <p className="mt-1 text-xs capitalize text-[#4B5563]">
        Status: {formatTruckStatus(truck.status)}
      </p>
      {truck.capacity_lbs != null && (
        <p className="mt-1 text-xs text-[#6B7280]">
          Capacity: {truck.capacity_lbs.toLocaleString()} lbs
        </p>
      )}
      {truck.current_lat != null && truck.current_lng != null && (
        <p className="mt-1 text-xs text-[#9CA3AF]">
          {truck.current_lat.toFixed(2)}, {truck.current_lng.toFixed(2)}
        </p>
      )}
    </div>
  );
}
