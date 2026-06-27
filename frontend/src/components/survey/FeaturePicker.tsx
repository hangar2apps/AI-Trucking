"use client";

import {
  Camera,
  MapPin,
  Route,
  Tablet,
  Truck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "map-pin": MapPin,
  tablet: Tablet,
  camera: Camera,
  wrench: Wrench,
  route: Route,
  truck: Truck,
};

interface FeaturePickerProps {
  options: { value: string; label: string; icon?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function FeaturePicker({
  options,
  selected,
  onToggle,
}: FeaturePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {options.map((opt) => {
        const Icon = opt.icon ? iconMap[opt.icon] : Truck;
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all",
              isSelected
                ? "border-[#0B5FFF] bg-[#0B5FFF]/5"
                : "border-[#E5E7EB] bg-white hover:border-[#0B5FFF]/40"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                isSelected ? "text-[#0B5FFF]" : "text-[#9CA3AF]"
              )}
            />
            <span className="font-medium text-[#1A2B4A]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
