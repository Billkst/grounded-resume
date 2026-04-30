from grounded_resume.core.models import CheckResult, Finding, ResumeDraft, ValidationResult, ValidationScore


class Validator:
    @staticmethod
    def validate(draft: ResumeDraft) -> ValidationResult:
        authenticity_findings: list[Finding] = []
        for section in draft.sections:
            for bullet in section.bullets:
                if not bullet.evidence_refs:
                    authenticity_findings.append(
                        Finding(
                            bullet_id=bullet.id,
                            issue="bullet missing evidence_refs",
                            severity="error",
                            evidence=bullet.text,
                        )
                    )

        authenticity_passed = not authenticity_findings
        structural_passed = any(section.section_type == "experience" for section in draft.sections)

        checks = [
            CheckResult(
                check_id="authenticity",
                check_name="真实性检查",
                passed=authenticity_passed,
                score=100 if authenticity_passed else 0,
                findings=authenticity_findings,
            ),
            CheckResult(
                check_id="structure",
                check_name="结构完整性检查",
                passed=structural_passed,
                score=100 if structural_passed else 0,
                findings=[]
                if structural_passed
                else [
                    Finding(
                        bullet_id="section:experience",
                        issue="missing experience section",
                        severity="error",
                        evidence="",
                    )
                ],
            ),
        ]

        return ValidationResult(
            passed=all(check.passed for check in checks),
            checks=checks,
            overall_score=ValidationScore(
                authenticity=checks[0].score,
                jd_alignment=60,
                expression_quality=70,
                structural_completeness=checks[1].score,
                modification_cost_estimate=50,
            ),
        )
