"""Celery application configured with Redis broker."""

from __future__ import annotations

from celery import Celery

app = Celery(
    "blockbuilders",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)


@app.task(bind=True)
def sample_task(self, *, strategy_id: str) -> str:
    """Placeholder task to verify pipeline wiring."""

    return f"Processed strategy {strategy_id}"
