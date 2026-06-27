"use client";

import { create } from "zustand";

interface PricingPopupState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const usePricingPopupStore = create<PricingPopupState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
