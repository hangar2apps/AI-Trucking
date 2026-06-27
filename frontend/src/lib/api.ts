const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TruckStatus = "available" | "en_route" | "maintenance" | "offline";
export type LoadStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delayed"
  | "delivered"
  | "cancelled";

export interface Truck {
  id: number;
  name: string;
  driver_name: string;
  status: TruckStatus;
  current_lat: number | null;
  current_lng: number | null;
  capacity_lbs: number | null;
}

export interface Customer {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string | null;
}

export interface Load {
  id: number;
  reference: string;
  status: LoadStatus;
  customer_id: number;
  assigned_truck_id: number | null;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  pickup_at: string;
  deliver_by: string;
  eta: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  notes: string | null;
}

export interface LoadDetail extends Load {
  customer: Customer;
  truck: Truck | null;
}

export interface EmailDraft {
  subject: string;
  body: string;
  internal_summary: string;
}

export interface EmailDraftResponse {
  load_reference: string;
  to_email: string;
  to_name: string;
  model: string;
  draft: EmailDraft;
}

export interface SurveyAnswersPayload {
  company_size: string;
  industry: string;
  fleet_size: string;
  features: string[];
  pain_point: string;
  current_tools: string;
  timeline: string;
  role: string;
  email: string;
  phone: string;
  consent: boolean;
}

export interface SurveySubmitResponse {
  ok: boolean;
  email_sent: boolean;
  message: string;
  lead_id: number;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchJson<{ status: string }>("/health"),
  getTrucks: () => fetchJson<Truck[]>("/trucks"),
  getCustomers: () => fetchJson<Customer[]>("/customers"),
  getLoads: () => fetchJson<Load[]>("/loads"),
  getLoad: (id: number) => fetchJson<LoadDetail>(`/loads/${id}`),
  draftEmail: (loadId: number) =>
    fetchJson<EmailDraftResponse>(`/loads/${loadId}/draft-email`, {
      method: "POST",
    }),
  submitSurvey: (answers: SurveyAnswersPayload) =>
    fetchJson<SurveySubmitResponse>("/survey/submit", {
      method: "POST",
      body: JSON.stringify(answers),
    }),
};
