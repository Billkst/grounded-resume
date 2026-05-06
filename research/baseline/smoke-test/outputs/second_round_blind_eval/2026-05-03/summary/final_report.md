# Second Round Blind Evaluation Final Report

## Executive Summary

- **Result**: New Jobs beats ChatGPT baseline overall, with a decisive win on the critical Authenticity dimension.
- **Must-achieve authenticity criterion**: **Pass**. New Jobs average Authenticity (29.33) significantly exceeds ChatGPT baseline (26.0).
- **Expected total-score criterion**: **Pass**. New Jobs average Total (83.13) exceeds ChatGPT baseline (82.59) and meets the ≥ 82 target.
- **Direct-submit/minor-edits validation**: **Partial Pass**. 9/15 judge-sample combinations rated Jobs as directly submittable vs 13/15 for ChatGPT. The gap is entirely driven by A6 (sparse-material sample), where all 5 judges rated Jobs as "No" due to excessive thinness.

---

## Average Scores

| System | Job customization /25 | Authenticity /30 | Structure /15 | Expression /15 | Modification cost /15 | Total /100 |
|---|---|---:|---:|---:|---:|---:|
| ChatGPT baseline | 20.00 | 26.00 | 12.73 | 12.33 | 11.53 | 82.59 |
| New Jobs conservative | 19.93 | 29.33 | 11.73 | 12.27 | 9.87 | 83.13 |

**Key observation**: New Jobs wins by +3.33 on Authenticity (the highest-weighted dimension at 30 points), while trailing slightly on Structure and Modification Cost. This trade-off is intentional and validated: the adjusted strategy sacrifices some polish and submission-readiness in exchange for eliminating fabrication risk.

---

## Sample-Level Comparison

| Sample | ChatGPT avg total | Jobs avg total | Winner | Key reason |
|---|---|---:|---|---|
| A2 | 81.6 | 85.6 | **Jobs** | Jobs version balances JD customization with explicit evidence boundaries; all 5 judges rated it No fabrication risk. |
| B2 | 85.4 | 85.0 | **ChatGPT** (margin 0.4) | Effectively a tie. ChatGPT scores slightly higher on polish and modification cost; Jobs scores higher on authenticity. Judges split 3-2 in favor of Jobs for preferred version. |
| A6 | 80.8 | 78.8 | **ChatGPT** | Sparse material is the limiting factor. Jobs version is too thin for competitive screening; ChatGPT provides more narrative context despite weaker evidence boundaries. |

---

## Dimension-by-Dimension Analysis

### Job Customization
- **ChatGPT avg**: 20.00
- **Jobs avg**: 19.93
- **Difference**: -0.07 (effectively tied)
- **Analysis**: Both systems achieve similar JD keyword fit. ChatGPT is slightly more willing to stretch project descriptions toward JD language (e.g., "AI Native 研发工具链"), while Jobs is more conservative about unsupported claims. The gap is negligible.

### Authenticity/Fidelity
- **ChatGPT avg**: 26.00
- **Jobs avg**: 29.33
- **Difference**: +3.33
- **Analysis**: This is the decisive victory for the adjusted Jobs strategy. In Round 1, Jobs scored 9.0 on Authenticity and all 5 judges detected systematic fabrication. In Round 2, Jobs scores 29.33 and **zero judges detected fabrication**. The conservative inference policy—removing unsupported metrics, tagging bullets with credibility labels, and pushing gaps into the Gap Report—completely solved the first-round fatal issue.

### Structural Completeness
- **ChatGPT avg**: 12.73
- **Jobs avg**: 11.73
- **Difference**: -1.00
- **Analysis**: ChatGPT produces more conventionally structured resumes with standard sections. Jobs resumes include credibility tags and Gap Reports that reduce structural completeness scores because they are not submission-ready without cleanup.

### Expression Quality
- **ChatGPT avg**: 12.33
- **Jobs avg**: 12.27
- **Difference**: -0.07 (effectively tied)
- **Analysis**: Both systems produce clear, professional expression. ChatGPT tends toward narrative/self-evaluative prose, while Jobs uses stronger action verbs in project bullets but is constrained by evidence boundaries.

### Modification Cost
- **ChatGPT avg**: 11.53
- **Jobs avg**: 9.87
- **Difference**: -1.67
- **Analysis**: ChatGPT resumes are closer to directly submittable. Jobs resumes require removing credibility tags, filling "待补充" placeholders, and separating the Gap Report before submission. This is the primary cost of the adjusted strategy.

---

## Fabrication Risk Findings

- **ChatGPT baseline**: No systematic fabrication detected. However, 2 judges (Judge 2 on A2, Judge 4 on B2) rated ChatGPT as "Unclear" on fabrication risk due to broad self-promotional phrases (e.g., "较强兴趣", "适合申请") that lack concrete evidence.
- **New Jobs conservative**: **Zero fabrication detected across all 15 judge-sample combinations.** All 5 judges explicitly stated "No" or "Neither" for systematic fabrication risk. This is a complete reversal from Round 1.
- **Conclusion**: The adjusted strategy **successfully solved the first-round fatal issue**. The key change was eliminating unsupported quantitative metrics ("200+ docs", "85% accuracy", "30% improvement") and replacing them with qualitatively grounded but still professionally phrased claims.

---

## Direct Submission / Minor Modification Count

| System | Yes count /15 | No count /15 |
|---|---|---|
| ChatGPT baseline | 13 | 2 |
| New Jobs conservative | 9 | 6 |

**Breakdown by sample (Jobs):**
- A2: 4/5 judges said Yes (Judge 1 said No due to visible tags)
- B2: 5/5 judges said Yes
- A6: 0/5 judges said Yes (all cited excessive thinness/sparse material)

**Analysis**: The direct-submission rate is the main weakness of the adjusted strategy. For A6 (high-risk sparse material), the Jobs resume is so conservative that it becomes non-competitive. For A2 and B2 (medium-risk with more material), the Jobs version is competitive or superior.

---

## Final Decision

**Does new Jobs beat ChatGPT baseline?**

**Yes, narrowly.** New Jobs achieves a higher average total score (83.13 vs 82.59) and a decisive win on Authenticity (29.33 vs 26.0), which is the most important dimension. This validates the core hypothesis: a conservative inference strategy can produce resumes that are both competitive and free from detectable fabrication.

However, the victory comes with important caveats:
1. **Sample dependency**: Jobs wins on A2, ties on B2, and loses on A6. The strategy works best when user material is moderately complete; for very sparse material (A6), excessive conservatism produces a non-competitive resume.
2. **Modification cost**: Jobs resumes require more cleanup before submission (removing tags, filling placeholders, separating Gap Report).
3. **Direct submission rate**: Only 9/15 judge-sample combinations rated Jobs as directly submittable vs 13/15 for ChatGPT.

**Should this strategy be adopted?**

**Yes, with iteration.** The adjusted strategy should become the default generation mode for grounded-resume because:
- It solves the fatal first-round issue (fabrication detection)
- It maintains competitiveness on total score
- It provides users with a Gap Report that guides improvement

**Recommended iteration**: For sparse-material samples like A6, the system should not be *quite* as conservative. Instead of producing a very thin resume, it should:
1. Keep the Gap Report substantial
2. But allow slightly more inferential depth in the resume body when material logically supports it
3. Clearly distinguish "reasonable inference" from "material support" via tags

---

## Recommended Next Changes

### Resume Generation Policy
1. **Keep the credibility tag system** (【素材支撑】/【合理推断】/【建议补充】) as it successfully eliminated fabrication detection.
2. **For sparse-material samples**, relax conservatism slightly: allow more inferential depth when the logic chain from material to claim is sound, rather than producing overly thin resumes.
3. **Add a "submission-ready cleanup" step** that automatically strips tags and Gap Report content to produce a clean resume for export.

### Gap Report Policy
1. **Keep Gap Reports as a core output**—judges consistently valued them for interview defensibility.
2. **Add actionable supplement suggestions** with time estimates (1-3 days, 1 week, 1 month) for each missing capability.
3. **Prioritize gaps by impact**: list the 2-3 gaps that would most improve interview success if filled.

### Future Evaluation Protocol
1. **Test sparse-material relaxation**: Run a third round with a modified A6 prompt that allows slightly more inference while keeping tags.
2. **Add a "submission-ready" evaluation dimension**: Score the cleaned-up version (tags removed) separately from the annotated version.
3. **Track interview invite rate**: The ultimate validation is whether users of the Jobs strategy get more interviews than ChatGPT baseline users.

---

*Report generated: 2026-05-03*
*Round: 2 (adjusted conservative inference strategy)*
*Judges: 5 independent evaluators*
*Samples: A2 (ByteDance), B2 (Xiaohongshu), A6 (Meituan)*
