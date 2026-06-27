"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { getTrucks, isUsingMockData } from "@/lib/data-provider";
import { api } from "@/lib/api";
import type { Truck } from "@/lib/api";

export default function MapPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const mock = useRef(false);

  useEffect(() => {
    let active = true;
    async function poll() {
      const data = await getTrucks();
      if (!active) return;
      setTrucks(data);
      mock.current = isUsingMockData();
      setMockMode(mock.current);
    }
    poll();
    const id = setInterval(poll, 2000);

    api.simStatus().then((s) => active && setRunning(s.running)).catch(() => {});

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  async function toggleMotion() {
    if (mock.current) return;
    setBusy(true);
    try {
      const s = running ? await api.simStop() : await api.simStart();
      setRunning(s.running);
    } catch {
      /* backend unavailable — ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}

      <div className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-3">
        <div>
          <h1 className="font-semibold text-[#1A2B4A]">Fleet map</h1>
          <p className="text-xs text-[#9CA3AF]">
            {trucks.length} trucks · control-center map integrates here
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMotion}
          disabled={busy || mockMode}
          className="flex items-center gap-2 rounded-full bg-[#0B5FFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0847CC] disabled:opacity-50"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause motion" : "Start motion"}
        </button>
      </div>

      <div className="relative flex-1">
        <FleetMap trucks={trucks} selectedId={selected?.id} onSelect={setSelected} />
      </div>
    </div>
  );
}
