import { SurveyStepClient } from "@/components/survey/SurveyStepClient";
import { surveySteps } from "@/lib/survey-steps";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ step: string }>;
}

export default async function SurveyStepPage({ params }: PageProps) {
  const { step: stepParam } = await params;
  const step = parseInt(stepParam, 10);

  if (isNaN(step) || !surveySteps.find((s) => s.id === step)) {
    notFound();
  }

  return <SurveyStepClient step={step} />;
}
