from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import cast


class SQLiteStore:
    db_path: Path

    def __init__(self, db_path: Path | str) -> None:
        self.db_path = Path(db_path)

    def initialize(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            _ = connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS workflow_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );

                CREATE TABLE IF NOT EXISTS provider_configs (
                    provider_id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    base_url TEXT NOT NULL,
                    encrypted_secret TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );
                """
            )

    def create_session(self, session_id: str) -> None:
        with self._connect() as connection:
            _ = connection.execute(
                "INSERT OR IGNORE INTO sessions (session_id) VALUES (?)",
                (session_id,),
            )

    def save_snapshot(self, session_id: str, stage: str, payload: dict[str, object]) -> None:
        with self._connect() as connection:
            _ = connection.execute(
                """
                INSERT INTO workflow_snapshots (session_id, stage, payload_json)
                VALUES (?, ?, ?)
                """,
                (session_id, stage, json.dumps(payload, ensure_ascii=False, sort_keys=True)),
            )

    def get_latest_snapshot(self, session_id: str) -> dict[str, object] | None:
        with self._connect() as connection:
            row = cast(
                sqlite3.Row | None,
                connection.execute(
                """
                SELECT stage, payload_json, created_at
                FROM workflow_snapshots
                WHERE session_id = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (session_id,),
                ).fetchone(),
            )

        if row is None:
            return None

        payload_json = cast(str, row["payload_json"])
        return {
            "stage": row["stage"],
            "payload": cast(dict[str, object], json.loads(payload_json)),
            "created_at": row["created_at"],
        }

    def save_provider_config(
        self,
        provider_id: str,
        display_name: str,
        base_url: str,
        encrypted_secret: str,
    ) -> None:
        with self._connect() as connection:
            _ = connection.execute(
                """
                INSERT INTO provider_configs (provider_id, display_name, base_url, encrypted_secret)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(provider_id) DO UPDATE SET
                    display_name = excluded.display_name,
                    base_url = excluded.base_url,
                    encrypted_secret = excluded.encrypted_secret,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (provider_id, display_name, base_url, encrypted_secret),
            )

    def get_provider_config(self, provider_id: str) -> dict[str, str] | None:
        with self._connect() as connection:
            row = cast(
                sqlite3.Row | None,
                connection.execute(
                """
                SELECT provider_id, display_name, base_url, encrypted_secret, updated_at
                FROM provider_configs
                WHERE provider_id = ?
                """,
                (provider_id,),
                ).fetchone(),
            )

        if row is None:
            return None

        return {
            "provider_id": row["provider_id"],
            "display_name": row["display_name"],
            "base_url": row["base_url"],
            "encrypted_secret": row["encrypted_secret"],
            "updated_at": row["updated_at"],
        }

    def record_audit_event(
        self,
        session_id: str,
        event_type: str,
        payload: dict[str, object],
    ) -> None:
        with self._connect() as connection:
            _ = connection.execute(
                """
                INSERT INTO audit_events (session_id, event_type, payload_json)
                VALUES (?, ?, ?)
                """,
                (session_id, event_type, json.dumps(payload, ensure_ascii=False, sort_keys=True)),
            )

    def list_audit_events(self, session_id: str) -> list[dict[str, object]]:
        with self._connect() as connection:
            rows = cast(
                list[sqlite3.Row],
                connection.execute(
                """
                SELECT event_type, payload_json, created_at
                FROM audit_events
                WHERE session_id = ?
                ORDER BY id ASC
                """,
                (session_id,),
                ).fetchall(),
            )

        return [
            {
                "event_type": row["event_type"],
                "payload": cast(dict[str, object], json.loads(cast(str, row["payload_json"]))),
                "created_at": row["created_at"],
            }
            for row in rows
        ]

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        _ = connection.execute("PRAGMA foreign_keys = ON")
        return connection
