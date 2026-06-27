"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getLoad, isUsingMockData } from "@/lib/data-provider";
import type { LoadDetail } from "@/lib/api";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_PILL: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-50 text-blue-700",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-red-100 text-red-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-400",
};

// Demo-region cities for reverse-geocoding a truck's position to a place name.
const CITIES: [string, string, number, number][] = [
  ["Dallas", "TX", 32.7767, -96.797],
  ["Houston", "TX", 29.7604, -95.3698],
  ["Austin", "TX", 30.2672, -97.7431],
  ["San Antonio", "TX", 29.4241, -98.4936],
  ["Corsicana", "TX", 32.0954, -96.4688],
  ["Fairfield", "TX", 31.7246, -96.1652],
  ["Buffalo", "TX", 31.4632, -96.0577],
  ["Centerville", "TX", 31.2599, -95.9774],
  ["Madisonville", "TX", 30.9491, -95.9119],
  ["Huntsville", "TX", 30.7235, -95.5508],
  ["Conroe", "TX", 30.3119, -95.4561],
  ["San Marcos", "TX", 29.8833, -97.9414],
  ["New Braunfels", "TX", 29.703, -98.1245],
  ["Waco", "TX", 31.5493, -97.1467],
  ["New Orleans", "LA", 29.9511, -90.0715],
];

function nearestCity(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null) return "—";
  let best = "—";
  let bd = Infinity;
  for (const [name, state, la, lo] of CITIES) {
    const d = (la - lat) ** 2 + (lo - lng) ** 2;
    if (d < bd) {
      bd = d;
      best = `${name}, ${state}`;
    }
  }
  return best;
}

function dt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function num(n: number | null | undefined, suffix = ""): string {
  return n != null ? `${n.toLocaleString()}${suffix}` : "—";
}

function hrs(n: number | null | undefined): string {
  return n != null ? `${n.toFixed(1)} h` : "—";
}

function isAtRisk(l: LoadDetail): boolean {
  if (l.status === "delayed") return true;
  if (l.status === "delivered" || l.status === "cancelled") return false;
  return l.eta != null && new Date(l.eta) > new Date(l.deliver_by);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
        {title}
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {children}
      </dl>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn(wide && "col-span-full")}>
      <dt className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-[#1A2B4A]">{value}</dd>
    </div>
  );
}

export default function LoadDetailPage({ params }: PageProps) {
  const [loadId, setLoadId] = useState<number | null>(null);
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setLoadId(parseInt(id, 10)));
  }, [params]);

  useEffect(() => {
    if (loadId == null) return;
    let active = true;
    async function fetchIt() {
      try {
        const data = await getLoad(loadId as number);
        if (!active) return;
        setLoad(data);
        setMockMode(isUsingMockData());
      } catch {
        if (active) setError("Could not load this shipment.");
      }
    }
    fetchIt();
    const t = setInterval(fetchIt, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [loadId]);

  if (error && !load) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }
  if (!load) {
    return <div className="p-6 text-sm text-[#6B7280]">Loading load details…</div>;
  }

  const c = load.customer;
  const t = load.truck;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {mockMode && <MockDataBanner />}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1A2B4A]">{load.reference}</h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              STATUS_PILL[load.status] ?? "bg-gray-100 text-gray-600"
            )}
          >
            {load.status.replace("_", " ")}
          </span>
          {isAtRisk(load) && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              At risk
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          {load.origin_name} → {load.dest_name}
        </p>

        <div className="mt-6 space-y-5">
          {/* LOAD */}
          <Section title="Load">
            <Field label="Load #" value={load.reference} />
            <Field label="Status" value={<span className="capitalize">{load.status.replace("_", " ")}</span>} />
            <Field label="Commodity" value={load.commodity ?? "—"} />
            <Field label="Weight" value={num(load.weight_lbs, " lbs")} />
            <Field label="Origin" value={load.origin_name} />
            <Field label="Destination" value={load.dest_name} />
            <Field label="Pickup" value={dt(load.pickup_at)} />
            <Field label="Deliver by" value={dt(load.deliver_by)} />
            <Field
              label="ETA"
              value={<span className={isAtRisk(load) ? "font-medium text-red-600" : ""}>{dt(load.eta)}</span>}
            />
            {load.notes && <Field label="Notes" value={load.notes} wide />}
          </Section>

          {/* CUSTOMER */}
          <Section title="Customer">
            <Field label="Name" value={c.name} />
            <Field label="Company" value={c.company} />
            <Field
              label="Email"
              value={
                <a className="text-[#0B5FFF] hover:underline" href={`mailto:${c.email}`}>
                  {c.email}
                </a>
              }
            />
            <Field
              label="Phone"
              value={
                c.phone ? (
                  <a className="text-[#0B5FFF] hover:underline" href={`tel:${c.phone}`}>
                    {c.phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </Section>

          {/* ASSIGNED TRUCK */}
          <Section title="Assigned Truck">
            {t ? (
              <>
                <Field label="Truck" value={t.name} />
                <Field label="Driver" value={t.driver_name} />
                <Field label="Status" value={<span className="capitalize">{t.status.replace("_", " ")}</span>} />
                <Field label="Location" value={nearestCity(t.current_lat, t.current_lng)} />
                <Field label="Capacity" value={num(t.capacity_lbs, " lbs")} />
                <Field label="Hours — driving left" value={hrs(t.hos_drive_remaining)} />
                <Field label="Hours — on-duty left" value={hrs(t.hos_duty_remaining)} />
                <Field label="Hours — since break" value={hrs(t.hos_since_break)} />
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">Unassigned</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
