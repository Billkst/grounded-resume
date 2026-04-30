# Plan C: Core Workflow Engine - Generation And Validation Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement safe resume draft generation, expression downgrading, redline detection, conservative mode, and validation using rule-first logic and `FakeLLMProvider`.

**Architecture:** Build generation and safety modules under `src/core/generation/`, `src/core/safety/`, and `src/core/validation/`. Generation creates `ResumeDraft` from evidence mappings; safety modules enforce downgrade and redline rules; validation produces scored `ValidationResult`. All logic is rule-based and deterministic for Alpha.

**Tech Stack:** Python 3.12, Pydantic v2, pytest.

---

## Dependencies

- Requires Plan A: schemas and provider contract.
- Requires Plan B: `JDParsedResult`, `MaterialParseResult`, `EvidenceMappingResult`.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `feat: add safety rule tables` | `src/core/config/safety_rules.py`, rule table tests |
| 2 | `feat: add constrained generator` | `src/core/generation/constrained_generator.py`, generator tests |
| 3 | `feat: add expression guard` | `src/core/safety/expression_guard.py`, guard tests |
| 4 | `feat: add redline detector` | `src/core/safety/redline_detector.py`, detector tests |
| 5 | `feat: add conservative mode` | `src/core/safety/conservative_mode.py`, mode tests |
| 6 | `feat: add resume validator` | `src/core/validation/validator.py`, validator tests |
| 7 | `test: add generate validate integration coverage` | Integration pipeline test |

## File Map

| Path | Responsibility |
|---|---|
| `src/core/config/__init__.py` | Config package marker |
| `src/core/config/safety_rules.py` | Shared verb/degree/role/redline rule tables |
| `src/core/generation/__init__.py` | Generation exports |
| `src/core/generation/constrained_generator.py` | `ConstrainedGenerator` implementation |
| `src/core/safety/__init__.py` | Safety exports |
| `src/core/safety/expression_guard.py` | `ExpressionGuard` implementation |
| `src/core/safety/redline_detector.py` | `RedlineDetector` implementation |
| `src/core/safety/conservative_mode.py` | `ConservativeMode` implementation |
| `src/core/validation/__init__.py` | Validation exports |
| `src/core/validation/validator.py` | `Validator` implementation |
| `tests/unit/test_safety_rules.py` | Rule table tests |
| `tests/unit/test_constrained_generator.py` | Generator tests |
| `tests/unit/test_expression_guard.py` | Guard tests |
| `tests/unit/test_redline_detector.py` | Detector tests |
| `tests/unit/test_conservative_mode.py` | Mode tests |
| `tests/unit/test_validator.py` | Validator tests |
| `tests/integration/test_generate_validate_pipeline.py` | B-to-C integration test |

---

## Scope

### Included

| Module | Description |
|---|---|
| `ConstrainedGenerator` | Generate `ResumeDraft` from mapped evidence |
| `ExpressionGuard` | Downgrade strong verbs and unsupported degree words |
| `RedlineDetector` | Detect fabricated skills, role inflation, unsupported numbers, temporal fabrication, keyword injection |
| `ConservativeMode` | Decide `normal`, `conservative`, or `minimal` mode based on evidence coverage |
| `Validator` | Produce `ValidationResult` across authenticity, JD alignment, expression quality, structure completeness |
| Rule tables | Verb downgrade table, degree word downgrade table, role limits, redline patterns |

### Excluded

| Excluded | Reason |
|---|---|
| Real LLM generation | Fake outputs and rule-generated bullets are enough for Alpha |
| User confirmation UI | Covered by Plan F |
| Markdown final export | Covered by Plan D |
| LangGraph orchestration | Covered by Plan E |

---

## Key Tasks

### Task C1: Safety Rule Tables

**Files:**
- Create: `src/core/config/__init__.py`
- Create: `src/core/config/safety_rules.py`
- Create: `tests/unit/test_safety_rules.py`

**Steps:**

- [ ] **Step 1: Write failing rule table tests**

Create `tests/unit/test_safety_rules.py`:

```python
from core.config.safety_rules import (
    DEGREE_DOWNGRADE_TABLE,
    ROLE_LIMITS,
    VERB_DOWNGRADE_TABLE,
    detect_unsupported_number,
)


def test_verb_downgrade_table_has_common_strong_verbs() -> None:
    assert "主导" in VERB_DOWNGRADE_TABLE
    assert VERB_DOWNGRADE_TABLE["主导"] == "参与"


def test_degree_downgrade_table_has_common_strong_words() -> None:
    assert "显著" in DEGREE_DOWNGRADE_TABLE
    assert DEGREE_DOWNGRADE_TABLE["显著"] == "一定"


def test_role_limits_define_maximum_role() -> None:
    assert ROLE_LIMITS["participant"] == "participant"
    assert ROLE_LIMITS["solo"] == "lead"


def test_detect_unsupported_number_finds_numeric_claims() -> None:
    assert detect_unsupported_number("提升 30%") is True
    assert detect_unsupported_number("有一定提升") is False
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_safety_rules.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement safety rules**

Create `src/core/config/safety_rules.py`:

```python
from __future__ import annotations

import re

VERB_DOWNGRADE_TABLE: dict[str, str] = {
    "主导": "参与",
    "负责": "参与",
    "带领": "协助",
    "设计": "参与设计",
    "架构": "参与架构",
    "规划": "协助规划",
    "精通": "了解",
    "熟练掌握": "使用过",
    "独立完成": "在指导下完成",
    "推动": "参与推进",
    "落地": "参与落地",
}

DEGREE_DOWNGRADE_TABLE: dict[str, str] = {
    "显著": "一定",
    "大幅": "部分",
    "全面": "部分",
    "深度": "基础",
    "扎实": "初步",
    "系统": "基础",
    "丰富": "若干",
    "大量": "一些",
    "众多": "若干",
    "成功": "",
    "高效": "",
    "优质": "",
}

ROLE_LIMITS: dict[str, str] = {
    "observer": "participant",
    "participant": "participant",
    "core": "core",
    "lead": "lead",
    "solo": "lead",
}

REDLINE_PATTERNS: list[tuple[str, str]] = [
    ("unsupported_number", r"\d+[%倍个项次人]"),
    ("role_inflation", r"(主导|负责|带领).{0,5}(团队|项目|部门)"),
]


def detect_unsupported_number(text: str) -> bool:
    return bool(re.search(r"\d+[%倍个项次人]", text))


def get_downgraded_verb(verb: str, evidence_strength: str) -> str | None:
    if evidence_strength in ("strong", "moderate"):
        return None
    return VERB_DOWNGRADE_TABLE.get(verb)
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_safety_rules.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/config/__init__.py src/core/config/safety_rules.py tests/unit/test_safety_rules.py
git commit -m "feat: add safety rule tables"
```

---

### Task C2: ConstrainedGenerator

**Files:**
- Create: `src/core/generation/__init__.py`
- Create: `src/core/generation/constrained_generator.py`
- Create: `tests/unit/test_constrained_generator.py`

**Steps:**

- [ ] **Step 1: Write failing generator tests**

Create `tests/unit/test_constrained_generator.py`:

```python
from core.generation.constrained_generator import ConstrainedGenerator
from core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceRef,
    MaterialFact,
    MaterialParseResult,
    ResumeBullet,
    ResumeDraft,
    UserInput,
    UserProfile,
)


def test_generator_creates_draft_with_evidence_refs() -> None:
    generator = ConstrainedGenerator()
    mapping_result = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jdRequirementId="C001",
                materialFactIds=["F001"],
                mappingType="direct",
                strength="strong",
                reasoning="直接匹配",
                directQuote="用 Python 分析数据",
            )
        ],
        gaps=[],
        overclaims=[],
        mappingConfidence=1.0,
    )
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        targetJob=__import__("core.models", fromlist=["TargetJob"]).TargetJob(
            companyName="Example AI",
            jobTitle="AI 产品实习生",
            jobDescription="负责 AI 产品调研，要求本科及以上在读。熟悉 Python。",
        ),
        materials=[],
    )

    draft = generator.generate(mapping_result, user_input)

    assert isinstance(draft, ResumeDraft)
    assert len(draft.sections) >= 1
    assert any(len(s.bullets) > 0 for s in draft.sections)
    first_bullet = draft.sections[0].bullets[0]
    assert len(first_bullet.evidenceRefs) >= 1


def test_generator_applies_expression_level_by_strength() -> None:
    generator = ConstrainedGenerator()
    mapping_result = EvidenceMappingResult(
        mappings=[
            EvidenceMapping(
                id="EM001",
                jdRequirementId="C001",
                materialFactIds=["F001"],
                mappingType="direct",
                strength="weak",
                reasoning="弱匹配",
                directQuote="接触过 Python",
            )
        ],
        gaps=[],
        overclaims=[],
        mappingConfidence=0.3,
    )
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        targetJob=__import__("core.models", fromlist=["TargetJob"]).TargetJob(
            companyName="Example AI",
            jobTitle="AI 产品实习生",
            jobDescription="负责 AI 产品调研，要求本科及以上在读。熟悉 Python。",
        ),
        materials=[],
    )

    draft = generator.generate(mapping_result, user_input)

    first_bullet = draft.sections[0].bullets[0]
    assert first_bullet.expressionLevel in ("conservative", "literal")
```

- [ ] **Step 2-5: Implement, test, commit**

Create `src/core/generation/__init__.py`:

```python
from core.generation.constrained_generator import ConstrainedGenerator

__all__ = ["ConstrainedGenerator"]
```

Create `src/core/generation/constrained_generator.py`:

```python
from __future__ import annotations

from core.models import (
    EvidenceMappingResult,
    EvidenceRef,
    ExpressionLevel,
    ResumeBullet,
    ResumeDraft,
    ResumeSection,
    RewriteStep,
    RiskLevel,
    UserInput,
)


class ConstrainedGenerator:
    def generate(
        self,
        mapping_result: EvidenceMappingResult,
        user_input: UserInput,
    ) -> ResumeDraft:
        sections: list[ResumeSection] = []
        bullets: list[ResumeBullet] = []

        for mapping in mapping_result.mappings:
            expression_level = self._map_strength_to_expression(mapping.strength)
            bullet_text = self._generate_bullet_text(mapping)

            bullets.append(
                ResumeBullet(
                    id=f"B-{mapping.id}",
                    text=bullet_text,
                    evidenceRefs=[
                        EvidenceRef(
                            mappingId=mapping.id,
                            factIds=mapping.materialFactIds,
                            sourceFragments=[],
                        )
                    ],
                    expressionLevel=expression_level,
                    rewriteChain=[
                        RewriteStep(
                            step=1,
                            from_=mapping.directQuote,
                            to=bullet_text,
                            reason=f"Generated with expression level {expression_level}",
                            operator="system",
                        )
                    ],
                    riskLevel=RiskLevel("safe") if mapping.strength == "strong" else RiskLevel("caution"),
                )
            )

        if bullets:
            sections.append(
                ResumeSection(
                    id="S001",
                    sectionType="experience",
                    title="项目经历",
                    bullets=bullets,
                    order=1,
                )
            )

        sections.append(
            ResumeSection(
                id="S002",
                sectionType="basic_info",
                title="基本信息",
                bullets=[],
                order=0,
            )
        )

        return ResumeDraft(
            version=1,
            sections=sorted(sections, key=lambda s: s.order),
            generationLog=[],
            riskFlags=[],
        )

    def _map_strength_to_expression(self, strength: str) -> ExpressionLevel:
        mapping = {
            "strong": "standard",
            "moderate": "standard",
            "weak": "conservative",
            "insufficient": "literal",
        }
        return ExpressionLevel(mapping.get(strength, "conservative"))

    def _generate_bullet_text(self, mapping) -> str:
        return mapping.directQuote
```

Run tests:

```bash
pytest tests/unit/test_constrained_generator.py -v
```

Expected: `2 passed`

Commit:

```bash
git add src/core/generation/__init__.py src/core/generation/constrained_generator.py tests/unit/test_constrained_generator.py
git commit -m "feat: add constrained generator"
```

---

### Task C3: ExpressionGuard

**Files:**
- Create: `src/core/safety/__init__.py`
- Create: `src/core/safety/expression_guard.py`
- Create: `tests/unit/test_expression_guard.py`

**Implementation sketch:**

```python
from core.config.safety_rules import VERB_DOWNGRADE_TABLE, DEGREE_DOWNGRADE_TABLE
from core.models import ResumeDraft, ResumeBullet, RewriteStep

class ExpressionGuard:
    def guard(self, draft: ResumeDraft) -> ResumeDraft:
        revised_sections = []
        for section in draft.sections:
            revised_bullets = []
            for bullet in section.bullets:
                revised_text = self._downgrade_expression(bullet.text, bullet.expressionLevel)
                if revised_text != bullet.text:
                    bullet = bullet.model_copy(update={
                        "text": revised_text,
                        "rewriteChain": bullet.rewriteChain + [
                            RewriteStep(step=len(bullet.rewriteChain)+1, from_=bullet.text, to=revised_text, reason="ExpressionGuard downgrade", operator="guardrail")
                        ]
                    })
                revised_bullets.append(bullet)
            revised_sections.append(section.model_copy(update={"bullets": revised_bullets}))
        return draft.model_copy(update={"sections": revised_sections})

    def _downgrade_expression(self, text: str, level: str) -> str:
        if level not in ("conservative", "literal"):
            return text
        for strong, weak in VERB_DOWNGRADE_TABLE.items():
            if strong in text:
                text = text.replace(strong, weak)
        for strong, weak in DEGREE_DOWNGRADE_TABLE.items():
            if strong in text:
                text = text.replace(strong, weak)
        return text
```

**Tests:** Assert strong verbs are downgraded for conservative bullets; strong evidence bullets are not modified.

---

### Task C4: RedlineDetector

**Files:**
- Create: `src/core/safety/redline_detector.py`
- Create: `tests/unit/test_redline_detector.py`

**Implementation sketch:**

```python
from core.config.safety_rules import detect_unsupported_number, REDLINE_PATTERNS
from core.models import ResumeDraft, RiskFlag, RiskLevel

class RedlineDetector:
    def detect(self, draft: ResumeDraft, material_facts: list) -> ResumeDraft:
        risk_flags = []
        material_skills = set()
        for fact in material_facts:
            material_skills.update(fact.skillTags)

        for section in draft.sections:
            for bullet in section.bullets:
                if detect_unsupported_number(bullet.text):
                    risk_flags.append(RiskFlag(
                        bulletId=bullet.id,
                        riskType="outcome_inference",
                        severity="high",
                        description="Unsupported numeric claim detected",
                        suggestedFix="Remove or generalize the number",
                        autoResolved=False,
                    ))
                    bullet = bullet.model_copy(update={"riskLevel": RiskLevel("redline")})

        return draft.model_copy(update={"riskFlags": draft.riskFlags + risk_flags})
```

**Tests:** Assert unsupported numbers trigger redline; supported numbers do not.

---

### Task C5: ConservativeMode

**Files:**
- Create: `src/core/safety/conservative_mode.py`
- Create: `tests/unit/test_conservative_mode.py`

**Implementation sketch:**

```python
from core.models import EvidenceMappingResult, ResumeDraft

class ConservativeMode:
    def apply(self, mapping_result: EvidenceMappingResult, draft: ResumeDraft) -> ResumeDraft:
        critical_coverage = self._calculate_critical_coverage(mapping_result)
        weak_ratio = self._calculate_weak_ratio(mapping_result)
        composite_ratio = self._calculate_composite_ratio(mapping_result)
        strong_count = sum(1 for m in mapping_result.mappings if m.strength == "strong")

        mode = self._decide_mode(critical_coverage, weak_ratio, composite_ratio, strong_count)

        if mode == "minimal":
            return self._to_minimal_draft(draft)
        if mode == "conservative":
            return self._to_conservative_draft(draft)
        return draft

    def _decide_mode(self, critical_coverage, weak_ratio, composite_ratio, strong_count):
        if critical_coverage < 0.3 or strong_count == 0:
            return "minimal"
        if critical_coverage < 0.6 or composite_ratio > 0.5 or weak_ratio > 0.7:
            return "conservative"
        return "normal"
```

**Tests:** Assert thresholds trigger correct modes.

---

### Task C6: Validator

**Files:**
- Create: `src/core/validation/__init__.py`
- Create: `src/core/validation/validator.py`
- Create: `tests/unit/test_validator.py`

**Implementation sketch:**

```python
from core.models import ResumeDraft, ValidationResult, ValidationScore, CheckResult

class Validator:
    def validate(self, draft: ResumeDraft) -> ValidationResult:
        checks = [
            self._check_authenticity(draft),
            self._check_structure(draft),
        ]
        passed = all(c.passed for c in checks)
        return ValidationResult(
            passed=passed,
            checks=checks,
            overallScore=ValidationScore(
                authenticity=checks[0].score,
                jdAlignment=60,
                expressionQuality=70,
                structuralCompleteness=checks[1].score,
                modificationCostEstimate=50,
            ),
            mandatoryRevisions=[],
            suggestedRevisions=[],
        )

    def _check_authenticity(self, draft):
        issues = []
        for section in draft.sections:
            for bullet in section.bullets:
                if not bullet.evidenceRefs:
                    issues.append("Missing evidence ref")
        score = 100 if not issues else max(0, 100 - len(issues) * 20)
        return CheckResult(checkId="CHK001", checkName="真实性检查", passed=score >= 80, score=score, findings=[])

    def _check_structure(self, draft):
        has_experience = any(s.sectionType == "experience" for s in draft.sections)
        score = 100 if has_experience else 40
        return CheckResult(checkId="CHK002", checkName="结构完整度", passed=has_experience, score=score, findings=[])
```

**Tests:** Assert validation scores and pass/fail logic.

---

### Task C7: Generate-Validate Integration

**Files:**
- Create: `tests/integration/test_generate_validate_pipeline.py`

**Test:** Run a sample from Plan B outputs through generator → guard → detector → conservative mode → validator, assert final `ValidationResult.passed` is consistent.

---

## Success Criteria

- `pytest tests/unit/test_constrained_generator.py tests/unit/test_expression_guard.py tests/unit/test_redline_detector.py tests/unit/test_conservative_mode.py tests/unit/test_validator.py -q` passes.
- `pytest tests/integration/test_generate_validate_pipeline.py -q` passes.
- 100% of generated bullets include at least one `EvidenceRef`.
- Weak evidence never produces `expressionLevel = "emphasized"`.
- Unsupported numbers and unsupported skills are flagged or removed.
- Minimal mode is triggered when critical coverage is below 30% or no strong evidence exists.
