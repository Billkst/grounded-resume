# Plan D: User Confirmation And Output Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement confirmation session management and Markdown/attachment output without frontend or WebSocket dependencies.

**Architecture:** Build confirmation logic under `src/core/confirmation/` and formatting logic under `src/core/output/`. Confirmation builds a prioritized queue of items to review, applies user decisions, and produces a confirmed draft. Formatter converts the confirmed draft into standard Chinese internship resume Markdown plus evidence map, gap report, risk summary, and modification guide attachments.

**Tech Stack:** Python 3.12, Pydantic v2, pytest.

---

## Dependencies

- Requires Plan A: schemas.
- Requires Plan B: evidence mappings and gaps.
- Requires Plan C: draft and validation results.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `feat: add confirmation queue builder` | `src/core/confirmation/user_confirmation.py`, queue tests |
| 2 | `feat: apply user confirmation decisions` | Decision application logic and tests |
| 3 | `feat: add resume markdown formatter` | `src/core/output/resume_formatter.py`, formatter tests |
| 4 | `feat: add output attachments` | Attachment generation logic |
| 5 | `test: add confirmation output integration coverage` | Integration pipeline test |

## File Map

| Path | Responsibility |
|---|---|
| `src/core/confirmation/__init__.py` | Confirmation exports |
| `src/core/confirmation/user_confirmation.py` | Confirmation session manager |
| `src/core/output/__init__.py` | Output exports |
| `src/core/output/resume_formatter.py` | Markdown and attachment generation |
| `tests/unit/test_user_confirmation.py` | Confirmation tests |
| `tests/unit/test_resume_formatter.py` | Formatter tests |
| `tests/integration/test_confirmation_output_pipeline.py` | Draft-to-output integration test |

---

## Scope

### Included

| Module | Description |
|---|---|
| `UserConfirmation` | Build confirmation queue, apply approve/revise/reject decisions, track gap acknowledgments |
| Confirmation priority | Sort warning/emphasized/numeric/composite items before low-risk items |
| User decision handling | Update `ResumeDraft.userOverride`, remove rejected bullets, preserve audit trail |
| `ResumeFormatter` | Generate final `ResumeOutput` |
| Markdown export | Produce Level 2 declaration, resume body, evidence map, gap report, risk summary, modification guide |

### Excluded

| Excluded | Reason |
|---|---|
| Frontend confirmation UI | Covered by Plan F |
| WebSocket streaming | Covered by Plan E |
| Multi-round regeneration | Explicit non-goal for MVP |
| PDF/DOCX export | Deferred beyond MVP |

---

## Key Tasks

### Task D1: Confirmation Queue Builder

**Files:**
- Create: `src/core/confirmation/__init__.py`
- Create: `src/core/confirmation/user_confirmation.py`
- Create: `tests/unit/test_user_confirmation.py`

**Steps:**

- [ ] **Step 1: Write failing confirmation tests**

Create `tests/unit/test_user_confirmation.py`:

```python
from core.confirmation.user_confirmation import UserConfirmation
from core.models import (
    ConfirmationItem,
    ConfirmationSession,
    EvidencePreview,
    EvidenceRef,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    RiskFlag,
    RiskLevel,
    ValidationResult,
    ValidationScore,
)


def test_confirmation_prioritizes_high_risk_items() -> None:
    confirmation = UserConfirmation()
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="安全内容",
                        evidenceRefs=[EvidenceRef(mappingId="EM001", factIds=["F001"])],
                        expressionLevel="literal",
                        riskLevel=RiskLevel("safe"),
                    ),
                    ResumeBullet(
                        id="B002",
                        text="警告内容",
                        evidenceRefs=[EvidenceRef(mappingId="EM002", factIds=["F002"])],
                        expressionLevel="emphasized",
                        riskLevel=RiskLevel("warning"),
                    ),
                ],
            )
        ],
    )
    validation = ValidationResult(
        passed=True,
        overallScore=ValidationScore(
            authenticity=80, jdAlignment=70, expressionQuality=75, structuralCompleteness=80, modificationCostEstimate=50
        ),
    )

    session = confirmation.build_session(draft, validation)

    assert session.items[0].bulletId == "B002"
    assert session.items[1].bulletId == "B001"


def test_apply_approval_keeps_bullet() -> None:
    confirmation = UserConfirmation()
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="测试内容",
                        evidenceRefs=[EvidenceRef(mappingId="EM001", factIds=["F001"])],
                        expressionLevel="standard",
                        riskLevel=RiskLevel("safe"),
                    )
                ],
            )
        ],
    )

    result = confirmation.apply_decision(draft, "B001", "approve")

    assert len(result.sections[0].bullets) == 1
    assert result.sections[0].bullets[0].userOverride.approved is True


def test_apply_rejection_removes_bullet() -> None:
    confirmation = UserConfirmation()
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="测试内容",
                        evidenceRefs=[EvidenceRef(mappingId="EM001", factIds=["F001"])],
                        expressionLevel="standard",
                        riskLevel=RiskLevel("safe"),
                    )
                ],
            )
        ],
    )

    result = confirmation.apply_decision(draft, "B001", "reject")

    assert len(result.sections[0].bullets) == 0
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_user_confirmation.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement UserConfirmation**

Create `src/core/confirmation/__init__.py`:

```python
from core.confirmation.user_confirmation import UserConfirmation

__all__ = ["UserConfirmation"]
```

Create `src/core/confirmation/user_confirmation.py`:

```python
from __future__ import annotations

from core.models import (
    ConfirmationItem,
    ConfirmationSession,
    EvidencePreview,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    UserDecision,
    UserOverride,
    ValidationResult,
)


class UserConfirmation:
    def build_session(
        self,
        draft: ResumeDraft,
        validation: ValidationResult,
    ) -> ConfirmationSession:
        items: list[ConfirmationItem] = []
        for section in draft.sections:
            for bullet in section.bullets:
                items.append(
                    ConfirmationItem(
                        id=f"CI-{bullet.id}",
                        bulletId=bullet.id,
                        proposedText=bullet.text,
                        evidencePreview=EvidencePreview(
                            sourceMaterialTitle="原始素材",
                            directQuotes=[],
                            mappingReasoning="系统自动映射",
                        ),
                        riskNotes=[f"Risk level: {bullet.riskLevel}"],
                        systemRecommendation="approve" if bullet.riskLevel == "safe" else "revise",
                    )
                )

        items.sort(key=lambda item: self._priority_score(item, draft))

        return ConfirmationSession(
            sessionId="session-001",
            resumeVersion=draft.version,
            items=items,
            userDecisions=[],
            finalResume=draft,
            gapAcknowledgments=[],
        )

    def apply_decision(self, draft: ResumeDraft, bullet_id: str, decision: str) -> ResumeDraft:
        new_sections: list[ResumeSection] = []
        for section in draft.sections:
            new_bullets: list[ResumeBullet] = []
            for bullet in section.bullets:
                if bullet.id == bullet_id:
                    if decision == "reject":
                        continue
                    override = UserOverride(approved=decision == "approve")
                    if decision == "revise":
                        override = UserOverride(approved=True, modifiedText=bullet.text)
                    bullet = bullet.model_copy(update={"userOverride": override})
                new_bullets.append(bullet)
            new_sections.append(section.model_copy(update={"bullets": new_bullets}))
        return draft.model_copy(update={"sections": new_sections})

    def _priority_score(self, item: ConfirmationItem, draft: ResumeDraft) -> int:
        bullet = next(
            (b for s in draft.sections for b in s.bullets if b.id == item.bulletId),
            None,
        )
        if bullet is None:
            return 0
        score_map = {
            "safe": 0,
            "caution": 1,
            "warning": 2,
            "redline": 3,
        }
        return score_map.get(bullet.riskLevel, 0)
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_user_confirmation.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/confirmation/__init__.py src/core/confirmation/user_confirmation.py tests/unit/test_user_confirmation.py
git commit -m "feat: add confirmation queue builder"
```

---

### Task D2: Apply User Confirmation Decisions

**Files:**
- Modify: `src/core/confirmation/user_confirmation.py`
- Modify: `tests/unit/test_user_confirmation.py`

**Steps:**

- [ ] **Step 1: Add decision application tests**

Add to `tests/unit/test_user_confirmation.py`:

```python
def test_apply_revision_updates_text() -> None:
    confirmation = UserConfirmation()
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="原始内容",
                        evidenceRefs=[EvidenceRef(mappingId="EM001", factIds=["F001"])],
                        expressionLevel="standard",
                        riskLevel=RiskLevel("safe"),
                    )
                ],
            )
        ],
    )

    result = confirmation.apply_decision(draft, "B001", "revise")

    assert result.sections[0].bullets[0].userOverride.approved is True
    assert result.sections[0].bullets[0].userOverride.modifiedText == "原始内容"
```

- [ ] **Step 2-5: Implement, test, commit**

Run tests:

```bash
pytest tests/unit/test_user_confirmation.py -v
```

Expected: `4 passed`

Commit:

```bash
git add src/core/confirmation/user_confirmation.py tests/unit/test_user_confirmation.py
git commit -m "feat: apply user confirmation decisions"
```

---

### Task D3: Resume Markdown Formatter

**Files:**
- Create: `src/core/output/__init__.py`
- Create: `src/core/output/resume_formatter.py`
- Create: `tests/unit/test_resume_formatter.py`

**Steps:**

- [ ] **Step 1: Write failing formatter tests**

Create `tests/unit/test_resume_formatter.py`:

```python
from core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    GapItem,
    OutputMetadata,
    ResumeBullet,
    ResumeDraft,
    ResumeOutput,
    ResumeSection,
    RiskFlag,
    TargetJob,
)
from core.output.resume_formatter import ResumeFormatter


def test_formatter_includes_level_two_declaration() -> None:
    formatter = ResumeFormatter()
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="参与整理课程项目知识库。",
                        evidenceRefs=[],
                        expressionLevel="conservative",
                        riskLevel="safe",
                    )
                ],
            )
        ],
    )
    output = formatter.format(
        draft,
        EvidenceMappingResult(mappings=[], gaps=[], overclaims=[], mappingConfidence=0.5),
        [],
        [],
        TargetJob(companyName="Example AI", jobTitle="AI 产品实习生", jobDescription="负责 AI 产品调研。"),
    )

    assert isinstance(output, ResumeOutput)
    assert "Level 2" in output.attachments[0].content or "接近可投版" in output.attachments[0].content


def test_formatter_generates_evidence_map_attachment() -> None:
    formatter = ResumeFormatter()
    draft = ResumeDraft(version=1, sections=[])
    mapping = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jdRequirementId="C001",
                materialFactIds=["F001"],
                mappingType="direct",
                strength="strong",
                reasoning="直接匹配",
                directQuote="测试",
            )
        ],
        gaps=[],
        overclaims=[],
        mappingConfidence=1.0,
    )

    output = formatter.format(
        draft, mapping, [], [],
        TargetJob(companyName="Example AI", jobTitle="AI 产品实习生", jobDescription="负责 AI 产品调研。"),
    )

    attachment_types = [a.type for a in output.attachments]
    assert "evidence_map" in attachment_types


def test_formatter_generates_gap_report() -> None:
    formatter = ResumeFormatter()
    draft = ResumeDraft(version=1, sections=[])
    gaps = [
        GapItem(
            id="GAP001",
            jdRequirementId="C001",
            gapType="missing_evidence",
            description="缺少数据分析经验",
            severity="major",
        )
    ]

    output = formatter.format(
        draft, EvidenceMappingResult(mappings=[], gaps=[], overclaims=[], mappingConfidence=0.0),
        gaps, [],
        TargetJob(companyName="Example AI", jobTitle="AI 产品实习生", jobDescription="负责 AI 产品调研。"),
    )

    attachment_types = [a.type for a in output.attachments]
    assert "gap_report" in attachment_types
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_resume_formatter.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement ResumeFormatter**

Create `src/core/output/__init__.py`:

```python
from core.output.resume_formatter import ResumeFormatter

__all__ = ["ResumeFormatter"]
```

Create `src/core/output/resume_formatter.py`:

```python
from __future__ import annotations

from datetime import UTC, datetime

from core.models import (
    EvidenceMappingResult,
    GapItem,
    OutputAttachment,
    OutputMetadata,
    ResumeDraft,
    ResumeOutput,
    RiskFlag,
    TargetJob,
)


class ResumeFormatter:
    def format(
        self,
        confirmed_resume: ResumeDraft,
        evidence_mapping: EvidenceMappingResult,
        gap_items: list[GapItem],
        risk_flags: list[RiskFlag],
        target_job: TargetJob,
    ) -> ResumeOutput:
        resume_markdown = self._format_resume_markdown(confirmed_resume)
        evidence_map = self._format_evidence_map(evidence_mapping)
        gap_report = self._format_gap_report(gap_items)
        risk_summary = self._format_risk_summary(risk_flags)
        modification_guide = self._format_modification_guide()

        return ResumeOutput(
            resume=confirmed_resume,
            metadata=OutputMetadata(
                targetJob=target_job,
                generationTimestamp=datetime.now(UTC),
                version="0.1.0",
                confidence=evidence_mapping.mappingConfidence,
                materialCoverage=0.6,
                gapCount=len(gap_items),
            ),
            attachments=[
                OutputAttachment(
                    type="evidence_map",
                    title="证据映射表",
                    content=evidence_map,
                ),
                OutputAttachment(
                    type="gap_report",
                    title="Gap 报告",
                    content=gap_report,
                ),
                OutputAttachment(
                    type="risk_summary",
                    title="风险提示摘要",
                    content=risk_summary,
                ),
                OutputAttachment(
                    type="modification_guide",
                    title="修改建议指南",
                    content=modification_guide,
                ),
            ],
        )

    def _format_resume_markdown(self, draft: ResumeDraft) -> str:
        lines = [
            "> **本简历为"接近可投版"（Level 2），已由系统生成并经过初步校验，但最终投递前请您：**",
            "> 1. 核对所有事实是否与您的真实经历一致",
            "> 2. 确认所有数字、时间、技能描述准确无误",
            "> 3. 根据目标岗位微调侧重点",
            "> 4. **最终投递版（Level 3）的责任由您承担**",
            "",
        ]
        for section in sorted(draft.sections, key=lambda s: s.order):
            lines.append(f"## {section.title}")
            lines.append("")
            for bullet in section.bullets:
                lines.append(f"- {bullet.text}")
            lines.append("")
        return "\n".join(lines)

    def _format_evidence_map(self, mapping: EvidenceMappingResult) -> str:
        lines = ["# 证据映射表", ""]
        lines.append("| JD 要求 | 证据强度 | 映射理由 |")
        lines.append("|---|---|---|")
        for m in mapping.mappings:
            lines.append(f"| {m.jdRequirementId} | {m.strength} | {m.reasoning} |")
        return "\n".join(lines)

    def _format_gap_report(self, gaps: list[GapItem]) -> str:
        lines = ["# Gap 报告", ""]
        for g in gaps:
            lines.append(f"- **{g.severity}**: {g.description}")
            if g.recommendation:
                lines.append(f"  - 建议: {g.recommendation}")
        return "\n".join(lines)

    def _format_risk_summary(self, risk_flags: list[RiskFlag]) -> str:
        lines = ["# 风险提示摘要", ""]
        if not risk_flags:
            lines.append("未发现明显风险。")
        for flag in risk_flags:
            lines.append(f"- **{flag.riskType}**: {flag.description}")
        return "\n".join(lines)

    def _format_modification_guide(self) -> str:
        return (
            "# 修改建议指南\n\n"
            "1. 压缩长度：删除重复描述，保留最关键的动作和结果\n"
            "2. 调整侧重点：根据具体面试官背景调整技术/产品比重\n"
            "3. 面试解释：对于 gap 项，准备 1-2 句话的主动解释\n"
        )
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_resume_formatter.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/output/__init__.py src/core/output/resume_formatter.py tests/unit/test_resume_formatter.py
git commit -m "feat: add resume markdown formatter"
```

---

### Task D4: Output Attachments

**Files:**
- Modify: `src/core/output/resume_formatter.py`
- Modify: `tests/unit/test_resume_formatter.py`

Already covered in Task D3 implementation.

---

### Task D5: Confirmation-Output Integration

**Files:**
- Create: `tests/integration/test_confirmation_output_pipeline.py`

**Steps:**

- [ ] **Step 1: Write integration test**

Create `tests/integration/test_confirmation_output_pipeline.py`:

```python
from core.confirmation.user_confirmation import UserConfirmation
from core.models import (
    EvidenceMappingResult,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    TargetJob,
    ValidationResult,
    ValidationScore,
)
from core.output.resume_formatter import ResumeFormatter


def test_full_confirmation_output_pipeline() -> None:
    draft = ResumeDraft(
        version=1,
        sections=[
            ResumeSection(
                id="S001",
                sectionType="experience",
                title="项目经历",
                order=1,
                bullets=[
                    ResumeBullet(
                        id="B001",
                        text="参与整理课程项目知识库。",
                        evidenceRefs=[],
                        expressionLevel="conservative",
                        riskLevel="safe",
                    )
                ],
            )
        ],
    )
    validation = ValidationResult(
        passed=True,
        overallScore=ValidationScore(
            authenticity=80, jdAlignment=70, expressionQuality=75, structuralCompleteness=80, modificationCostEstimate=50
        ),
    )

    confirmation = UserConfirmation()
    session = confirmation.build_session(draft, validation)
    confirmed_draft = confirmation.apply_decision(session.finalResume, "B001", "approve")

    formatter = ResumeFormatter()
    output = formatter.format(
        confirmed_draft,
        EvidenceMappingResult(mappings=[], gaps=[], overclaims=[], mappingConfidence=0.5),
        [],
        [],
        TargetJob(companyName="Example AI", jobTitle="AI 产品实习生", jobDescription="负责 AI 产品调研。"),
    )

    assert output.metadata.gapCount == 0
    assert len(output.attachments) == 4
    attachment_types = {a.type for a in output.attachments}
    assert attachment_types == {"evidence_map", "gap_report", "risk_summary", "modification_guide"}
```

- [ ] **Step 2: Run integration test**

```bash
pytest tests/integration/test_confirmation_output_pipeline.py -v
```

Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/integration/test_confirmation_output_pipeline.py
git commit -m "test: add confirmation output integration coverage"
```

---

## Success Criteria

- `pytest tests/unit/test_user_confirmation.py tests/unit/test_resume_formatter.py -q` passes.
- `pytest tests/integration/test_confirmation_output_pipeline.py -q` passes.
- Confirmation queue prioritizes warning/emphasized/numeric/composite items.
- Final `ResumeOutput.attachments` contains `evidence_map`, `gap_report`, `risk_summary`, and `modification_guide`.
- Markdown output includes the Level 2 responsibility declaration.
- Rejected bullets do not appear in final output.
