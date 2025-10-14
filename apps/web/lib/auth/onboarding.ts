"use client";

import { fetchAuthSession, persistSimulationConsent, bootstrapDemoWorkspace } from "@/lib/api/client";
import { getAccessToken } from "@/lib/supabase/client";
import type { StrategySeed } from "@blockbuilders/shared";

export async function completeOnboarding(): Promise<StrategySeed> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Supabase session token unavailable");
  }

  await persistSimulationConsent(token);
  await fetchAuthSession(token);
  return bootstrapDemoWorkspace(token);
}
