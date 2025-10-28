/**
 * @fileoverview OAuth callback handler persisting simulation consent before redirecting.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Exchanges Supabase OAuth codes for sessions and optionally captures consent acknowledgement.
 *
 * @param {Request} request - Incoming OAuth callback request.
 * @returns {Promise<NextResponse>} Redirect response to the requested destination.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const shouldPersistConsent = requestUrl.searchParams.get("consent") === "true";

  if (code) {
    const supabase = createRouteHandlerClient({
      cookies,
      cookieOptions: getSupabaseCookieOptions()
    });
    await supabase.auth.exchangeCodeForSession(code);

    if (shouldPersistConsent) {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (accessToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/consent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ acknowledged: true })
          });

          if (!response.ok) {
            console.error("Failed to persist consent during OAuth callback", response.status, await response.text());
          }
        } catch (error) {
          console.error("Error persisting consent during OAuth callback", error);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin), {
    status: 303
  });
}
