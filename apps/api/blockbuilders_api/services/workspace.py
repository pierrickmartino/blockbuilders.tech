"""Demo workspace provisioning service."""

from __future__ import annotations

from dataclasses import dataclass, field

from blockbuilders_shared import StrategySeed

from ..models.auth import AuthenticatedUser


def _build_demo_seed(user_id: str) -> StrategySeed:
    return StrategySeed.model_validate(
        {
            "strategyId": f"demo-{user_id}",
            "name": "Quickstart Momentum",
            "versionId": "demo-v1",
            "versionLabel": "v1",
            "blocks": [
                {
                    "id": "node-data",
                    "kind": "data-source",
                    "label": "Data Source",
                    "position": {"x": 0, "y": 0},
                    "config": {"symbol": "BTC-USD", "interval": "1d"},
                },
                {
                    "id": "node-indicator",
                    "kind": "indicator",
                    "label": "EMA Crossover",
                    "position": {"x": 260, "y": 0},
                    "config": {"fast": 12, "slow": 26},
                },
                {
                    "id": "node-signal",
                    "kind": "signal",
                    "label": "Signal Logic",
                    "position": {"x": 520, "y": 0},
                    "config": {"entry": "fast_crosses_above_slow", "exit": "fast_crosses_below_slow"},
                },
                {
                    "id": "node-execution",
                    "kind": "execution",
                    "label": "Paper Trade",
                    "position": {"x": 780, "y": -60},
                    "config": {"mode": "simulation", "allocation": 0.2},
                },
                {
                    "id": "node-risk",
                    "kind": "risk",
                    "label": "Risk Controls",
                    "position": {"x": 780, "y": 80},
                    "config": {"maxDrawdown": 0.15, "stopLoss": 0.05},
                },
            ],
            "edges": [
                {"id": "edge-1", "source": "node-data", "target": "node-indicator"},
                {"id": "edge-2", "source": "node-indicator", "target": "node-signal"},
                {"id": "edge-3", "source": "node-signal", "target": "node-execution"},
                {"id": "edge-4", "source": "node-signal", "target": "node-risk"},
            ],
            "callouts": [
                {
                    "id": "callout-data",
                    "title": "Data Source",
                    "description": "We pre-loaded BTC-USD daily candles so you can focus on signal design.",
                    "actionText": "Inspect feed",
                },
                {
                    "id": "callout-indicator",
                    "title": "Indicator",
                    "description": "EMA crossover parameters are editable—try experimenting with different windows.",
                    "actionText": "Adjust EMA",
                },
                {
                    "id": "callout-run",
                    "title": "Run your first backtest",
                    "description": "Launch the quickstart backtest to understand how results and audit logging work.",
                    "actionText": "Run backtest",
                },
            ],
        }
    )


@dataclass
class WorkspaceService:
    _store: dict[str, StrategySeed] = field(default_factory=dict)

    def get_or_create_demo_workspace(self, user: AuthenticatedUser) -> tuple[StrategySeed, bool]:
        if user.id in self._store:
            return self._store[user.id], False

        seed = _build_demo_seed(user.id)
        self._store[user.id] = seed
        return seed, True

    def audit_metadata(self, workspace: StrategySeed) -> dict[str, str]:
        return {
            "strategyId": workspace.strategy_id,
            "versionId": workspace.version_id,
            "strategyName": workspace.name,
        }


_workspace_service = WorkspaceService()


def get_workspace_service() -> WorkspaceService:
    return _workspace_service
