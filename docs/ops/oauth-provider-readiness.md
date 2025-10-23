# OAuth Domain & Certificate Readiness

Status log for Supabase OAuth redirect domains, aligned with the DNS & SSL provisioning plan.

| Domain | Environment | Certificate Status | Last Verified | Notes |
| --- | --- | --- | --- | --- |
| auth.blockbuilders.app | Production | Pending DNS validation | 2025-10-13 | ACM request submitted under `networking/oauth-auth-prod`; awaiting CNAME propagation before registering Supabase providers. |
| staging.blockbuilders.app | Staging | Validation in progress | 2025-10-13 | CNAME targets created; DevOps monitoring Route 53 propagation. Blocker escalated to Sprint 1 release checklist. |
| staging-api.blockbuilders.app | Staging API | Validation in progress | 2025-10-13 | Certificate tied to staging ALB; Terraform apply scheduled for Sprint 1. Track progress in Ops ticket `OPS-1124`. |

**Next Steps**
- Re-run `aws acm describe-certificate --certificate-arn <arn>` for each entry once DNS validation completes and update this log.
- After certificates are issued, register the production and staging redirect URLs in Supabase (`Project Settings → Authentication → URL Configuration`).
- If validation exceeds the stage-gating SLA, notify the Product Owner and update the release risk register.
