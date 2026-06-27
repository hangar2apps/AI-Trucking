import Link from "next/link";
import { MARKET_SURVEY_URL } from "@/lib/brand";

export function CtaSection() {
  return (
    <section className="bg-[#0B5FFF] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to get in touch?
        </h2>
        <p className="mt-4 text-lg text-white/90">
          We&apos;re here to help transform your operations
        </p>
        <Link
          href={MARKET_SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full border-2 border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          Contact us
        </Link>
        <p className="mt-4 text-sm text-white/70">
          Opens our 4–5 minute market validation survey in a new tab.
        </p>
      </div>
    </section>
  );
}
