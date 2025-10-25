"""Utilities for capturing Datadog log payloads in backend tests."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Dict, List

import httpx


@dataclass
class DatadogSink:
    records: List[Dict[str, object]] = field(default_factory=list)

    def as_transport(self) -> httpx.MockTransport:
        def handler(request: httpx.Request) -> httpx.Response:
            payload = json.loads(request.content.decode()) if request.content else {}
            headers = {key.lower(): value for key, value in request.headers.items()}
            self.records.append(
                {
                    "payload": payload,
                    "headers": headers,
                }
            )
            return httpx.Response(200)

        return httpx.MockTransport(handler)

    def last_payload(self) -> Dict[str, object] | None:
        if not self.records:
            return None
        return self.records[-1]["payload"]
