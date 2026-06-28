"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/dashboard/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-[#6B7280]">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LiveMap />
    </div>
  );
}
