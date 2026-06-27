"use client";

import { useEffect } from "react";
import { SurveyPopupModal } from "@/components/survey/SurveyPopupModal";
import { useSurveyPopupStore } from "@/stores/survey-popup-store";

export function SurveyPopupHost() {
  const open = useSurveyPopupStore((s) => s.open);

  useEffect(() => {
    const timer = window.setTimeout(() => open(), 600);
    return () => window.clearTimeout(timer);
  }, [open]);

  return <SurveyPopupModal />;
}
