# C 类工具 Smoke Test 执行清单

| 工具 | A2 | B2 | A6 | 任务适配度初判 | 是否完成 | 备注 |
|---|---|---|---|---|---|---|
| WonderCV / 超级简历 | 已完成 | 已完成 | 已完成 | Partial Fit | 是 | 偏已有简历 + JD 分析/优化，不支持 JD + 原始素材从零生成完整简历 |
| BOSS 直聘简历 | 已完成 | 已完成 | 已完成 | Partial Fit | 是 | 可生成简历，但输出严重虚构和过度包装，不建议进入 Deep Test |
| 全民简历 | 已完成 | 已完成 | 已完成 | Partial Fit | 是 | 偏结构化表单 AI 简历生成，不支持完整 JD + 原始素材包输入 |
| Rezi | Deferred | Deferred | Deferred | Deferred | 否 | 英文简历工具，暂不纳入中文 MVP v0.1 对标 |
| Teal | Deferred | Deferred | Deferred | Deferred | 否 | 英文简历工具，暂不纳入中文 MVP v0.1 对标 |
| Oaki | Deferred | Deferred | Deferred | Deferred | 否 | 英文求职工具，暂不纳入中文 MVP v0.1 对标 |

## 执行提醒

1. 优先测试是否能完成"JD + 原始素材 → 第一版简历"。
2. 如果工具要求已有简历，必须记录。
3. 如果工具只能做 ATS match / keyword scan，不要强行评分。
4. 如果工具不支持中文，可以尝试英文流程，但必须记录语言限制。
5. 所有输出原样保存。
