# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Response Language

**Always respond in Simplified Chinese.**

- All explanations, plans, clarifying questions, summaries, and final answers must be written in Simplified Chinese.
- Keep code, commands, file paths, API names, error messages, and quoted source text in their original language when necessary.
- If the user explicitly requests another language, follow the user's request for that response only.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Development Commands

Backend is Python 3.12+ (FastAPI + LangGraph). Frontend is Next.js 14 + TypeScript + Tailwind CSS.

### Setup

```bash
make install-backend   # pip install -e ".[dev]"
make install-frontend  # cd frontend && npm install
```

### Running

```bash
make dev-backend   # cd src && python -m grounded_resume  (port 8000)
make dev-frontend  # cd frontend && npm run dev            (port 3000)
```

Backend depends on a `.env` file (copy from `.env.example`). Key env vars: `DEPLOYMENT_MODE`, `ENABLE_AUTH`, `JWT_SECRET`, `ENCRYPTION_KEY`, `DATABASE_PATH`, plus LLM provider API keys.

### Backend Tests / Quality

```bash
make test-backend              # pytest -q
make test-backend-cov          # pytest with coverage
make lint-backend              # ruff check + ruff format --check
make typecheck-backend         # basedpyright src/grounded_resume
python -m pytest tests/path/to/test_module.py::test_func -q   # single test
```

### Frontend Tests / Build

```bash
cd frontend && npm run build        # production build
cd frontend && npm run test:e2e     # Playwright E2E (runs against dev server)
make test-e2e                       # same, from root
make test-e2e-headed                # headed mode
make test-e2e-debug                 # Playwright debug mode
```

Playwright config (`frontend/playwright.config.ts`) automatically starts the Next.js dev server as a `webServer` and sets `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`.

### Full Verification

```bash
make verify   # lint + typecheck + backend tests + frontend build + e2e
```

---

## Architecture

### Backend Pipeline

The resume generation engine is a **LangGraph state machine** plus a **strategy layer** that decides how each node executes.

**Strategy layer** (`src/grounded_resume/core/workflow/strategies.py`):

- `PipelineStrategy` is the ABC. Concrete implementations:
  - `RuleStrategy` — pure code-based parsing, mapping, and generation.
  - `LLMStrategy` — pure LLM-driven JSON-in / JSON-out for each stage.
  - `HybridStrategy` — rule-based first, then LLM normalization/reranking/generation with fallback to rules on failure or low quality scores.
- `build_strategy(mode, llm_service)` selects the implementation. `mode` can be `"rule" | "hybrid" | "llm" | "jobs_v3"`.

**Workflow graphs** (`src/grounded_resume/core/workflow/graph.py`):

There are two hard-coded graphs:

1. **legacy** (`strategy_mode != "jobs_v3"`) — linear pipeline:
   `parse_jd → parse_materials → map_evidence → generate_draft → validate_draft`
2. **jobs_v3** — richer branch:
   `parse_jd → parse_materials → map_evidence → classify_density → [route by density] → plan_generation → generate_candidates → rerank_candidates → verify_claims → enforce_hard_rules → assemble_output`

Both graphs wrap `WorkflowState` (dict-based LangGraph state) and inject the chosen `PipelineStrategy` into legacy nodes. Jobs-v3 nodes operate directly on state.

**Key architectural constraints:**

- All Pydantic models inherit from `StrictModel` (`src/grounded_resume/core/models/schemas.py`), which uses:
  - `extra="forbid"`
  - `alias_generator=to_camel` + `serialize_by_alias=True`
  This means **API JSON uses camelCase fields** even though Python attributes are snake_case. The frontend must align with camelCase.
- `LLMService` is instantiated once in `create_app()` and stored on `app.state.llm_service`. The workflow graph is also built once and stored on `app.state.workflow_graph`.
- Provider adapters live in `src/grounded_resume/providers/`. The `DEPLOYMENT_MODE` env var gates which providers are exposed via `/config`.

### Frontend

- Next.js 14 app router. Pages: `/`, `/confirmation`, `/result`, `/login`, `/settings`.
- API client is a thin fetch wrapper in `frontend/lib/api.ts`. Base URL comes from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`).
- E2E tests are Playwright, located in `frontend/e2e/`.
