"use client";

/**
 * @fileoverview Client-side onboarding helpers enforcing simulation consent.
 */

import {
  acknowledgeSimulationConsent,
  fetchAuthSession,
  bootstrapDemoWorkspace,
  type AuthSession
} from "@/lib/api/client";
import { getAccessToken } from "@/lib/supabase/client";
import type { StrategySeed } from "@blockbuilders/shared";

export class ConsentRequiredError extends Error {
  /**
   * Construct an error signaling that simulation-only consent is missing.
   */
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

/**
 * Ensures consent acknowledgement and returns the seeded strategy workspace for the user.
 *
 * @param {CompleteOnboardingOptions} options - Optional consent acknowledgement parameters.
 * @returns {Promise<StrategySeed>} Seeded workspace ready for canvas hydration.
 * @throws {Error} When a Supabase access token is unavailable.
 */
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
