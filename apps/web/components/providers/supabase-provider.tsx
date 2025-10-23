"use client";

import type { ReactNode } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

import { supabase } from "@/lib/supabase/client";

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
