#!/usr/bin/env python3
"""Simple HTTP server that mirrors Datadog log ingestion for local testing."""

from __future__ import annotations

import argparse
import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Tuple


class MockDatadogHandler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 - required signature
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw)
            logging.info("Received Datadog payload: %s", json.dumps(payload, indent=2))
        except json.JSONDecodeError:
            logging.info("Received Datadog payload: %s", raw.decode())

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, fmt: str, *args: Tuple[object, ...]) -> None:  # noqa: D401
        """Suppress default HTTP server logging to keep output focused."""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8282, help="Port to bind the mock agent on")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="[mock-datadog] %(message)s")
    server = HTTPServer(("127.0.0.1", args.port), MockDatadogHandler)

    logging.info("Mock Datadog agent listening on http://127.0.0.1:%s/logs", args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Stopping mock Datadog agent")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
