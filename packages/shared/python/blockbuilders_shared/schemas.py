"""Pydantic models that mirror the TypeScript contracts in packages/shared."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SimulationConsent(BaseModel):
    """Tracks the user's acknowledgement of the simulation-only policy."""

    acknowledged: bool = Field(..., description="Whether the user accepted the simulation-only terms.")
    acknowledged_at: datetime | None = Field(
        default=None,
        alias="acknowledgedAt",
        description="ISO-8601 timestamp when the consent was recorded.",
    )

    class Config:
        populate_by_name = True


class ConsentContainer(BaseModel):
    simulation_only: SimulationConsent = Field(..., alias="simulationOnly")

    class Config:
        populate_by_name = True


class AppMetadata(BaseModel):
    consents: ConsentContainer


class AuditEventType(str, Enum):
    AUTH_LOGIN = "AUTH_LOGIN"
    AUTH_LOGOUT = "AUTH_LOGOUT"
    WORKSPACE_CREATED = "WORKSPACE_CREATED"
    CONSENT_ACKNOWLEDGED = "CONSENT_ACKNOWLEDGED"


class AuditLogEvent(BaseModel):
    id: str
    actor_id: str = Field(alias="actorId")
    event_type: AuditEventType = Field(alias="eventType")
    created_at: datetime = Field(alias="createdAt")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class StrategyBlock(BaseModel):
    id: str
    kind: str
    label: str
    position: Dict[str, float]
    config: Dict[str, Any]


class StrategyEdge(BaseModel):
    id: str
    source: str
    target: str


class OnboardingCallout(BaseModel):
    id: str
    title: str
    description: str
    action_text: Optional[str] = Field(default=None, alias="actionText")

    class Config:
        populate_by_name = True


class StrategySeed(BaseModel):
    strategy_id: str = Field(alias="strategyId")
    name: str
    version_id: str = Field(alias="versionId")
    version_label: str = Field(alias="versionLabel")
    blocks: List[StrategyBlock]
    edges: List[StrategyEdge]
    callouts: List[OnboardingCallout]

    class Config:
        populate_by_name = True
