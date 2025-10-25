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

const calloutActionSchema = z.object({
  label: z.string(),
  href: z.string().optional()
});

export const onboardingCalloutSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  trigger: z.string().optional(),
  order: z.number().optional(),
  primaryAction: calloutActionSchema.optional(),
  secondaryAction: calloutActionSchema.optional(),
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
export type CalloutAction = z.infer<typeof calloutActionSchema>;
