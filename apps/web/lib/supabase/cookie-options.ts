const ONE_HOUR_IN_SECONDS = 60 * 60;

export function getSupabaseCookieOptions() {
  return {
    name: "bb-auth-token",
    lifetime: ONE_HOUR_IN_SECONDS,
    domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}
