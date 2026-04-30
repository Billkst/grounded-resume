from grounded_resume.core.config.safety_rules import (
    DEGREE_DOWNGRADE_TABLE,
    ROLE_LIMITS,
    VERB_DOWNGRADE_TABLE,
    detect_unsupported_number,
)


def test_verb_downgrade_table_has_common_strong_verbs() -> None:
    assert "主导" in VERB_DOWNGRADE_TABLE
    assert VERB_DOWNGRADE_TABLE["主导"] == "参与"


def test_degree_downgrade_table_has_common_strong_words() -> None:
    assert "显著" in DEGREE_DOWNGRADE_TABLE
    assert DEGREE_DOWNGRADE_TABLE["显著"] == "一定"


def test_role_limits_define_maximum_role() -> None:
    assert ROLE_LIMITS["participant"] == "participant"
    assert ROLE_LIMITS["solo"] == "lead"


def test_detect_unsupported_number_finds_numeric_claims() -> None:
    assert detect_unsupported_number("提升 30%") is True
    assert detect_unsupported_number("有一定提升") is False
