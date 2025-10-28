"use client";

/**
 * @fileoverview Simulation consent-gated authentication page for Supabase auth flows.
 */

import { ChangeEvent, ReactElement } from "react";
import Link from "next/link";

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

  const heading = mode === "signin" ? "Sign in to your account" : "Create your account";

  return (
    <div className="auth-shell">
      <main className="auth-card">
        <header className="auth-logo" aria-label="BlockBuilders">
          <div className="auth-logo-mark" aria-hidden="true">
            BB
          </div>
          <div>
            <span>BlockBuilders</span>
          </div>
        </header>

        <section>
          <h1 className="auth-title">{heading}</h1>
          <AuthModeToggle mode={mode} pending={pending} onSelect={setMode} />
        </section>

        {consentNotice ? <StatusBanner message={consentNotice} tone="warning" role="status" /> : null}
        {statusMessage ? <StatusBanner message={statusMessage} tone="info" role="status" /> : null}

        <OAuthProviderButtons
          options={oauthProviders}
          disabled={!consent}
          pending={pending}
          onSignIn={handleOAuthSignIn}
        />

        <div className="auth-separator">
          <span>or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="email">
            Email
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="john@company.com"
              autoComplete="email"
              required
              value={email}
              onChange={handleEmailChange}
              disabled={pending}
            />
          </label>

          <label className="auth-label" htmlFor="password">
            Password
            <input
              id="password"
              className="auth-input"
              type="password"
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              value={password}
              onChange={handlePasswordChange}
              disabled={pending}
            />
          </label>

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={handleConsentChange}
              disabled={pending}
              aria-required
            />
            <span>
              I acknowledge that the BlockBuilders platform operates in a <strong>simulation-only</strong> environment. See our{" "}
              <a className="auth-link" href={TERMS_URL} target="_blank" rel="noreferrer">
                policy
              </a>
              .
            </span>
          </label>

          <button type="submit" className="auth-submit" disabled={disabled}>
            {pending ? "Processing..." : actionLabel}
          </button>

          {error ? <StatusBanner message={error} tone="error" role="alert" /> : null}
        </form>

        <div className="auth-footer">
          <span>Forgot your password?</span>
          <Link href="https://blockbuilders.tech/reset-password">Reset password</Link>
        </div>
      </main>
    </div>
  );
}
