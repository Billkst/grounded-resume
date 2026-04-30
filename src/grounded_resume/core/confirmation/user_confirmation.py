from __future__ import annotations

from uuid import uuid4
from typing import ClassVar

from grounded_resume.core.models import (
    ConfirmationItem,
    ConfirmationSession,
    EvidencePreview,
    ResumeBullet,
    ResumeDraft,
    UserOverride,
    ValidationResult,
)
from grounded_resume.core.models.schemas import Recommendation


class UserConfirmation:
    _risk_rank: ClassVar[dict[str, int]] = {"redline": 0, "warning": 1, "caution": 2, "safe": 3}

    @classmethod
    def build_session(cls, draft: ResumeDraft, validation: ValidationResult) -> ConfirmationSession:
        _ = validation.overall_score
        bullets = [bullet for section in draft.sections for bullet in section.bullets]
        ordered_bullets = sorted(bullets, key=lambda bullet: cls._risk_rank.get(bullet.risk_level, 99))

        items = [cls._build_item(bullet) for bullet in ordered_bullets]
        return ConfirmationSession(
            session_id=uuid4().hex,
            resume_version=draft.version,
            items=items,
            user_decisions=[],
            final_resume=draft.model_copy(deep=True),
            gap_acknowledgments=[],
        )

    @classmethod
    def apply_decision(cls, draft: ResumeDraft, bullet_id: str, decision: str) -> ResumeDraft:
        updated = draft.model_copy(deep=True)
        for section in updated.sections:
            for index, bullet in enumerate(section.bullets):
                if bullet.id != bullet_id:
                    continue

                if decision == "reject":
                    _ = section.bullets.pop(index)
                    return updated

                if decision == "revise":
                    bullet.user_override = UserOverride(approved=True, modified_text=bullet.text)
                    return updated

                if decision == "approve":
                    bullet.user_override = UserOverride(approved=True)
                    return updated

                return updated

        return updated

    @classmethod
    def _build_item(cls, bullet: ResumeBullet) -> ConfirmationItem:
        recommendation: Recommendation = "approve" if bullet.risk_level == "safe" else "revise"
        return ConfirmationItem(
            id=bullet.id,
            bullet_id=bullet.id,
            proposed_text=bullet.text,
            evidence_preview=EvidencePreview(
                source_material_title="原始素材",
                direct_quotes=[bullet.text],
                mapping_reasoning=f"基于 bullet.risk_level={bullet.risk_level} 生成确认项。",
            ),
            risk_notes=[f"risk_level={bullet.risk_level}"],
            system_recommendation=recommendation,
        )
