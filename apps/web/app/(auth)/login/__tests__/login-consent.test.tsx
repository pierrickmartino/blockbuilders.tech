import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/(auth)/login/page";

const pushMock = vi.hoisted(() => vi.fn());
const loadWorkspaceMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { session: { access_token: "signin-token" } }, error: null })
);
const signUpMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { session: { access_token: "signup-token" } }, error: null })
);
const signInWithOAuthMock = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));
const completeOnboardingMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    blocks: [],
    edges: [],
    callouts: [],
    strategyId: "demo",
    versionId: "v1"
  })
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/stores/workspace", () => {
  const state = {
    seed: null,
    nodes: [],
    edges: [],
    history: [],
    loadWorkspace: loadWorkspaceMock,
    pushHistory: vi.fn(),
    reset: vi.fn()
  };

  const useWorkspaceStore = (selector?: (store: typeof state) => unknown) => {
    if (selector) {
      return selector(state);
    }
    return state;
  };

  useWorkspaceStore.getState = () => state;

  return { useWorkspaceStore };
});

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      signInWithOAuth: signInWithOAuthMock
    }
  },
  getAccessToken: vi.fn()
}));

vi.mock("@/lib/auth/onboarding", () => ({
  completeOnboarding: completeOnboardingMock
}));

describe("LoginPage consent gating", () => {
  beforeEach(() => {
    pushMock.mockClear();
    loadWorkspaceMock.mockClear();
    signInWithPasswordMock.mockClear();
    signUpMock.mockClear();
    signInWithOAuthMock.mockClear();
    completeOnboardingMock.mockClear();
  });

  it("disables authentication actions until consent is acknowledged", () => {
    render(<LoginPage />);

    const submitButton = screen
      .getAllByRole("button", { name: "Sign In" })
      .find((button) => (button as HTMLButtonElement).type === "submit") as HTMLButtonElement;
    const googleButton = screen.getByRole("button", { name: "Continue with Google" });

    expect(submitButton).toBeDisabled();
    expect(googleButton).toBeDisabled();

    const consentCheckbox = screen.getByRole("checkbox", { name: /simulation-only/i });
    fireEvent.click(consentCheckbox);

    expect(submitButton).toBeEnabled();
    expect(googleButton).toBeEnabled();
  });

  it("blocks form submission when consent is missing and surfaces guidance", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "demo@blockbuilders.tech" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "sufficientlySecure1!" } });

    const submitButton = screen
      .getAllByRole("button", { name: "Sign In" })
      .find((button) => (button as HTMLButtonElement).type === "submit") as HTMLButtonElement;
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "You must acknowledge the simulation-only policy before continuing."
      )
    );
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("propagates consent acknowledgement to OAuth sign-in redirects", async () => {
    render(<LoginPage />);

    const consentCheckbox = screen.getByRole("checkbox", { name: /simulation-only/i });
    fireEvent.click(consentCheckbox);

    const googleButton = screen.getByRole("button", { name: "Continue with Google" });
    fireEvent.click(googleButton);

    await waitFor(() => expect(signInWithOAuthMock).toHaveBeenCalled());

    const call = signInWithOAuthMock.mock.calls[0][0];
    expect(call.provider).toBe("google");
    const redirectUrl = new URL(call.options.redirectTo);
    expect(redirectUrl.searchParams.get("consent")).toBe("true");
    expect(redirectUrl.searchParams.get("next")).toBe("/dashboard");
  });

  it("passes the active session access token into onboarding flow after sign-up", async () => {
    render(<LoginPage />);

    const signUpTab = screen.getByRole("tab", { name: "Sign Up" });
    fireEvent.click(signUpTab);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "demo@blockbuilders.tech" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "sufficientlySecure1!" } });

    const consentCheckbox = screen.getByRole("checkbox", { name: /simulation-only/i });
    fireEvent.click(consentCheckbox);

    const submitButton = screen
      .getAllByRole("button", { name: "Create Account" })
      .find((button) => (button as HTMLButtonElement).type === "submit") as HTMLButtonElement;

    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() =>
      expect(completeOnboardingMock).toHaveBeenCalledWith(
        expect.objectContaining({ acknowledgeConsent: true, accessToken: "signup-token" })
      )
    );
  });

  it("prompts the user to verify their email when Supabase does not create a session on sign-up", async () => {
    signUpMock.mockResolvedValueOnce({ data: { session: null }, error: null });

    render(<LoginPage />);

    const signUpTab = screen.getByRole("tab", { name: "Sign Up" });
    fireEvent.click(signUpTab);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "demo@blockbuilders.tech" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "sufficientlySecure1!" } });

    const consentCheckbox = screen.getByRole("checkbox", { name: /simulation-only/i });
    fireEvent.click(consentCheckbox);

    const submitButton = screen
      .getAllByRole("button", { name: "Create Account" })
      .find((button) => (button as HTMLButtonElement).type === "submit") as HTMLButtonElement;

    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Account created. Check your email to verify your address, then sign in to continue."
      )
    );
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });
});
