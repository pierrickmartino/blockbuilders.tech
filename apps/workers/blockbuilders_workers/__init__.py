"""Celery worker bootstrap."""

from .celery_app import app

__all__ = ["app"]
