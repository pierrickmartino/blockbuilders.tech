"""Shared onboarding callout registry loaded from the TypeScript source of truth."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from .schemas import OnboardingCallout


def _registry_path() -> Path:
    root = Path(__file__).resolve().parents[2]
    return root / "src" / "onboarding" / "callouts.json"


def _load_callouts() -> List[OnboardingCallout]:
    with _registry_path().open(encoding="utf-8") as handle:
        payload = json.load(handle)
    return [OnboardingCallout.model_validate(item) for item in payload]


ONBOARDING_CALLOUTS: List[OnboardingCallout] = _load_callouts()
ONBOARDING_CALLOUT_MAP: Dict[str, OnboardingCallout] = {callout.id: callout for callout in ONBOARDING_CALLOUTS}
ONBOARDING_CALLOUT_ORDER: List[str] = [callout.id for callout in sorted(ONBOARDING_CALLOUTS, key=lambda item: item.order or 0)]
