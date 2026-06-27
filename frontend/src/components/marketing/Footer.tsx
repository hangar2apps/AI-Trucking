import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/brand";

const footerLinks = {
  Products: ["Cameras and Video", "AI Multicam", "Driver Experience", "Driver Coaching"],
  Industries: ["Transportation & Logistics", "Construction", "Food & Beverage"],
  Resources: ["Customer Stories", "Community", "Support Center", "Referral Program"],
};

export function Footer() {
  return (
    <footer className="mt-auto bg-[#D6EAF8] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B5FFF] text-lg font-bold text-white">
              a
            </div>
            <span className="text-2xl font-semibold text-[#1A2B4A]">
              {PRODUCT_NAME}
            </span>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-3">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="mb-3 text-sm font-semibold text-[#1A2B4A]">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="/survey/1"
                      className="text-sm text-[#4B5563] hover:text-[#0B5FFF]"
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
    </footer>
  );
}
