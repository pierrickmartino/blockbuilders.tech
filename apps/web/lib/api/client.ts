/**
 * @fileoverview Typed REST client for BlockBuilders authentication APIs.
 */

import { SupabaseAuthProfile, appMetadataSchema, strategySeedSchema, type StrategySeed } from "@blockbuilders/shared";

/**
 * Auth session payload validated against shared Supabase schemas.
 */
export type AuthSession = SupabaseAuthProfile;

type ApiAuthSessionResponse = {
  id: string;
  email: string;
  appMetadata: unknown;
};

/**
 * Retrieves the authenticated Supabase session metadata from the API.
 *
 * @param {string} accessToken - Supabase access token used for authorization.
 * @returns {Promise<AuthSession>} Parsed session payload matching shared contracts.
 * @throws {Error} When the fetch fails or the payload cannot be validated.
 */
export async function fetchAuthSession(accessToken: string): Promise<AuthSession> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/session`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.status}`);
  }

  const json = (await response.json()) as ApiAuthSessionResponse;
  const parsed = appMetadataSchema.safeParse(json.appMetadata);

  if (!parsed.success) {
    throw new Error("Received invalid app metadata from API");
  }

  return {
    id: json.id,
    email: json.email,
    app_metadata: parsed.data
  } satisfies AuthSession;
}

/**
 * Persists the simulation-only consent acknowledgement for the active user.
 *
 * @param {string} accessToken - Supabase access token used for authorization.
 * @returns {Promise<void>} Resolves when the API confirms consent persistence.
 * @throws {Error} When the API call fails.
 */
export async function acknowledgeSimulationConsent(accessToken: string): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ acknowledged: true })
  });

  if (!response.ok) {
    throw new Error(`Failed to persist consent: ${response.status}`);
  }
}

/**
 * Seeds a demo strategy and initial version for the authenticated user.
 *
 * @param {string} accessToken - Supabase access token used for authorization.
 * @returns {Promise<StrategySeed>} Strategy scaffold containing blocks and edges.
 * @throws {Error} When strategy provisioning fails or responses are invalid.
 */
export async function bootstrapDemoWorkspace(accessToken: string): Promise<StrategySeed> {
  const strategyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/strategies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!strategyResponse.ok) {
    throw new Error(`Failed to create strategy: ${strategyResponse.status}`);
  }

  const strategyJson = await strategyResponse.json();
  const strategyParsed = strategySeedSchema.safeParse(strategyJson);

  if (!strategyParsed.success) {
    throw new Error("Invalid strategy seed payload");
  }

  const versionResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/strategies/${strategyParsed.data.strategyId}/versions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!versionResponse.ok) {
    throw new Error(`Failed to seed strategy version: ${versionResponse.status}`);
  }

  const versionJson = await versionResponse.json();
  const versionParsed = strategySeedSchema.safeParse(versionJson);

  if (!versionParsed.success) {
    throw new Error("Invalid strategy version payload");
  }

  return versionParsed.data;
}
