# Introduction
This document outlines the complete fullstack architecture for Blockbuilders, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project
N/A – greenfield project. We intentionally assemble a Turborepo monorepo combining a Next.js 15 App Router frontend with a FastAPI backend (as mandated by the PRD) so we can codify shared types, design tokens, and generated API clients while keeping services modular.

## Change Log
| Date | Version | Description | Author |
| 2025-09-22 | v0.4 | Documented operational playbooks, responsibility ownership, and resilience cadences | Winston (Architect) |
| 2025-09-21 | v0.3 | Synced with PRD v1.4 & UI spec v0.2: added plan guardrails, notification center, and responsive/accessibility guidance | Winston (Architect) |
| 2025-09-21 | v0.2 | Supabase adoption for auth and managed Postgres | Codex (AI) |
| 2025-09-20 | v0.1 | Initial fullstack architecture synthesized from PRD + UI spec | Winston (Architect) |
