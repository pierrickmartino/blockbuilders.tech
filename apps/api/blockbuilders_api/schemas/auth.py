"""API response contracts for authentication flows."""

from __future__ import annotations

from pydantic import BaseModel, Field

from blockbuilders_shared import AppMetadata, SimulationConsent


class SimulationConsentPayload(BaseModel):
    acknowledged: bool = Field(..., description="Flag indicating consent was granted.")
    acknowledged_at: str = Field(..., alias="acknowledgedAt")

    class Config:
        populate_by_name = True


class ConsentCollection(BaseModel):
    simulation_only: SimulationConsentPayload = Field(alias="simulationOnly")

    class Config:
        populate_by_name = True


class AppMetadataPayload(BaseModel):
    consents: ConsentCollection


class AuthSession(BaseModel):
    id: str
    email: str
    app_metadata: AppMetadataPayload = Field(alias="appMetadata")

    class Config:
        populate_by_name = True

    @classmethod
    def from_metadata(cls, *, user_id: str, email: str, metadata: AppMetadata) -> "AuthSession":
        consent: SimulationConsent = metadata.consents.simulation_only
        return cls(
            id=user_id,
            email=email,
            appMetadata={
                "consents": {
                    "simulationOnly": SimulationConsentPayload(
                        acknowledged=consent.acknowledged,
                        acknowledgedAt=consent.acknowledged_at.isoformat(),
                    )
                }
            },
        )
