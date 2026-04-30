# Plan A: Data Models And Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared backend foundation for grounded-resume: Pydantic v2 data contracts, SQLite persistence, and a testable LLM provider abstraction.

**Architecture:** Create a minimal Python package under `src/core/` because the repository currently has no implementation files. Pydantic models define all MVP workflow data contracts, SQLite stores workflow sessions and snapshots, and provider abstractions isolate future real LLM integrations behind a deterministic testable interface.

**Tech Stack:** Python 3.12, Pydantic v2, SQLite standard library, pytest, Ruff.

---

## Save Location

Save this plan as:

`docs/superpowers/plans/2026-04-30-plan-a-data-models-infrastructure.md`

## Dependencies

None. This is the first implementation plan.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `chore: add python project foundation` | `pyproject.toml`, package init files, package smoke test |
| 2 | `feat: add shared pydantic schemas` | `src/core/models/`, model tests |
| 3 | `feat: add sqlite workflow store` | `src/core/db/`, SQLite tests |
| 4 | `feat: add llm provider contract` | `src/core/providers/`, provider tests |
| 5 | `test: verify plan a foundation` | Only if final verification requires formatting or import fixes |

## File Map

| Path | Responsibility |
|---|---|
| `pyproject.toml` | Python project metadata, dependencies, pytest config, Ruff config |
| `src/core/__init__.py` | Root backend package marker |
| `src/core/__main__.py` | Minimal health command |
| `src/core/models/__init__.py` | Exports schema types |
| `src/core/models/schemas.py` | Pydantic v2 MVP data contracts |
| `src/core/db/__init__.py` | Exports SQLite store |
| `src/core/db/sqlite_store.py` | SQLite schema and persistence methods |
| `src/core/providers/__init__.py` | Exports provider abstractions |
| `src/core/providers/llm.py` | LLM request/response types, provider protocol, fake provider, presets |
| `tests/unit/test_package.py` | Package smoke tests |
| `tests/unit/test_models.py` | Pydantic schema tests |
| `tests/unit/test_db.py` | SQLite persistence tests |
| `tests/unit/test_providers.py` | Provider contract tests |

---

## Task 1: Python Project Foundation

**Files:**

- Create: `pyproject.toml`
- Create: `src/core/__init__.py`
- Create: `src/core/__main__.py`
- Create: `tests/unit/test_package.py`

- [ ] **Step 1: Write the failing package smoke test**

Create `tests/unit/test_package.py`:

```python
import subprocess
import sys

from core import __version__


def test_package_exports_version() -> None:
    assert __version__ == "0.1.0"


def test_package_health_command() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "core"],
        check=True,
        capture_output=True,
        text=True,
    )

    assert result.stdout.strip() == "grounded-resume backend 0.1.0"
```

- [ ] **Step 2: Run the package test and verify it fails**

Run:

```bash
pytest tests/unit/test_package.py -v
```

Expected output contains:

```text
ModuleNotFoundError: No module named 'core'
```

- [ ] **Step 3: Add project configuration**

Create `pyproject.toml`:

```toml
[project]
name = "grounded-resume"
version = "0.1.0"
description = "Grounded, evidence-traceable resume generation for Chinese internship candidates."
requires-python = ">=3.12"
dependencies = [
  "pydantic>=2.7,<3.0",
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2,<9.0",
  "ruff>=0.5,<1.0",
]

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]
addopts = "-q"

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["B", "E", "F", "I", "UP"]
ignore = []
```

- [ ] **Step 4: Add package files**

Create `src/core/__init__.py`:

```python
__version__ = "0.1.0"
```

Create `src/core/__main__.py`:

```python
from core import __version__


def main() -> None:
    print(f"grounded-resume backend {__version__}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Run the package test and verify it passes**

Run:

```bash
pytest tests/unit/test_package.py -v
```

Expected:

```text
2 passed
```

- [ ] **Step 6: Commit**

Run:

```bash
git add pyproject.toml src/core/__init__.py src/core/__main__.py tests/unit/test_package.py
git commit -m "chore: add python project foundation"
```

---

## Task 2: Shared Pydantic Schemas

**Files:**

- Create: `src/core/models/__init__.py`
- Create: `src/core/models/schemas.py`
- Create: `tests/unit/test_models.py`

- [ ] **Step 1: Write failing schema tests**

Create `tests/unit/test_models.py`:

```python
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from core.models import (
    CapabilityRequirement,
    EvidenceMapping,
    EvidenceRef,
    MaterialFact,
    OutputMetadata,
    RawMaterial,
    ResumeBullet,
    ResumeDraft,
    ResumeOutput,
    ResumeSection,
    RewriteStep,
    TargetJob,
    UserInput,
    UserProfile,
)


def test_user_input_accepts_minimum_valid_payload() -> None:
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        targetJob=TargetJob(
            companyName="Example AI",
            jobTitle="AI 产品实习生",
            jobDescription="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
            "需要理解 AIGC 产品并具备基础数据分析意识。",
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG 课程项目",
                content="我做过一个 RAG 问答助手课程项目，负责整理知识库和测试 prompt 效果。",
            )
        ],
    )

    assert user_input.preferences.tone == "balanced"
    assert user_input.preferences.allowDowngrade is True
    assert user_input.preferences.showGapAnalysis is True


def test_target_job_rejects_short_jd() -> None:
    with pytest.raises(ValidationError, match="jobDescription must contain at least 50 characters"):
        TargetJob(companyName="A", jobTitle="B", jobDescription="太短")


def test_raw_material_rejects_empty_content() -> None:
    with pytest.raises(ValidationError):
        RawMaterial(id="M001", type="project", title="项目", content="")


def test_evidence_mapping_requires_fact_reference() -> None:
    with pytest.raises(ValidationError):
        EvidenceMapping(
            id="EM001",
            jdRequirementId="C001",
            materialFactIds=[],
            mappingType="direct",
            strength="strong",
            reasoning="素材明确提到 Python。",
            directQuote="我会 Python。",
        )


def test_resume_bullet_requires_evidence_reference() -> None:
    with pytest.raises(ValidationError):
        ResumeBullet(
            id="B001",
            text="参与整理 AI 产品知识库。",
            evidenceRefs=[],
            expressionLevel="conservative",
            rewriteChain=[],
            riskLevel="safe",
        )


def test_rewrite_step_accepts_from_alias() -> None:
    step = RewriteStep.model_validate(
        {
            "step": 1,
            "from": "我整理过知识库。",
            "to": "参与整理课程项目知识库。",
            "reason": "保守表达用户原始动作。",
            "operator": "system",
        }
    )

    assert step.from_ == "我整理过知识库。"


def test_capability_requirement_accepts_priority() -> None:
    requirement = CapabilityRequirement(
        id="C001",
        capability="产品判断",
        description="能够分析 AI 产品能力边界。",
        evidenceType="product_judgment",
        priority="critical",
        sourceText="对 AI 产品的能力边界有思考。",
        relatedKeywords=["AI 产品", "能力边界"],
    )

    assert requirement.priority == "critical"


def test_material_fact_preserves_source_chain() -> None:
    fact = MaterialFact(
        id="F001",
        sourceMaterialId="M001",
        factType="action",
        statement="用户整理过知识库内容。",
        confidence="explicit",
        skillTags=["RAG"],
        topicTags=["知识库"],
        outcomeTags=["整理"],
    )

    assert fact.sourceMaterialId == "M001"


def test_resume_output_roundtrips_to_json() -> None:
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
                        evidenceRefs=[
                            EvidenceRef(
                                mappingId="EM001",
                                factIds=["F001"],
                                sourceFragments=["SF001"],
                            )
                        ],
                        expressionLevel="conservative",
                        rewriteChain=[
                            RewriteStep(
                                step=1,
                                from_="我整理过知识库。",
                                to="参与整理课程项目知识库。",
                                reason="保守表达用户原始动作。",
                                operator="system",
                            )
                        ],
                        riskLevel="safe",
                    )
                ],
            )
        ],
    )
    target_job = TargetJob(
        companyName="Example AI",
        jobTitle="AI 产品实习生",
        jobDescription="负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
        "需要理解 AIGC 产品并具备基础数据分析意识。",
    )
    output = ResumeOutput(
        resume=draft,
        metadata=OutputMetadata(
            targetJob=target_job,
            generationTimestamp=datetime(2026, 4, 30, tzinfo=UTC),
            version="0.1.0",
            confidence=0.8,
            materialCoverage=0.6,
            gapCount=2,
        ),
        attachments=[],
    )

    restored = ResumeOutput.model_validate_json(output.model_dump_json())

    assert restored.resume.sections[0].bullets[0].evidenceRefs[0].factIds == ["F001"]
```

- [ ] **Step 2: Run schema tests and verify they fail**

Run:

```bash
pytest tests/unit/test_models.py -v
```

Expected output contains:

```text
ModuleNotFoundError: No module named 'core.models'
```

- [ ] **Step 3: Add model exports**

Create `src/core/models/__init__.py`:

```python
from core.models.schemas import (
    CapabilityRequirement,
    CheckResult,
    ConfirmationItem,
    ConfirmationSession,
    EvidenceMapping,
    EvidenceMappingResult,
    EvidencePreview,
    EvidenceRef,
    Finding,
    GapAcknowledgment,
    GapItem,
    GenerationLog,
    HardRequirement,
    JDExcerpt,
    JDParsedResult,
    JobContext,
    MaterialFact,
    MaterialParseResult,
    OutputAttachment,
    OutputMetadata,
    OverclaimItem,
    ParserNote,
    RawMaterial,
    ResumeBullet,
    ResumeDraft,
    ResumeOutput,
    ResumeSection,
    RevisionItem,
    RewriteStep,
    RiskFlag,
    SourceFragment,
    TargetJob,
    UserDecision,
    UserInput,
    UserOverride,
    UserPreferences,
    UserProfile,
    ValidationResult,
    ValidationScore,
)

__all__ = [
    "CapabilityRequirement",
    "CheckResult",
    "ConfirmationItem",
    "ConfirmationSession",
    "EvidenceMapping",
    "EvidenceMappingResult",
    "EvidencePreview",
    "EvidenceRef",
    "Finding",
    "GapAcknowledgment",
    "GapItem",
    "GenerationLog",
    "HardRequirement",
    "JDExcerpt",
    "JDParsedResult",
    "JobContext",
    "MaterialFact",
    "MaterialParseResult",
    "OutputAttachment",
    "OutputMetadata",
    "OverclaimItem",
    "ParserNote",
    "RawMaterial",
    "ResumeBullet",
    "ResumeDraft",
    "ResumeOutput",
    "ResumeSection",
    "RevisionItem",
    "RewriteStep",
    "RiskFlag",
    "SourceFragment",
    "TargetJob",
    "UserDecision",
    "UserInput",
    "UserOverride",
    "UserPreferences",
    "UserProfile",
    "ValidationResult",
    "ValidationScore",
]
```

- [ ] **Step 4: Add Pydantic schemas**

Create `src/core/models/schemas.py`:

```python
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

MaterialType = Literal["education", "project", "competition", "campus", "skill", "work", "other"]
Tone = Literal["conservative", "balanced", "confident"]
HardType = Literal["education", "major", "location", "availability", "language", "tool", "visa", "other"]
EvidenceType = Literal[
    "project_outcome",
    "technical_depth",
    "product_judgment",
    "research_analysis",
    "collaboration",
    "learning_agility",
    "communication",
]
Priority = Literal["critical", "important", "nice_to_have"]
JobLevel = Literal["intern", "junior", "mid", "senior"]
JDSection = Literal["description", "requirements", "preferred", "other"]
FactType = Literal["action", "outcome", "skill_possessed", "skill_used", "knowledge", "trait"]
FactConfidence = Literal["explicit", "inferred_weak", "inferred_strong"]
RoleLevel = Literal["solo", "lead", "core", "participant", "observer"]
MappingType = Literal["direct", "semantic", "inferential", "composite"]
EvidenceStrength = Literal["strong", "moderate", "weak", "insufficient"]
GapType = Literal["missing_evidence", "insufficient_depth", "unclear_scope", "temporal_mismatch"]
GapSeverity = Literal["critical", "major", "minor"]
SectionType = Literal["basic_info", "education", "experience", "skills", "summary", "additional"]
ExpressionLevel = Literal["literal", "conservative", "standard", "emphasized"]
RiskLevel = Literal["safe", "caution", "warning", "redline"]
RewriteOperator = Literal["system", "guardrail", "user"]
RiskType = Literal[
    "fabrication",
    "exaggeration",
    "role_inflation",
    "outcome_inference",
    "scope_ambiguity",
    "temporal_fabrication",
    "keyword_injection",
]
FindingSeverity = Literal["info", "warning", "error"]
RevisionPriority = Literal["mandatory", "suggested"]
Recommendation = Literal["approve", "revise", "reject"]
UserDecisionValue = Literal["approve", "revise", "reject"]
GapUserAction = Literal["accept", "will_supplement", "acknowledge"]
AttachmentType = Literal["evidence_map", "gap_report", "risk_summary", "modification_guide"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class UserProfile(StrictModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str | None = None
    github: str | None = None
    blog: str | None = None
    location: str | None = None


class TargetJob(StrictModel):
    companyName: str = Field(min_length=1)
    jobTitle: str = Field(min_length=1)
    jobDescription: str
    sourceUrl: HttpUrl | None = None

    @field_validator("jobDescription")
    @classmethod
    def validate_job_description_length(cls, value: str) -> str:
        if len(value.strip()) < 50:
            raise ValueError("jobDescription must contain at least 50 characters")
        return value


class RawMaterial(StrictModel):
    id: str = Field(min_length=1)
    type: MaterialType
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    timestamp: str | None = None
    sourceHint: str | None = None


class UserPreferences(StrictModel):
    tone: Tone = "balanced"
    allowDowngrade: bool = True
    showGapAnalysis: bool = True
    maxBullets: int = Field(default=10, ge=1, le=20)


class UserInput(StrictModel):
    profile: UserProfile
    targetJob: TargetJob
    materials: list[RawMaterial] = Field(min_length=1)
    preferences: UserPreferences = Field(default_factory=UserPreferences)


class HardRequirement(StrictModel):
    id: str
    category: HardType
    description: str
    sourceText: str
    isSatisfiableByEvidence: bool


class CapabilityRequirement(StrictModel):
    id: str
    capability: str
    description: str
    evidenceType: EvidenceType
    priority: Priority
    sourceText: str
    relatedKeywords: list[str] = Field(default_factory=list)


class JobContext(StrictModel):
    jobLevel: JobLevel
    teamFocus: list[str] = Field(default_factory=list)
    productStage: str | None = None
    techStackMentioned: list[str] = Field(default_factory=list)
    cultureSignals: list[str] = Field(default_factory=list)


class JDExcerpt(StrictModel):
    id: str
    text: str
    section: JDSection
    lineNumber: int | None = Field(default=None, ge=1)


class JDParsedResult(StrictModel):
    jobId: str
    hardRequirements: list[HardRequirement] = Field(default_factory=list)
    coreCapabilities: list[CapabilityRequirement] = Field(default_factory=list)
    niceToHave: list[CapabilityRequirement] = Field(default_factory=list)
    derivedContext: JobContext
    parserConfidence: float = Field(ge=0, le=1)
    rawExcerpts: list[JDExcerpt] = Field(default_factory=list)


class MaterialFact(StrictModel):
    id: str
    sourceMaterialId: str
    factType: FactType
    statement: str
    confidence: FactConfidence
    temporalScope: str | None = None
    roleIndicator: RoleLevel | None = None
    skillTags: list[str] = Field(default_factory=list)
    topicTags: list[str] = Field(default_factory=list)
    outcomeTags: list[str] = Field(default_factory=list)


class SourceFragment(StrictModel):
    id: str
    materialId: str
    text: str
    startOffset: int = Field(ge=0)
    endOffset: int = Field(ge=0)


class ParserNote(StrictModel):
    level: Literal["info", "warning", "critical"]
    materialId: str
    message: str


class MaterialParseResult(StrictModel):
    facts: list[MaterialFact] = Field(default_factory=list)
    fragments: list[SourceFragment] = Field(default_factory=list)
    parserNotes: list[ParserNote] = Field(default_factory=list)


class EvidenceMapping(StrictModel):
    id: str
    jdRequirementId: str
    materialFactIds: list[str] = Field(min_length=1)
    mappingType: MappingType
    strength: EvidenceStrength
    reasoning: str
    directQuote: str


class GapItem(StrictModel):
    id: str
    jdRequirementId: str
    gapType: GapType
    description: str
    severity: GapSeverity
    recommendation: str | None = None


class OverclaimItem(StrictModel):
    id: str
    materialFactId: str
    reason: str
    suggestion: str | None = None


class EvidenceMappingResult(StrictModel):
    mappings: list[EvidenceMapping] = Field(default_factory=list)
    gaps: list[GapItem] = Field(default_factory=list)
    overclaims: list[OverclaimItem] = Field(default_factory=list)
    mappingConfidence: float = Field(ge=0, le=1)


class EvidenceRef(StrictModel):
    mappingId: str
    factIds: list[str] = Field(min_length=1)
    sourceFragments: list[str] = Field(default_factory=list)


class RewriteStep(StrictModel):
    step: int = Field(ge=1)
    from_: str = Field(alias="from")
    to: str
    reason: str
    operator: RewriteOperator


class UserOverride(StrictModel):
    approved: bool
    modifiedText: str | None = None
    rejectionReason: str | None = None


class ResumeBullet(StrictModel):
    id: str
    text: str
    evidenceRefs: list[EvidenceRef] = Field(min_length=1)
    expressionLevel: ExpressionLevel
    rewriteChain: list[RewriteStep] = Field(default_factory=list)
    riskLevel: RiskLevel
    userOverride: UserOverride | None = None


class ResumeSection(StrictModel):
    id: str
    sectionType: SectionType
    title: str
    bullets: list[ResumeBullet] = Field(default_factory=list)
    order: int


class GenerationLog(StrictModel):
    step: str
    decision: str
    rationale: str


class RiskFlag(StrictModel):
    bulletId: str
    riskType: RiskType
    severity: Literal["low", "medium", "high"]
    description: str
    suggestedFix: str
    autoResolved: bool


class ResumeDraft(StrictModel):
    version: int = Field(ge=1)
    sections: list[ResumeSection] = Field(default_factory=list)
    generationLog: list[GenerationLog] = Field(default_factory=list)
    riskFlags: list[RiskFlag] = Field(default_factory=list)


class Finding(StrictModel):
    bulletId: str
    issue: str
    severity: FindingSeverity
    evidence: str | None = None


class CheckResult(StrictModel):
    checkId: str
    checkName: str
    passed: bool
    score: int = Field(ge=0, le=100)
    findings: list[Finding] = Field(default_factory=list)


class ValidationScore(StrictModel):
    authenticity: int = Field(ge=0, le=100)
    jdAlignment: int = Field(ge=0, le=100)
    expressionQuality: int = Field(ge=0, le=100)
    structuralCompleteness: int = Field(ge=0, le=100)
    modificationCostEstimate: int = Field(ge=0, le=100)


class RevisionItem(StrictModel):
    id: str
    bulletId: str
    originalText: str
    suggestedText: str
    reason: str
    priority: RevisionPriority
    resolved: bool


class ValidationResult(StrictModel):
    passed: bool
    checks: list[CheckResult] = Field(default_factory=list)
    overallScore: ValidationScore
    mandatoryRevisions: list[RevisionItem] = Field(default_factory=list)
    suggestedRevisions: list[RevisionItem] = Field(default_factory=list)


class EvidencePreview(StrictModel):
    sourceMaterialTitle: str
    directQuotes: list[str] = Field(default_factory=list)
    mappingReasoning: str


class ConfirmationItem(StrictModel):
    id: str
    bulletId: str
    proposedText: str
    evidencePreview: EvidencePreview
    riskNotes: list[str] = Field(default_factory=list)
    systemRecommendation: Recommendation


class UserDecision(StrictModel):
    confirmationItemId: str
    decision: UserDecisionValue
    revisedText: str | None = None
    userComment: str | None = None
    timestamp: datetime


class GapAcknowledgment(StrictModel):
    gapId: str
    userAction: GapUserAction
    userComment: str | None = None


class ConfirmationSession(StrictModel):
    sessionId: str
    resumeVersion: int
    items: list[ConfirmationItem] = Field(default_factory=list)
    userDecisions: list[UserDecision] = Field(default_factory=list)
    finalResume: ResumeDraft
    gapAcknowledgments: list[GapAcknowledgment] = Field(default_factory=list)


class OutputMetadata(StrictModel):
    targetJob: TargetJob
    generationTimestamp: datetime
    version: str
    confidence: float = Field(ge=0, le=1)
    materialCoverage: float = Field(ge=0, le=1)
    gapCount: int = Field(ge=0)


class OutputAttachment(StrictModel):
    type: AttachmentType
    title: str
    content: str


class ResumeOutput(StrictModel):
    resume: ResumeDraft
    metadata: OutputMetadata
    attachments: list[OutputAttachment] = Field(default_factory=list)
```

- [ ] **Step 5: Run schema tests and verify they pass**

Run:

```bash
pytest tests/unit/test_models.py -v
```

Expected:

```text
9 passed
```

- [ ] **Step 6: Commit**

Run:

```bash
git add src/core/models/__init__.py src/core/models/schemas.py tests/unit/test_models.py
git commit -m "feat: add shared pydantic schemas"
```

---

## Task 3: SQLite Workflow Store

**Files:**

- Create: `src/core/db/__init__.py`
- Create: `src/core/db/sqlite_store.py`
- Create: `tests/unit/test_db.py`

- [ ] **Step 1: Write failing SQLite tests**

Create `tests/unit/test_db.py`:

```python
from pathlib import Path

from core.db import SQLiteStore


def test_store_initializes_database_file(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)

    store.initialize()

    assert db_path.exists()


def test_store_creates_session_and_roundtrips_snapshot(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()

    store.create_session(session_id="S001")
    store.save_snapshot(session_id="S001", stage="user_input", payload={"name": "张三"})

    latest = store.get_latest_snapshot("S001")

    assert latest is not None
    assert latest["stage"] == "user_input"
    assert latest["payload"] == {"name": "张三"}


def test_store_persists_provider_config_metadata(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()

    store.save_provider_config(
        provider_id="kimi",
        display_name="Kimi",
        base_url="https://api.moonshot.cn/v1",
        encrypted_secret='{"version":1,"ciphertext":"fixture"}',
    )

    config = store.get_provider_config("kimi")

    assert config is not None
    assert config["provider_id"] == "kimi"
    assert config["encrypted_secret"] == '{"version":1,"ciphertext":"fixture"}'


def test_store_records_audit_event(tmp_path: Path) -> None:
    db_path = tmp_path / "grounded-resume.db"
    store = SQLiteStore(db_path)
    store.initialize()
    store.create_session(session_id="S001")

    store.record_audit_event(session_id="S001", event_type="schema_validation", payload={"passed": True})

    events = store.list_audit_events("S001")

    assert len(events) == 1
    assert events[0]["event_type"] == "schema_validation"
    assert events[0]["payload"] == {"passed": True}
```

- [ ] **Step 2: Run SQLite tests and verify they fail**

Run:

```bash
pytest tests/unit/test_db.py -v
```

Expected output contains:

```text
ModuleNotFoundError: No module named 'core.db'
```

- [ ] **Step 3: Add DB exports**

Create `src/core/db/__init__.py`:

```python
from core.db.sqlite_store import SQLiteStore

__all__ = ["SQLiteStore"]
```

- [ ] **Step 4: Add SQLite store implementation**

Create `src/core/db/sqlite_store.py`:

```python
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any


class SQLiteStore:
    def __init__(self, db_path: Path | str) -> None:
        self.db_path = Path(db_path)

    def initialize(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS workflow_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );

                CREATE TABLE IF NOT EXISTS provider_configs (
                    provider_id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    base_url TEXT NOT NULL,
                    encrypted_secret TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                );
                """
            )

    def create_session(self, session_id: str) -> None:
        with self._connect() as connection:
            connection.execute(
                "INSERT OR IGNORE INTO sessions (session_id) VALUES (?)",
                (session_id,),
            )

    def save_snapshot(self, session_id: str, stage: str, payload: dict[str, Any]) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO workflow_snapshots (session_id, stage, payload_json)
                VALUES (?, ?, ?)
                """,
                (session_id, stage, json.dumps(payload, ensure_ascii=False, sort_keys=True)),
            )

    def get_latest_snapshot(self, session_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT stage, payload_json, created_at
                FROM workflow_snapshots
                WHERE session_id = ?
                ORDER BY id DESC
                LIMIT 1
                """,
                (session_id,),
            ).fetchone()

        if row is None:
            return None

        return {
            "stage": row["stage"],
            "payload": json.loads(row["payload_json"]),
            "created_at": row["created_at"],
        }

    def save_provider_config(
        self,
        provider_id: str,
        display_name: str,
        base_url: str,
        encrypted_secret: str,
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO provider_configs (provider_id, display_name, base_url, encrypted_secret)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(provider_id) DO UPDATE SET
                    display_name = excluded.display_name,
                    base_url = excluded.base_url,
                    encrypted_secret = excluded.encrypted_secret,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (provider_id, display_name, base_url, encrypted_secret),
            )

    def get_provider_config(self, provider_id: str) -> dict[str, str] | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT provider_id, display_name, base_url, encrypted_secret, updated_at
                FROM provider_configs
                WHERE provider_id = ?
                """,
                (provider_id,),
            ).fetchone()

        if row is None:
            return None

        return dict(row)

    def record_audit_event(
        self,
        session_id: str,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO audit_events (session_id, event_type, payload_json)
                VALUES (?, ?, ?)
                """,
                (session_id, event_type, json.dumps(payload, ensure_ascii=False, sort_keys=True)),
            )

    def list_audit_events(self, session_id: str) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT event_type, payload_json, created_at
                FROM audit_events
                WHERE session_id = ?
                ORDER BY id ASC
                """,
                (session_id,),
            ).fetchall()

        return [
            {
                "event_type": row["event_type"],
                "payload": json.loads(row["payload_json"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ]

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection
```

- [ ] **Step 5: Run SQLite tests and verify they pass**

Run:

```bash
pytest tests/unit/test_db.py -v
```

Expected:

```text
4 passed
```

- [ ] **Step 6: Commit**

Run:

```bash
git add src/core/db/__init__.py src/core/db/sqlite_store.py tests/unit/test_db.py
git commit -m "feat: add sqlite workflow store"
```

---

## Task 4: LLM Provider Contract

**Files:**

- Create: `src/core/providers/__init__.py`
- Create: `src/core/providers/llm.py`
- Create: `tests/unit/test_providers.py`

- [ ] **Step 1: Write failing provider tests**

Create `tests/unit/test_providers.py`:

```python
import pytest

from core.providers import (
    FakeLLMProvider,
    LLMRequest,
    ProviderRegistry,
    get_default_presets,
)


def test_default_presets_include_phase_one_providers() -> None:
    presets = get_default_presets()
    provider_ids = {preset.provider_id for preset in presets}

    assert "kimi" in provider_ids
    assert "openai" in provider_ids


def test_default_presets_include_beta_providers() -> None:
    presets = get_default_presets()
    provider_ids = {preset.provider_id for preset in presets}

    assert {"glm", "deepseek", "claude", "qwen", "gemini", "third_party"}.issubset(provider_ids)


def test_registry_returns_registered_provider() -> None:
    registry = ProviderRegistry()
    provider = FakeLLMProvider(response_text='{"ok": true}')
    registry.register(provider)

    assert registry.get("fake") is provider


def test_registry_rejects_unknown_provider() -> None:
    registry = ProviderRegistry()

    with pytest.raises(KeyError, match="Unknown LLM provider: missing"):
        registry.get("missing")


def test_fake_provider_returns_deterministic_response() -> None:
    provider = FakeLLMProvider(response_text='{"capability":"产品判断"}')

    response = provider.complete(
        LLMRequest(
            model="fake-model",
            system_prompt="Return JSON.",
            user_prompt="Parse this JD.",
            temperature=0,
        )
    )

    assert response.text == '{"capability":"产品判断"}'
    assert response.provider_id == "fake"
    assert response.model == "fake-model"
    assert response.input_tokens == len("Return JSON.") + len("Parse this JD.")
    assert response.output_tokens == len('{"capability":"产品判断"}')
```

- [ ] **Step 2: Run provider tests and verify they fail**

Run:

```bash
pytest tests/unit/test_providers.py -v
```

Expected output contains:

```text
ModuleNotFoundError: No module named 'core.providers'
```

- [ ] **Step 3: Add provider exports**

Create `src/core/providers/__init__.py`:

```python
from core.providers.llm import (
    FakeLLMProvider,
    LLMProvider,
    LLMRequest,
    LLMResponse,
    ProviderPreset,
    ProviderRegistry,
    get_default_presets,
)

__all__ = [
    "FakeLLMProvider",
    "LLMProvider",
    "LLMRequest",
    "LLMResponse",
    "ProviderPreset",
    "ProviderRegistry",
    "get_default_presets",
]
```

- [ ] **Step 4: Add provider implementation**

Create `src/core/providers/llm.py`:

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProviderPreset:
    provider_id: str
    display_name: str
    base_url: str
    default_models: tuple[str, ...]
    auth_modes: tuple[str, ...]


@dataclass(frozen=True)
class LLMRequest:
    model: str
    system_prompt: str
    user_prompt: str
    temperature: float = 0


@dataclass(frozen=True)
class LLMResponse:
    provider_id: str
    model: str
    text: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class LLMProvider(Protocol):
    provider_id: str

    def complete(self, request: LLMRequest) -> LLMResponse:
        raise NotImplementedError


class FakeLLMProvider:
    provider_id = "fake"

    def __init__(self, response_text: str) -> None:
        self.response_text = response_text

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider_id=self.provider_id,
            model=request.model,
            text=self.response_text,
            input_tokens=len(request.system_prompt) + len(request.user_prompt),
            output_tokens=len(self.response_text),
        )


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, LLMProvider] = {}

    def register(self, provider: LLMProvider) -> None:
        self._providers[provider.provider_id] = provider

    def get(self, provider_id: str) -> LLMProvider:
        try:
            return self._providers[provider_id]
        except KeyError as exc:
            raise KeyError(f"Unknown LLM provider: {provider_id}") from exc


def get_default_presets() -> tuple[ProviderPreset, ...]:
    return (
        ProviderPreset(
            provider_id="openai",
            display_name="OpenAI",
            base_url="https://api.openai.com/v1",
            default_models=("gpt-5.5", "gpt-5.5-pro", "gpt-5.4-mini"),
            auth_modes=("api_key", "device_code"),
        ),
        ProviderPreset(
            provider_id="kimi",
            display_name="Kimi",
            base_url="https://api.moonshot.cn/v1",
            default_models=("kimi-k2.6", "kimi-k2.5"),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="glm",
            display_name="GLM",
            base_url="https://open.bigmodel.cn/api/paas/v4",
            default_models=("glm-5.1",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="deepseek",
            display_name="DeepSeek",
            base_url="https://api.deepseek.com/v1",
            default_models=("deepseek-v4-pro",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="claude",
            display_name="Claude",
            base_url="https://api.anthropic.com/v1",
            default_models=("claude-opus-4-7",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="qwen",
            display_name="Qwen",
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            default_models=("qwen3.5-flash-2026-02-23",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="gemini",
            display_name="Gemini",
            base_url="https://generativelanguage.googleapis.com/v1beta",
            default_models=("gemini-3.1-flash-live-preview",),
            auth_modes=("api_key",),
        ),
        ProviderPreset(
            provider_id="third_party",
            display_name="Third-party OpenAI-compatible endpoint",
            base_url="https://example.invalid/v1",
            default_models=("custom",),
            auth_modes=("api_key",),
        ),
    )
```

- [ ] **Step 5: Run provider tests and verify they pass**

Run:

```bash
pytest tests/unit/test_providers.py -v
```

Expected:

```text
5 passed
```

- [ ] **Step 6: Commit**

Run:

```bash
git add src/core/providers/__init__.py src/core/providers/llm.py tests/unit/test_providers.py
git commit -m "feat: add llm provider contract"
```

---

## Task 5: Full Plan A Verification

**Files:**

- Verify: `pyproject.toml`
- Verify: `src/core/`
- Verify: `tests/unit/`

- [ ] **Step 1: Run all unit tests**

Run:

```bash
pytest -q
```

Expected:

```text
20 passed
```

- [ ] **Step 2: Run Ruff lint**

Run:

```bash
ruff check .
```

Expected:

```text
All checks passed!
```

- [ ] **Step 3: Run package health command**

Run:

```bash
python -m core
```

Expected:

```text
grounded-resume backend 0.1.0
```

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git diff --stat HEAD
```

Expected output includes only Plan A files if all previous commits were made:

```text
```

Expected output includes Plan A files if commits were not made during execution:

```text
pyproject.toml
src/core/__init__.py
src/core/__main__.py
src/core/models/__init__.py
src/core/models/schemas.py
src/core/db/__init__.py
src/core/db/sqlite_store.py
src/core/providers/__init__.py
src/core/providers/llm.py
tests/unit/test_package.py
tests/unit/test_models.py
tests/unit/test_db.py
tests/unit/test_providers.py
```

- [ ] **Step 5: Commit verification fixes only if Step 1 or Step 2 required edits**

Run this only if edits were required during final verification:

```bash
git add pyproject.toml src/core tests/unit
git commit -m "test: verify plan a foundation"
```

## Self-Review

Spec coverage:

- `UserInput`, `UserProfile`, `TargetJob`, `RawMaterial`, and `UserPreferences` cover the user input layer.
- `JDParsedResult`, `HardRequirement`, `CapabilityRequirement`, `JobContext`, and `JDExcerpt` cover the JD parsing layer.
- `MaterialParseResult`, `MaterialFact`, `SourceFragment`, and `ParserNote` cover the material parsing layer.
- `EvidenceMappingResult`, `EvidenceMapping`, `GapItem`, and `OverclaimItem` cover the evidence mapping layer.
- `ResumeDraft`, `ResumeSection`, `ResumeBullet`, `EvidenceRef`, `RewriteStep`, `GenerationLog`, and `RiskFlag` cover the resume generation layer.
- `ValidationResult`, `CheckResult`, `Finding`, `ValidationScore`, and `RevisionItem` cover the validation layer.
- `ConfirmationSession`, `ConfirmationItem`, `EvidencePreview`, `UserDecision`, and `GapAcknowledgment` cover the user confirmation layer.
- `ResumeOutput`, `OutputMetadata`, and `OutputAttachment` cover the final output layer.
- `SQLiteStore` covers Plan A persistence for sessions, workflow snapshots, provider config metadata, and audit events.
- `LLMProvider`, `ProviderRegistry`, `FakeLLMProvider`, and `ProviderPreset` cover the provider abstraction required by later plans.

No-placeholder scan:

- The implementation steps contain concrete file paths, complete code, test commands, and expected outputs.
- OAuth, production encryption, real provider HTTP calls, LangGraph nodes, FastAPI routes, and frontend code are intentionally excluded from Plan A and assigned to later plans.

Type consistency:

- Tests import from `core.models`, `core.db`, and `core.providers`, matching package exports.
- `RewriteStep.from_` maps the TypeScript field name `from` through a Pydantic alias.
- Provider IDs are consistent across presets and tests.
