"""Tests for the Celery application setup."""

from blockbuilders_workers.celery_app import app, sample_task


def test_sample_task_returns_expected_message() -> None:
    """Sample task should return the formatted strategy message."""

    assert sample_task.run(strategy_id="alpha") == "Processed strategy alpha"


def test_sample_task_registered_with_app() -> None:
    """The sample task should be registered on the Celery application."""

    assert sample_task.name in app.tasks
    registered_task = app.tasks[sample_task.name]
    assert registered_task.name == sample_task.name