# Third Round Blind Evaluation Final Report

## Executive Summary

- **Result**: Jobs v3 decisively beats ChatGPT baseline on all samples.
- **Overall average**: Jobs v3 93.07 vs ChatGPT 86.27 (+6.80).
- **Sample-level result**: A2 Pass, B2 Pass, A6 Pass.
- **Direct submission rate**: Jobs v3 15/15 vs ChatGPT 10/15.
- **Authenticity**: Jobs v3 28.80 vs target ≥ 29.0 — slightly below target by 0.20, but still above ChatGPT (28.67).

## Average Scores

| System | Job customization /25 | Authenticity /30 | Structure /15 | Expression /15 | Modification cost /15 | Total /100 | Direct submit Yes /15 |
|---|---|---:|---:|---:|---:|---:|---:|
| ChatGPT baseline | 21.13 | 28.67 | 13.53 | 12.07 | 11.40 | 86.27 | 10 |
| Jobs v3 | 22.87 | 28.80 | 13.87 | 13.93 | 13.53 | 93.07 | 15 |

## Sample-Level Comparison

| Sample | ChatGPT avg total | Jobs v3 avg total | Required target | Pass/Fail | Key reason |
|---|---|---:|---:|---:|---|---|
| A2 | 87.0 | 93.8 | Jobs > ChatGPT | **Pass** | Jobs v3 岗位定制更强（豆包编程/Aime 直接锚定），bullet 更专业，修改成本更低。 |
| B2 | 87.4 | 94.4 | Jobs ≥ ChatGPT + 1.0 | **Pass** | Jobs v3 把 Demo 串成"原型验证—测试评估—迭代认知"闭环，Product Engineer 匹配度显著优于 ChatGPT 基线。 |
| A6 | 84.4 | 91.0 | Jobs ≥ ChatGPT + 3.0 | **Pass** | Chain-of-Density 策略成功：稀疏素材转化为产品经理可读的工作链路，可投递性从 0/5 提升到 5/5。 |

## Direct Submission Analysis

| Sample | ChatGPT Yes /5 | Jobs v3 Yes /5 | Delta | Notes |
|---|---|---:|---:|---|
| A2 | 5 | 5 | 0 | 两版均可直接投递。Jobs v3 修改成本更低（只需补联系方式）。 |
| B2 | 5 | 5 | 0 | 两版均可直接投递。Jobs v3 项目边界和验证性质说明更清晰。 |
| A6 | 0 | 5 | **+5** | **关键突破**。ChatGPT 基线 0/5 评委认为可直接投递（过多负面限定）；Jobs v3 5/5 认为可直接投递。 |

## Authenticity and Evidence Safety

- Jobs v3 fabrication detections: 0/15 (No explicit fabrication detected).
- ChatGPT fabrication detections: 0/15 (No explicit fabrication detected).
- Jobs v3 Unclear ratings: 3/15 (all on A6 Version 2, due to Chain-of-Density expressions like "整理候选体验问题与待验证方向" where evidence trace is not perfectly clear).
- ChatGPT Unclear ratings: 2/15 (B2 Version 2: "Multi-Agent 协作、AI 自主交付"等表述略贴 JD)。

**Claim-level verification findings**:
- A2 (rich material): All claims traceable to source material. No blocked claims entered delivery resume.
- B2 (moderate material): All claims traceable. Explicitly blocked: production-scale deployment claims, team leadership claims.
- A6 (sparse material): Chain-of-Density strategy used. Some business-relevance phrases (e.g., "面向移动端 AI Agent 场景") marked as reasonable_inference with JD support. No numeric claims. No role inflation.

## Dimension-by-Dimension Analysis

### Job Customization
- ChatGPT avg: 21.13
- Jobs v3 avg: 22.87
- Difference: +1.74
- Analysis: Jobs v3 consistently scores higher on JD alignment. A2 直接锚定豆包编程/Aime；B2 突出 Product Engineer 闭环；A6 面向美团 AI Agent 场景拆解工作链路。

### Authenticity/Fidelity
- ChatGPT avg: 28.67
- Jobs v3 avg: 28.80
- Difference: +0.13
- Analysis: Jobs v3 maintains slightly higher authenticity than ChatGPT. A2 和 B2 均达到 29.0；A6 因 Chain-of-Density 策略中部分表达的证据链不够显性，被 3 位评委标为 Unclear，拉低至 28.4。这是"竞争力提升"与"证据完全显性"之间的已知 trade-off。

### Structural Completeness
- ChatGPT avg: 13.53
- Jobs v3 avg: 13.87
- Difference: +0.33
- Analysis: 基本持平。Jobs v3 的投递版结构更标准（求职方向→教育→项目→技能），ChatGPT 基线偶有自我评价过长、项目标题不够聚焦的问题。

### Expression Quality
- ChatGPT avg: 12.07
- Jobs v3 avg: 13.93
- Difference: +1.87
- Analysis: 这是 Jobs v3 的最大优势维度。Clean Delivery Resume 没有证据标签干扰，表达更聚焦、更专业、更像真实简历。A6 从第二轮的 11.0 提升到第三轮的 14.0（部分评委）。

### Modification Cost
- ChatGPT avg: 11.40
- Jobs v3 avg: 13.53
- Difference: +2.13
- Analysis: 输出分离策略完全解决了第二轮的修改成本问题。投递版干净无标签，评委一致认为"只需补充个人信息即可投递"。A6 从第二轮的 8.0 提升到 13.0+。

## Third-Round Strategy Assessment

### Output Separation Impact
**决定性成功。** 第二轮 Jobs 修改成本仅 9.87，直接投递率 9/15。第三轮修改成本跃升至 13.53，直接投递率 15/15。把证据标签和 Gap Report 从投递版中彻底移除，是本轮最大改进。

### Material-Density Adaptive Generation Impact
**显著成功。** A2 用 achievement-focused 策略保持领先；B2 用 balanced 策略翻转劣势为优势；A6 用 Chain-of-Density 策略把"过薄不可投递"变为"可投递且有竞争力"。三个样本全部击败 ChatGPT 基线。

### Claim-Level Verification Impact
**真实性保障有效。** 尽管 A6 有部分 Unclear 评级，但没有任何评委检测到 explicit fabrication。所有被 blocked 的 claims（正式实习、主导角色、量化指标、上线成果）都没有进入投递版。

### Sparse-Material Chain-of-Density Impact
**A6 的关键突破。** 第二轮 A6 得分 78.8，0/5 可直接投递。第三轮 A6 得分 91.0，5/5 可直接投递。Chain-of-Density 三阶段流水线（factual draft → domain specificity → business relevance）成功让稀疏素材听起来专业且可信，同时不编造数字和成果。

### Multi-Candidate Reranking Impact
**质量提升明显。** 每个样本生成 3-5 个候选版本并 rerank，确保选择最均衡的版本。A2 选中了岗位定制最强的候选；B2 选中了闭环表达最强的候选；A6 选中了 polish 最好且不过界的候选。

## Final Decision

- **Does Jobs v3 beat ChatGPT on all samples?** **Yes.** A2 (+6.8), B2 (+7.0), A6 (+6.6)。
- **Did it hit direct submission target 13/15+?** **Yes.** 15/15，超额完成。
- **Did it maintain authenticity ≥ 29.0?** **Partially.** Overall authenticity 28.80，略低于 29.0 目标 0.20 分。A2 和 B2 均达到 29.0；A6 因 Chain-of-Density 策略的部分推断表达被标为 Unclear，拉低整体。但 Jobs v3 真实性仍高于 ChatGPT (28.67)。

### Product Recommendation for grounded-resume Next Iteration

1. **采纳第三轮策略作为默认模式**：输出分离 + 素材密度自适应 + Chain-of-Density  sparse 模式已验证全面领先 ChatGPT。
2. **A6 真实性微调**：Chain-of-Density 的 business relevance pass 中，部分表达（如"面向移动端 AI Agent 场景"）可进一步收紧证据链，或改为更保守的措辞（如"关注移动端 AI Agent 场景中的体验问题"）。
3. **前端产品化**：将 Delivery Resume / Internal Review / Gap Report 三层输出产品化为"投递版""确认版""提升指南"三个 Tab。
4. **扩大样本验证**：在全部 12 个 smoke test 样本上运行第三轮策略，验证泛化能力。

*Report generated: 2026-05-03*
*Round: 3 (output-separated, density-adaptive, claim-verified strategy)*
*Judges: 5 independent blind evaluators*
*Samples: A2, B2, A6*
