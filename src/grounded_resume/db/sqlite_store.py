from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from collections.abc import Iterator, Sequence
from typing import cast, override

from langchain_core.runnables.config import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    ChannelVersions,
    get_checkpoint_id,
    get_checkpoint_metadata,
)


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

                CREATE TABLE IF NOT EXISTS workflow_checkpoints (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    thread_id TEXT NOT NULL,
                    checkpoint_ns TEXT NOT NULL DEFAULT '',
                    checkpoint_id TEXT NOT NULL,
                    parent_checkpoint_id TEXT,
                    checkpoint_type TEXT NOT NULL,
                    checkpoint_blob BLOB NOT NULL,
                    metadata_type TEXT NOT NULL,
                    metadata_blob BLOB NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

    def create_checkpointer(self) -> "SQLiteCheckpointSaver":
        return SQLiteCheckpointSaver(self.db_path)

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


class SQLiteCheckpointSaver(BaseCheckpointSaver[str]):
    db_path: Path

    def __init__(self, db_path: Path | str) -> None:
        super().__init__()
        self.db_path = Path(db_path)
        self._ensure_table()

    def _ensure_table(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            _ = connection.execute(
                """
                CREATE TABLE IF NOT EXISTS workflow_checkpoints (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    thread_id TEXT NOT NULL,
                    checkpoint_ns TEXT NOT NULL DEFAULT '',
                    checkpoint_id TEXT NOT NULL,
                    parent_checkpoint_id TEXT,
                    checkpoint_type TEXT NOT NULL,
                    checkpoint_blob BLOB NOT NULL,
                    metadata_type TEXT NOT NULL,
                    metadata_blob BLOB NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    @override
    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        configurable = cast(dict[str, object], config.get("configurable", {}))
        thread_id = cast(str, configurable["thread_id"])
        checkpoint_ns = cast(str, configurable.get("checkpoint_ns", ""))
        checkpoint_id = get_checkpoint_id(config)

        query = """
            SELECT id, checkpoint_id, parent_checkpoint_id,
                   checkpoint_type, checkpoint_blob,
                   metadata_type, metadata_blob
            FROM workflow_checkpoints
            WHERE thread_id = ? AND checkpoint_ns = ?
        """
        params: list[object] = [thread_id, checkpoint_ns]
        if checkpoint_id is not None:
            query += " AND checkpoint_id = ?"
            params.append(checkpoint_id)
        else:
            query += " ORDER BY id DESC LIMIT 1"

        with self._connect() as connection:
            row = cast(sqlite3.Row | None, connection.execute(query, params).fetchone())

        if row is None:
            return None

        checkpoint = cast(Checkpoint, self.serde.loads_typed((row["checkpoint_type"], row["checkpoint_blob"])))
        metadata = cast(
            CheckpointMetadata,
            self.serde.loads_typed((row["metadata_type"], row["metadata_blob"])),
        )
        checkpoint_config: RunnableConfig = {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": cast(str, row["checkpoint_id"]),
            }
        }
        parent_checkpoint_id = cast(str | None, row["parent_checkpoint_id"])
        parent_config: RunnableConfig | None = None
        if parent_checkpoint_id:
            parent_config = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": parent_checkpoint_id,
                }
            }
        return CheckpointTuple(
            config=checkpoint_config,
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
            pending_writes=[],
        )

    @override
    def list(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, object] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> Iterator[CheckpointTuple]:
        query = """
            SELECT id, thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id,
                   checkpoint_type, checkpoint_blob, metadata_type, metadata_blob
            FROM workflow_checkpoints
        """
        conditions: list[str] = []
        params: list[object] = []

        if config is not None:
            configurable = cast(dict[str, object], config.get("configurable", {}))
            conditions.append("thread_id = ?")
            params.append(cast(str, configurable["thread_id"]))
            checkpoint_ns = cast(str, configurable.get("checkpoint_ns", ""))
            conditions.append("checkpoint_ns = ?")
            params.append(checkpoint_ns)
            checkpoint_id = get_checkpoint_id(config)
            if checkpoint_id is not None:
                conditions.append("checkpoint_id = ?")
                params.append(checkpoint_id)

        if before is not None and (before_checkpoint_id := get_checkpoint_id(before)) is not None:
            conditions.append("id < (SELECT id FROM workflow_checkpoints WHERE checkpoint_id = ? LIMIT 1)")
            params.append(before_checkpoint_id)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY id DESC"
        if limit is not None:
            query += " LIMIT ?"
            params.append(limit)

        with self._connect() as connection:
            rows = cast(list[sqlite3.Row], connection.execute(query, params).fetchall())

        for row in rows:
            checkpoint = cast(Checkpoint, self.serde.loads_typed((row["checkpoint_type"], row["checkpoint_blob"])))
            metadata = cast(
                CheckpointMetadata,
                self.serde.loads_typed((row["metadata_type"], row["metadata_blob"])),
            )
            parent_checkpoint_id = cast(str | None, row["parent_checkpoint_id"])
            yield CheckpointTuple(
                config=cast(
                    RunnableConfig,
                    cast(
                        object,
                        {
                            "configurable": {
                                "thread_id": cast(str, row["thread_id"]),
                                "checkpoint_ns": cast(str, row["checkpoint_ns"]),
                                "checkpoint_id": cast(str, row["checkpoint_id"]),
                            },
                        },
                    ),
                ),
                checkpoint=checkpoint,
                metadata=metadata,
                parent_config=(
                    {
                        "configurable": {
                            "thread_id": cast(str, row["thread_id"]),
                            "checkpoint_ns": cast(str, row["checkpoint_ns"]),
                            "checkpoint_id": parent_checkpoint_id,
                        }
                    }
                    if parent_checkpoint_id
                    else None
                ),
                pending_writes=[],
            )

    @override
    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        configurable = cast(dict[str, object], config.get("configurable", {}))
        thread_id = cast(str, configurable["thread_id"])
        checkpoint_ns = cast(str, configurable.get("checkpoint_ns", ""))
        parent_checkpoint_id = cast(str | None, configurable.get("checkpoint_id"))
        checkpoint_type, checkpoint_blob = self.serde.dumps_typed(checkpoint)
        metadata_type, metadata_blob = self.serde.dumps_typed(get_checkpoint_metadata(config, metadata))

        with self._connect() as connection:
            _ = connection.execute(
                """
                INSERT INTO workflow_checkpoints (
                    thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id,
                    checkpoint_type, checkpoint_blob, metadata_type, metadata_blob
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    thread_id,
                    checkpoint_ns,
                    checkpoint["id"],
                    parent_checkpoint_id,
                    checkpoint_type,
                    checkpoint_blob,
                    metadata_type,
                    metadata_blob,
                ),
            )

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint["id"],
            }
        }

    @override
    def put_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, object]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        return None

    @override
    def delete_thread(self, thread_id: str) -> None:
        with self._connect() as connection:
            _ = connection.execute("DELETE FROM workflow_checkpoints WHERE thread_id = ?", (thread_id,))

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection
