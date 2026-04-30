from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from grounded_resume.core.models import (
    CapabilityRequirement,
    EvidenceMapping,
    EvidenceMappingResult,
    GapItem,
    HardRequirement,
    JDParsedResult,
    MaterialFact,
    MaterialParseResult,
    OverclaimItem,
)


@dataclass(frozen=True)
class _Requirement:
    id: str
    text: str
    keywords: tuple[str, ...]
    kind: str
    semantic_key: str | None
    severity: Literal["critical", "major", "minor"]


class EvidenceMapper:
    _SEMANTIC_KEYWORDS: dict[str, tuple[str, ...]] = {
        "product_judgment": ("产品", "用户", "需求", "反馈", "优化", "建议", "方案", "分析"),
        "research_analysis": ("数据", "分析", "调研", "研究", "结论", "洞察", "报表"),
        "communication": ("沟通", "表达", "汇报", "撰写", "说明", "反馈"),
        "collaboration": ("协作", "配合", "团队", "推进", "联动", "协同", "跨团队", "协调"),
        "learning_agility": ("学习", "上手", "适应", "快速", "成长"),
    }

    def map(self, jd_result: JDParsedResult, material_result: MaterialParseResult) -> EvidenceMappingResult:
        requirements = self._collect_requirements(jd_result)
        mappings: list[EvidenceMapping] = []
        gaps: list[GapItem] = []
        used_fact_ids: set[str] = set()

        for requirement in requirements:
            mapping = self._map_requirement(requirement, material_result.facts)
            if mapping is None:
                gaps.append(self._build_gap(requirement))
                continue

            mappings.append(mapping)
            used_fact_ids.update(mapping.material_fact_ids)

        overclaims = [
            OverclaimItem(
                id=f"OC-{index}",
                material_fact_id=fact.id,
                reason="该素材事实未被任何 JD 要求使用",
                suggestion="如无关可删除，如相关可补充对应 JD 关键词",
            )
            for index, fact in enumerate(material_result.facts, start=1)
            if fact.id not in used_fact_ids
        ]

        total_requirements = len(requirements)
        mapping_confidence = len(mappings) / total_requirements if total_requirements else 0.0
        return EvidenceMappingResult(
            mappings=mappings,
            gaps=gaps,
            overclaims=overclaims,
            mapping_confidence=mapping_confidence,
        )

    def _collect_requirements(self, jd_result: JDParsedResult) -> list[_Requirement]:
        requirements: list[_Requirement] = []

        for item in jd_result.hard_requirements:
            requirements.append(
                _Requirement(
                    id=item.id,
                    text=item.description or item.source_text,
                    keywords=self._build_keywords_from_hard(item),
                    kind=item.category,
                    semantic_key=item.category,
                    severity="critical",
                )
            )

        for item in jd_result.core_capabilities:
            requirements.append(
                _Requirement(
                    id=item.id,
                    text=item.capability,
                    keywords=self._build_keywords_from_capability(item),
                    kind="capability",
                    semantic_key=item.evidence_type,
                    severity="major",
                )
            )

        for item in jd_result.nice_to_have:
            requirements.append(
                _Requirement(
                    id=item.id,
                    text=item.capability,
                    keywords=self._build_keywords_from_capability(item),
                    kind="capability",
                    semantic_key=item.evidence_type,
                    severity="minor",
                )
            )

        return requirements

    def _build_keywords_from_hard(self, requirement: HardRequirement) -> tuple[str, ...]:
        keywords = [requirement.description, requirement.source_text]
        return self._unique_keywords(keywords)

    def _build_keywords_from_capability(self, requirement: CapabilityRequirement) -> tuple[str, ...]:
        keywords = [requirement.capability, requirement.description, *requirement.related_keywords]
        return self._unique_keywords(keywords)

    def _unique_keywords(self, keywords: list[str]) -> tuple[str, ...]:
        deduped: list[str] = []
        for keyword in keywords:
            cleaned = keyword.strip()
            if cleaned and cleaned not in deduped:
                deduped.append(cleaned)
        return tuple(deduped)

    def _map_requirement(self, requirement: _Requirement, facts: list[MaterialFact]) -> EvidenceMapping | None:
        scored = [self._score_fact(requirement, fact) for fact in facts]
        direct_candidates = [item for item in scored if item[1] == "direct"]
        semantic_candidates = [item for item in scored if item[1] == "semantic"]
        weak_candidates = [item for item in scored if item[1] == "inferential"]

        if direct_candidates:
            fact, _, matched = max(direct_candidates, key=lambda item: (len(item[2]), item[0].confidence == "explicit"))
            strength = "strong" if fact.confidence == "explicit" else "moderate"
            return self._build_mapping(requirement, [fact], "direct", strength, matched)

        if len(semantic_candidates) >= 2:
            top_two = sorted(semantic_candidates, key=lambda item: len(item[2]), reverse=True)[:2]
            material_facts = [item[0] for item in top_two]
            matched = sorted({keyword for _, _, keywords in top_two for keyword in keywords})
            return self._build_mapping(requirement, material_facts, "composite", "moderate", matched)

        if semantic_candidates:
            fact, _, matched = max(semantic_candidates, key=lambda item: len(item[2]))
            return self._build_mapping(requirement, [fact], "semantic", "moderate", matched)

        if len(weak_candidates) >= 2:
            top_two = sorted(weak_candidates, key=lambda item: len(item[2]), reverse=True)[:2]
            material_facts = [item[0] for item in top_two]
            matched = sorted({keyword for _, _, keywords in top_two for keyword in keywords})
            return self._build_mapping(requirement, material_facts, "composite", "moderate", matched)

        if weak_candidates:
            fact, _, matched = max(weak_candidates, key=lambda item: len(item[2]))
            return self._build_mapping(requirement, [fact], "inferential", "weak", matched)

        return None

    def _score_fact(
        self,
        requirement: _Requirement,
        fact: MaterialFact,
    ) -> tuple[MaterialFact, str, list[str]]:
        text = self._fact_text(fact)
        direct_matches = [keyword for keyword in requirement.keywords if self._contains(text, keyword)]
        if direct_matches:
            return fact, "direct", direct_matches

        semantic_matches = self._semantic_matches(requirement, text)
        if semantic_matches:
            return fact, "semantic", semantic_matches

        weak_matches = [keyword for keyword in requirement.keywords if self._loosely_related(text, keyword)]
        if weak_matches:
            return fact, "inferential", weak_matches

        return fact, "none", []

    def _semantic_matches(self, requirement: _Requirement, text: str) -> list[str]:
        semantic_terms: list[str] = []
        for term in self._SEMANTIC_KEYWORDS.get(requirement.semantic_key or "", ()):
            if self._contains(text, term) and term not in semantic_terms:
                semantic_terms.append(term)
        return semantic_terms

    def _loosely_related(self, text: str, keyword: str) -> bool:
        normalized = self._normalize(text)
        token = self._normalize(keyword)
        if not token:
            return False
        return token[:2] in normalized or normalized[:2] in token

    def _contains(self, text: str, keyword: str) -> bool:
        return self._normalize(keyword) in self._normalize(text)

    def _normalize(self, text: str) -> str:
        return text.casefold().replace(" ", "")

    def _fact_text(self, fact: MaterialFact) -> str:
        return " ".join([fact.statement, *fact.skill_tags, *fact.topic_tags, *fact.outcome_tags])

    def _build_mapping(
        self,
        requirement: _Requirement,
        facts: list[MaterialFact],
        mapping_type: Literal["direct", "semantic", "inferential", "composite"],
        strength: Literal["strong", "moderate", "weak", "insufficient"],
        matched_terms: list[str],
    ) -> EvidenceMapping:
        fact_ids = [fact.id for fact in facts]
        quotes = [fact.statement for fact in facts]
        return EvidenceMapping(
            id=f"EM-{requirement.id}",
            jd_requirement_id=requirement.id,
            material_fact_ids=fact_ids,
            mapping_type=mapping_type,  # type: ignore[arg-type]
            strength=strength,  # type: ignore[arg-type]
            reasoning=f"匹配关键词：{'、'.join(matched_terms) if matched_terms else requirement.text}",
            direct_quote="；".join(quotes),
        )

    def _build_gap(self, requirement: _Requirement) -> GapItem:
        return GapItem(
            id=f"GAP-{requirement.id}",
            jd_requirement_id=requirement.id,
            gap_type="missing_evidence",
            description=f"未找到可支撑 {requirement.text} 的素材证据",
            severity=requirement.severity,  # type: ignore[arg-type]
            recommendation="补充相关经历或更具体的成果描述",
        )
