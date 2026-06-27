export type SurveyAnswers = {
  companySize: string;
  industry: string;
  fleetSize: string;
  features: string[];
  painPoint: string;
  currentTools: string;
  timeline: string;
  role: string;
  email: string;
  phone: string;
  consent: boolean;
};

export const defaultAnswers: SurveyAnswers = {
  companySize: "",
  industry: "",
  fleetSize: "",
  features: [],
  painPoint: "",
  currentTools: "",
  timeline: "",
  role: "",
  email: "",
  phone: "",
  consent: false,
};

export type StepConfig = {
  id: number;
  title: string;
  subtitle?: string;
  field: keyof SurveyAnswers;
  type:
    | "select"
    | "multi-card"
    | "textarea"
    | "text"
    | "email"
    | "phone-consent";
  options?: { value: string; label: string; icon?: string }[];
  required?: boolean;
};

export const surveySteps: StepConfig[] = [
  {
    id: 1,
    title: "How large is your company?",
    field: "companySize",
    type: "select",
    required: true,
    options: [
      { value: "1-10", label: "1–10 employees" },
      { value: "11-50", label: "11–50 employees" },
      { value: "51-200", label: "51–200 employees" },
      { value: "201+", label: "201+ employees" },
    ],
  },
  {
    id: 2,
    title: "What industry are you in?",
    field: "industry",
    type: "select",
    required: true,
    options: [
      { value: "transportation", label: "Transportation & Logistics" },
      { value: "construction", label: "Construction" },
      { value: "food", label: "Food & Beverage" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: 3,
    title: "How many vehicles are in your fleet?",
    field: "fleetSize",
    type: "select",
    required: true,
    options: [
      { value: "1-5", label: "1–5" },
      { value: "6-25", label: "6–25" },
      { value: "26-100", label: "26–100" },
      { value: "100+", label: "100+" },
    ],
  },
  {
    id: 4,
    title: "Which features are you interested in?",
    subtitle: "Please select at least one.",
    field: "features",
    type: "multi-card",
    required: true,
    options: [
      { value: "gps", label: "GPS", icon: "map-pin" },
      { value: "eld", label: "ELD", icon: "tablet" },
      { value: "dash-cams", label: "Dash Cams", icon: "camera" },
      { value: "maintenance", label: "Maintenance", icon: "wrench" },
      { value: "routing", label: "Routing", icon: "route" },
      { value: "other", label: "Other", icon: "truck" },
    ],
  },
  {
    id: 5,
    title: "What's your biggest fleet operations challenge?",
    field: "painPoint",
    type: "textarea",
    required: true,
  },
  {
    id: 6,
    title: "What tools do you use today?",
    field: "currentTools",
    type: "text",
    required: false,
  },
  {
    id: 7,
    title: "When are you looking to adopt a new platform?",
    field: "timeline",
    type: "select",
    required: true,
    options: [
      { value: "now", label: "This month" },
      { value: "1-3", label: "1–3 months" },
      { value: "6+", label: "6+ months" },
    ],
  },
  {
    id: 8,
    title: "What's your role?",
    field: "role",
    type: "select",
    required: true,
    options: [
      { value: "owner", label: "Owner / Executive" },
      { value: "ops", label: "Operations" },
      { value: "fleet", label: "Fleet Manager" },
      { value: "driver", label: "Driver" },
    ],
  },
  {
    id: 9,
    title: "Great! What email should we send the info to?",
    field: "email",
    type: "email",
    required: true,
  },
  {
    id: 10,
    title: "Almost done — how can we reach you?",
    subtitle: "Phone is optional. Please confirm you agree to be contacted.",
    field: "phone",
    type: "phone-consent",
    required: true,
  },
];

export function validateStep(step: number, answers: SurveyAnswers): boolean {
  const config = surveySteps.find((s) => s.id === step);
  if (!config) return false;

  const value = answers[config.field];

  switch (config.type) {
    case "multi-card":
      return Array.isArray(value) && value.length > 0;
    case "email":
      return (
        typeof value === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      );
    case "phone-consent":
      return answers.consent === true;
    case "textarea":
    case "text":
    case "select":
      if (!config.required) return true;
      return typeof value === "string" && value.trim().length > 0;
    default:
      return true;
  }
}
