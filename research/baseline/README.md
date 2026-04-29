# research/baseline/

本目录存放 Baseline 阶段的全部评测数据、输出、评分卡及分析报告。

## 目录结构

```
baseline/
├── test-cases/
│   └── smoke/                    # Smoke Test 样本（含公开输入、隐藏评测、系统输出、评分卡）
├── smoke-test/
│   ├── outputs/
│   │   ├── llm/                  # B 类通用 LLM 输出（chatgpt, claude, glm 等）
│   │   └── c-tools/              # C 类专用 AI 简历工具输出
│   └── scorecards/
│       ├── llm/                  # B 类通用 LLM 评分卡
│       └── c-tools/              # C 类专用 AI 简历工具评分卡
├── deep-test/
│   ├── outputs/
│   │   └── llm/                  # Deep Test 输出（chatgpt, deepseek, glm）
│   ├── scorecards/
│   │   └── llm/                  # Deep Test 评分卡
│   └── deep_test_execution_checklist.md
├── repo-reviews/                 # D 类开源项目评审（6 个项目）
├── capability-matrix/            # D 类开源项目能力矩阵
└── reports/                      # 综合分析报告与汇总
```

## 测试样本索引

### Smoke Test 样本（12 组）

位于 `test-cases/smoke/`：

| 样本 | 岗位类型 | 素材完整度 | 风险等级 | 公司 |
|---|---|---|---|---|
| A1 | AI 产品岗 | 完整 | 低风险 | 智谱 |
| A2 | AI 产品岗 | 完整 | 中风险 | 字节跳动 |
| A3 | AI 产品岗 | 完整 | 高风险 | 字节跳动 |
| A4 | AI 产品岗 | 零散 | 中风险 | 百度 |
| A5 | AI 产品岗 | 零散 | 中风险 | MiniMax |
| A6 | AI 产品岗 | 零散 | 高风险 | 美团 |
| B1 | AI 应用开发 / 技术产品交叉岗 | 完整 | 低风险 | 小红书 |
| B2 | AI 应用开发 / 技术产品交叉岗 | 完整 | 中风险 | 小红书 |
| B3 | AI 应用开发 / 技术产品交叉岗 | 完整 | 高风险 | 商汤 |
| B4 | AI 应用开发 / 技术产品交叉岗 | 零散 | 低风险 | 百度 |
| B5 | AI 应用开发 / 技术产品交叉岗（边界样本） | 零散 | 中风险 | 腾讯 |
| B6 | AI 应用开发 / 技术产品交叉岗 | 零散 | 高风险 | 美团 |

### Deep Test 样本

沿用 Smoke Test 全部 12 组样本，对 finalist（ChatGPT / DeepSeek / GLM）跑完整评测。

## 报告索引

| 报告 | 路径 |
|---|---|
| Baseline 综合分析报告 v1.0 | `reports/Baseline 综合分析报告 v1.0.md` |
| Smoke Test 汇总 | `reports/smoke-summary.md` |
| Deep Test 汇总 | `reports/deep-summary.md` |
| C 类工具 Smoke Test 汇总 | `reports/c-tools-smoke-summary.md` |
| 通用 LLM Smoke Test 误差分析 | `reports/通用 LLM Smoke Test 误差分析报告 v0.1.md` |
