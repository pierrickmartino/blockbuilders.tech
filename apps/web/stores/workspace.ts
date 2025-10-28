/**
 * @fileoverview Zustand store containing the demo strategy workspace state.
 */

import { create } from "zustand";
import { type StrategyBlock, type StrategyEdge, type StrategySeed } from "@blockbuilders/shared";

interface WorkspaceState {
  seed: StrategySeed | null;
  nodes: StrategyBlock[];
  edges: StrategyEdge[];
  history: StrategySeed[];
  loadWorkspace: (seed: StrategySeed) => void;
  pushHistory: (seed: StrategySeed) => void;
  reset: () => void;
}

/**
 * Provides access to the workspace state for the authenticated demo environment.
 */
export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  seed: null,
  nodes: [],
  edges: [],
  history: [],
  loadWorkspace: (seed) => {
    set({
      seed,
      nodes: seed.blocks,
      edges: seed.edges
    });
    get().pushHistory(seed);
  },
  pushHistory: (seed) => {
    const nextHistory = [...get().history, seed];
    set({ history: nextHistory.slice(-10) });
  },
  reset: () => set({ seed: null, nodes: [], edges: [], history: [] })
}));
