import { z } from "zod";

export const strategyBlockSchema = z.object({
  id: z.string(),
  kind: z.enum(["data-source", "indicator", "signal", "execution", "risk"]),
  label: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  config: z.record(z.any())
});

export const strategyEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string()
});

export const onboardingCalloutSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  actionText: z.string().optional()
});

export const strategySeedSchema = z.object({
  strategyId: z.string(),
  name: z.string(),
  versionId: z.string(),
  versionLabel: z.string(),
  blocks: z.array(strategyBlockSchema),
  edges: z.array(strategyEdgeSchema),
  callouts: z.array(onboardingCalloutSchema)
});

export type StrategyBlock = z.infer<typeof strategyBlockSchema>;
export type StrategyEdge = z.infer<typeof strategyEdgeSchema>;
export type StrategySeed = z.infer<typeof strategySeedSchema>;
export type OnboardingCallout = z.infer<typeof onboardingCalloutSchema>;
