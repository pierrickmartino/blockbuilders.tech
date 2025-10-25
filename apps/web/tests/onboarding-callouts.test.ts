import { describe, expect, it } from "vitest";

import { getOnboardingCallout, onboardingCalloutOrder, onboardingCallouts } from "@blockbuilders/shared";

describe("onboarding callout registry", () => {
  it("exposes the canonical set of callouts in order", () => {
    expect(onboardingCallouts).toHaveLength(4);
    expect(onboardingCalloutOrder).toEqual(["welcome-consent", "canvas-tour", "edit-parameters", "run-first-backtest"]);
  });

  it("provides callout metadata with primary and secondary actions", () => {
    const callout = getOnboardingCallout("welcome-consent");
    expect(callout?.primaryAction?.label).toBe("Acknowledge & Continue");
    expect(callout?.secondaryAction?.href).toBe("/legal/simulation-policy");
  });
});
