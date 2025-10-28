/**
 * @fileoverview Supabase browser client helpers with consistent cookie configuration.
 */

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Shared Supabase browser client configured with application cookie policy.
 */
export const supabase = createPagesBrowserClient({
  cookieOptions: getSupabaseCookieOptions()
});

/**
 * Retrieves the current Supabase session access token, if available.
 *
 * @returns {Promise<string | null>} Active session token or null when unavailable.
 */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to retrieve Supabase session", error);
    return null;
  }

  return session?.access_token ?? null;
}
