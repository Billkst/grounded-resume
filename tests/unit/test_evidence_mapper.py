# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
from grounded_resume.core.models import RawMaterial
from grounded_resume.core.models import JDParsedResult, MaterialParseResult
from grounded_resume.core.parsing.jd_parser import JDParser
from grounded_resume.core.parsing.material_parser import MaterialParser
from grounded_resume.core.mapping.evidence_mapper import EvidenceMapper


def _parse_jd(text: str) -> JDParsedResult:
    return JDParser().parse(text)


def _parse_materials(contents: list[str]) -> MaterialParseResult:
    parser = MaterialParser()
    materials = [
        RawMaterial(id=f"M{i+1:03d}", type="project", title=f"素材{i+1}", content=content)
        for i, content in enumerate(contents)
    ]
    return parser.parse(materials)


def test_map_creates_direct_strong_mapping_for_explicit_tool_requirement() -> None:
    jd_result = _parse_jd(
        "招聘数据实习生，负责整理业务报表并支持团队日常工作。要求熟悉 Python，"
        + "能够按时完成任务，整体描述足够长以满足解析需求。"
    )
    material_result = _parse_materials(["我负责使用 Python 搭建自动化报表流程。"])

    result = EvidenceMapper().map(jd_result, material_result)

    assert len(result.mappings) == 1
    assert result.mappings[0].mapping_type == "direct"
    assert result.mappings[0].strength == "strong"
    assert result.mapping_confidence == 1.0
    assert result.gaps == []
    assert result.overclaims == []


def test_map_marks_gap_and_overclaim_when_requirement_is_unmet() -> None:
    jd_result = _parse_jd(
        "招聘产品实习生，负责整理业务数据并协助团队输出结论。要求熟悉 Excel，"
        + "具备产品判断能力，并有良好的团队协作能力，能够按时完成交付，内容足够长满足解析。"
    )
    material_result = _parse_materials(
        [
            "我使用 Excel 整理周报和数据看板。",
            "我分析用户反馈并提出产品优化建议。",
            "我使用 Figma 设计活动海报。",
        ]
    )

    result = EvidenceMapper().map(jd_result, material_result)

    assert len(result.mappings) == 2
    assert {mapping.mapping_type for mapping in result.mappings} == {"direct", "semantic"}
    assert len(result.gaps) == 1
    assert result.gaps[0].jd_requirement_id == "CR-2"
    assert len(result.overclaims) == 1
    assert result.overclaims[0].material_fact_id == "M003-F001"
    assert result.mapping_confidence == 2 / 3


def test_map_uses_composite_mapping_for_multiple_weak_facts() -> None:
    jd_result = _parse_jd(
        "招聘项目实习生，负责支持需求整理和项目推进，要求具备协作能力，"
        + "能够按时完成交付，内容足够长满足解析。"
    )
    material_result = _parse_materials(
        [
            "我参与团队配合推进需求梳理。",
            "我负责协调跨团队推进项目落地。",
            "我使用 Photoshop 设计海报。",
        ]
    )

    result = EvidenceMapper().map(jd_result, material_result)

    assert len(result.mappings) == 1
    mapping = result.mappings[0]
    assert mapping.mapping_type == "composite"
    assert mapping.strength == "moderate"
    assert len(mapping.material_fact_ids) == 2
    assert result.mapping_confidence == 1.0
