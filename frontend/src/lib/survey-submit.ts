import { api, type SurveyAnswersPayload, type SurveySubmitResponse } from "@/lib/api";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SurveyAnswers } from "@/lib/survey-steps";

const SURVEY_COMPLETED_KEY = "survey-lead-completed";

export function hasCompletedSurvey(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SURVEY_COMPLETED_KEY) === "true";
}

export function markSurveyCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SURVEY_COMPLETED_KEY, "true");
}

function toPayload(answers: SurveyAnswers): SurveyAnswersPayload {
  return {
    company_size: answers.companySize,
    industry: answers.industry,
    fleet_size: answers.fleetSize,
    features: answers.features,
    pain_point: answers.painPoint,
    current_tools: answers.currentTools,
    timeline: answers.timeline,
    role: answers.role,
    email: answers.email.trim(),
    phone: answers.phone.trim(),
    consent: answers.consent,
  };
}

async function saveToSupabase(
  payload: SurveyAnswersPayload,
  source: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { error } = await supabase.from("survey_leads").insert({
    email: payload.email,
    phone: payload.phone || null,
    company_size: payload.company_size,
    industry: payload.industry,
    fleet_size: payload.fleet_size,
    features: payload.features,
    pain_point: payload.pain_point,
    current_tools: payload.current_tools || null,
    timeline: payload.timeline,
    role: payload.role,
    consent: payload.consent,
    source,
  });

  if (error) {
    throw new Error(`Supabase save failed: ${error.message}`);
  }

  return null;
}

async function logEmailToSupabase(
  leadId: string | null,
  payload: SurveyAnswersPayload,
  result: SurveySubmitResponse
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from("email_responses").insert({
    lead_id: leadId,
    to_email: payload.email,
    subject: "Your A-TMS survey responses",
    email_type: "survey_confirmation",
    sent: result.email_sent,
    provider_message: result.message,
  });
}

export async function submitLeadSurvey(
  answers: SurveyAnswers,
  source = "landing_popup"
): Promise<SurveySubmitResponse & { supabase_saved: boolean }> {
  const payload = toPayload(answers);
  let leadId: string | null = null;
  let supabaseSaved = false;

  if (isSupabaseConfigured()) {
    leadId = await saveToSupabase(payload, source);
    supabaseSaved = true;
  }

  let result: SurveySubmitResponse;
  try {
    result = await api.submitSurvey(payload);
  } catch (err) {
    if (supabaseSaved) {
      return {
        ok: true,
        email_sent: false,
        message:
          "Responses saved to Supabase. Backend email unavailable — start the API server for confirmation emails.",
        lead_id: 0,
        supabase_saved: true,
      };
    }
    throw err;
  }

  if (isSupabaseConfigured()) {
    await logEmailToSupabase(leadId, payload, result).catch(() => undefined);
  }

  markSurveyCompleted();
  return { ...result, supabase_saved: supabaseSaved };
}
