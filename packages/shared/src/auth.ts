import { z } from "zod";

export const simulationConsentSchema = z.object({
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().datetime({ offset: true }).nullable()
});

export type SimulationConsent = z.infer<typeof simulationConsentSchema>;

export function createSimulationConsent(now: Date = new Date()): SimulationConsent {
  return {
    acknowledged: true,
    acknowledgedAt: now.toISOString()
  };
}

export const appMetadataSchema = z.object({
  consents: z.object({
    simulationOnly: simulationConsentSchema
  })
});

export type AppMetadata = z.infer<typeof appMetadataSchema>;

export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  app_metadata: appMetadataSchema
});

export type SupabaseAuthProfile = z.infer<typeof profileSchema>;

export const auditEventTypeSchema = z.enum(["AUTH_LOGIN", "AUTH_LOGOUT", "WORKSPACE_CREATED", "CONSENT_ACKNOWLEDGED"]);

export const auditLogEventSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  eventType: auditEventTypeSchema,
  createdAt: z.string().datetime({ offset: true }),
  metadata: z.record(z.any()).optional()
});

export type AuditLogEvent = z.infer<typeof auditLogEventSchema>;
export type AuditEventType = z.infer<typeof auditEventTypeSchema>;
