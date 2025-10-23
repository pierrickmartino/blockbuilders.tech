import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseCookieOptions } from "@/lib/supabase/cookie-options";

export const supabase = createBrowserSupabaseClient({
  cookieOptions: getSupabaseCookieOptions()
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
