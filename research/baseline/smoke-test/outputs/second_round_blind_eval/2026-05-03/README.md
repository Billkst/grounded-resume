# Second Round Blind Evaluation - 2026-05-03

## Purpose

Validate the adjusted Jobs strategy: conservative material-supported inference in the resume body, with missing capabilities disclosed in the Gap report instead of fabricated.

## Samples

| Sample | JD | Input | Baseline |
|---|---|---|---|
| A2 | ByteDance AI Product Intern - Developer Services | `research/baseline/test-cases/smoke/A2_bytedance_devservice_ai_product/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/A2_output.md` |
| B2 | Xiaohongshu Product Engineer - AI App | `research/baseline/test-cases/smoke/B2_xiaohongshu_product_engineer_ai_app/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/B2_output.md` |
| A6 | Meituan AI Product Manager Intern | `research/baseline/test-cases/smoke/A6_meituan_ai_agent_pm/01_public_input.md` | `research/baseline/smoke-test/outputs/llm/chatgpt/A6_output.md` |

## Blind Label Mapping

Fixed mapping for reproducibility:

| Sample | Version 1 | Version 2 |
|---|---|---|
| A2 | ChatGPT baseline | New Jobs conservative version |
| B2 | New Jobs conservative version | ChatGPT baseline |
| A6 | ChatGPT baseline | New Jobs conservative version |

Do not expose this mapping to judge agents.

## Success Criteria

- Must achieve: New Jobs average Authenticity score >= ChatGPT baseline average Authenticity score.
- Expected: New Jobs average Total score >= ChatGPT baseline average Total score, target >= 82.
- Validation metric: 5/5 judges believe New Jobs can be directly submitted or only needs minor modifications for each sample, or final report explicitly lists which samples fail this bar.
