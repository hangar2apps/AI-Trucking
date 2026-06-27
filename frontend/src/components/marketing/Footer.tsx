import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { COMPANY_NAME, MARKET_SURVEY_URL } from "@/lib/brand";

const footerLinks = {
  Platform: [
    { label: "Fleet map (pilot)", href: "/signup" },
    { label: "Route & ETA (launching)", href: "/#services" },
    { label: "Weather alerts (coming)", href: "/#services" },
    { label: "AI operations (pilot)", href: "/#services" },
  ],
  Industries: [
    { label: "Regional trucking", href: "/#usecases" },
    { label: "Dispatch & CRM teams", href: "/#usecases" },
    { label: "Pilot fleets welcome", href: MARKET_SURVEY_URL, external: true },
  ],
  Company: [
    { label: "About our launch", href: "/#about" },
    { label: "Market survey", href: MARKET_SURVEY_URL, external: true },
    { label: "Interactive demo", href: "/demo" },
    { label: "Contact", href: MARKET_SURVEY_URL, external: true },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F0F7FF]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo href="/" showTagline size="lg" />
            <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
              {COMPANY_NAME} is launching A-TMS — AI dispatch, proactive customer updates, and
              fleet intelligence built with early pilot partners.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="mb-3 text-sm font-semibold text-[#1A2B4A]">{heading}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#6B7280] transition-colors hover:text-[#0B5FFF]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-[#6B7280] transition-colors hover:text-[#0B5FFF]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-[#E5E7EB] pt-6 text-center text-xs text-[#9CA3AF] sm:text-left">
          © {new Date().getFullYear()} {COMPANY_NAME}. New launch — pilot program open.
        </p>
      </div>
    </footer>
  );
}
