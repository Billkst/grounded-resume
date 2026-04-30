from __future__ import annotations

from grounded_resume.core.config.safety_rules import DEGREE_DOWNGRADE_TABLE, VERB_DOWNGRADE_TABLE
from grounded_resume.core.models import ResumeDraft, RewriteStep


class ExpressionGuard:
    def guard(self, draft: ResumeDraft) -> ResumeDraft:
        rewritten = draft.model_copy(deep=True)

        for section in rewritten.sections:
            for bullet in section.bullets:
                if bullet.expression_level not in {"conservative", "literal"}:
                    continue

                original_text = bullet.text
                downgraded_text = self._downgrade_text(original_text)

                if downgraded_text == original_text:
                    continue

                bullet.text = downgraded_text
                bullet.rewrite_chain.append(
                    RewriteStep.model_validate(
                        {
                            "step": len(bullet.rewrite_chain) + 1,
                            "from": original_text,
                            "to": downgraded_text,
                            "reason": "降级表达以符合保守表达要求",
                            "operator": "guardrail",
                        }
                    )
                )

        return rewritten

    def _downgrade_text(self, text: str) -> str:
        result = text
        for source, target in sorted(VERB_DOWNGRADE_TABLE.items(), key=lambda item: len(item[0]), reverse=True):
            result = result.replace(source, target)
        for source, target in sorted(DEGREE_DOWNGRADE_TABLE.items(), key=lambda item: len(item[0]), reverse=True):
            result = result.replace(source, target)
        return result
