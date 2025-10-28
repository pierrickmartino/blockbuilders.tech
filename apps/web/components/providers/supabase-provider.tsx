"use client";

/**
 * @fileoverview Shared Supabase session provider for client components.
 */

import type { ReactElement, ReactNode } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

import { supabase } from "@/lib/supabase/client";

type SupabaseProviderProps = {
  children: ReactNode;
};

/**
 * Supplies Supabase session context to nested client components.
 *
 * @param {SupabaseProviderProps} props - Composition props containing child elements.
 * @returns {ReactElement} Session context provider.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps): ReactElement {
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
