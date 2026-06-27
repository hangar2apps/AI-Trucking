"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SpeedChart } from "@/components/dashboard/SpeedChart";
import { getTrucks, isUsingMockData } from "@/lib/data-provider";
import type { Truck } from "@/lib/api";

export default function TripMediaPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    getTrucks().then((data) => {
      setTruck(
        data.find((t) => t.name === "Truck 17") ??
          data.find((t) => t.status === "en_route") ??
          data[0] ??
          null
      );
    });
  }, []);

  const handleRetrieve = () => {
    setToast("Video request queued — check your inbox when processing completes.");
    setTimeout(() => setToast(null), 4000);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#121212] text-white">
      {isUsingMockData() && (
        <div className="shrink-0 bg-amber-900/40 px-4 py-1 text-center text-xs text-amber-200">
          Demo mode — offline sample data
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
        <h1 className="text-sm font-medium">
          Review Trip Media — {truck?.name ?? "Truck 17"} on Nov 10
        </h1>
        <Link href="/app" className="text-sm text-[#0B5FFF] hover:underline">
          Close
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-[#333] p-4">
          <div className="mb-4 rounded bg-[#1e1e1e] p-3 text-center">
            <p className="text-2xl font-bold">14 mph</p>
            <p className="text-xs text-[#9CA3AF]">3:43:53 PM EST</p>
          </div>
          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="aspect-video w-full rounded bg-black object-cover"
              src="/demo/dashcam.mp4"
              muted
              loop
              autoPlay
              playsInline
            />
            <button
              type="button"
              onClick={togglePlay}
              className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs"
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>
          <div className="space-y-3 text-xs text-[#9CA3AF]">
            <div>
              <p className="font-medium text-white">Point B</p>
              <p>Houston, TX</p>
              <p>Nov 10, 2:26 PM EST</p>
            </div>
            <div>
              <p className="font-medium text-white">Point A</p>
              <p>Dallas, TX</p>
              <p>Nov 10, 2:25 PM EST</p>
            </div>
            <p className="text-white">{truck?.driver_name ?? "Sam Whitfield"}</p>
          </div>
        </aside>

        <main className="flex flex-1 flex-col p-4">
          <SpeedChart />
          <div className="relative mt-4 flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-[#E8F4FC] to-[#DBEAFE]">
            <div className="absolute inset-0 flex items-center justify-center text-[#1A2B4A]/40">
              Route map preview
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between border-t border-[#333] pt-4">
            <div className="flex gap-4 text-sm text-[#9CA3AF]">
              <span>2:25:52 PM</span>
              <span>Duration: 1 min</span>
              <span>High Resolution</span>
            </div>
            <button
              type="button"
              onClick={handleRetrieve}
              className="rounded-full bg-[#0B5FFF] px-6 py-2 text-sm font-medium hover:bg-[#0847CC]"
            >
              Retrieve Video
            </button>
          </div>
          {toast && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-sm text-[#1A2B4A] shadow-lg">
              {toast}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
