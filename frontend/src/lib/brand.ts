export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "A-TMS";
export const PRODUCT_FULL_NAME = "A-TMS — AI Transportation Management System";
export const COMPANY_NAME = "Aurora Freight";
export const TAGLINE = "AI-powered fleet operations";

/** In-app lead capture survey (multi-step, posts to backend). */
export const LEAD_SURVEY_PATH = "/survey/1";

/** Google Form — market validation / customer discovery (external). */
export const MARKET_SURVEY_URL =
  process.env.NEXT_PUBLIC_MARKET_SURVEY_URL ??
  "https://docs.google.com/forms/d/17v5y7PV67nuXP_Ylt4049GOtppHmPxP8KI5vkRecFjg/viewform";

/** Fields captured on survey submit (mirrors backend Lead model for future Supabase). */
export const SURVEY_LEAD_FIELDS = [
  "email",
  "phone",
  "company_size",
  "industry",
  "fleet_size",
  "features",
  "pain_point",
  "current_tools",
  "timeline",
  "role",
  "consent",
] as const;

export const colors = {
  primary: "#0B5FFF",
  primaryDark: "#0847CC",
  primaryLight: "#E8F4FC",
  sidebar: "#FFFFFF",
  sidebarBorder: "#E5E7EB",
  footer: "#F0F7FF",
  text: "#1A2B4A",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  surface: "#F9FAFB",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

export const testimonials = [
  {
    quote:
      "Since switching to A-TMS, we've cut preventable incidents by 20%. Real-time visibility lets us deconflict routes and keep delivery windows tight.",
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
