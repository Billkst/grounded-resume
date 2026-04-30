from __future__ import annotations

from grounded_resume.core.models import ExpressionLevel, EvidenceMappingResult, ResumeBullet, ResumeDraft


class ConservativeMode:
    def apply(self, mapping_result: EvidenceMappingResult, draft: ResumeDraft) -> ResumeDraft:
        mode = self._decide_mode(mapping_result)
        updated = draft.model_copy(deep=True)

        if mode == "minimal":
            self._apply_minimal(updated)
        elif mode == "conservative":
            self._apply_conservative(updated)

        return updated

    def _decide_mode(self, mapping_result: EvidenceMappingResult) -> str:
        strong_count = sum(1 for mapping in mapping_result.mappings if mapping.strength == "strong")
        moderate_or_strong_count = sum(
            1 for mapping in mapping_result.mappings if mapping.strength in {"strong", "moderate"}
        )
        weak_count = sum(1 for mapping in mapping_result.mappings if mapping.strength in {"weak", "insufficient"})
        composite_count = sum(1 for mapping in mapping_result.mappings if mapping.mapping_type == "composite")
        total_mappings = len(mapping_result.mappings)
        critical_gap_count = sum(1 for gap in mapping_result.gaps if gap.severity == "critical")

        critical_coverage = (
            moderate_or_strong_count / (moderate_or_strong_count + critical_gap_count)
            if (moderate_or_strong_count + critical_gap_count)
            else 1.0
        )
        weak_ratio = weak_count / total_mappings if total_mappings else 0.0
        composite_ratio = composite_count / total_mappings if total_mappings else 0.0

        if critical_coverage < 0.3 or strong_count == 0:
            return "minimal"
        if critical_coverage < 0.6 or composite_ratio > 0.5 or weak_ratio > 0.7:
            return "conservative"
        return "normal"

    def _apply_minimal(self, draft: ResumeDraft) -> None:
        for bullet in self._bullets(draft):
            bullet.expression_level = "literal"
            bullet.text = ""

    def _apply_conservative(self, draft: ResumeDraft) -> None:
        for bullet in self._bullets(draft):
            bullet.expression_level = self._downgrade_expression_level(bullet.expression_level)

    def _bullets(self, draft: ResumeDraft) -> list[ResumeBullet]:
        bullets: list[ResumeBullet] = []
        for section in draft.sections:
            bullets.extend(section.bullets)
        return bullets

    def _downgrade_expression_level(self, expression_level: ExpressionLevel) -> ExpressionLevel:
        if expression_level == "emphasized":
            return "standard"
        if expression_level == "standard":
            return "conservative"
        if expression_level == "conservative":
            return "literal"
        return expression_level
