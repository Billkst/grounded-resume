# Plan E: LangGraph Workflow Orchestration And API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Plan B/C/D modules into a durable workflow and expose it through FastAPI REST and WebSocket endpoints.

**Architecture:** Define a LangGraph `StateGraph` where each node wraps a Plan B/C/D module. State is persisted to SQLite via LangGraph checkpointing. FastAPI provides REST endpoints for session lifecycle and a WebSocket endpoint for streaming progress. All tests use fake providers and temp databases.

**Tech Stack:** Python 3.12, Pydantic v2, LangGraph, FastAPI, Uvicorn, pytest.

---

## Dependencies

- Requires Plan A: infrastructure.
- Requires Plan B: parsers/mappers.
- Requires Plan C: generator/safety/validator.
- Requires Plan D: confirmation/output.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `chore: add api workflow dependencies` | `pyproject.toml` - add FastAPI, LangGraph, Uvicorn |
| 2 | `feat: add workflow state and nodes` | `src/core/workflow/state.py`, `src/core/workflow/nodes.py` |
| 3 | `feat: add langgraph resume workflow` | `src/core/workflow/graph.py` |
| 4 | `feat: add workflow checkpoint persistence` | SQLite checkpoint integration |
| 5 | `feat: add fastapi rest routes` | `src/api/routes.py` |
| 6 | `feat: add workflow websocket progress` | `src/api/websocket.py` |
| 7 | `test: add api workflow integration coverage` | Integration tests |

## File Map

| Path | Responsibility |
|---|---|
| `pyproject.toml` | Updated with FastAPI, Uvicorn, LangGraph dependencies |
| `src/api/__init__.py` | API package marker |
| `src/api/main.py` | FastAPI app factory |
| `src/api/dependencies.py` | Store/provider/workflow dependency injection |
| `src/api/routes.py` | REST endpoints |
| `src/api/websocket.py` | WebSocket progress endpoint |
| `src/core/workflow/__init__.py` | Workflow exports |
| `src/core/workflow/state.py` | Workflow state model |
| `src/core/workflow/nodes.py` | LangGraph node functions |
| `src/core/workflow/graph.py` | StateGraph construction |
| `tests/unit/test_workflow_nodes.py` | Node unit tests |
| `tests/integration/test_workflow_graph.py` | Graph integration tests |
| `tests/integration/test_api_routes.py` | FastAPI route tests |
| `tests/integration/test_api_websocket.py` | WebSocket tests |

---

## Scope

### Included

| Module | Description |
|---|---|
| LangGraph state | Define workflow state around Plan A schemas |
| Nodes and edges | Wire JD parsing, material parsing, mapping, generation, safety, validation, confirmation, output |
| Checkpointing | SQLite-backed checkpoint persistence |
| FastAPI REST | Submit generation request, fetch session state, submit confirmation decisions, fetch output |
| WebSocket | Stream workflow progress events and generated draft items |
| Fake provider runtime | Use `FakeLLMProvider` or provider registry without real HTTP calls |

### Excluded

| Excluded | Reason |
|---|---|
| Frontend | Covered by Plan F |
| OAuth complete implementation | Deferred to Phase 2 |
| Real LLM HTTP providers | Provider hardening after workflow proves stable |
| Production auth/rate limiting | Beta/deployment hardening |

---

## Key Tasks

### Task E1: Add Dependencies

**Files:**
- Modify: `pyproject.toml`

**Steps:**

- [ ] **Step 1: Add FastAPI and LangGraph to dependencies**

Edit `pyproject.toml`, add to `[project.dependencies]`:

```toml
dependencies = [
  "pydantic>=2.7,<3.0",
  "langgraph>=0.2,<0.3",
  "fastapi>=0.111,<1.0",
  "uvicorn[standard]>=0.30,<1.0",
]
```

- [ ] **Step 2: Verify imports**

```bash
python -c "import fastapi, langgraph, uvicorn; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add pyproject.toml
git commit -m "chore: add api workflow dependencies"
```

---

### Task E2: Workflow State and Nodes

**Files:**
- Create: `src/core/workflow/__init__.py`
- Create: `src/core/workflow/state.py`
- Create: `src/core/workflow/nodes.py`
- Create: `tests/unit/test_workflow_nodes.py`

**Steps:**

- [ ] **Step 1: Write failing node tests**

Create `tests/unit/test_workflow_nodes.py`:

```python
from core.models import UserInput, UserProfile, TargetJob, RawMaterial
from core.workflow.nodes import parse_jd_node, parse_materials_node
from core.workflow.state import WorkflowState


def test_parse_jd_node_populates_jd_result() -> None:
    state = WorkflowState(
        user_input=UserInput(
            profile=UserProfile(name="张三", email="zhangsan@example.com"),
            targetJob=TargetJob(
                companyName="Example AI",
                jobTitle="AI 产品实习生",
                jobDescription="负责 AI 产品调研，要求本科及以上在读。熟悉 Python。",
            ),
            materials=[],
        )
    )

    result = parse_jd_node(state)

    assert result.jd_result is not None
    assert len(result.jd_result.coreCapabilities) >= 1


def test_parse_materials_node_populates_material_result() -> None:
    state = WorkflowState(
        user_input=UserInput(
            profile=UserProfile(name="张三", email="zhangsan@example.com"),
            targetJob=TargetJob(
                companyName="Example AI",
                jobTitle="AI 产品实习生",
                jobDescription="负责 AI 产品调研，要求本科及以上在读。熟悉 Python。",
            ),
            materials=[
                RawMaterial(
                    id="M001",
                    type="project",
                    title="RAG 项目",
                    content="用 Python 整理知识库。",
                )
            ],
        )
    )

    result = parse_materials_node(state)

    assert result.material_result is not None
    assert len(result.material_result.facts) >= 1
```

- [ ] **Step 2: Run tests → expect failures**

```bash
pytest tests/unit/test_workflow_nodes.py -v
```

Expected: Import errors

- [ ] **Step 3: Implement workflow state and nodes**

Create `src/core/workflow/__init__.py`:

```python
from core.workflow.graph import build_workflow_graph
from core.workflow.state import WorkflowState

__all__ = ["build_workflow_graph", "WorkflowState"]
```

Create `src/core/workflow/state.py`:

```python
from __future__ import annotations

from core.models import (
    ConfirmationSession,
    EvidenceMappingResult,
    JDParsedResult,
    MaterialParseResult,
    ResumeDraft,
    ResumeOutput,
    UserInput,
    ValidationResult,
)


class WorkflowState:
    def __init__(
        self,
        user_input: UserInput | None = None,
        jd_result: JDParsedResult | None = None,
        material_result: MaterialParseResult | None = None,
        mapping_result: EvidenceMappingResult | None = None,
        draft: ResumeDraft | None = None,
        validation_result: ValidationResult | None = None,
        confirmation_session: ConfirmationSession | None = None,
        output: ResumeOutput | None = None,
        error: str | None = None,
    ):
        self.user_input = user_input
        self.jd_result = jd_result
        self.material_result = material_result
        self.mapping_result = mapping_result
        self.draft = draft
        self.validation_result = validation_result
        self.confirmation_session = confirmation_session
        self.output = output
        self.error = error

    def to_dict(self) -> dict:
        return {
            "user_input": self.user_input.model_dump() if self.user_input else None,
            "jd_result": self.jd_result.model_dump() if self.jd_result else None,
            "material_result": self.material_result.model_dump() if self.material_result else None,
            "mapping_result": self.mapping_result.model_dump() if self.mapping_result else None,
            "draft": self.draft.model_dump() if self.draft else None,
            "validation_result": self.validation_result.model_dump() if self.validation_result else None,
            "confirmation_session": self.confirmation_session.model_dump() if self.confirmation_session else None,
            "output": self.output.model_dump() if self.output else None,
            "error": self.error,
        }

    @classmethod
    def from_dict(cls, data: dict) -> WorkflowState:
        return cls(
            user_input=UserInput.model_validate(data["user_input"]) if data.get("user_input") else None,
            jd_result=JDParsedResult.model_validate(data["jd_result"]) if data.get("jd_result") else None,
            material_result=MaterialParseResult.model_validate(data["material_result"]) if data.get("material_result") else None,
            mapping_result=EvidenceMappingResult.model_validate(data["mapping_result"]) if data.get("mapping_result") else None,
            draft=ResumeDraft.model_validate(data["draft"]) if data.get("draft") else None,
            validation_result=ValidationResult.model_validate(data["validation_result"]) if data.get("validation_result") else None,
            confirmation_session=ConfirmationSession.model_validate(data["confirmation_session"]) if data.get("confirmation_session") else None,
            output=ResumeOutput.model_validate(data["output"]) if data.get("output") else None,
            error=data.get("error"),
        )
```

Create `src/core/workflow/nodes.py`:

```python
from __future__ import annotations

from core.parsing.jd_parser import JDParser
from core.parsing.material_parser import MaterialParser
from core.mapping.evidence_mapper import EvidenceMapper
from core.generation.constrained_generator import ConstrainedGenerator
from core.safety.expression_guard import ExpressionGuard
from core.safety.redline_detector import RedlineDetector
from core.safety.conservative_mode import ConservativeMode
from core.validation.validator import Validator
from core.confirmation.user_confirmation import UserConfirmation
from core.output.resume_formatter import ResumeFormatter
from core.workflow.state import WorkflowState


def parse_jd_node(state: WorkflowState) -> WorkflowState:
    if state.user_input is None:
        return WorkflowState(error="No user input")
    parser = JDParser()
    try:
        jd_result = parser.parse(state.user_input.targetJob.jobDescription)
        return WorkflowState(user_input=state.user_input, jd_result=jd_result)
    except ValueError as e:
        return WorkflowState(user_input=state.user_input, error=str(e))


def parse_materials_node(state: WorkflowState) -> WorkflowState:
    if state.user_input is None:
        return WorkflowState(error="No user input")
    parser = MaterialParser()
    material_result = parser.parse(state.user_input.materials)
    return WorkflowState(
        user_input=state.user_input,
        jd_result=state.jd_result,
        material_result=material_result,
    )


def map_evidence_node(state: WorkflowState) -> WorkflowState:
    if state.jd_result is None or state.material_result is None:
        return WorkflowState(error="Missing parsed results")
    mapper = EvidenceMapper()
    mapping_result = mapper.map(state.jd_result, state.material_result)
    return WorkflowState(
        user_input=state.user_input,
        jd_result=state.jd_result,
        material_result=state.material_result,
        mapping_result=mapping_result,
    )


def generate_draft_node(state: WorkflowState) -> WorkflowState:
    if state.mapping_result is None or state.user_input is None:
        return WorkflowState(error="Missing mapping result")
    generator = ConstrainedGenerator()
    draft = generator.generate(state.mapping_result, state.user_input)
    return WorkflowState(
        user_input=state.user_input,
        jd_result=state.jd_result,
        material_result=state.material_result,
        mapping_result=state.mapping_result,
        draft=draft,
    )
```

- [ ] **Step 4: Run tests → expect pass**

```bash
pytest tests/unit/test_workflow_nodes.py -v
```

Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/core/workflow/__init__.py src/core/workflow/state.py src/core/workflow/nodes.py tests/unit/test_workflow_nodes.py
git commit -m "feat: add workflow state and nodes"
```

---

### Task E3: LangGraph StateGraph

**Files:**
- Create: `src/core/workflow/graph.py`
- Create: `tests/integration/test_workflow_graph.py`

**Implementation sketch:**

```python
from langgraph.graph import StateGraph, END
from core.workflow.state import WorkflowState
from core.workflow.nodes import parse_jd_node, parse_materials_node, map_evidence_node, generate_draft_node

def build_workflow_graph():
    graph = StateGraph(WorkflowState)
    graph.add_node("parse_jd", parse_jd_node)
    graph.add_node("parse_materials", parse_materials_node)
    graph.add_node("map_evidence", map_evidence_node)
    graph.add_node("generate_draft", generate_draft_node)

    graph.set_entry_point("parse_jd")
    graph.add_edge("parse_jd", "parse_materials")
    graph.add_edge("parse_materials", "map_evidence")
    graph.add_edge("map_evidence", "generate_draft")
    graph.add_edge("generate_draft", END)

    return graph.compile()
```

**Test:** Run full graph with sample input, assert final state has `draft` populated.

---

### Task E4: Checkpoint Store Integration

**Files:**
- Modify: `src/core/db/sqlite_store.py`
- Modify: `src/core/workflow/graph.py`

Use LangGraph's `SqliteSaver` or custom checkpoint logic. Persist session snapshots after each node.

---

### Task E5: FastAPI REST Routes

**Files:**
- Create: `src/api/main.py`
- Create: `src/api/dependencies.py`
- Create: `src/api/routes.py`
- Create: `tests/integration/test_api_routes.py`

**Implementation sketch:**

```python
from fastapi import FastAPI, Depends
from core.models import UserInput, ResumeOutput
from core.workflow.graph import build_workflow_graph

app = FastAPI(title="grounded-resume API", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}

@app.post("/sessions")
def create_session(user_input: UserInput):
    graph = build_workflow_graph()
    # Run workflow
    return {"session_id": "session-001", "status": "running"}

@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    return {"session_id": session_id, "status": "completed"}
```

**Tests:** Use FastAPI `TestClient` to assert `/health` returns 200 and schema.

---

### Task E6: WebSocket Progress

**Files:**
- Create: `src/api/websocket.py`
- Create: `tests/integration/test_api_websocket.py`

**Implementation sketch:**

```python
from fastapi import WebSocket

@app.websocket("/ws/sessions/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    for stage in ["jd_parsing", "material_parsing", "mapping", "generation", "validation"]:
        await websocket.send_json({"stage": stage, "session_id": session_id})
    await websocket.close()
```

**Tests:** Assert WebSocket receives ordered progress events.

---

## Success Criteria

- `pytest tests/unit/test_workflow_nodes.py -q` passes.
- `pytest tests/integration/test_workflow_graph.py -q` passes.
- `pytest tests/integration/test_api_routes.py tests/integration/test_api_websocket.py -q` passes.
- `GET /health` returns app and version.
- A sample `POST /sessions` creates a session and reaches a confirmation-ready or output-ready state.
- Checkpoint reload returns the latest session state.
- WebSocket emits ordered progress events such as `jd_parsing`, `material_parsing`, `mapping`, `generation`, `validation`.
