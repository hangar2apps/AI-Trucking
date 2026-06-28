"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pause, Play, Sparkles } from "lucide-react";
import {
  getEvents,
  getIncidents,
  getLoads,
  getTrucks,
  isUsingMockData,
} from "@/lib/data-provider";
import { api } from "@/lib/api";
import type { Incident, Load, Truck } from "@/lib/api";

const ACTIVE = ["assigned", "in_transit", "delayed"];
const TRUCK_COLOR: Record<string, string> = {
  available: "#22C55E",
  en_route: "#0B5FFF",
  maintenance: "#9CA3AF",
  offline: "#6B7280",
};

const numOf = (name: string) => name.replace(/^Truck\s+/i, "");

function isAtRisk(l: Load): boolean {
  if (l.status === "delayed") return true;
  if (l.status === "delivered" || l.status === "cancelled") return false;
  return l.eta != null && new Date(l.eta) > new Date(l.deliver_by);
}

// If the straight origin→dest line crosses an incident, bow it out to one side
// so the drawn route visibly detours around the storm (matches the AI's reroute).
function detourPath(
  o: [number, number],
  d: [number, number],
  incidents: Incident[]
): [number, number][] {
  const latRef = (o[0] + d[0]) / 2;
  const k = Math.cos((latRef * Math.PI) / 180) || 1; // longitude compression
  const ax = o[1] * k,
    ay = o[0],
    bx = d[1] * k,
    by = d[0];
  const abx = bx - ax,
    aby = by - ay;
  const len2 = abx * abx + aby * aby || 1e-9;
  let best: [number, number] | null = null;
  let bestPen = 0;
  for (const inc of incidents) {
    const cx = inc.center_lng * k,
      cy = inc.center_lat;
    const rDeg = (inc.radius_mi / 69) * 1.7; // clearance, in degrees (must match sim.py)
    let t = ((cx - ax) * abx + (cy - ay) * aby) / len2;
    t = Math.max(0.12, Math.min(0.88, t));
    const px = ax + t * abx,
      py = ay + t * aby;
    const dx = px - cx,
      dy = py - cy;
    const dist = Math.hypot(dx, dy);
    const pen = rDeg - dist;
    if (pen > 0 && pen > bestPen) {
      const ux = dist > 1e-6 ? dx / dist : 1;
      const uy = dist > 1e-6 ? dy / dist : 0;
      best = [cy + uy * rDeg, (cx + ux * rDeg) / k]; // waypoint clearing the circle
      bestPen = pen;
    }
  }
  return best ? [o, best, d] : [o, d];
}

function incidentStyle(inc: Incident): { color: string; label: string } {
  const s = inc.summary.toLowerCase();
  if (s.includes("wildfire") || s.includes("fire")) return { color: "#EA580C", label: "🔥 Wildfire" };
  if (s.includes("blizzard") || s.includes("ice") || s.includes("snow")) return { color: "#38BDF8", label: "❄ Blizzard" };
  if (s.includes("hurricane")) return { color: "#A855F7", label: "🌀 Hurricane" };
  if (s.includes("pileup") || s.includes("accident") || inc.kind === "accident")
    return { color: "#F59E0B", label: "🚧 Accident" };
  if (inc.kind === "disaster") return { color: "#EA580C", label: "⚠ Hazard" };
  return { color: "#DC2626", label: "⛈ Storm" };
}

const TRUCK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>' +
  '<path d="M15 18H9"/>' +
  '<path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>' +
  '<circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>';

function truckHtml(t: Truck, rerouting: boolean): string {
  const color = TRUCK_COLOR[t.status] ?? "#6B7280";
  const badge = rerouting ? '<span class="reroute-badge">Rerouted</span>' : "";
  return (
    `<div class="truck-pin${rerouting ? " rerouting" : ""}" style="background:${color}">` +
    `${badge}${TRUCK_SVG}<span class="truck-num">${numOf(t.name)}</span></div>`
  );
}

function truckIcon(t: Truck, rerouting: boolean) {
  return L.divIcon({
    className: "truck-marker",
    html: truckHtml(t, rerouting),
    iconSize: [34, 28],
    iconAnchor: [17, 14],
  });
}

export default function LiveMap() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Map<number, L.Marker>>(new Map());
  const markerKey = useRef<Map<number, string>>(new Map());
  const routes = useRef<Map<number, L.Polyline>>(new Map());
  const incidentLayers = useRef<Map<number, L.LayerGroup>>(new Map());
  const reroutedUntil = useRef<Map<number, number>>(new Map());
  const reroutedLoads = useRef<Set<number>>(new Set()); // loads the AI has rerouted this session
  const lastEventId = useRef(0);
  const didFit = useRef(false);

  const [mockMode, setMockMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      center: [31, -96],
      zoom: 6,
      attributionControl: false,
      zoomControl: true,
    });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 }
    ).addTo(map);
    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 }
    ).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);

    const el = elRef.current;
    const onMoveStart = () => el.classList.add("leaflet-panning");
    const onMoveEnd = () => el.classList.remove("leaflet-panning");
    map.on("movestart zoomstart", onMoveStart);
    map.on("moveend zoomend", onMoveEnd);

    let active = true;

    (async () => {
      const e = await getEvents(0);
      lastEventId.current = e.length ? e[e.length - 1].id : 0;
    })();

    function fitAll(trucks: Truck[], loads: Load[]) {
      const pts: [number, number][] = [
        ...trucks
          .filter((t) => t.current_lat != null)
          .map((t) => [t.current_lat as number, t.current_lng as number] as [number, number]),
        ...loads
          .filter((l) => ACTIVE.includes(l.status))
          .flatMap(
            (l) =>
              [
                [l.origin_lat, l.origin_lng],
                [l.dest_lat, l.dest_lng],
              ] as [number, number][]
          ),
      ];
      if (pts.length && mapRef.current) {
        mapRef.current.fitBounds(L.latLngBounds(pts).pad(0.3));
        didFit.current = true;
      }
    }

    function drawHandoff(fromId?: number, toId?: number, trucks: Truck[] = []) {
      const m = mapRef.current;
      const f = trucks.find((t) => t.id === fromId);
      const to = trucks.find((t) => t.id === toId);
      if (!m || !f || !to || f.current_lat == null || to.current_lat == null) return;
      const line = L.polyline(
        [
          [f.current_lat, f.current_lng as number],
          [to.current_lat, to.current_lng as number],
        ],
        { color: "#F59E0B", weight: 2.5, dashArray: "4 6", opacity: 0.95 }
      ).addTo(m);
      setTimeout(() => line.remove(), 9000);
    }

    // Fly the camera to the reroute so it's visible even from the national view.
    function flyToReroute(fromId?: number, toId?: number, loadId?: number | null, trucks: Truck[] = [], loads: Load[] = []) {
      const m = mapRef.current;
      if (!m) return;
      const pts: [number, number][] = [];
      const f = trucks.find((t) => t.id === fromId);
      if (f?.current_lat != null) pts.push([f.current_lat, f.current_lng as number]);
      const to = trucks.find((t) => t.id === toId);
      if (to?.current_lat != null) pts.push([to.current_lat, to.current_lng as number]);
      const ld = loads.find((l) => l.id === loadId);
      if (ld) pts.push([ld.dest_lat, ld.dest_lng]);
      if (pts.length) m.flyToBounds(L.latLngBounds(pts).pad(0.7), { maxZoom: 8, duration: 1.4 });
    }

    function updateIncidents(incidents: Incident[]) {
      const seen = new Set<number>();
      for (const inc of incidents) {
        seen.add(inc.id);
        if (!incidentLayers.current.has(inc.id)) {
          const { color, label } = incidentStyle(inc);
          const group = L.layerGroup().addTo(map);
          L.circle([inc.center_lat, inc.center_lng], {
            radius: inc.radius_mi * 1609.34,
            color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.18,
          }).addTo(group);
          L.marker([inc.center_lat, inc.center_lng], {
            icon: L.divIcon({
              className: "",
              html: `<span class="storm-label" style="background:${color}">${label}</span>`,
              iconSize: [1, 1],
            }),
          }).addTo(group);
          incidentLayers.current.set(inc.id, group);
        }
      }
      for (const [id, g] of incidentLayers.current) {
        if (!seen.has(id)) {
          g.remove();
          incidentLayers.current.delete(id);
        }
      }
    }

    function updateRoutes(loads: Load[], trucks: Truck[], incidents: Incident[]) {
      if (!loads.length) return; // don't wipe routes on a transient empty/failed fetch
      const truckById = new Map(trucks.map((t) => [t.id, t]));
      const activeLoads = loads.filter((l) => ACTIVE.includes(l.status) && l.assigned_truck_id != null);
      const seen = new Set<number>();
      for (const l of activeLoads) {
        seen.add(l.id);
        const risk = isAtRisk(l);
        // Route runs from the ASSIGNED truck's current position to the destination,
        // so the line belongs to that truck (falls back to origin if no position yet).
        const tk = truckById.get(l.assigned_truck_id as number);
        const start: [number, number] =
          tk?.current_lat != null && tk?.current_lng != null
            ? [tk.current_lat, tk.current_lng]
            : [l.origin_lat, l.origin_lng];
        const dest: [number, number] = [l.dest_lat, l.dest_lng];
        // Only bend the route around the storm once the AI has actually rerouted
        // this load — before that it shows the straight (at-risk) line.
        const latlngs: [number, number][] = reroutedLoads.current.has(l.id)
          ? detourPath(start, dest, incidents)
          : [start, dest];
        const style = { color: risk ? "#DC2626" : "#38BDF8", dashArray: risk ? "6 6" : undefined };
        let pl = routes.current.get(l.id);
        if (!pl) {
          pl = L.polyline(latlngs, { weight: 2.5, opacity: 0.9, ...style }).addTo(map);
          routes.current.set(l.id, pl);
        } else {
          pl.setLatLngs(latlngs);
          pl.setStyle(style);
        }
      }
      for (const [id, pl] of routes.current) {
        if (!seen.has(id)) {
          pl.remove();
          routes.current.delete(id);
        }
      }
    }

    function updateTrucks(trucks: Truck[]) {
      const now = Date.now();
      const seen = new Set<number>();
      for (const t of trucks) {
        if (t.current_lat == null || t.current_lng == null) continue;
        seen.add(t.id);
        const rerouting = (reroutedUntil.current.get(t.id) ?? 0) > now;
        const key = `${t.status}|${rerouting ? 1 : 0}`;
        let mk = markers.current.get(t.id);
        if (!mk) {
          mk = L.marker([t.current_lat, t.current_lng], { icon: truckIcon(t, rerouting) }).addTo(map);
          markers.current.set(t.id, mk);
          markerKey.current.set(t.id, key);
        } else {
          mk.setLatLng([t.current_lat, t.current_lng]); // smooth move via CSS transition
          if (markerKey.current.get(t.id) !== key) {
            mk.setIcon(truckIcon(t, rerouting));
            markerKey.current.set(t.id, key);
          }
        }
      }
      for (const [id, mk] of markers.current) {
        if (!seen.has(id)) {
          mk.remove();
          markers.current.delete(id);
        }
      }
    }

    async function poll() {
      const [trucks, loads, incidents, events] = await Promise.all([
        getTrucks(),
        getLoads(),
        getIncidents(true),
        getEvents(lastEventId.current),
      ]);
      if (!active || !mapRef.current) return;
      setMockMode(isUsingMockData());

      if (events.length) {
        lastEventId.current = events[events.length - 1].id;
        for (const ev of events) {
          if (ev.kind === "reassignment") {
            const to = ev.data?.to_truck_id as number | undefined;
            const from = ev.data?.from_truck_id as number | undefined;
            if (to != null) reroutedUntil.current.set(to, Date.now() + 12000);
            if (ev.load_id != null) reroutedLoads.current.add(ev.load_id);
            drawHandoff(from, to, trucks);
            flyToReroute(from, to, ev.load_id, trucks, loads);
          }
        }
      }

      updateIncidents(incidents);
      updateRoutes(loads, trucks, incidents);
      updateTrucks(trucks);
      if (!didFit.current) fitAll(trucks, loads);
    }

    poll();
    const id = setInterval(poll, 1500);
    api.simStatus().then((s) => active && setRunning(s.running)).catch(() => {});

    return () => {
      active = false;
      clearInterval(id);
      map.remove();
      mapRef.current = null;
      markers.current.clear();
      markerKey.current.clear();
      routes.current.clear();
      incidentLayers.current.clear();
    };
  }, []);

  async function toggleMotion() {
    setBusy(true);
    try {
      const s = running ? await api.simStop() : await api.simStart();
      setRunning(s.running);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function runAi() {
    setThinking(true);
    try {
      await api.monitorTick();
    } catch {
      /* ignore */
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full" />

      {mockMode && (
        <div className="absolute left-4 top-4 z-[1000] rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
          Mock data — backend offline
        </div>
      )}

      <div className="absolute right-4 top-4 z-[1000] flex gap-2">
        <button
          type="button"
          onClick={toggleMotion}
          disabled={busy || mockMode}
          className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#1A2B4A] shadow transition hover:bg-white disabled:opacity-50"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause motion" : "Start motion"}
        </button>
        <button
          type="button"
          onClick={runAi}
          disabled={thinking || mockMode}
          className="flex items-center gap-2 rounded-full bg-[#0B5FFF] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#0847CC] disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {thinking ? "Assessing…" : "Run AI"}
        </button>
      </div>
    </div>
  );
}
