import { z } from "zod";

export const planUsageMetricSchema = z.enum(["backtests", "paper_trades", "template_publishes"]);

export const planUsageSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  metric: planUsageMetricSchema,
  windowStart: z.string().datetime({ offset: true }),
  windowEnd: z.string().datetime({ offset: true }),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  updatedAt: z.string().datetime({ offset: true })
});

export type PlanUsageMetric = z.infer<typeof planUsageMetricSchema>;
export type PlanUsage = z.infer<typeof planUsageSchema>;
