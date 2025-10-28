"use client";

/**
 * @fileoverview Consent-aware controller supplying login state and handlers.
 */

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";

import { completeOnboarding } from "@/lib/auth/onboarding";
import { supabase } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";

const DEFAULT_REDIRECT_PATH = "/dashboard";
const AUTH_REDIRECT_BASE_URL = process.env.NEXT_PUBLIC_AUTH_REDIRECT_BASE_URL;

export type AuthMode = "signin" | "signup";

export type OAuthProviderOption = {
  id: Provider;
  label: string;
};

type LoginControllerState = {
  mode: AuthMode;
  email: string;
  password: string;
  consent: boolean;
  error: string | null;
  statusMessage: string | null;
  pending: boolean;
  actionLabel: string;
  consentNotice: string | null;
  disabled: boolean;
  oauthProviders: OAuthProviderOption[];
};

type LoginControllerHandlers = {
  setMode: (mode: AuthMode) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConsent: (value: boolean) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleOAuthSignIn: (provider: Provider) => void;
};

type LoginController = {
  state: LoginControllerState;
  handlers: LoginControllerHandlers;
};

/**
 * Provides derived state and event handlers for the Supabase authentication UI.
 *
 * @returns {LoginController} Structured state and actions powering the login page.
 */
export function useLoginController(): LoginController {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadWorkspace = useWorkspaceStore((state) => state.loadWorkspace);

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
  const nextPath = searchParams?.get("next") ?? DEFAULT_REDIRECT_PATH;

  const actionLabel = useMemo(() => (mode === "signin" ? "Sign In" : "Create Account"), [mode]);

  const oauthProviders: OAuthProviderOption[] = [
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
          : await supabase.auth.signUp({
              ...credentials,
              options: { emailRedirectTo: window.location.origin }
            });

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
        loadWorkspace(seed);
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

  return {
    state: {
      mode,
      email,
      password,
      consent,
      error,
      statusMessage,
      pending,
      actionLabel,
      consentNotice,
      disabled: pending || !consent,
      oauthProviders
    },
    handlers: {
      setMode,
      setEmail,
      setPassword,
      setConsent,
      handleSubmit,
      handleOAuthSignIn
    }
  };
}
