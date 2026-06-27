import { MARKET_SURVEY_URL } from "@/lib/brand";

export function HeroSection() {
  return (
    <section className="bg-[#0F172A] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24 lg:px-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Operate Smarter™
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Lower costs and improve safety across your business with an open, secure
            platform built to scale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={MARKET_SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] hover:bg-white/90"
            >
              Take the survey
            </a>
            <a
              href="/demo"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              See a demo
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <div
              className="aspect-[4/3] bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(15,23,42,0.3), rgba(11,95,255,0.2)), url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&auto=format&fit=crop')",
              }}
              role="img"
              aria-label="Fleet truck on highway"
            />
          </div>
          <div className="absolute bottom-4 right-4 max-w-[260px] rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-lg sm:bottom-6 sm:right-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F4FC]">
                <ShieldIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A2B4A]">Insights</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                  Driver executed a harsh brake to stop safely for ambulance at
                  intersection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 text-[#0B5FFF]"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
