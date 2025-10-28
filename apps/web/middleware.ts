/**
 * @fileoverview Edge middleware enforcing authentication and consent gating.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { appMetadataSchema } from "@blockbuilders/shared";
import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

const PROTECTED_PATH_PREFIXES = ["/dashboard"];

/**
 * Determines whether the current path requires an authenticated session.
 *
 * @param {string} pathname - Requested URL pathname.
 * @returns {boolean} True when the route is protected.
 */
function requiresAuth(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Builds a redirect URL preserving the original destination and reason.
 *
 * @param {NextRequest} request - Incoming request context.
 * @param {"login" | "consent"} reason - Redirect reason for messaging.
 * @returns {URL} Next.js redirect destination.
 */
function buildRedirectUrl(request: NextRequest, reason: "login" | "consent"): URL {
  const redirect = new URL("/login", request.url);
  if (reason === "consent") {
    redirect.searchParams.set("error", "consent");
  }

  const nextParam = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirect.searchParams.set("next", nextParam);
  return redirect;
}

/**
 * Enforces authentication and consent acknowledgement prior to accessing protected routes.
 *
 * @param {NextRequest} request - Next.js middleware request.
 * @returns {Promise<NextResponse>} Response or redirect enforcing policy.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createMiddlewareClient({
    req: request,
    res: response,
    cookieOptions: getSupabaseCookieOptions()
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!requiresAuth(request.nextUrl.pathname)) {
    return response;
  }

  if (!session) {
    return NextResponse.redirect(buildRedirectUrl(request, "login"));
  }

  const metadataResult = appMetadataSchema.safeParse(session.user?.app_metadata);
  const consentAcknowledged = metadataResult.success && metadataResult.data.consents.simulationOnly.acknowledged;

  if (!consentAcknowledged) {
    return NextResponse.redirect(buildRedirectUrl(request, "consent"));
  }

  return response;
}

/**
 * Middleware matcher configuration enforcing gating on dashboard routes.
 */
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"]
};
