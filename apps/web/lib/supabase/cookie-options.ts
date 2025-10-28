/**
 * @fileoverview Supabase cookie configuration utilities.
 */

const ONE_HOUR_IN_SECONDS = 60 * 60;

type SupabaseCookieOptions = {
  name: string;
  lifetime: number;
  domain: string | undefined;
  path: string;
  sameSite: "lax";
  secure: boolean;
};

/**
 * Generates the cookie options used by Supabase clients for session persistence.
 *
 * @returns {SupabaseCookieOptions} Cookie configuration aligned with platform security policy.
 */
export function getSupabaseCookieOptions(): SupabaseCookieOptions {
  return {
    name: "bb-auth-token",
    lifetime: ONE_HOUR_IN_SECONDS,
    domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}
