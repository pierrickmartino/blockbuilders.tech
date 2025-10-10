# Epic 1 Foundation & Guided Strategy Canvas

**Epic Goal:** Establish the Blockbuilders monorepo, authentication flow, and the initial visual canvas so new users can assemble blocks, follow onboarding guidance, and achieve a successful backtest. This epic proves the “first win” promise and lays groundwork for subsequent services.

## Story 1.1 Platform Skeleton & Authentication
As a new user,
I want to sign up, authenticate, and land in a pre-configured workspace,
so that I can immediately begin exploring strategy building in a trustworthy environment.

### Acceptance Criteria
1. 1: Monorepo initialized with Next.js frontend, FastAPI API gateway, shared schema package, and CI lint/test pipeline.
2. 2: Supabase (or equivalent) authentication integrated with email/password and OAuth, enforcing simulation-only consent checkbox.
3. 3: Post-login redirect initializes a demo strategy workspace populated with sample blocks and educational callouts.
4. 4: Audit logging captures auth events and workspace creation metadata.

## Story 1.2 Core Canvas Blocks & Validation
As a strategy tinkerer,
I want to drag blocks onto a canvas and connect them with real-time validation,
so that I can assemble a working strategy without writing code.

### Acceptance Criteria
1. 1: Canvas supports drag-and-drop, block linking, and deletion with undo, using at least five starter block types.
2. 2: Inline validation flags missing inputs, incompatible block connections, and quota breaches.
3. 3: Block configuration side panel exposes editable parameters with hint text and default ranges.
4. 4: Strategy versions auto-save with timestamped history and ability to revert to previous version.

## Story 1.3 Guided Onboarding & Template Library
As a first-time user,
I want a guided walkthrough and starter strategies,
so that I can run my first successful backtest within minutes.

### Acceptance Criteria
1. 1: Guided checklist highlights onboarding steps (tour canvas, load template, run backtest) with progress tracking.
2. 2: Template library offers at least three pre-built strategies with tooltips explaining each block.
3. 3: In-app education hub surfaces copy, video, or tooltip content that clarifies simulation scope and risk disclaimers.
4. 4: Analytics event stream captures onboarding progress to measure activation metrics.
