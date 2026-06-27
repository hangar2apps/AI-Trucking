import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { COMPANY_NAME, MARKET_SURVEY_URL } from "@/lib/brand";

type FooterLink =
  | { label: string; href: string; external?: false }
  | { label: string; href: string; external: true };

const footerLinks: Record<string, FooterLink[]> = {
  Products: [
    { label: "Operations dashboard (pilot)", href: "/signup" },
    { label: "Fleet intelligence (early access)", href: "#services" },
    { label: "AI assistant (pilot)", href: "#services" },
    { label: "Routes & ETA (launching)", href: "#services" },
    { label: "Load management (pilot)", href: "#services" },
  ],
  Industries: [
    { label: "Regional trucking fleets", href: "#usecases" },
    { label: "Dispatch & CRM teams", href: "#usecases" },
    { label: "Owner-operators (1–25 trucks)", href: MARKET_SURVEY_URL, external: true },
    { label: "Pilot partners — apply now", href: MARKET_SURVEY_URL, external: true },
  ],
  Resources: [
    { label: "Market validation survey", href: MARKET_SURVEY_URL, external: true },
    { label: "Launch roadmap", href: "#about" },
    { label: "Interactive demo", href: "/demo" },
    { label: "Building in public updates", href: "#usecases" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Use cases", href: "#usecases" },
    { label: "Services", href: "#services" },
    { label: "Contact / early access", href: MARKET_SURVEY_URL, external: true },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Logo href="/" showTagline size="lg" />
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          {COMPANY_NAME} is a new company launching A-TMS — we&apos;re validating with real
          fleets, not shipping decade-old case studies.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-3 text-sm font-semibold text-[#1A2B4A]">{heading}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
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
        <p className="mt-10 border-t border-[#E5E7EB] pt-6 text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} {COMPANY_NAME}. New launch — pilot program open.
        </p>
      </div>
    </footer>
  );
}
