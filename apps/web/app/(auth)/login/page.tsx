"use client";

/**
 * @fileoverview Simulation consent-gated authentication page for Supabase auth flows.
 */

import { ChangeEvent, ReactElement } from "react";

import { AuthModeToggle, OAuthProviderButtons, StatusBanner } from "./components";
import { useLoginController } from "./useLoginController";

const TERMS_URL = "https://blockbuilders.tech/legal/simulation-policy";

/**
 * Presents email/password and OAuth authentication with simulation-only consent enforcement.
 *
 * @returns {ReactElement} Interactive authentication workflow.
 */
export default function LoginPage(): ReactElement {
  const {
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
      disabled,
      oauthProviders
    },
    handlers: { setMode, setEmail, setPassword, setConsent, handleSubmit, handleOAuthSignIn }
  } = useLoginController();

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleConsentChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConsent(event.target.checked);
  };

  return (
    <main>
      <h1>Welcome back</h1>
      <p>Authenticate with Supabase and launch into your guided BlockBuilders workspace.</p>

      {consentNotice ? <StatusBanner message={consentNotice} tone="warning" role="status" /> : null}
      {statusMessage ? <StatusBanner message={statusMessage} tone="info" role="status" /> : null}

      <AuthModeToggle mode={mode} pending={pending} onSelect={setMode} />

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", maxWidth: "400px" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleEmailChange}
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
            onChange={handlePasswordChange}
            disabled={pending}
            style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.2)" }}
          />
        </label>

        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={handleConsentChange}
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

        {error ? <StatusBanner message={error} tone="error" role="alert" /> : null}
      </form>

      <OAuthProviderButtons
        options={oauthProviders}
        disabled={!consent}
        pending={pending}
        onSignIn={handleOAuthSignIn}
      />
    </main>
  );
}
