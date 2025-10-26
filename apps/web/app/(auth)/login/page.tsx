"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";

import { completeOnboarding } from "@/lib/auth/onboarding";
import { supabase } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";

const TERMS_URL = "https://blockbuilders.tech/legal/simulation-policy";
const DEFAULT_REDIRECT_PATH = "/dashboard";
const AUTH_REDIRECT_BASE_URL = process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL;

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const consentNotice =
    searchParams?.get("error") === "consent"
      ? "You must acknowledge the simulation-only policy before accessing the platform."
      : null;
  const actionLabel = useMemo(() => (mode === "signin" ? "Sign In" : "Create Account"), [mode]);
  const nextPath = searchParams?.get("next") ?? DEFAULT_REDIRECT_PATH;

  const oauthProviders: Array<{ id: Provider; label: string }> = [
    { id: "google", label: "Continue with Google" },
    { id: "github", label: "Continue with GitHub" }
  ];

  const ensureConsent = () => {
    if (!consent) {
      setError("You must acknowledge the simulation-only policy before continuing.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ensureConsent()) {
      return;
    }

    setError(null);
    setStatusMessage(null);
    startTransition(async () => {
      const credentials = { email, password };
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: window.location.origin } });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const session = result.data?.session ?? null;

      if (!session) {
        setMode("signin");
        setStatusMessage(
          "Account created. Check your email to verify your address, then sign in to continue."
        );
        return;
      }

      try {
        const accessToken = session.access_token ?? null;
        const seed = await completeOnboarding({ acknowledgeConsent: true, accessToken });
        useWorkspaceStore.getState().loadWorkspace(seed);
      } catch (apiError) {
        console.error(apiError);
        setError("We could not persist your consent. Please try again.");
        return;
      }

      router.push(nextPath);
    });
  };

  const handleOAuthSignIn = (provider: Provider) => {
    if (!ensureConsent()) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const redirectOrigin = AUTH_REDIRECT_BASE_URL ?? window.location.origin;
      const redirectTo = new URL("/api/auth/callback", redirectOrigin);
      redirectTo.searchParams.set("next", nextPath);
      redirectTo.searchParams.set("consent", "true");

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo.toString()
        }
      });

      if (signInError) {
        console.error(signInError);
        setError(signInError.message);
      }
    });
  };

  const disabled = pending || !consent;

  return (
    <main>
      <h1>Welcome back</h1>
      <p>Authenticate with Supabase and launch into your guided BlockBuilders workspace.</p>

      {consentNotice ? (
        <p role="status" style={{ color: "#facc15" }}>
          {consentNotice}
        </p>
      ) : null}
      {statusMessage ? (
        <p role="status" style={{ color: "#38bdf8" }}>
          {statusMessage}
        </p>
      ) : null}

      <div className="button-row" role="tablist" aria-label="Authentication modes">
        <button
          type="button"
          className={`button ${mode === "signin" ? "primary" : ""}`}
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          disabled={pending}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`button ${mode === "signup" ? "primary" : ""}`}
          role="tab"
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

      <section style={{ marginTop: "2rem", display: "grid", gap: "0.75rem", maxWidth: "400px" }}>
        <h2 style={{ margin: 0 }}>Or continue with</h2>
        {oauthProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="button"
            onClick={() => handleOAuthSignIn(provider.id)}
            disabled={!consent || pending}
          >
            {provider.label}
          </button>
        ))}
      </section>
    </main>
  );
}
