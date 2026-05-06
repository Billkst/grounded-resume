# Third Round Blind Evaluation - 2026-05-03

## Purpose

Validate Jobs v3: output-separated, material-density adaptive, claim-level verified resume generation against the same ChatGPT baselines from smoke-test.

## Samples

| Sample | Material density | Input | Baseline |
|---|---|---|---|
| A2 | Rich | `research/baseline/test-cases/smoke/A2_bytedance_devservice_ai_product/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/A2_output.md` |
| B2 | Moderate | `research/baseline/test-cases/smoke/B2_xiaohongshu_product_engineer_ai_app/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/B2_output.md` |
| A6 | Sparse | `research/baseline/test-cases/smoke/A6_meituan_ai_agent_pm/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/A6_output.md` |

## Blind Label Mapping

Fixed mapping for reproducibility:

| Sample | Version 1 | Version 2 |
|---|---|---|
| A2 | ChatGPT baseline | Jobs v3 Delivery Resume |
| B2 | Jobs v3 Delivery Resume | ChatGPT baseline |
| A6 | ChatGPT baseline | Jobs v3 Delivery Resume |

Do not expose this mapping to judge agents.

## Success Criteria

- A2: Jobs v3 average total > ChatGPT average total.
- B2: Jobs v3 average total >= ChatGPT average total + 1.0.
- A6: Jobs v3 average total >= ChatGPT average total + 3.0.
- Overall: Jobs v3 average total > ChatGPT average total.
- Jobs v3 direct submit/minor edits count >= 13/15.
- Jobs v3 authenticity average >= 29.0.
- Blind packages contain only clean Delivery Resume content, with no tags or Gap Report.
