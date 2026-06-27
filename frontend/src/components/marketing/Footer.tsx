import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { COMPANY_NAME } from "@/lib/brand";

const footerLinks = {
  Platform: ["Fleet map", "Route optimization", "Weather alerts", "AI operations"],
  Industries: ["Transportation & Logistics", "Construction", "Food & Beverage"],
  Company: ["Customer stories", "Support", "Privacy", "Contact"],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-[#F0F7FF]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo href="/" showTagline size="lg" />
            <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
              {COMPANY_NAME} runs on A-TMS — autonomous dispatch, proactive customer
              communication, and weather-aware routing in one cloud platform.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="mb-3 text-sm font-semibold text-[#1A2B4A]">{heading}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <Link
                        href="/survey/1"
                        className="text-sm text-[#6B7280] transition-colors hover:text-[#0B5FFF]"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 border-t border-[#E5E7EB] pt-6 text-center text-xs text-[#9CA3AF] sm:text-left">
          © {new Date().getFullYear()} A-TMS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
