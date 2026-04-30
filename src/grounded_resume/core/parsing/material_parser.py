from __future__ import annotations

import re
from typing import ClassVar

from grounded_resume.core.models import MaterialFact, MaterialParseResult, ParserNote, RawMaterial, SourceFragment
from grounded_resume.core.utils.text import clean_whitespace


class MaterialParser:
    _ACTION_PATTERN: ClassVar[re.Pattern[str]] = re.compile(
        r"(?:^|[。！？；;\n])\s*(?P<clause>[^。！？；;\n]*?(?:负责|参与|主导|搭建|设计|开发|实现|优化|分析|整理|测试|推进|调研|撰写|使用|构建)[^。！？；;\n]*?)(?=(?:[。！？；;\n]|$))"
    )
    _SKILL_PATTERNS: ClassVar[tuple[tuple[str, re.Pattern[str]], ...]] = (
        ("Python", re.compile(r"\bpython\b", re.IGNORECASE)),
        ("SQL", re.compile(r"\bsql\b", re.IGNORECASE)),
        ("Figma", re.compile(r"\bfigma\b", re.IGNORECASE)),
        ("Pandas", re.compile(r"\bpandas\b", re.IGNORECASE)),
        ("Excel", re.compile(r"\bexcel\b", re.IGNORECASE)),
        ("RAG", re.compile(r"\brag\b|检索增强", re.IGNORECASE)),
        ("Prompt", re.compile(r"\bprompt\b|提示词", re.IGNORECASE)),
    )

    def parse(self, materials: list[RawMaterial]) -> MaterialParseResult:
        if not materials:
            raise ValueError("No materials provided")

        facts: list[MaterialFact] = []
        fragments: list[SourceFragment] = []
        notes: list[ParserNote] = []

        for material in materials:
            material_facts, material_fragments = self._parse_material(material)
            if material_facts:
                facts.extend(material_facts)
                fragments.extend(material_fragments)
            else:
                notes.append(
                    ParserNote(
                        level="warning",
                        material_id=material.id,
                        message="No action facts extracted",
                    )
                )

        return MaterialParseResult(facts=facts, fragments=fragments, parser_notes=notes)

    def _parse_material(self, material: RawMaterial) -> tuple[list[MaterialFact], list[SourceFragment]]:
        matches = list(self._ACTION_PATTERN.finditer(material.content))
        facts: list[MaterialFact] = []
        fragments: list[SourceFragment] = []

        for index, match in enumerate(matches, start=1):
            clause = clean_whitespace(match.group("clause"))
            if not clause:
                continue

            fact_id = f"{material.id}-F{index:03d}"
            fragment_id = f"{material.id}-SF{index:03d}"
            skill_tags = self._extract_skill_tags(clause)
            facts.append(
                MaterialFact(
                    id=fact_id,
                    source_material_id=material.id,
                    fact_type="action",
                    statement=clause,
                    confidence="explicit",
                    skill_tags=skill_tags,
                )
            )
            fragments.append(
                SourceFragment(
                    id=fragment_id,
                    material_id=material.id,
                    text=clause,
                    start_offset=match.start("clause"),
                    end_offset=match.end("clause"),
                )
            )

        return facts, fragments

    def _extract_skill_tags(self, text: str) -> list[str]:
        tags: list[str] = []
        for tag, pattern in self._SKILL_PATTERNS:
            if pattern.search(text) and tag not in tags:
                tags.append(tag)
        return tags
