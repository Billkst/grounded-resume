# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
import pytest

from grounded_resume.core.parsing.jd_parser import JDParser


def test_parse_rejects_non_chinese_jd() -> None:
    parser = JDParser()

    with pytest.raises(ValueError, match="Only Chinese JD is supported in MVP"):
        parser.parse("We are hiring a product intern for our team.")


def test_parse_rejects_short_jd() -> None:
    parser = JDParser()

    with pytest.raises(ValueError, match="JD too short"):
        parser.parse("中文 JD 太短")


def test_parse_extracts_hard_requirements() -> None:
    parser = JDParser()
    jd = (
        "招聘 AI 产品实习生，负责协助产品调研和用户反馈整理。"
        "要求本科及以上在读，实习期至少 3 个月，熟悉 Excel 和 SQL。"
        "能够快速学习，配合团队完成产品分析工作。"
    )

    result = parser.parse(jd)

    categories = {item.category for item in result.hard_requirements}
    assert {"education", "availability", "tool"}.issubset(categories)


def test_parse_extracts_capability_requirements() -> None:
    parser = JDParser()
    jd = (
        "招聘 AI 产品实习生，负责协助产品调研和用户反馈整理。"
        "要求本科及以上在读，实习期至少 3 个月，熟悉 Excel 和 SQL。"
        "能够快速学习，配合团队完成产品分析工作。需要良好的沟通表达能力，"
        "具备产品判断和数据分析意识。"
    )

    result = parser.parse(jd)

    capabilities = {item.capability for item in result.core_capabilities}
    assert {"产品判断", "数据分析", "沟通"}.issubset(capabilities)


def test_parse_infers_intern_level_context() -> None:
    parser = JDParser()
    jd = (
        "招聘 AI 产品实习生，负责协助产品调研和用户反馈整理。"
        "要求本科及以上在读，实习期至少 3 个月，熟悉 Excel 和 SQL。"
        "能够快速学习，配合团队完成产品分析工作。需要良好的沟通表达能力，"
        "具备产品判断和数据分析意识。"
    )

    result = parser.parse(jd)

    assert result.derived_context.job_level == "intern"
