# Plan B: Core Workflow Engine - Parsing And Mapping Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `JDParser`, `MaterialParser`, and `EvidenceMapper` as deterministic, independently testable backend modules using `FakeLLMProvider`.

**Architecture:** Build three parser modules under `src/core/parsing/` and `src/core/mapping/`. Each module consumes Plan A Pydantic models, applies rule-based logic (with optional fake LLM augmentation), and produces traceable structured outputs. All tests run against fake providers so the layer is fast and deterministic.

**Tech Stack:** Python 3.12, Pydantic v2, pytest. No real LLM calls in this plan.

---

## Dependencies

- Requires Plan A: `core.models` schemas and `core.providers` contract.
- Produces inputs for Plan C.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `feat: add parsing text utilities` | `src/core/utils/text.py`, text utility tests |
| 2 | `feat: add jd parser` | `src/core/parsing/jd_parser.py`, JD parser tests |
| 3 | `feat: add material parser` | `src/core/parsing/material_parser.py`, material parser tests |
| 4 | `feat: add evidence mapper` | `src/core/mapping/evidence_mapper.py`, mapper tests |
| 5 | `test: add parse map integration coverage` | Integration pipeline test |

## File Map

| Path | Responsibility |
|---|---|
| `src/core/utils/__init__.py` | Utils package marker |
| `src/core/utils/text.py` | Chinese text normalization, whitespace cleaning, snippet extraction |
| `src/core/parsing/__init__.py` | Parsing exports |
| `src/core/parsing/jd_parser.py` | `JDParser` implementation |
| `src/core/parsing/material_parser.py` | `MaterialParser` implementation |
| `src/core/mapping/__init__.py` | Mapping exports |
| `src/core/mapping/evidence_mapper.py` | `EvidenceMapper` implementation |
| `tests/unit/test_text_utils.py` | Text utility tests |
| `tests/unit/test_jd_parser.py` | JD parser unit tests |
| `tests/unit/test_material_parser.py` | Material parser unit tests |
| `tests/unit/test_evidence_mapper.py` | Evidence mapper unit tests |
| `tests/integration/test_parse_map_pipeline.py` | Parse-to-map integration test |
| `tests/fixtures/sample_jd.txt` | Sample JD fixture |
| `tests/fixtures/sample_materials.json` | Sample materials fixture |

---

## Scope

### Included

| Module | Description |
|---|---|
| `JDParser` | Segment Chinese JD text, extract hard requirements, capability requirements, nice-to-have items, and job context |
| `MaterialParser` | Convert raw user materials into `MaterialFact`, `SourceFragment`, and `ParserNote` |
| `EvidenceMapper` | Map JD capability requirements to material facts, classify mapping strength, produce gaps and overclaims |
| Fake LLM tests | Use deterministic fake provider outputs and rule-based fallbacks |
| Lightweight semantic matching | Keyword/tag overlap, normalized Chinese text matching, simple scoring rules |

### Excluded

| Excluded | Reason |
|---|---|
| Real LLM API calls | Deferred until provider implementation hardening |
| Real embeddings | Not required for Alpha validation |
| Complex NLP pipeline | Overkill for v0.1 Alpha |
| LangGraph orchestration | Covered by Plan E |
| Resume generation | Covered by Plan C |

---

## Key Tasks

### Task B1: Text Utilities

**Files:**
- Create: `src/core/utils/__init__.py`
- Create: `src/core/utils/text.py`
- Create: `tests/unit/test_text_utils.py`

**Steps:**

- [ ] **Step 1: Write failing text utility tests**

Create `tests/unit/test_text_utils.py`:

```python
from core.utils.text import clean_whitespace, is_chinese_dominant, extract_snippet


def test_clean_whitespace_normalizes_mixed_spaces() -> None:
    assert clean_whitespace("  负责  AI   产品  ") == "负责 AI 产品"


def test_is_chinese_dominant_detects_chinese_text() -> None:
    assert is_chinese_dominant("负责 AI 产品调研") is True
    assert is_chinese_dominant("Responsible for AI product research") is False


def test_extract_snippet_extracts_bounded_text() -> None:
    text = "我们希望你负责 AI 产品调研和竞品分析，具备数据敏感度。"
    snippet = extract_snippet(text, start=5, end=15)
    assert "AI 产品调研" in snippet
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_text_utils.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.utils'`

- [ ] **Step 3: Implement text utilities**

Create `src/core/utils/text.py`:

```python
from __future__ import annotations

import re


def clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def is_chinese_dominant(text: str, threshold: float = 0.5) -> bool:
    if not text:
        return False
    chinese_chars = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
    return chinese_chars / len(text) >= threshold


def extract_snippet(text: str, start: int, end: int, padding: int = 5) -> str:
    snippet_start = max(0, start - padding)
    snippet_end = min(len(text), end + padding)
    return text[snippet_start:snippet_end]
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_text_utils.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/utils/__init__.py src/core/utils/text.py tests/unit/test_text_utils.py
git commit -m "feat: add parsing text utilities"
```

---

### Task B2: JDParser

**Files:**
- Create: `src/core/parsing/__init__.py`
- Create: `src/core/parsing/jd_parser.py`
- Create: `tests/unit/test_jd_parser.py`
- Create: `tests/fixtures/sample_jd.txt`

**Steps:**

- [ ] **Step 1: Write failing JD parser tests**

Create `tests/unit/test_jd_parser.py`:

```python
import pytest

from core.models import JDParsedResult
from core.parsing.jd_parser import JDParser


def test_parser_rejects_non_chinese_jd() -> None:
    parser = JDParser()
    with pytest.raises(ValueError, match="Only Chinese JD is supported in MVP"):
        parser.parse("This is an English job description only.")


def test_parser_rejects_short_jd() -> None:
    parser = JDParser()
    with pytest.raises(ValueError, match="JD too short"):
        parser.parse("招实习生。")


def test_parser_extracts_hard_requirements() -> None:
    parser = JDParser()
    jd = (
        "【岗位】AI 产品实习生\n"
        "【要求】本科及以上在读，每周至少实习 4 天，实习期 3 个月以上。"
        "熟悉 Python 和 SQL，对 AIGC 产品有基础认知。"
        "具备数据分析意识，能从评估结果中洞察模型能力缺口。"
    )
    result = parser.parse(jd)

    assert isinstance(result, JDParsedResult)
    assert len(result.hardRequirements) >= 2
    education_reqs = [r for r in result.hardRequirements if r.category == "education"]
    assert len(education_reqs) >= 1


def test_parser_extracts_capabilities() -> None:
    parser = JDParser()
    jd = (
        "【岗位】AI 产品实习生\n"
        "【要求】本科及以上在读，每周至少实习 4 天。"
        "熟悉 Python 和 SQL，对 AIGC 产品有基础认知。"
        "具备数据分析意识，能从评估结果中洞察模型能力缺口。"
    )
    result = parser.parse(jd)

    assert len(result.coreCapabilities) >= 2
    capabilities = [c.capability for c in result.coreCapabilities]
    assert any("数据" in c or "分析" in c for c in capabilities)


def test_parser_preserves_source_text() -> None:
    parser = JDParser()
    jd = "【要求】本科及以上在读。"
    result = parser.parse(jd)

    assert len(result.hardRequirements) >= 1
    assert "本科" in result.hardRequirements[0].sourceText
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_jd_parser.py -v
```

Expected: `ModuleNotFoundError: No module named 'core.parsing'`

- [ ] **Step 3: Implement JDParser**

Create `src/core/parsing/__init__.py`:

```python
from core.parsing.jd_parser import JDParser
from core.parsing.material_parser import MaterialParser

__all__ = ["JDParser", "MaterialParser"]
```

Create `src/core/parsing/jd_parser.py`:

```python
from __future__ import annotations

import re

from core.models import (
    CapabilityRequirement,
    HardRequirement,
    JDExcerpt,
    JDParsedResult,
    JobContext,
)
from core.utils.text import clean_whitespace, is_chinese_dominant


class JDParser:
    def parse(self, job_description: str) -> JDParsedResult:
        cleaned = clean_whitespace(job_description)

        if not is_chinese_dominant(cleaned):
            raise ValueError("Only Chinese JD is supported in MVP")

        if len(cleaned.strip()) < 50:
            raise ValueError("JD too short")

        hard_requirements = self._extract_hard_requirements(cleaned)
        core_capabilities, nice_to_have = self._extract_capabilities(cleaned)
        context = self._infer_context(cleaned)
        excerpts = self._build_excerpts(cleaned)

        return JDParsedResult(
            jobId="jd-001",
            hardRequirements=hard_requirements,
            coreCapabilities=core_capabilities,
            niceToHave=nice_to_have,
            derivedContext=context,
            parserConfidence=0.75,
            rawExcerpts=excerpts,
        )

    def _extract_hard_requirements(self, text: str) -> list[HardRequirement]:
        requirements: list[HardRequirement] = []
        patterns = [
            ("education", r"(本科|硕士|博士|研究生).{0,5}(及以上|以上|在读|学历)"),
            ("availability", r"(每周|至少|不少于).{0,5}(\d+).{0,3}(天|工作日)"),
            ("tool", r"(熟悉|掌握|了解).{0,5}(Python|SQL|Figma|Excel)"),
        ]

        for category, pattern in patterns:
            for match in re.finditer(pattern, text):
                requirements.append(
                    HardRequirement(
                        id=f"H{len(requirements)+1:03d}",
                        category=category,  # type: ignore[arg-type]
                        description=match.group(0),
                        sourceText=match.group(0),
                        isSatisfiableByEvidence=category in {"tool", "language"},
                    )
                )

        return requirements

    def _extract_capabilities(self, text: str) -> tuple[list[CapabilityRequirement], list[CapabilityRequirement]]:
        core: list[CapabilityRequirement] = []
        nice: list[CapabilityRequirement] = []

        capability_patterns = [
            ("product_judgment", r"(产品判断|产品认知|产品思维|产品理解|AIGC.{0,3}产品)"),
            ("research_analysis", r"(数据分析|数据敏感度|数据品味|洞察|评估结果)"),
            ("communication", r"(沟通|协调|跨部门|表达)"),
        ]

        for evidence_type, pattern in capability_patterns:
            for match in re.finditer(pattern, text):
                req = CapabilityRequirement(
                    id=f"C{len(core)+len(nice)+1:03d}",
                    capability=match.group(0)[:10],
                    description=match.group(0),
                    evidenceType=evidence_type,  # type: ignore[arg-type]
                    priority="critical",
                    sourceText=match.group(0),
                    relatedKeywords=[match.group(0)],
                )
                core.append(req)

        return core, nice

    def _infer_context(self, text: str) -> JobContext:
        level = "intern" if "实习" in text else "junior"
        return JobContext(
            jobLevel=level,  # type: ignore[arg-type]
            teamFocus=[],
            techStackMentioned=[],
            cultureSignals=[],
        )

    def _build_excerpts(self, text: str) -> list[JDExcerpt]:
        lines = text.split("\n")
        excerpts: list[JDExcerpt] = []
        for idx, line in enumerate(lines, 1):
            if line.strip():
                excerpts.append(
                    JDExcerpt(
                        id=f"E{idx:03d}",
                        text=line.strip(),
                        section="requirements",
                        lineNumber=idx,
                    )
                )
        return excerpts
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_jd_parser.py -v
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/parsing/__init__.py src/core/parsing/jd_parser.py tests/unit/test_jd_parser.py tests/fixtures/sample_jd.txt
git commit -m "feat: add jd parser"
```

---

### Task B3: MaterialParser

**Files:**
- Create: `src/core/parsing/material_parser.py`
- Create: `tests/unit/test_material_parser.py`
- Create: `tests/fixtures/sample_materials.json`

**Steps:**

- [ ] **Step 1: Write failing material parser tests**

Create `tests/unit/test_material_parser.py`:

```python
import pytest

from core.models import MaterialFact, MaterialParseResult, RawMaterial
from core.parsing.material_parser import MaterialParser


def test_parser_classifies_education_material() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M001",
        type="education",
        title="教育背景",
        content="北京大学，计算机科学专业，预计 2027 年毕业。",
    )
    result = parser.parse([material])

    assert isinstance(result, MaterialParseResult)
    assert len(result.facts) >= 1
    assert any(f.factType == "skill_possessed" or "专业" in f.statement for f in result.facts)


def test_parser_extracts_project_facts() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M002",
        type="project",
        title="RAG 课程项目",
        content="我做过一个 RAG 问答助手课程项目，负责整理知识库和测试 prompt 效果。",
    )
    result = parser.parse([material])

    assert len(result.facts) >= 2
    action_facts = [f for f in result.facts if f.factType == "action"]
    assert len(action_facts) >= 1


def test_parser_generates_skill_tags() -> None:
    parser = MaterialParser()
    material = RawMaterial(
        id="M003",
        type="project",
        title="数据分析项目",
        content="用 Python 和 Pandas 分析用户行为数据，输出可视化报告。",
    )
    result = parser.parse([material])

    all_tags: set[str] = set()
    for fact in result.facts:
        all_tags.update(f.skillTags)

    assert "Python" in all_tags or "Pandas" in all_tags


def test_parser_detects_empty_materials() -> None:
    parser = MaterialParser()
    with pytest.raises(ValueError, match="No materials provided"):
        parser.parse([])
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_material_parser.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement MaterialParser**

Create `src/core/parsing/material_parser.py`:

```python
from __future__ import annotations

import re

from core.models import (
    MaterialFact,
    MaterialParseResult,
    ParserNote,
    RawMaterial,
    SourceFragment,
)
from core.utils.text import clean_whitespace


class MaterialParser:
    def parse(self, materials: list[RawMaterial]) -> MaterialParseResult:
        if not materials:
            raise ValueError("No materials provided")

        facts: list[MaterialFact] = []
        fragments: list[SourceFragment] = []
        notes: list[ParserNote] = []

        for material in materials:
            content = clean_whitespace(material.content)
            fragments.append(
                SourceFragment(
                    id=f"SF-{material.id}-001",
                    materialId=material.id,
                    text=content,
                    startOffset=0,
                    endOffset=len(content),
                )
            )

            material_facts, material_notes = self._extract_facts(material)
            facts.extend(material_facts)
            notes.extend(material_notes)

        return MaterialParseResult(
            facts=facts,
            fragments=fragments,
            parserNotes=notes,
        )

    def _extract_facts(
        self, material: RawMaterial
    ) -> tuple[list[MaterialFact], list[ParserNote]]:
        facts: list[MaterialFact] = []
        notes: list[ParserNote] = []
        content = material.content

        action_patterns = [
            r"(负责|参与|协助|完成|设计|开发|整理|测试|分析).{1,20}(项目|系统|知识库|数据|报告)",
            r"(用|使用|通过).{1,10}(Python|SQL|Figma|Pandas|Excel)",
        ]

        for pattern in action_patterns:
            for match in re.finditer(pattern, content):
                facts.append(
                    MaterialFact(
                        id=f"F-{material.id}-{len(facts)+1:03d}",
                        sourceMaterialId=material.id,
                        factType="action",
                        statement=match.group(0),
                        confidence="explicit",
                        skillTags=self._extract_skills(match.group(0)),
                        topicTags=[],
                        outcomeTags=[],
                    )
                )

        if not facts:
            notes.append(
                ParserNote(
                    level="warning",
                    materialId=material.id,
                    message="No explicit facts extracted; material may be too vague",
                )
            )

        return facts, notes

    def _extract_skills(self, text: str) -> list[str]:
        skill_keywords = ["Python", "SQL", "Figma", "Pandas", "Excel", "RAG", "Prompt"]
        found = [skill for skill in skill_keywords if skill in text]
        return found
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_material_parser.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/parsing/material_parser.py tests/unit/test_material_parser.py tests/fixtures/sample_materials.json
git commit -m "feat: add material parser"
```

---

### Task B4: EvidenceMapper

**Files:**
- Create: `src/core/mapping/__init__.py`
- Create: `src/core/mapping/evidence_mapper.py`
- Create: `tests/unit/test_evidence_mapper.py`

**Steps:**

- [ ] **Step 1: Write failing evidence mapper tests**

Create `tests/unit/test_evidence_mapper.py`:

```python
from core.mapping.evidence_mapper import EvidenceMapper
from core.models import (
    CapabilityRequirement,
    EvidenceMappingResult,
    JDParsedResult,
    JobContext,
    MaterialFact,
    MaterialParseResult,
)


def test_mapper_creates_direct_mapping() -> None:
    mapper = EvidenceMapper()
    jd_result = JDParsedResult(
        jobId="jd-001",
        hardRequirements=[],
        coreCapabilities=[
            CapabilityRequirement(
                id="C001",
                capability="Python 技能",
                description="熟悉 Python",
                evidenceType="technical_depth",
                priority="critical",
                sourceText="熟悉 Python",
                relatedKeywords=["Python"],
            )
        ],
        niceToHave=[],
        derivedContext=JobContext(jobLevel="intern"),
        parserConfidence=0.8,
    )
    material_result = MaterialParseResult(
        facts=[
            MaterialFact(
                id="F001",
                sourceMaterialId="M001",
                factType="action",
                statement="用 Python 分析数据",
                confidence="explicit",
                skillTags=["Python"],
            )
        ]
    )

    result = mapper.map(jd_result, material_result)

    assert isinstance(result, EvidenceMappingResult)
    assert len(result.mappings) >= 1
    assert result.mappings[0].mappingType == "direct"
    assert result.mappings[0].strength == "strong"


def test_mapper_identifies_gaps() -> None:
    mapper = EvidenceMapper()
    jd_result = JDParsedResult(
        jobId="jd-001",
        hardRequirements=[],
        coreCapabilities=[
            CapabilityRequirement(
                id="C001",
                capability="SQL 技能",
                description="熟悉 SQL",
                evidenceType="technical_depth",
                priority="critical",
                sourceText="熟悉 SQL",
                relatedKeywords=["SQL"],
            )
        ],
        niceToHave=[],
        derivedContext=JobContext(jobLevel="intern"),
        parserConfidence=0.8,
    )
    material_result = MaterialParseResult(facts=[])

    result = mapper.map(jd_result, material_result)

    assert len(result.gaps) >= 1
    assert result.gaps[0].gapType == "missing_evidence"


def test_mapper_tracks_coverage() -> None:
    mapper = EvidenceMapper()
    jd_result = JDParsedResult(
        jobId="jd-001",
        hardRequirements=[],
        coreCapabilities=[
            CapabilityRequirement(
                id="C001",
                capability="Python",
                description="熟悉 Python",
                evidenceType="technical_depth",
                priority="critical",
                sourceText="熟悉 Python",
                relatedKeywords=["Python"],
            ),
            CapabilityRequirement(
                id="C002",
                capability="SQL",
                description="熟悉 SQL",
                evidenceType="technical_depth",
                priority="critical",
                sourceText="熟悉 SQL",
                relatedKeywords=["SQL"],
            ),
        ],
        niceToHave=[],
        derivedContext=JobContext(jobLevel="intern"),
        parserConfidence=0.8,
    )
    material_result = MaterialParseResult(
        facts=[
            MaterialFact(
                id="F001",
                sourceMaterialId="M001",
                factType="action",
                statement="用 Python 分析",
                confidence="explicit",
                skillTags=["Python"],
            )
        ]
    )

    result = mapper.map(jd_result, material_result)

    assert result.mappingConfidence == 0.5
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_evidence_mapper.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement EvidenceMapper**

Create `src/core/mapping/__init__.py`:

```python
from core.mapping.evidence_mapper import EvidenceMapper

__all__ = ["EvidenceMapper"]
```

Create `src/core/mapping/evidence_mapper.py`:

```python
from __future__ import annotations

from core.models import (
    EvidenceMapping,
    EvidenceMappingResult,
    EvidenceStrength,
    GapItem,
    JDParsedResult,
    MappingType,
    MaterialParseResult,
    OverclaimItem,
)


class EvidenceMapper:
    def map(
        self,
        jd_result: JDParsedResult,
        material_result: MaterialParseResult,
    ) -> EvidenceMappingResult:
        mappings: list[EvidenceMapping] = []
        gaps: list[GapItem] = []
        overclaims: list[OverclaimItem] = []

        all_requirements = jd_result.coreCapabilities + jd_result.niceToHave
        used_fact_ids: set[str] = set()

        for req in all_requirements:
            matched_facts = self._find_matching_facts(req, material_result)

            if matched_facts:
                mapping_type, strength = self._classify_mapping(req, matched_facts)
                mappings.append(
                    EvidenceMapping(
                        id=f"EM-{req.id}",
                        jdRequirementId=req.id,
                        materialFactIds=[f.id for f in matched_facts],
                        mappingType=mapping_type,
                        strength=strength,
                        reasoning=f"Matched via keywords: {req.relatedKeywords}",
                        directQuote=matched_facts[0].statement,
                    )
                )
                for f in matched_facts:
                    used_fact_ids.add(f.id)
            else:
                gaps.append(
                    GapItem(
                        id=f"GAP-{req.id}",
                        jdRequirementId=req.id,
                        gapType="missing_evidence",
                        description=f"No evidence found for: {req.capability}",
                        severity="major" if req.priority == "critical" else "minor",
                        recommendation="Consider adding relevant project experience",
                    )
                )

        for fact in material_result.facts:
            if fact.id not in used_fact_ids:
                overclaims.append(
                    OverclaimItem(
                        id=f"OC-{fact.id}",
                        materialFactId=fact.id,
                        reason="Fact not mapped to any JD requirement",
                        suggestion="Consider adding to supplementary information",
                    )
                )

        coverage = len(mappings) / max(len(all_requirements), 1)

        return EvidenceMappingResult(
            mappings=mappings,
            gaps=gaps,
            overclaims=overclaims,
            mappingConfidence=coverage,
        )

    def _find_matching_facts(self, req, material_result):
        matched = []
        keywords = set(req.relatedKeywords)
        for fact in material_result.facts:
            fact_text = f"{fact.statement} {' '.join(fact.skillTags)}"
            if any(kw in fact_text for kw in keywords):
                matched.append(fact)
        return matched

    def _classify_mapping(self, req, matched_facts):
        if len(matched_facts) >= 2:
            return MappingType("composite"), EvidenceStrength("moderate")
        fact = matched_facts[0]
        if fact.confidence == "explicit":
            return MappingType("direct"), EvidenceStrength("strong")
        return MappingType("semantic"), EvidenceStrength("moderate")
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_evidence_mapper.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/mapping/__init__.py src/core/mapping/evidence_mapper.py tests/unit/test_evidence_mapper.py
git commit -m "feat: add evidence mapper"
```

---

### Task B5: Parse-Map Integration

**Files:**
- Create: `tests/integration/test_parse_map_pipeline.py`

**Steps:**

- [ ] **Step 1: Write integration test**

Create `tests/integration/test_parse_map_pipeline.py`:

```python
from core.mapping.evidence_mapper import EvidenceMapper
from core.models import RawMaterial, TargetJob, UserInput, UserProfile
from core.parsing.jd_parser import JDParser
from core.parsing.material_parser import MaterialParser


def test_full_parse_map_pipeline() -> None:
    user_input = UserInput(
        profile=UserProfile(name="张三", email="zhangsan@example.com"),
        targetJob=TargetJob(
            companyName="Example AI",
            jobTitle="AI 产品实习生",
            jobDescription=(
                "负责 AI 产品调研、竞品分析、用户反馈整理，要求本科及以上在读。"
                "需要理解 AIGC 产品并具备基础数据分析意识。"
                "熟悉 Python 和 SQL。"
            ),
        ),
        materials=[
            RawMaterial(
                id="M001",
                type="project",
                title="RAG 项目",
                content="我做过一个 RAG 问答助手课程项目，用 Python 整理知识库和测试 prompt 效果。",
            )
        ],
    )

    jd_result = JDParser().parse(user_input.targetJob.jobDescription)
    material_result = MaterialParser().parse(user_input.materials)
    mapping_result = EvidenceMapper().map(jd_result, material_result)

    assert len(jd_result.coreCapabilities) >= 2
    assert len(material_result.facts) >= 1
    assert len(mapping_result.mappings) >= 1
    assert all(m.jdRequirementId for m in mapping_result.mappings)
    assert all(g.jdRequirementId for g in mapping_result.gaps)
```

- [ ] **Step 2: Run integration test**

```bash
pytest tests/integration/test_parse_map_pipeline.py -v
```

Expected: `1 passed`

- [ ] **Step 3: Commit**

```bash
git add tests/integration/test_parse_map_pipeline.py
git commit -m "test: add parse map integration coverage"
```

---

## Success Criteria

- `pytest tests/unit/test_jd_parser.py tests/unit/test_material_parser.py tests/unit/test_evidence_mapper.py -q` passes.
- `pytest tests/integration/test_parse_map_pipeline.py -q` passes.
- At least one complete sample produces non-empty `coreCapabilities`, `facts`, `mappings`, and `gaps`.
- Every `EvidenceMapping.materialFactIds` points to a real `MaterialFact.id`.
- Every `GapItem.jdRequirementId` points to a real `CapabilityRequirement.id`.
