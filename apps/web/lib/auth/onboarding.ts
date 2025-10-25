"use client";

import {
  acknowledgeSimulationConsent,
  fetchAuthSession,
  bootstrapDemoWorkspace,
  type AuthSession
} from "@/lib/api/client";
import { getAccessToken } from "@/lib/supabase/client";
import type { StrategySeed } from "@blockbuilders/shared";

export class ConsentRequiredError extends Error {
  constructor() {
    super("Simulation consent required");
  }
}

function assertConsentAcknowledged(session: AuthSession): void {
  const consent = session.app_metadata.consents.simulationOnly;
  if (!consent.acknowledged) {
    throw new ConsentRequiredError();
  }
}

type CompleteOnboardingOptions = {
  acknowledgeConsent?: boolean;
  accessToken?: string | null;
};

export async function completeOnboarding(options: CompleteOnboardingOptions = {}): Promise<StrategySeed> {
  const { acknowledgeConsent = false, accessToken } = options;
  const token = accessToken ?? (await getAccessToken());

  if (!token) {
    throw new Error("Supabase session token unavailable");
  }

  if (acknowledgeConsent) {
    await acknowledgeSimulationConsent(token);
  }

  const session = await fetchAuthSession(token);
  assertConsentAcknowledged(session);
  return bootstrapDemoWorkspace(token);
}
