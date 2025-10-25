"""In-memory compliance repository mirroring the governance data model."""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

from blockbuilders_shared import AuditLogEvent


ComplianceRecord = Dict[str, str | None]


@dataclass
class ComplianceRepository:
    """Persists compliance events and exports a CSV snapshot for auditors."""

    export_path: Path | None = None
    _records: List[ComplianceRecord] = field(default_factory=list)

    def record(self, event: AuditLogEvent) -> ComplianceRecord:
        metadata = event.metadata or {}
        record: ComplianceRecord = {
            "event_id": event.id,
            "event_type": event.event_type.value,
            "actor_id": event.actor_id,
            "occurred_at": event.created_at.isoformat(),
            "strategy_id": metadata.get("strategyId"),
            "version_id": metadata.get("versionId"),
        }
        self._records.append(record)
        self.export_snapshot()
        return record

    def export_snapshot(self) -> None:
        if not self.export_path:
            return

        self.export_path.parent.mkdir(parents=True, exist_ok=True)
        with self.export_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["event_id", "event_type", "actor_id", "occurred_at", "strategy_id", "version_id"],
            )
            writer.writeheader()
            writer.writerows(self._records)

    def all(self) -> List[ComplianceRecord]:
        return list(self._records)
