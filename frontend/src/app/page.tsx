import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

const FEATURES = [
  {
    title: "Catches delays before your customer does",
    body: "The AI watches every load in real time and flags a delivery that's about to slip its window — before the phone rings.",
  },
  {
    title: "Notifies customers automatically",
    body: "A proactive, accurate ETA email goes out the moment a delay is detected. No dispatcher chasing it down.",
  },
  {
    title: "Reassigns trucks to save the delivery",
    body: "When a load is at risk, the AI finds a capable nearby truck and hands off the load — keeping the promise intact.",
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white text-[#1A2B4A]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="text-lg font-bold tracking-tight">{PRODUCT_NAME}</span>
        <Link
          href="/app"
          className="rounded-full bg-[#0B5FFF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0847CC]"
        >
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#0B5FFF]">
          AI Transportation Management System
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          A trucking operation that runs itself.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#4B5563]">
          {PRODUCT_NAME} monitors every load, catches delays before customers
          notice, emails them a new ETA, and reroutes a backup truck to save the
          delivery — autonomously.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/app"
            className="rounded-full bg-[#0B5FFF] px-7 py-3 text-base font-semibold text-white transition hover:bg-[#0847CC]"
          >
            Open the dashboard
          </Link>
          <Link
            href="/survey/1"
            className="rounded-full border border-[#E5E7EB] px-7 py-3 text-base font-semibold text-[#1A2B4A] transition hover:border-[#0B5FFF]"
          >
            Take the survey
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-6"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E5E7EB] px-6 py-8 text-center text-sm text-[#6B7280]">
        {PRODUCT_NAME} — AI Transportation Management System
      </footer>
    </main>
  );
}
