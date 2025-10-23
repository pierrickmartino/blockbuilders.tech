import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { appMetadataSchema } from "@blockbuilders/shared";

const PROTECTED_PATH_PREFIXES = ["/dashboard"];

function requiresAuth(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function buildRedirectUrl(request: NextRequest, reason: "login" | "consent"): URL {
  const redirect = new URL("/login", request.url);
  if (reason === "consent") {
    redirect.searchParams.set("error", "consent");
  }

  const nextParam = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirect.searchParams.set("next", nextParam);
  return redirect;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createMiddlewareClient({ req: request, res: response });

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

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"]
};
