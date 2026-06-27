import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  en_route: "bg-blue-50 text-blue-700 ring-blue-600/20",
  in_transit: "bg-blue-50 text-blue-700 ring-blue-600/20",
  delayed: "bg-amber-50 text-amber-800 ring-amber-600/20",
  pending: "bg-gray-50 text-gray-700 ring-gray-600/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  maintenance: "bg-orange-50 text-orange-800 ring-orange-600/20",
  offline: "bg-gray-100 text-gray-600 ring-gray-500/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  severe: "bg-red-50 text-red-700 ring-red-600/20",
  clear: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        toneMap[key] ?? "bg-gray-50 text-gray-700 ring-gray-600/20",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
