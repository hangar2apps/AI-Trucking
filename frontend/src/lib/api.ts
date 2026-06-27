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

export interface EmailDraftSendResponse extends EmailDraftResponse {
  email_sent: boolean;
  send_message: string;
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

export interface FleetEvent {
  id: number;
  created_at: string;
  kind: string;
  load_id: number | null;
  truck_id: number | null;
  summary: string;
  data: Record<string, unknown> | null;
}

export interface SimStatus {
  running: boolean;
  tick_count: number;
  interval_seconds: number;
  minutes_per_tick: number;
  step_miles: number;
}

export interface WeatherRouteResult {
  status: string;
  incidents: Array<{
    type: string;
    label: string;
    severity: string;
    eta_impact_minutes?: number;
    affected_route?: string;
  }>;
  note: string;
}

export interface ComputeEtaResult {
  distance_mi?: number;
  drive_hours?: number;
  eta?: string;
  error?: string;
}

export interface AgentStep {
  kind: string;
  text?: string | null;
  tool?: string | null;
  tool_input?: Record<string, unknown> | null;
  tool_output?: Record<string, unknown> | null;
}

export interface AgentRunResult {
  final_message: string;
  steps: AgentStep[];
  iterations: number;
  dry_run: boolean;
}

export interface InquiryReplyResponse {
  matched_load_id: number | null;
  load_reference: string | null;
  recipient_name: string;
  recipient_email: string;
  recipient_role: string;
  inferred_intent: string;
  confidence: string;
  needs_clarification: boolean;
  clarifying_questions: string[];
  reply_subject: string;
  reply_body: string;
  internal_summary: string;
  model: string;
}

export interface InquirySendResponse extends InquiryReplyResponse {
  email_sent: boolean;
  send_message: string;
}

export interface InquiryRequestPayload {
  from_email: string;
  role?: "customer" | "driver";
  message: string;
  sender_name?: string;
  subject?: string;
}

export interface InboundSimulatePayload {
  from_email: string;
  body: string;
  subject?: string;
  sender_name?: string;
  to_email?: string;
  auto_send?: boolean;
}

export interface InboundProcessResponse {
  event_id: number;
  from_email: string;
  from_name: string;
  to_email: string;
  subject: string;
  body: string;
  inferred_role: string;
  matched_load_id: number | null;
  load_reference: string | null;
  inferred_intent: string;
  confidence: string;
  needs_clarification: boolean;
  clarifying_questions: string[];
  reply_subject: string;
  reply_body: string;
  internal_summary: string;
  auto_reply_sent: boolean;
  send_message: string;
  model: string;
}

export interface InboxItem {
  id: number;
  created_at: string;
  from_email: string;
  from_name: string;
  subject: string;
  body_preview: string;
  load_reference: string | null;
  inferred_intent: string | null;
  inferred_role: string | null;
  auto_reply_sent: boolean | null;
  send_message: string | null;
  reply_subject: string | null;
  reply_body: string | null;
}

export interface InboxResponse {
  items: InboxItem[];
  ai_inbox_email: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail ? `API ${path} failed: ${res.status} ${detail}` : `API ${path} failed: ${res.status}`
    );
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
  sendCustomerEmail: (loadId: number) =>
    fetchJson<EmailDraftSendResponse>(`/loads/${loadId}/send-customer-email`, {
      method: "POST",
    }),
  submitSurvey: (answers: SurveyAnswersPayload) =>
    fetchJson<SurveySubmitResponse>("/survey/submit", {
      method: "POST",
      body: JSON.stringify(answers),
    }),
  getEvents: (sinceId = 0) =>
    fetchJson<FleetEvent[]>(`/events?since_id=${sinceId}&limit=100`),
  getSimStatus: () => fetchJson<SimStatus>("/sim/status"),
  startSim: () => fetchJson<SimStatus>("/sim/start", { method: "POST" }),
  stopSim: () => fetchJson<SimStatus>("/sim/stop", { method: "POST" }),
  tickSim: () => fetchJson<Record<string, unknown>>("/sim/tick", { method: "POST" }),
  checkWeatherRoute: (route: {
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
  }) =>
    fetchJson<WeatherRouteResult>("/tools/check-weather-route", {
      method: "POST",
      body: JSON.stringify(route),
    }),
  computeEta: (payload: { truck_id: number; dest_lat: number; dest_lng: number }) =>
    fetchJson<ComputeEtaResult>("/tools/compute-eta", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  runAgent: (situation: string, dryRun = true) =>
    fetchJson<AgentRunResult>("/agent/run", {
      method: "POST",
      body: JSON.stringify({ situation, dry_run: dryRun }),
    }),
  respondToInquiry: (payload: InquiryRequestPayload) =>
    fetchJson<InquiryReplyResponse>("/assistant/inquiry", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendInquiryReply: (payload: InquiryRequestPayload) =>
    fetchJson<InquirySendResponse>("/assistant/inquiry/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  simulateInboundEmail: (payload: InboundSimulatePayload) =>
    fetchJson<InboundProcessResponse>("/assistant/inbound/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAssistantInbox: (limit = 40) =>
    fetchJson<InboxResponse>(`/assistant/inbox?limit=${limit}`),
};
