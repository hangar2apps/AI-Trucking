export function LogoBarSection() {
  return (
    <section className="border-b border-[#E5E7EB] bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-sm font-medium text-[#0B5FFF]">
          Now launching · Early access open
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          {[
            "Built for trucking",
            "AI-native dispatch",
            "Pilot fleets welcome",
            "No legacy TMS required",
          ].map((label) => (
            <span
              key={label}
              className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-xs font-semibold tracking-wide text-[#6B7280] uppercase"
            >
              {label}
            </span>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          We&apos;re a new company — no enterprise partners yet. We&apos;re looking for
          early fleets to shape the product with us.
        </p>
      </div>
    </section>
  );
}
