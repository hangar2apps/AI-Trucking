import { ArrowRight, Mail, Truck } from "lucide-react";
import { MARKET_SURVEY_URL } from "@/lib/brand";

export function UseCasesSection() {
  return (
    <section id="usecases" className="scroll-mt-20 bg-[#F9FAFB] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4FC] px-3 py-1 text-xs font-medium text-[#0B5FFF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
            Use cases
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            Built from real fleet conversations
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
            We&apos;re early stage — these are the problems operators ask us to solve first.
          </p>
        </div>

        <article className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="grid lg:grid-cols-5">
            <div
              className="relative min-h-[200px] bg-cover bg-center lg:col-span-2"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15,23,42,0.55), rgba(11,95,255,0.35)), url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop')",
              }}
            />
            <div className="flex flex-col justify-center p-8 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0B5FFF]">
                Customer story
              </p>
              <h3 className="mt-2 text-xl font-bold text-[#1A2B4A] sm:text-2xl">
                Regional carrier automates CRM for their customer service team
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
                A mid-size trucking company running 20+ trucks on regional lanes reached out
                because their CRM and customer service team was stuck in reactive mode — fielding
                &quot;where is my load?&quot; calls and emails all day while dispatch updated
                spreadsheets in the background.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                They wanted automation that still felt human: proactive delay notices, honest ETAs,
                and load status without every message being typed by hand. With A-TMS, they pilot
                AI-drafted customer emails, late-load detection, and backup truck reassignment —
                so CS focuses on exceptions, not copy-paste updates.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  {
                    icon: Mail,
                    text: "Proactive customer emails when a load slips past its delivery window",
                  },
                  {
                    icon: Truck,
                    text: "Automatic reassignment suggestions when the assigned truck can't make it",
                  },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-[#374151]">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F4FC]">
                      <Icon className="h-4 w-4 text-[#0B5FFF]" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <a
                href={MARKET_SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#0B5FFF] hover:underline"
              >
                Share your use case in our market survey
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
