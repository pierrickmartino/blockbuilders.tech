import { test, expect } from "@playwright/test";

import { onboardingCallouts } from "@blockbuilders/shared";

test.describe("onboarding callouts", () => {
  test("renders canonical callouts in order", async ({ page }) => {
    const markup = onboardingCallouts
      .map(
        (callout) => `
        <article data-callout-id="${callout.id}">
          <h2>${callout.title}</h2>
          <p>${callout.description}</p>
        </article>`
      )
      .join("\n");

    await page.setContent(`<main>${markup}</main>`);

    for (const callout of onboardingCallouts) {
      const locator = page.locator(`[data-callout-id="${callout.id}"]`);
      await expect(locator.locator("h2")).toHaveText(callout.title);
      await expect(locator.locator("p")).toContainText(callout.description.slice(0, 12));
    }
  });
});
