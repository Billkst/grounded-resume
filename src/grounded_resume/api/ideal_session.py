"""Minimal in-memory session store for ideal resume generation."""

from __future__ import annotations

import threading
import time
import uuid
from typing import Any


class IdealSessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create(self) -> str:
        session_id = uuid.uuid4().hex[:12]
        with self._lock:
            self._sessions[session_id] = {
                "status": "processing",
                "progress": "",
                "result": None,
                "error": None,
                "created_at": time.time(),
            }
        return session_id

    def update_progress(self, session_id: str, progress: str) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["progress"] = progress

    def complete(self, session_id: str, result: dict[str, Any]) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "completed"
                self._sessions[session_id]["result"] = result
                self._sessions[session_id]["progress"] = "done"

    def fail(self, session_id: str, error: str) -> None:
        with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "failed"
                self._sessions[session_id]["error"] = error

    def get(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._sessions.get(session_id)

    def cleanup_expired(self, ttl_seconds: int = 86400) -> int:
        now = time.time()
        with self._lock:
            expired = [
                sid for sid, s in self._sessions.items()
                if now - s["created_at"] > ttl_seconds
            ]
            for sid in expired:
                del self._sessions[sid]
        return len(expired)
