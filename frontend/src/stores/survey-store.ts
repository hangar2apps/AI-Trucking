"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultAnswers, type SurveyAnswers } from "@/lib/survey-steps";

interface SurveyStore {
  answers: SurveyAnswers;
  setAnswer: <K extends keyof SurveyAnswers>(
    key: K,
    value: SurveyAnswers[K]
  ) => void;
  toggleFeature: (feature: string) => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set, get) => ({
      answers: defaultAnswers,
      setAnswer: (key, value) =>
        set((state) => ({
          answers: { ...state.answers, [key]: value },
        })),
      toggleFeature: (feature) => {
        const current = get().answers.features;
        const next = current.includes(feature)
          ? current.filter((f) => f !== feature)
          : [...current, feature];
        set((state) => ({
          answers: { ...state.answers, features: next },
        }));
      },
      reset: () => set({ answers: defaultAnswers }),
    }),
    { name: "survey-answers" }
  )
);
