"""Shared authentication models."""

from __future__ import annotations

from dataclasses import dataclass

from blockbuilders_shared import AppMetadata


@dataclass
class AuthenticatedUser:
    id: str
    email: str
    metadata: AppMetadata
