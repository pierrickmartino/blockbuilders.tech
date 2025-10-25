import calloutData from "./callouts.json" assert { type: "json" };

import { onboardingCalloutSchema, type OnboardingCallout } from "../workspace";

const parsedCallouts = onboardingCalloutSchema.array().parse(calloutData);

export const onboardingCallouts: ReadonlyArray<OnboardingCallout> = parsedCallouts;

export const onboardingCalloutOrder = onboardingCallouts
  .slice()
  .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
  .map((callout) => callout.id);

const onboardingCalloutMap = new Map(onboardingCallouts.map((callout) => [callout.id, callout]));

export function getOnboardingCallout(id: string): OnboardingCallout | undefined {
  return onboardingCalloutMap.get(id);
}
