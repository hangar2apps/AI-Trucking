"use client";

import { create } from "zustand";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

function mapUser(
  id: string,
  email: string,
  metadata?: Record<string, unknown>
): AuthUser {
  const name =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    email.split("@")[0];
  return { id, name, email };
}

let listenerAttached = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  init: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ initialized: true });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.email) {
      set({
        user: mapUser(session.user.id, session.user.email, session.user.user_metadata),
      });
    }

    if (!listenerAttached) {
      listenerAttached = true;
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession?.user?.email) {
          set({
            user: mapUser(
              nextSession.user.id,
              nextSession.user.email,
              nextSession.user.user_metadata
            ),
          });
        } else {
          set({ user: null });
        }
      });
    }

    set({ initialized: true });
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Supabase is not configured. Add keys to .env.local." };
    }
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Could not connect to Supabase." };

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user?.email) {
      return { ok: false, error: "Login failed." };
    }

    set({
      user: mapUser(data.user.id, data.user.email, data.user.user_metadata),
    });
    return { ok: true };
  },

  signup: async (name, email, password) => {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Supabase is not configured. Add keys to .env.local." };
    }
    const normalized = email.trim().toLowerCase();
    if (!name.trim() || !normalized || password.length < 6) {
      return { ok: false, error: "Name, email, and password (6+ chars) required." };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, error: "Could not connect to Supabase." };

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user?.email) {
      return { ok: false, error: "Sign up failed." };
    }

    set({
      user: mapUser(data.user.id, data.user.email, data.user.user_metadata),
    });
    return { ok: true };
  },

  logout: async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    set({ user: null });
  },
}));
