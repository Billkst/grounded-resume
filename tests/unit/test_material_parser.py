# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
import pytest

from grounded_resume.core.models import RawMaterial
from grounded_resume.core.parsing.material_parser import MaterialParser


def test_parse_raises_for_empty_materials() -> None:
    parser = MaterialParser()

    with pytest.raises(ValueError, match="No materials provided"):
        parser.parse([])


def test_parse_extracts_action_fact_and_skill_tags() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M001",
        type="project",
        title="数据分析项目",
        content="我负责用 Python 和 SQL 搭建数据分析流程，并用 Pandas 清洗数据。",
    )

    result = parser.parse([material])

    assert len(result.facts) == 1
    fact = result.facts[0]
    assert fact.source_material_id == "M001"
    assert fact.fact_type == "action"
    assert fact.statement == "我负责用 Python 和 SQL 搭建数据分析流程，并用 Pandas 清洗数据"
    assert fact.skill_tags == ["Python", "SQL", "Pandas"]
    assert len(result.fragments) == 1
    assert result.fragments[0].text == "我负责用 Python 和 SQL 搭建数据分析流程，并用 Pandas 清洗数据"


def test_parse_extracts_multiple_action_facts_from_one_material() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M002",
        type="project",
        title="设计项目",
        content="我参与需求梳理，并使用 Figma 设计原型；随后推进测试并整理反馈。",
    )

    result = parser.parse([material])

    assert len(result.facts) == 2
    assert result.facts[0].skill_tags == ["Figma"]
    assert result.facts[1].skill_tags == []


def test_parse_adds_warning_note_when_no_action_fact_is_found() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M003",
        type="other",
        title="自我描述",
        content="热爱学习，沟通能力强，喜欢团队协作。",
    )

    result = parser.parse([material])

    assert result.facts == []
    assert len(result.parser_notes) == 1
    assert result.parser_notes[0].level == "warning"
    assert result.parser_notes[0].material_id == "M003"
