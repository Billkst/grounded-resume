# Plan F: Web Frontend - Input And Result Display

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished Next.js frontend with mock data: input form, three-column confirmation layout, evidence visualization, Gap report, and result display using the Editorial/Magazine visual direction.

**Architecture:** Create a Next.js 14+ App Router project under `frontend/`. Use Tailwind CSS with custom Editorial/Magazine design tokens. All data is mock-based so the frontend can be built and tested independently from the backend API.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS.

---

## Dependencies

- Requires Plan E: API contract shape (for TypeScript types).
- Can be built with mock data before live API wiring.

## Atomic Commit Strategy

| Commit | Message | Scope |
|---|---|---|
| 1 | `chore: add nextjs frontend foundation` | `frontend/package.json`, configs, basic layout |
| 2 | `style: add editorial design tokens` | Tailwind config, CSS variables, fonts |
| 3 | `feat: add resume input form` | Input page with profile/JD/materials form |
| 4 | `feat: add mock workflow data` | `frontend/lib/mock-data.ts`, type mirrors |
| 5 | `feat: add confirmation evidence layout` | Three-column confirmation page |
| 6 | `feat: add gap report and result views` | Gap report + result page |
| 7 | `test: verify frontend build and responsive smoke` | Build check |

## File Map

| Path | Responsibility |
|---|---|
| `frontend/package.json` | Frontend dependencies and scripts |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/next.config.js` | Next.js config |
| `frontend/tailwind.config.ts` | Tailwind theme tokens |
| `frontend/app/globals.css` | Global styles and CSS variables |
| `frontend/app/layout.tsx` | Root layout |
| `frontend/app/page.tsx` | Input page |
| `frontend/app/confirmation/page.tsx` | Confirmation page |
| `frontend/app/result/page.tsx` | Result page |
| `frontend/components/input-form.tsx` | User input form |
| `frontend/components/confirmation-board.tsx` | Three-column confirmation layout |
| `frontend/components/evidence-card.tsx` | Evidence source card |
| `frontend/components/gap-report.tsx` | Gap report UI |
| `frontend/components/resume-preview.tsx` | Markdown/result preview |
| `frontend/lib/mock-data.ts` | Mock MVP workflow data |
| `frontend/lib/types.ts` | TypeScript API mirror types |

---

## Scope

### Included

- Next.js project setup (App Router, TypeScript, Tailwind CSS)
- Editorial/Magazine style (Cream background, serif headings, soft accent colors, card-based layout)
- Input form (Profile, target job, JD, material blocks, preferences)
- Mock API layer (Local mock data matching Plan E response schemas)
- Confirmation UI (Three-column layout: resume expression, evidence source, mapping analysis)
- Evidence visualization (Strength badges, expression level badges, risk notes)
- Gap report (Gap cards with severity and user action controls)
- Result display (Markdown resume preview and attachments preview)
- Responsive layout (Desktop three-column, mobile stacked cards)

### Excluded

- Real backend calls (Use mock data until API integration hardening)
- OAuth UI (Deferred to Phase 2)
- PDF/DOCX export (Deferred beyond MVP)
- Full design system package (Keep local components minimal)
- Browser E2E automation beyond smoke checks

---

## Design Tokens

Colors:
- cream: #FDFCF8
- warmgray: #F5F3EE
- charcoal: #2D2D2D
- terracotta: #C67B5C
- sage: #8B9D83
- amber: #D4A373
- softred: #C97B7B

Fonts:
- serif: Noto Serif SC
- display: Playfair Display
- body: -apple-system, PingFang SC, Microsoft YaHei, sans-serif

---

## Key Tasks

### Task F1: Frontend Tooling

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`

**Steps:**

- [ ] **Step 1: Initialize Next.js project**

Create `frontend/package.json` with Next.js 14, React 18, TypeScript, Tailwind CSS dependencies.

- [ ] **Step 2: Add TypeScript config**

Create `frontend/tsconfig.json` with strict mode, path aliases `@/*`.

- [ ] **Step 3: Add Tailwind config**

Create `frontend/tailwind.config.ts` extending theme with cream, warmgray, charcoal, terracotta, sage, amber, softred colors and serif/display font families.

- [ ] **Step 4: Add globals.css**

Create `frontend/app/globals.css` with `@tailwind` directives and CSS custom properties for design tokens.

- [ ] **Step 5: Add root layout**

Create `frontend/app/layout.tsx` with zh-CN lang, cream background, centered layout.

- [ ] **Step 6: Build check**

Run: `cd frontend && npm install && npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "chore: add nextjs frontend foundation"
```

---

### Task F2: Mock Data and Types

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/mock-data.ts`

**Steps:**

- [ ] **Step 1: Add TypeScript types**

Create `frontend/lib/types.ts` with interfaces: UserProfile, TargetJob, RawMaterial, ResumeBullet, GapItem, ResumeOutput.

- [ ] **Step 2: Add mock data**

Create `frontend/lib/mock-data.ts` exporting:
- mockBullets: array with 2 ResumeBullet items (conservative safe, standard warning)
- mockGaps: array with 1 GapItem (major severity)
- mockOutput: ResumeOutput with resumeMarkdown and 4 attachments

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/
git commit -m "feat: add mock workflow data"
```

---

### Task F3: Input Form

**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/input-form.tsx`

**Steps:**

- [ ] **Step 1: Create input page**

Create `frontend/app/page.tsx` with centered layout, title "grounded-resume", subtitle, and `<InputForm />`.

- [ ] **Step 2: Create InputForm component**

Create `frontend/components/input-form.tsx` as a client component with useState form state.

Fields:
- name (text input, required)
- email (email input, required)
- company (text input, required)
- jobTitle (text input, required)
- jobDescription (textarea, required, min 50 chars)
- materials (dynamic list of textareas, at least 1)
- submit button

Style: card-based form with warmgray background, rounded corners, serif headings.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx frontend/components/input-form.tsx
git commit -m "feat: add resume input form"
```

---

### Task F4: Confirmation Board

**Files:**
- Create: `frontend/app/confirmation/page.tsx`
- Create: `frontend/components/confirmation-board.tsx`
- Create: `frontend/components/evidence-card.tsx`

**Steps:**

- [ ] **Step 1: Create confirmation page**

Create `frontend/app/confirmation/page.tsx` importing mockBullets and rendering `<ConfirmationBoard bullets={mockBullets} />`.

- [ ] **Step 2: Create ConfirmationBoard**

Create `frontend/components/confirmation-board.tsx`.

Desktop layout: `grid grid-cols-3 gap-6`
Mobile layout: `flex flex-col gap-6`

Each bullet renders as a card with three columns:
1. **简历表达**: bullet text + expressionLevel badge + riskLevel badge
2. **证据来源**: evidencePreview directQuotes + sourceMaterialTitle
3. **映射分析**: mappingReasoning + action buttons (认可/修改/拒绝)

Color coding:
- safe: sage green badge
- warning: amber badge
- redline: softred badge
- conservative: muted style
- emphasized: terracotta accent

- [ ] **Step 3: Create EvidenceCard**

Create `frontend/components/evidence-card.tsx` rendering sourceMaterialTitle and quoted text with left border accent.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/confirmation/page.tsx frontend/components/confirmation-board.tsx frontend/components/evidence-card.tsx
git commit -m "feat: add confirmation evidence layout"
```

---

### Task F5: Gap Report and Result

**Files:**
- Create: `frontend/app/result/page.tsx`
- Create: `frontend/components/gap-report.tsx`
- Create: `frontend/components/resume-preview.tsx`

**Steps:**

- [ ] **Step 1: Create result page**

Create `frontend/app/result/page.tsx` with tabs or sections:
- Resume preview (primary)
- Evidence map
- Gap report
- Risk summary
- Modification guide

- [ ] **Step 2: Create GapReport**

Create `frontend/components/gap-report.tsx`.

Each gap card shows:
- severity indicator (left border color: critical=softred, major=amber, minor=sage)
- description
- recommendation
- action buttons: 接受缺口 / 后续补充

- [ ] **Step 3: Create ResumePreview**

Create `frontend/components/resume-preview.tsx`.

Render mockOutput.resumeMarkdown as styled text with:
- Level 2 declaration blockquote at top
- Section headings in serif font
- Bullet points with proper spacing

- [ ] **Step 4: Commit**

```bash
git add frontend/app/result/page.tsx frontend/components/gap-report.tsx frontend/components/resume-preview.tsx
git commit -m "feat: add gap report and result views"
```

---

### Task F6: Responsive QA

**Files:**
- Verify: All frontend pages

**Steps:**

- [ ] **Step 1: Build verification**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Lint check**

```bash
cd frontend && npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "test: verify frontend build and responsive smoke"
```

---

## Success Criteria

- `npm run lint` passes in `frontend/`.
- `npm run build` passes in `frontend/`.
- Input page displays required user fields: name, email, company, job title, JD, materials.
- Confirmation page displays three logical areas: resume expression, evidence source, mapping analysis.
- Gap report shows severity, description, recommendation, and user action choices.
- Result page displays Level 2 declaration, resume preview, evidence map, gap report, risk summary, and modification guide.
- Mobile layout stacks confirmation columns without horizontal overflow.
- No real backend URL is required for Plan F; all pages run from mock data.
