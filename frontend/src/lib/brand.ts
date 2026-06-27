export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "app";

export const colors = {
  primary: "#0B5FFF",
  primaryDark: "#0847CC",
  sidebar: "#E8F4FC",
  footer: "#D6EAF8",
  text: "#1A2B4A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  success: "#22C55E",
} as const;

export const testimonials = [
  {
    quote:
      "Since switching to our fleet platform, we've cut preventable incidents by 20%. Real-time visibility lets us deconflict routes and keep delivery windows tight.",
    name: "Doug McGowen",
    title: "President and CEO, MLGW",
    avatar: "DM",
  },
  {
    quote:
      "Our dispatch team finally has one pane of glass. Loads, trucks, and customer updates flow without anyone chasing spreadsheets.",
    name: "Sarah Nguyen",
    title: "VP Operations, Pacific Haul",
    avatar: "SN",
  },
  {
    quote:
      "The AI status emails alone saved us hours every week. Customers get proactive ETAs before they ever have to ask.",
    name: "James Porter",
    title: "Fleet Director, Summit Logistics",
    avatar: "JP",
  },
] as const;
