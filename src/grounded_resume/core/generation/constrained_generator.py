from __future__ import annotations

from grounded_resume.core.models import (
    ExpressionLevel,
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceRef,
    GenerationLog,
    RawMaterial,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    RiskFlag,
    RiskLevel,
    RewriteStep,
    SectionType,
    UserInput,
)


class ConstrainedGenerator:
    def generate(self, mapping_result: EvidenceMappingResult, user_input: UserInput) -> ResumeDraft:
        bullets = self._build_bullets(mapping_result.mappings, user_input.materials)
        section = ResumeSection(
            id="S001",
            section_type="experience",
            title="项目经历",
            bullets=bullets,
            order=1,
        )

        return ResumeDraft(
            version=1,
            sections=[section],
            generation_log=[
                GenerationLog(
                    step="constrained_generation",
                    decision="generated",
                    rationale="优先使用可追溯的证据映射生成简历条目。",
                )
            ],
            risk_flags=self._build_risk_flags(bullets),
        )

    def _build_bullets(
        self,
        mappings: list[EvidenceMapping],
        materials: list[RawMaterial],
    ) -> list[ResumeBullet]:
        if mappings:
            return [self._build_bullet_from_mapping(mapping, materials) for mapping in mappings]

        if not materials:
            return []

        material = materials[0]
        return [
            ResumeBullet(
                id="B001",
                text=material.content.strip(),
                evidence_refs=[EvidenceRef(mapping_id="EM-000", fact_ids=[material.id], source_fragments=[])],
                expression_level="literal",
                rewrite_chain=[],
                risk_level="safe",
            )
        ]

    def _build_bullet_from_mapping(self, mapping: EvidenceMapping, materials: list[RawMaterial]) -> ResumeBullet:
        expression_level = self._expression_level_for_strength(mapping.strength)
        risk_level = self._risk_level_for_strength(mapping.strength)
        source_fragments = [material.id for material in materials[:1]]
        return ResumeBullet(
            id=f"B-{mapping.id}",
            text=mapping.direct_quote.strip() or mapping.reasoning.strip(),
            evidence_refs=[
                EvidenceRef(
                    mapping_id=mapping.id,
                    fact_ids=mapping.material_fact_ids,
                    source_fragments=source_fragments,
                )
            ],
            expression_level=expression_level,
            rewrite_chain=[
            RewriteStep.model_validate(
                {
                    "step": 1,
                    "from": mapping.direct_quote.strip() or mapping.reasoning.strip(),
                    "to": mapping.direct_quote.strip() or mapping.reasoning.strip(),
                    "reason": "保留原始证据表达。",
                    "operator": "system",
                }
            )
            ],
            risk_level=risk_level,
        )

    def _expression_level_for_strength(self, strength: str) -> ExpressionLevel:
        if strength == "weak":
            return "conservative"
        return "standard"

    def _risk_level_for_strength(self, strength: str) -> RiskLevel:
        if strength == "strong":
            return "safe"
        if strength == "moderate":
            return "caution"
        return "warning"

    def _build_risk_flags(self, bullets: list[ResumeBullet]) -> list[RiskFlag]:
        return [
            RiskFlag(
                bullet_id=bullet.id,
                risk_type="scope_ambiguity",
                severity="low",
                description="条目已保守约束表达。",
                suggested_fix="如需更强表达，可补充对应原始证据。",
                auto_resolved=True,
            )
            for bullet in bullets
            if bullet.risk_level != "safe"
        ]
