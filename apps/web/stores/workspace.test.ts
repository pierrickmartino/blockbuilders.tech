import { describe, beforeEach, it, expect } from "vitest";

import { StrategySeed } from "@blockbuilders/shared";

import { useWorkspaceStore } from "./workspace";

const demoSeed: StrategySeed = {
  strategyId: "demo-user",
  name: "Quickstart Momentum",
  versionId: "demo-v1",
  versionLabel: "v1",
  blocks: [
    {
      id: "node-data",
      kind: "data-source",
      label: "Data Source",
      position: { x: 0, y: 0 },
      config: { symbol: "BTC-USD" }
    }
  ],
  edges: [],
  callouts: []
};

describe("workspace store", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it("loads workspace seed and records history", () => {
    useWorkspaceStore.getState().loadWorkspace(demoSeed);

    const state = useWorkspaceStore.getState();
    expect(state.seed?.strategyId).toBe("demo-user");
    expect(state.history).toHaveLength(1);
  });

  it("trims history to the last 10 entries", () => {
    for (let index = 0; index < 12; index += 1) {
      useWorkspaceStore.getState().pushHistory({
        ...demoSeed,
        versionId: `demo-v${index}`,
        versionLabel: `v${index}`
      });
    }

    expect(useWorkspaceStore.getState().history).toHaveLength(10);
    expect(useWorkspaceStore.getState().history[0].versionId).toBe("demo-v2");
  });
});
