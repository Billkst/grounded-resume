from __future__ import annotations

from grounded_resume.core.config.safety_rules import detect_unsupported_number
from grounded_resume.core.models import MaterialFact, ResumeDraft, RiskFlag


class RedlineDetector:
    def detect(self, draft: ResumeDraft, material_facts: list[MaterialFact]) -> ResumeDraft:
        result = draft.model_copy(deep=True)

        for section in result.sections:
            for bullet in section.bullets:
                if not detect_unsupported_number(bullet.text):
                    continue

                bullet.risk_level = "redline"
                result.risk_flags.append(
                    RiskFlag(
                        bullet_id=bullet.id,
                        risk_type="outcome_inference",
                        severity="high",
                        description="Bullet contains an unsupported numeric claim.",
                        suggested_fix="Remove the number or replace it with a verifiable statement.",
                        auto_resolved=False,
                    )
                )

        return result
