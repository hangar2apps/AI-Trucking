import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { COMPANY_NAME, LEAD_SURVEY_PATH, MARKET_SURVEY_URL } from "@/lib/brand";

const footerLinks = {
  Products: [
    { label: "Fleet Telematics", href: "/app" },
    { label: "Load Management", href: "/app/loads" },
    { label: "Driver Experience", href: "/demo" },
    { label: "Driver Coaching", href: "/demo" },
    { label: "AI Multicam", href: "/app/intelligence" },
    { label: "Equipment Management", href: "/app" },
  ],
  Industries: [
    { label: "Transportation & Logistics", href: LEAD_SURVEY_PATH },
    { label: "Construction", href: LEAD_SURVEY_PATH },
    { label: "Food & Beverage", href: LEAD_SURVEY_PATH },
    { label: "Public Sector", href: LEAD_SURVEY_PATH },
  ],
  Resources: [
    { label: "Customer Stories", href: LEAD_SURVEY_PATH },
    { label: "Market validation survey", href: MARKET_SURVEY_URL, external: true },
    { label: "Support Center", href: LEAD_SURVEY_PATH },
    { label: "Webinars", href: LEAD_SURVEY_PATH },
  ],
  Company: [
    { label: "About", href: "/" },
    { label: "Careers", href: LEAD_SURVEY_PATH },
    { label: "Contact", href: MARKET_SURVEY_URL, external: true },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Logo href="/" showTagline size="lg" />
        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
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
        <p className="mt-10 border-t border-[#E5E7EB] pt-6 text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
