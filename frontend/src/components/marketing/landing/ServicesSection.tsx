import Link from "next/link";
import { Bot, LayoutDashboard, Map, Route, Sparkles } from "lucide-react";

const services = [
  {
    icon: LayoutDashboard,
    title: "Operations dashboard",
    description:
      "Live loads, fleet KPIs, and shipment status in one view — synced from your A-TMS backend, not static demos.",
    href: "/login",
  },
  {
    icon: Map,
    title: "Fleet intelligence",
    description:
      "Live fleet map, route polylines, and truck positions. See what's moving and where delays cluster across your network.",
    href: "/login",
  },
  {
    icon: Route,
    title: "Routes & ETA",
    description:
      "Compute drive time and arrival windows per load. Weather-aware routing plugs in as your route engine matures.",
    href: "/login",
  },
  {
    icon: Bot,
    title: "AI assistant",
    description:
      "Draft and send customer status emails per load. The agent can detect late freight, reassign trucks, and log every action.",
    href: "/login",
  },
  {
    icon: Sparkles,
    title: "Automated customer comms",
    description:
      "Proactive delay emails, ETA updates, and audit-ready send logs — built for CRM and CS teams tired of manual follow-ups.",
    href: "/login",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4FC] px-3 py-1 text-xs font-medium text-[#0B5FFF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0B5FFF]" />
            Services
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            What A-TMS delivers today
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
            Cloud modules for dispatch, intelligence, and AI operations — provisioned when your
            fleet is onboarded to the platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F4FC]">
                  <Icon className="h-5 w-5 text-[#0B5FFF]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#1A2B4A]">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#6B7280]">
                  {service.description}
                </p>
                <Link
                  href={service.href}
                  className="mt-4 text-sm font-medium text-[#0B5FFF] hover:underline"
                >
                  Sign in to explore →
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[#9CA3AF]">
          Weather APIs and route optimization engines connect through the same backend tools your
          dashboard and intelligence views already consume.
        </p>
      </div>
    </section>
  );
}
