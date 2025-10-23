"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ConsentRequiredError, completeOnboarding } from "@/lib/auth/onboarding";
import { supabase } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/stores/workspace";

const DASHBOARD_PATH = "/dashboard";

export default function DashboardPage() {
  const seed = useWorkspaceStore((state) => state.seed);
  const nodes = useWorkspaceStore((state) => state.nodes);
  const loadWorkspace = useWorkspaceStore((state) => state.loadWorkspace);
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    async function bootstrapDemo() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        if (isActive) {
          router.push(`/login?next=${encodeURIComponent(DASHBOARD_PATH)}`);
        }
        return;
      }

      if (seed) {
        return;
      }

      try {
        const demoSeed = await completeOnboarding();
        if (isActive) {
          loadWorkspace(demoSeed);
        }
      } catch (error) {
        if (error instanceof ConsentRequiredError) {
          if (isActive) {
            router.push(`/(auth)/login?error=consent&next=${encodeURIComponent(DASHBOARD_PATH)}`);
          }
          return;
        }
        console.error("Failed to bootstrap demo workspace", error);
      }
    }

    bootstrapDemo();

    return () => {
      isActive = false;
    };
  }, [seed, loadWorkspace, router]);

  const callouts = seed?.callouts ?? [];
  const checklist = [
    "Review every block configuration",
    "Run the quickstart backtest",
    "Inspect the audit log to confirm consent capture"
  ];

  return (
    <main>
      <h1>Demo Workspace</h1>
      <p>
        You are viewing the <strong>{seed?.name ?? "Quickstart Momentum"}</strong> strategy. Tweak blocks, then run a backtest to
        experience the full analytics flow.
      </p>

      {callouts.length > 0 ? (
        <section style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
          {callouts.map((callout) => (
            <article key={callout.id} style={{ padding: "1.25rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)" }}>
              <h2 style={{ margin: "0 0 0.5rem" }}>{callout.title}</h2>
              <p style={{ margin: 0 }}>{callout.description}</p>
              {callout.actionText ? (
                <button className="button" style={{ marginTop: "1rem" }}>
                  {callout.actionText}
                </button>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <section>
        <h2>Blocks</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {nodes.map((block) => (
            <li key={block.id} style={{ padding: "1rem", marginBottom: "0.75rem", background: "rgba(15,23,42,0.35)", borderRadius: "1rem" }}>
              <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>{block.label}</span>
                <code>{block.kind}</code>
              </header>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(block.config, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Onboarding Checklist</h2>
        <ol style={{ display: "grid", gap: "0.5rem", marginLeft: "1.25rem" }}>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <p style={{ marginTop: "1rem" }}>
          Need additional guidance? Visit the <Link href="/docs">documentation</Link> for walkthroughs and deep dives.
        </p>
      </section>
    </main>
  );
}
