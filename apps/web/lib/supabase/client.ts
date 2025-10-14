import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

const ONE_HOUR_IN_SECONDS = 60 * 60;

export const supabase = createBrowserSupabaseClient({
  cookieOptions: {
    name: "bb-auth-token",
    lifetime: ONE_HOUR_IN_SECONDS,
    domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? undefined,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  }
});

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
