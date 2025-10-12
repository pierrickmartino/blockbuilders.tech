import { create } from "zustand";
import { StrategyBlock, StrategyEdge, StrategySeed } from "@blockbuilders/shared";

interface WorkspaceState {
  seed: StrategySeed | null;
  nodes: StrategyBlock[];
  edges: StrategyEdge[];
  history: StrategySeed[];
  loadWorkspace: (seed: StrategySeed) => void;
  pushHistory: (seed: StrategySeed) => void;
  reset: () => void;
}

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
