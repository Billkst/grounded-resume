# B 类 Deep Test 执行清单

## 1. 评测对象

| 系统 | 定位 | 是否完成 12 case |
|---|---|---|
| ChatGPT | 强 baseline | 否 |
| GLM | 高风险观察 baseline | 否 |
| DeepSeek | 高风险观察 baseline | 否 |

## 2. 样本清单

| 样本编号 | 样本目录 | public input 路径 | ChatGPT | GLM | DeepSeek |
|---|---|---|---|---|---|
| A1 | research/baseline/test-cases/smoke/A1_zhipu_glm_ai_product | research/baseline/test-cases/smoke/A1_zhipu_glm_ai_product/01_public_input.md | 待跑 | 待跑 | 待跑 |
| A2 | research/baseline/test-cases/smoke/A2_bytedance_devservice_ai_product | research/baseline/test-cases/smoke/A2_bytedance_devservice_ai_product/01_public_input.md | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 |
| A3 | research/baseline/test-cases/smoke/A3_bytedance_trae_ai_product | research/baseline/test-cases/smoke/A3_bytedance_trae_ai_product/01_public_input.md | 待跑 | 待跑 | 待跑 |
| A4 | research/baseline/test-cases/smoke/A4_baidu_ai_product_function | research/baseline/test-cases/smoke/A4_baidu_ai_product_function/01_public_input.md | 待跑 | 待跑 | 待跑 |
| A5 | research/baseline/test-cases/smoke/A5_minimax_aigc_agent_product | research/baseline/test-cases/smoke/A5_minimax_aigc_agent_product/01_public_input.md | 待跑 | 待跑 | 待跑 |
| A6 | research/baseline/test-cases/smoke/A6_meituan_ai_agent_pm | research/baseline/test-cases/smoke/A6_meituan_ai_agent_pm/01_public_input.md | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 |
| B1 | research/baseline/test-cases/smoke/B1_xiaohongshu_pe_ai_app_pm | research/baseline/test-cases/smoke/B1_xiaohongshu_pe_ai_app_pm/01_public_input.md | 待跑 | 待跑 | 待跑 |
| B2 | research/baseline/test-cases/smoke/B2_xiaohongshu_product_engineer_ai_app | research/baseline/test-cases/smoke/B2_xiaohongshu_product_engineer_ai_app/01_public_input.md | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 | 已有 Smoke 输出，可重跑 Deep 或复用需标注 |
| B3 | research/baseline/test-cases/smoke/B3_sensetime_large_model_tech_product | research/baseline/test-cases/smoke/B3_sensetime_large_model_tech_product/01_public_input.md | 待跑 | 待跑 | 待跑 |
| B4 | research/baseline/test-cases/smoke/B4_baidu_wenxin_kuaima_product | research/baseline/test-cases/smoke/B4_baidu_wenxin_kuaima_product/01_public_input.md | 待跑 | 待跑 | 待跑 |
| B5 | research/baseline/test-cases/smoke/B5_tencent_pm_tech_bg | research/baseline/test-cases/smoke/B5_tencent_pm_tech_bg/01_public_input.md | 待跑 | 待跑 | 待跑 |
| B6 | research/baseline/test-cases/smoke/B6_meituan_llm_agent_product | research/baseline/test-cases/smoke/B6_meituan_llm_agent_product/01_public_input.md | 待跑 | 待跑 | 待跑 |

## 3. 执行规则

1. 每次只输入对应样本的 `01_public_input.md`。
2. 不输入 hidden risk notes。
3. 不输入 scorecard。
4. 不针对某个模型单独改 prompt。
5. 输出必须原样粘贴到 `research/baseline/deep-test/outputs/llm/{model}/{case}_output.md`。
6. 如果复用 Smoke Test 的 A2/B2/A6 输出，必须在对应输出文件的"输出备注"里写明"复用 Smoke Test 输出"；如果重跑，则写明"Deep Test 重跑输出"。
7. 建议优先重跑 A2/B2/A6，保证 Deep Test 的 12 case 是同一轮执行结果。

## 4. Deep Test 重点观察项

- A3 / A6 / B3 / B6：高风险样本，重点观察是否虚构或过度包装。
- A4：人工复核后上调为中风险，重点观察模型是否把弱素材写成强 Coding Agent 经验。
- B5：边界样本，参与评分，但系统级结论中单独分析；统计 B 类表现时建议同时给出含 B5 和不含 B5 两组结果。
- A1 / B1 / B4：低风险样本，重点观察模型在容易场景下是否仍然过度包装。

## 5. 跑完后的下一步

1. 创建 `research/baseline/deep-test/scorecards/llm/`。
2. 为 3 个系统 × 12 case 创建并填写 scorecard。
3. 创建 `research/baseline/deep-test/outputs/llm/deep_summary.md`。
4. 输出系统级对比：
   - 平均分
   - 红线样本数
   - 真实性均分
   - 修改成本均分
   - 高风险样本表现
   - 含 B5 / 不含 B5 两组结果
5. 再决定是否进入 A/C/D 类 baseline。
