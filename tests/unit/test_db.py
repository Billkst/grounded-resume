# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false

from pathlib import Path

from grounded_resume.db import SQLiteStore


def test_store_initializes_database_file(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)

    store.initialize()

    assert db_path.exists()


def test_store_creates_session_and_roundtrips_snapshot(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()

    store.create_session(session_id="S001")
    store.save_snapshot(session_id="S001", stage="user_input", payload={"name": "张三"})

    latest = store.get_latest_snapshot("S001")

    assert latest is not None
    assert latest["stage"] == "user_input"
    assert latest["payload"] == {"name": "张三"}


def test_store_persists_provider_config_metadata(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()

    store.save_provider_config(
        provider_id="kimi",
        display_name="Kimi",
        base_url="https://api.moonshot.cn/v1",
        encrypted_secret='{"version":1,"ciphertext":"fixture"}',
    )

    config = store.get_provider_config("kimi")

    assert config is not None
    assert config["provider_id"] == "kimi"
    assert config["encrypted_secret"] == '{"version":1,"ciphertext":"fixture"}'


def test_store_records_audit_event(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()
    store.create_session(session_id="S001")

    store.record_audit_event(session_id="S001", event_type="schema_validation", payload={"passed": True})

    events = store.list_audit_events("S001")

    assert len(events) == 1
    assert events[0]["event_type"] == "schema_validation"
    assert events[0]["payload"] == {"passed": True}
