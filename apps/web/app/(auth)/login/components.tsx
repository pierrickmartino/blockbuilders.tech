"use client";

/**
 * @fileoverview Presentational helpers for the consent-gated login workflow.
 */

import type { ReactElement } from "react";
import type { Provider } from "@supabase/supabase-js";

import type { AuthMode, OAuthProviderOption } from "./useLoginController";

type AuthModeToggleProps = {
  mode: AuthMode;
  pending: boolean;
  onSelect: (mode: AuthMode) => void;
};

/**
 * Renders segmented buttons for choosing between sign-in and sign-up flows.
 *
 * @param {AuthModeToggleProps} props - Component props.
 * @returns {ReactElement} Auth mode toggle control.
 */
export function AuthModeToggle({ mode, pending, onSelect }: AuthModeToggleProps): ReactElement {
  const isSignIn = mode === "signin";
  const message = isSignIn ? "Don't have an account?" : "Already have an account?";
  const actionLabel = isSignIn ? "Sign up" : "Sign in";
  const targetMode: AuthMode = isSignIn ? "signup" : "signin";

  return (
    <p className="auth-subtext" aria-live="polite">
      {message}{" "}
      <button
        type="button"
        className="auth-link"
        onClick={() => onSelect(targetMode)}
        disabled={pending}
      >
        {actionLabel}
      </button>
    </p>
  );
}

type OAuthProviderButtonsProps = {
  options: OAuthProviderOption[];
  disabled: boolean;
  pending: boolean;
  onSignIn: (provider: Provider) => void;
};

/**
 * Displays available OAuth providers for Supabase authentication.
 *
 * @param {OAuthProviderButtonsProps} props - Component props.
 * @returns {ReactElement} OAuth provider selection list.
 */
export function OAuthProviderButtons({
  options,
  disabled,
  pending,
  onSignIn
}: OAuthProviderButtonsProps): ReactElement {
  return (
    <section aria-label="Social sign-in providers">
      <div className="auth-provider-grid">
        {options.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="auth-provider-button"
            onClick={() => onSignIn(provider.id)}
            disabled={disabled || pending}
          >
            {resolveProviderIcon(provider.id)}
            <span>{provider.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

type StatusBannerProps = {
  message: string;
  tone: "info" | "warning" | "error";
  role?: "status" | "alert";
};

const TONE_COLORS: Record<StatusBannerProps["tone"], string> = {
  info: "#38bdf8",
  warning: "#facc15",
  error: "#f87171"
};

/**
 * Presents feedback messaging with semantic coloring for assistive technologies.
 *
 * @param {StatusBannerProps} props - Banner presentation options.
 * @returns {ReactElement} Feedback paragraph element.
 */
export function StatusBanner({ message, tone, role = "status" }: StatusBannerProps): ReactElement {
  return (
    <p role={role} className={`auth-banner ${tone}`} style={{ borderLeft: `4px solid ${TONE_COLORS[tone]}` }}>
      {message}
    </p>
  );
}

function resolveProviderIcon(provider: Provider): ReactElement {
  switch (provider) {
    case "google":
      return <GoogleIcon />;
    case "github":
      return <GitHubIcon />;
    default:
      return <DefaultProviderIcon label={provider.slice(0, 2).toUpperCase()} />;
  }
}

function GoogleIcon(): ReactElement {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 46 46" fill="none">
      <path
        d="M45.5 23.5c0-1.6-.1-3.2-.5-4.7H23v9h12.7c-.6 3-2.6 5.5-5.3 7.2v6h8.6c5-4.6 7.5-11.5 6.5-17.5Z"
        fill="#4285F4"
      />
      <path
        d="M23 46c6.3 0 11.7-2.1 15.6-5.8l-8.6-6c-2.4 1.6-5.4 2.6-7 2.6-5.3 0-9.8-3.6-11.4-8.4H2.7v6.3C6.6 41.8 14.1 46 23 46Z"
        fill="#34A853"
      />
      <path
        d="M11.6 28.5a13.9 13.9 0 0 1 0-9L5.3 13a22.9 22.9 0 0 0 0 20L11.6 28.5Z"
        fill="#FBBC04"
      />
      <path
        d="M23 9.1c3.4 0 6.4 1.3 8.8 3.8l6.4-6.4A23 23 0 0 0 2.7 13l6.3 6.5c1.6-4.8 6.1-8.4 11.4-8.4Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon(): ReactElement {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.34.7-4.04-1.6-4.04-1.6-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.5.8 1.5.8.9 1.6 2.3 1.1 2.8.9.1-.7.4-1.1.7-1.4-2.67-.3-5.47-1.4-5.47-6.2 0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2.9-.3 1.9-.5 2.9-.5s2 .2 2.9.5c2.3-1.6 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.9 1.2 2 1.2 3.4 0 4.8-2.8 5.9-5.5 6.2.4.3.8 1 .8 2v3c0 .3.2.6.8.5C20.6 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12Z"
        fill="#111827"
      />
    </svg>
  );
}

type DefaultProviderIconProps = {
  label: string;
};

function DefaultProviderIcon({ label }: DefaultProviderIconProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        placeItems: "center",
        width: "20px",
        height: "20px",
        borderRadius: "999px",
        backgroundColor: "#e5e7eb",
        fontSize: "0.7rem",
        fontWeight: 600
      }}
    >
      {label}
    </span>
  );
}
