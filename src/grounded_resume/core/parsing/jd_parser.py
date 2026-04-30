from __future__ import annotations

import hashlib
import re
from typing import ClassVar, Literal

from grounded_resume.core.models import (
    CapabilityRequirement,
    HardRequirement,
    JDExcerpt,
    JDParsedResult,
    JobContext,
)
from grounded_resume.core.utils.text import clean_whitespace, is_chinese_dominant


class JDParser:
    _EDUCATION_PATTERNS: ClassVar[tuple[tuple[str, str], ...]] = (
        (r"本科及以上|本科以上|本科学历|本科在读", "本科及以上"),
        (r"硕士及以上|研究生及以上|硕士学历|研究生在读", "硕士及以上"),
        (r"大专及以上|大专以上|大专学历", "大专及以上"),
    )
    _TOOL_PATTERNS: ClassVar[tuple[str, ...]] = (
        r"Excel",
        r"SQL",
        r"Python",
        r"PPT",
        r"Axure",
        r"Figma",
        r"Tableau",
        r"Power BI",
    )
    _CAPABILITY_PATTERNS: ClassVar[
        tuple[
            tuple[
                str,
                str,
                Literal["product_judgment", "research_analysis", "communication", "collaboration", "learning_agility"],
            ],
            ...,
        ]
    ] = (
        (r"产品判断|产品思维|产品 sense|产品分析|理解产品", "产品判断", "product_judgment"),
        (r"数据分析|分析能力|数据意识|数据驱动", "数据分析", "research_analysis"),
        (r"沟通表达|沟通能力|沟通协作|表达能力", "沟通", "communication"),
        (r"协作能力|团队协作|配合团队", "协作", "collaboration"),
        (r"快速学习|学习能力|学习意愿", "快速学习", "learning_agility"),
    )

    def parse(self, job_description: str) -> JDParsedResult:
        text = clean_whitespace(job_description)
        if not is_chinese_dominant(text):
            raise ValueError("Only Chinese JD is supported in MVP")
        if len(text) < 50:
            raise ValueError("JD too short")

        hard_requirements, hard_excerpts = self._extract_hard_requirements(text)
        core_capabilities, nice_to_have, capability_excerpts = self._extract_capabilities(text)
        derived_context = self._derive_context(text)

        parser_confidence = min(1.0, 0.45 + 0.1 * (len(hard_requirements) + len(core_capabilities)))
        job_id = hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]

        return JDParsedResult(
            job_id=job_id,
            hard_requirements=hard_requirements,
            core_capabilities=core_capabilities,
            nice_to_have=nice_to_have,
            derived_context=derived_context,
            parser_confidence=parser_confidence,
            raw_excerpts=hard_excerpts + capability_excerpts,
        )

    def _extract_hard_requirements(self, text: str) -> tuple[list[HardRequirement], list[JDExcerpt]]:
        requirements: list[HardRequirement] = []
        excerpts: list[JDExcerpt] = []

        for pattern, label in self._EDUCATION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                requirements.append(
                    HardRequirement(
                        id=f"HR-{len(requirements) + 1}",
                        category="education",
                        description=label,
                        source_text=match.group(0),
                        is_satisfiable_by_evidence=True,
                    )
                )
                excerpts.append(self._excerpt_from_match(text, match, len(excerpts) + 1))
                break

        duration_match = re.search(r"实习期(?:至少|不少于|不低于)?\s*(\d+)\s*个?月|至少\s*(\d+)\s*个?月", text)
        if duration_match:
            source = duration_match.group(0)
            requirements.append(
                HardRequirement(
                    id=f"HR-{len(requirements) + 1}",
                    category="availability",
                    description="实习时长",
                    source_text=source,
                    is_satisfiable_by_evidence=False,
                )
            )
            excerpts.append(self._excerpt_from_match(text, duration_match, len(excerpts) + 1))

        seen_tools: set[str] = set()
        for pattern in self._TOOL_PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                tool = match.group(0)
                if tool.lower() in seen_tools:
                    continue
                seen_tools.add(tool.lower())
                requirements.append(
                    HardRequirement(
                        id=f"HR-{len(requirements) + 1}",
                        category="tool",
                        description=tool,
                        source_text=tool,
                        is_satisfiable_by_evidence=True,
                    )
                )
                excerpts.append(self._excerpt_from_match(text, match, len(excerpts) + 1))

        return requirements, excerpts

    def _extract_capabilities(self, text: str) -> tuple[list[CapabilityRequirement], list[CapabilityRequirement], list[JDExcerpt]]:
        core: list[CapabilityRequirement] = []
        nice_to_have: list[CapabilityRequirement] = []
        excerpts: list[JDExcerpt] = []

        for pattern, capability, evidence_type in self._CAPABILITY_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if not match:
                continue
            target = nice_to_have if re.search(r"优先|加分|最好|更佳", text[match.start() : min(len(text), match.end() + 20)]) else core
            target.append(
                CapabilityRequirement(
                    id=f"CR-{len(core) + len(nice_to_have) + 1}",
                    capability=capability,
                    description=match.group(0),
                    evidence_type=evidence_type,
                    priority="important" if target is core else "nice_to_have",
                    source_text=match.group(0),
                    related_keywords=[capability],
                )
            )
            excerpts.append(self._excerpt_from_match(text, match, len(excerpts) + 1))

        return core, nice_to_have, excerpts

    def _derive_context(self, text: str) -> JobContext:
        if re.search(r"实习|实习生|暑期实习|校招", text):
            level = "intern"
        elif re.search(r"初级|助理|应届|1年以下|1-3年|junior", text, re.IGNORECASE):
            level = "junior"
        else:
            level = "junior"

        team_focus: list[str] = []
        for keyword in ("产品", "用户", "数据", "调研", "沟通"):
            if keyword in text and keyword not in team_focus:
                team_focus.append(keyword)

        return JobContext(job_level=level, team_focus=team_focus)

    def _excerpt_from_match(self, text: str, match: re.Match[str], index: int) -> JDExcerpt:
        return JDExcerpt(
            id=f"EX-{index}",
            text=text[max(0, match.start() - 8) : min(len(text), match.end() + 8)],
            section="requirements",
            line_number=None,
        )
