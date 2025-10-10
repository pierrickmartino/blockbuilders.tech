# Frontend Architecture

## Component Architecture
### Component Organization
```text
apps/web/src/
├── app/
│   ├── (public)/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── dashboard/
│       ├── strategies/[strategyId]/
│       ├── templates/
│       ├── notifications/
│       ├── paper-trading/
│       ├── account/plan/
│       └── educator/
├── components/
│   ├── canvas/
│   ├── analytics/
│   ├── onboarding/
│   ├── notifications/
│   ├── paper-trading/
│   ├── billing/
│   ├── compliance/
│   └── primitives/
├── hooks/
├── services/
├── stores/
└── utils/
```

### Component Template
```typescript
import { memo } from 'react';
import { useStrategyCanvas } from '@/stores/canvas';
import { useValidation } from '@/hooks/useValidation';
import { CanvasNode } from '@/components/canvas/CanvasNode';

type StrategyCanvasProps = {
  strategyId: string;
  versionId: string;
};

export const StrategyCanvas = memo(function StrategyCanvas({ strategyId, versionId }: StrategyCanvasProps) {
  const graph = useStrategyCanvas(strategyId, versionId);
  const { issues, validate } = useValidation(strategyId, versionId);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Strategy Canvas</h2>
        <button className="btn-primary" onClick={validate}>Validate</button>
      </header>
      <div className="canvas-grid">
        {graph.nodes.map((node) => (
          <CanvasNode key={node.id} node={node} issues={issues[node.id] ?? []} />
        ))}
      </div>
    </section>
  );
});
```

## Feature Modules
- **Onboarding & Education Hub:** Guided checklist, starter templates, and contextual education tiles that mirror the UX spec's progressive disclosure cues.
- **Strategy Canvas & Validation:** Drag-and-drop canvas, inline validation badges, and comparison table surfaces tied to shared Zustand stores.
- **Results & Insight Dashboards:** Backtest summaries, comparison hub, anomaly inspector, and insight engine panels with shared data loaders.
- **Paper Trading Scheduler & Alert Center:** Scheduling wizard, alert thresholds, notification inbox, and acknowledgement flows introduced in UI spec v0.2.
- **Plan & Billing Guardrails:** Plan usage banner, upgrade modals, and quota tooltips that surface before heavy actions to reinforce freemium boundaries.
- **Compliance & Disclosure Surfaces:** Disclosure banners, compliance checklists, and educator governance panes to keep messaging consistent across flows.

## State Management Architecture
### State Structure
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { StrategyGraph } from '@blockbuilders/shared/types';

type CanvasState = {
  graphs: Record<string, StrategyGraph>;
  setGraph: (versionId: string, graph: StrategyGraph) => void;
  updateNode: (versionId: string, nodeId: string, updates: Partial<StrategyGraph['nodes'][number]>) => void;
};

export const useStrategyCanvas = create<CanvasState>()(
  devtools(
    persist((set) => ({
      graphs: {},
      setGraph: (versionId, graph) => set((state) => ({ graphs: { ...state.graphs, [versionId]: graph } })),
      updateNode: (versionId, nodeId, updates) =>
        set((state) => {
          const graph = state.graphs[versionId];
          if (!graph) return state;
          const nodes = graph.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          );
          return { graphs: { ...state.graphs, [versionId]: { ...graph, nodes } } };
        }),
    }), { name: 'bb-canvas' })
  )
);
```

### State Management Patterns
- Separate server state (React Query) from local canvas edits (Zustand) to avoid cache churn.
- Persist drafts locally to support offline tinkering; sync when validation is triggered.
- Emit validation events via Zustand listeners to provide immediate UX feedback.
- Mirror Supabase `app_metadata.roles` into store on login for consistent feature gating.
- Hydrate plan quotas and usage counters from React Query selectors so quota modals render before API calls.
- Maintain notification inbox state (unread counts, acknowledgements) independently to keep toasts and the notification center in sync.

## Routing Architecture
### Route Organization
```text
app/
├── layout.tsx
├── page.tsx
├── (auth)/login/page.tsx
├── (dashboard)/layout.tsx
├── (dashboard)/dashboard/page.tsx
├── (dashboard)/strategies/page.tsx
├── (dashboard)/strategies/[strategyId]/page.tsx
├── (dashboard)/templates/page.tsx
├── (dashboard)/notifications/page.tsx
├── (dashboard)/paper-trading/page.tsx
├── (dashboard)/account/plan/page.tsx
├── (dashboard)/educator/page.tsx
└── api/notifications/route.ts
```

### Protected Route Pattern
```typescript
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export async function withRoleGuard(route: string, requiredRoles: string[], next: () => Promise<JSX.Element>) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect(`/login?next=${route}`);
  }
  const roles = (session.user.app_metadata?.roles ?? []) as string[];
  if (!requiredRoles.some((role) => roles.includes(role))) {
    redirect('/403');
  }
  return next();
}
```

## Frontend Services Layer
### API Client Setup
```typescript
import ky from 'ky';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ApiError } from '@blockbuilders/shared/errors';

const supabase = createClientComponentClient();

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  hooks: {
    beforeRequest: [async (request) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }],
    afterResponse: [(_request, _options, response) => {
      if (!response.ok) {
        return response.json().then((payload) => {
          throw ApiError.fromResponse(payload, response.status);
        });
      }
    }],
  },
});
```

### Service Example
```typescript
import { apiClient } from './client';
import { StrategyInput, Strategy } from '@blockbuilders/shared/types';

export async function createStrategy(input: StrategyInput): Promise<Strategy> {
  return apiClient.post('strategies', { json: input }).json<Strategy>();
}
```

### Guard Example
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@blockbuilders/shared/errors';
import { PlanUsage } from '@blockbuilders/shared/types';

export function assertBacktestQuota(queryClient: ReturnType<typeof useQueryClient>) {
  const usage = queryClient.getQueryData<PlanUsage>(['planUsage', 'backtests']);
  if (!usage) return;
  if (usage.used >= usage.limit) {
    throw new ApiError('quota_exceeded', 'Upgrade to unlock more backtests today.', {
      metric: 'backtests',
      limit: usage.limit,
    });
  }
}
```

## Responsive & Accessibility Strategy
- Breakpoints mirror the UX spec: mobile (≤599px) surfaces read-only strategy cards, alert acknowledgements, and upgrade CTAs; tablet (600–1023px) unlocks simplified canvas editing; desktop and wide retain full drag-and-drop plus analytics panes.
- Side panels collapse into drawers on tablet/mobile, dashboards stack vertically with sticky KPI summaries, and notification toasts funnel into the persistent notification center entry point.
- High-contrast 2px focus rings, semantic headings, and chart summaries keep interfaces aligned with WCAG 2.1 AA, matching the front-end spec's accessibility guardrails.
- Canvas blocks expose ARIA labels, validation badges emit polite live-region updates, and animations respect `prefers-reduced-motion` to support inclusive UX.
