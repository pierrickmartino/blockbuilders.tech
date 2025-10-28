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
  return (
    <div className="button-row" role="tablist" aria-label="Authentication modes">
      <button
        type="button"
        className={`button ${mode === "signin" ? "primary" : ""}`}
        role="tab"
        aria-selected={mode === "signin"}
        onClick={() => onSelect("signin")}
        disabled={pending}
      >
        Sign In
      </button>
      <button
        type="button"
        className={`button ${mode === "signup" ? "primary" : ""}`}
        role="tab"
        aria-selected={mode === "signup"}
        onClick={() => onSelect("signup")}
        disabled={pending}
      >
        Sign Up
      </button>
    </div>
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
    <section style={{ marginTop: "2rem", display: "grid", gap: "0.75rem", maxWidth: "400px" }}>
      <h2 style={{ margin: 0 }}>Or continue with</h2>
      {options.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="button"
          onClick={() => onSignIn(provider.id)}
          disabled={disabled || pending}
        >
          {provider.label}
        </button>
      ))}
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
    <p role={role} style={{ color: TONE_COLORS[tone] }}>
      {message}
    </p>
  );
}
