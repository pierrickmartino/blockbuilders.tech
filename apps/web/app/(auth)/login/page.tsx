"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { fetchAuthSession, persistSimulationConsent, bootstrapDemoWorkspace } from "@/lib/api/client";
import { getAccessToken, supabase } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";

const TERMS_URL = "https://blockbuilders.tech/legal/simulation-policy";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actionLabel = useMemo(() => (mode === "signin" ? "Sign In" : "Create Account"), [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consent) {
      setError("You must acknowledge the simulation-only policy before continuing.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const credentials = { email, password };
      const response =
        mode === "signin"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: window.location.origin } });

      if (response.error) {
        setError(response.error.message);
        return;
      }

      const token = await getAccessToken();

      if (!token) {
        setError("Could not retrieve Supabase session token.");
        return;
      }

      try {
        await persistSimulationConsent(token);
        await fetchAuthSession(token);
        const seed = await bootstrapDemoWorkspace(token);
        useWorkspaceStore.getState().loadWorkspace(seed);
      } catch (apiError) {
        console.error(apiError);
        setError("We could not persist your consent. Please try again.");
        return;
      }

      router.push("/dashboard");
    });
  };

  const disabled = pending || !consent;

  return (
    <main>
      <h1>Welcome back</h1>
      <p>Authenticate with Supabase and launch into your guided BlockBuilders workspace.</p>

      <div className="button-row" role="tablist" aria-label="Authentication modes">
        <button
          type="button"
          className={`button ${mode === "signin" ? "primary" : ""}`}
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          disabled={pending}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`button ${mode === "signup" ? "primary" : ""}`}
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          disabled={pending}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: "400px" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.2)" }}
          />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.2)" }}
          />
        </label>

        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            disabled={pending}
            aria-required
          />
          <span>
            I acknowledge that the BlockBuilders platform operates in a <strong>simulation-only</strong> environment. See our
            <a href={TERMS_URL} target="_blank" rel="noreferrer" style={{ color: "#38bdf8", marginLeft: "0.25rem" }}>
              policy
            </a>
            .
          </span>
        </label>

        <button type="submit" className="button primary" disabled={disabled}>
          {pending ? "Processing..." : actionLabel}
        </button>

        {error ? (
          <p role="alert" style={{ color: "#f87171" }}>
            {error}
          </p>
        ) : null}
      </form>
    </main>
  );
}
