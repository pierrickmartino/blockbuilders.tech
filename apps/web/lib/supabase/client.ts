import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();

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
