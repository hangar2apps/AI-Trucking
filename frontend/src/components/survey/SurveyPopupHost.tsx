"use client";

import { SurveyPopupModal } from "@/components/survey/SurveyPopupModal";

/** In-app survey modal — opened manually (e.g. pricing flow), not on page load. */
export function SurveyPopupHost() {
  return <SurveyPopupModal />;
}
