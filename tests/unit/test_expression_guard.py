from grounded_resume.core.models import EvidenceRef, ResumeBullet, ResumeDraft, ResumeSection


def test_expression_guard_downgrades_conservative_bullet() -> None:
    from grounded_resume.core.safety.expression_guard import ExpressionGuard

    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                section_type="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="主导课程项目落地，并显著提升交付效率。",
                        evidence_refs=[EvidenceRef(mapping_id="EM001", fact_ids=["F001"])],
                        expression_level="conservative",
                        rewrite_chain=[],
                        risk_level="safe",
                    )
                ],
            )
        ],
    )

    rewritten = ExpressionGuard().guard(draft)

    bullet = rewritten.sections[0].bullets[0]
    assert bullet.text == "参与课程项目参与落地，并一定提升交付效率。"
    assert len(bullet.rewrite_chain) == 1
    assert bullet.rewrite_chain[0].from_ == "主导课程项目落地，并显著提升交付效率。"
    assert bullet.rewrite_chain[0].to == "参与课程项目参与落地，并一定提升交付效率。"
    assert bullet.rewrite_chain[0].operator == "guardrail"


def test_expression_guard_keeps_standard_bullet_unchanged() -> None:
    from grounded_resume.core.safety.expression_guard import ExpressionGuard

    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                section_type="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="主导课程项目落地，并显著提升交付效率。",
                        evidence_refs=[EvidenceRef(mapping_id="EM001", fact_ids=["F001"])],
                        expression_level="standard",
                        rewrite_chain=[],
                        risk_level="safe",
                    )
                ],
            )
        ],
    )

    rewritten = ExpressionGuard().guard(draft)

    bullet = rewritten.sections[0].bullets[0]
    assert bullet.text == "主导课程项目落地，并显著提升交付效率。"
    assert bullet.rewrite_chain == []
