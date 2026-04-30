from __future__ import annotations

import re

VERB_DOWNGRADE_TABLE: dict[str, str] = {
    "主导": "参与",
    "负责": "参与",
    "带领": "协助",
    "设计": "参与设计",
    "架构": "参与架构",
    "规划": "协助规划",
    "精通": "了解",
    "熟练掌握": "使用过",
    "独立完成": "在指导下完成",
    "推动": "参与推进",
    "落地": "参与落地",
}

DEGREE_DOWNGRADE_TABLE: dict[str, str] = {
    "显著": "一定",
    "大幅": "部分",
    "全面": "部分",
    "深度": "基础",
    "扎实": "初步",
    "系统": "基础",
    "丰富": "若干",
    "大量": "一些",
    "众多": "若干",
    "成功": "",
    "高效": "",
    "优质": "",
}

ROLE_LIMITS: dict[str, str] = {
    "observer": "participant",
    "participant": "participant",
    "core": "core",
    "lead": "lead",
    "solo": "lead",
}

REDLINE_PATTERNS: list[tuple[str, str]] = [
    ("unsupported_number", r"\d+[%倍个项次人]"),
    ("role_inflation", r"(主导|负责|带领).{0,5}(团队|项目|部门)"),
]


def detect_unsupported_number(text: str) -> bool:
    return bool(re.search(r"\d+[%倍个项次人]", text))


def get_downgraded_verb(verb: str, evidence_strength: str) -> str | None:
    if evidence_strength in ("strong", "moderate"):
        return None
    return VERB_DOWNGRADE_TABLE.get(verb)
