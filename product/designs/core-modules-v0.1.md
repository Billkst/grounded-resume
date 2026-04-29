# Core Modules Design v0.1

> **Scope**: 定义 MVP 核心模块的职责边界、输入输出接口、以及模块间交互协议。  
> **Status**: Draft.  
> **对应需求**: Baseline 综合分析报告中的 9 项 MVP 要求。

---

## 模块总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Pipeline Orchestrator                       │
│                     （工作流编排器，非核心模块）                      │
└────────┬─────────────────┬─────────────────┬────────────────────────┘
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │JDParser │      │Material │      │Evidence │
    │         │      │Parser   │      │Mapper   │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                 │
         └────────────────┼─────────────────┘
                          │
                   ┌──────▼──────┐
                   │ Constrained │
                   │  Generator  │
                   └──────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │ExprGuard│     │Redline  │     │Conserv. │
    │         │     │Detector │     │ Mode    │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────▼──────┐
                  │  Validator  │
                  │  (综合校验)  │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │   UserConf  │
                  │  (用户确认)  │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │   Formatter │
                  │ (简历格式化) │
                  └─────────────┘
```

**模块数量**: 9 个核心模块 + 1 个编排器（Pipeline Orchestrator）。  
**设计原则**: 每个模块单一职责、接口明确、可独立测试、可替换实现。

---

## 1. JD 解析层 (JDParser)

> **对应 MVP 要求 1**: 提取岗位要求、技能、经验年限、硬条件

### 1.1 职责

- 接收原始 JD 文本，输出结构化的 `JDParsedResult`
- 识别并分类：硬门槛、核心能力、加分项
- 推断岗位上下文（职级、团队方向、文化信号）
- 保留原文溯源（每个抽取项关联 JD 原文片段）

### 1.2 输入

```typescript
interface JDParserInput {
  jobDescription: string;          // JD 原文
  sourceUrl?: string;              // 招聘页面 URL
}
```

### 1.3 输出

```typescript
interface JDParserOutput {
  result: JDParsedResult;          // 见 data-structures-v0.1.md §2
  confidence: number;              // 解析置信度 0-1
  parserNotes: string[];           // 解析过程中的注释
}
```

### 1.4 内部子组件

| 子组件 | 职责 |
|---|---|
| TextSegmenter | 将 JD 原文分块并分类（描述/要求/加分项/其他） |
| HardExtractor | 从文本块中提取硬门槛 |
| CapabilityExtractor | 从文本块中提取能力要求并标注优先级 |
| ContextInferencer | 基于整体 JD 推断岗位上下文 |

### 1.5 关键设计决策

- **为什么不直接做关键词匹配？**  
  Baseline 测试证明，AI 产品岗的 JD 包含大量抽象要求（如"数据品味""产品判断"），关键词匹配会丢失语义。本模块使用语义理解 + 结构化抽取。

- **置信度低于阈值时怎么办？**  
  当 `confidence < 0.7` 时，系统标记"JD 解析可能不完整"，在确认阶段提示用户复核。

### 1.6 失败模式

| 失败场景 | 处理 |
|---|---|
| JD 过短或格式异常 | 返回低置信度结果，附带"建议检查 JD 完整性" |
| 非中文 JD | MVP 阶段暂不支持，返回错误"仅支持中文 JD" |
| 抽取为空 | 返回空结果，阻断流程，提示用户重新输入 JD |

---

## 2. 素材解析层 (MaterialParser)

> **对应 MVP 要求 2**: 从用户提供的零散素材中抽取结构化经历事实

### 2.1 职责

- 接收 `RawMaterial[]`，输出结构化的 `MaterialParseResult`
- 将口语化描述转化为最小事实单元 `MaterialFact`
- 自动分类素材类型、标注置信度、生成标签
- 识别素材中的矛盾、模糊和缺失

### 2.2 输入

```typescript
interface MaterialParserInput {
  materials: RawMaterial[];        // 用户原始素材包
  targetJob?: JDParsedResult;      // 可选：目标岗位上下文（用于聚焦解析重点）
}
```

### 2.3 输出

```typescript
interface MaterialParserOutput {
  result: MaterialParseResult;     // 见 data-structures-v0.1.md §3
  stats: {
    totalMaterials: number;
    totalFacts: number;
    factsByType: Record<FactType, number>;
    explicitFacts: number;
    inferredFacts: number;
  };
}
```

### 2.4 内部子组件

| 子组件 | 职责 |
|---|---|
| MaterialClassifier | 自动分类素材类型（教育/项目/竞赛/校园/技能） |
| FactExtractor | 从素材中抽取最小事实单元 |
| ConfidenceAssessor | 标注每条事实的置信度（explicit / inferred） |
| TagGenerator | 为事实生成 skillTags / topicTags / outcomeTags |
| ConsistencyChecker | 检测素材间的矛盾和模糊 |

### 2.5 关键设计决策

- **为什么解析时要"去包装"？**  
  用户素材中可能已经含有自我包装（如"精通 Python"但实际只是课程学习）。本模块的任务是还原为事实陈述，包装/降级由后续模块决定。

- **如何处理模糊素材？**  
  不猜测、不补全。标记为 `inferred_weak`，在后续映射中会被降级处理，并在确认阶段提示用户澄清。

### 2.6 失败模式

| 失败场景 | 处理 |
|---|---|
| 素材为空 | 返回错误，阻断流程 |
| 素材无 project/competition 类型 | 返回警告"建议补充项目经历，否则生成结果可能较单薄" |
| 素材严重矛盾 | 生成 critical 级别 ParserNote，在确认阶段高亮 |

---

## 3. 证据映射层 (EvidenceMapper)

> **对应 MVP 要求 3**: 建立 JD 要求与用户素材之间的映射关系，识别匹配项和缺口

### 3.1 职责

- 接收 `JDParsedResult` + `MaterialParseResult`
- 输出 `EvidenceMappingResult`（映射 + gap + overclaim）
- 为每个映射生成自然语言解释（reasoning）
- 评估证据强度并决定表达策略

### 3.2 输入

```typescript
interface EvidenceMapperInput {
  jdResult: JDParsedResult;
  materialResult: MaterialParseResult;
  mappingStrategy?: "strict" | "balanced" | "aggressive";  // 默认 balanced
}
```

### 3.3 输出

```typescript
interface EvidenceMapperOutput {
  result: EvidenceMappingResult;   // 见 data-structures-v0.1.md §4
  coverage: {
    criticalCoverage: number;      // critical 要求覆盖率 0-1
    overallCoverage: number;       // 整体覆盖率 0-1
  };
  riskAssessment: {
    highRiskGaps: number;          // 严重缺口数
    compositeMappings: number;     // 组合映射数（风险信号）
  };
}
```

### 3.4 内部子组件

| 子组件 | 职责 |
|---|---|
| CandidateRetriever | 基于标签召回相关 MaterialFact |
| SimilarityScorer | 计算 JD 要求与事实的语义相似度 |
| StrengthAssessor | 评估证据强度（strong/moderate/weak/insufficient） |
| ReasoningGenerator | 为每个映射生成自然语言解释 |
| GapAnalyzer | 识别未满足的 JD 要求并分类 |

### 3.5 关键设计决策

- **为什么需要 reasoning？**  
  因为抽象 JD 要求（如"数据品味"）与素材事实（如"整理 bad case"）之间的映射不是显然的。reasoning 既是用户确认时的解释，也是审计线索。

- **组合映射的风险控制**：  
  当多个 weak 事实组合成一个 moderate 映射时，系统必须：
  1. 明确标注这是 composite 映射
  2. 在确认阶段重点展示
  3. 使用保守表达（不允许 emphasized）

### 3.6 失败模式

| 失败场景 | 处理 |
|---|---|
| 覆盖率 < 30% | 触发保守模式，生成详细 Gap 报告 |
| 无 strong 证据 | 标记为"低置信度映射"，所有表达强制降级 |
| 大量 composite 映射 | 提示"当前素材与岗位匹配度较低，建议补充素材或调整目标岗位" |

---

## 4. 受约束生成层 (ConstrainedGenerator)

> **对应 MVP 要求 4**: 在真实性约束下生成简历，禁止无证据植入、禁止夸大、禁止新增事实

### 4.1 职责

- 接收 `EvidenceMappingResult`，输出 `ResumeDraft`
- 根据证据强度决定表达强度
- 记录完整的改写链条（RewriteChain）
- 确保每条 bullet 都有证据溯源

### 4.2 输入

```typescript
interface ConstrainedGeneratorInput {
  evidenceMapping: EvidenceMappingResult;
  userProfile: UserProfile;
  preferences?: UserPreferences;
  jobContext: JobContext;
}
```

### 4.3 输出

```typescript
interface ConstrainedGeneratorOutput {
  draft: ResumeDraft;              // 见 data-structures-v0.1.md §5
  generationMetrics: {
    totalBullets: number;
    bulletsByExpressionLevel: Record<ExpressionLevel, number>;
    evidenceCoverage: number;      // 素材利用率
  };
}
```

### 4.4 内部子组件

| 子组件 | 职责 |
|---|---|
| SectionPlanner | 根据岗位类型和素材分布规划简历章节 |
| BulletGenerator | 基于 EvidenceMapping 生成每条 bullet |
| ExpressionSelector | 根据证据强度选择表达强度 |
| EvidenceBinder | 为每条 bullet 绑定 EvidenceRef |
| RewriteLogger | 记录每次改写的理由和操作者 |

### 4.5 核心约束规则

本模块的生成过程受以下规则严格约束：

| 规则编号 | 规则内容 | 违反处理 |
|---|---|---|
| G1 | 每条 bullet 必须关联至少一个 EvidenceMapping | 不生成该 bullet |
| G2 | 不得使用素材 skillTags 中不存在的技能词 | 删除该技能词 |
| G3 | 不得升级角色描述（participant → lead） | 降级为原始角色 |
| G4 | 不得添加素材中无的数字/指标 | 删除数字或模糊化 |
| G5 | 课程项目必须标注"课程项目" | 自动添加标注 |
| G6 | 无时间信息时不编造时间 | 使用"在校期间"等模糊表达 |
| G7 | 弱证据必须使用 conservative 或 literal 表达 | 自动降级 |

### 4.6 关键设计决策

- **为什么生成时要"保守优先"？**  
  Baseline 测试表明，GLM 和 DeepSeek 的弱点是"默认补强"。本模块的默认策略是：如果证据强度不明确，选择更保守的表达。用户可以在确认阶段选择升级，但系统不会主动升级。

### 4.7 失败模式

| 失败场景 | 处理 |
|---|---|
| 无可用 mapping | 生成极简简历（仅基础信息+教育背景），提示补充素材 |
| 所有 mapping 都是 weak | 进入保守模式，所有表达降级，生成简短简历 |
| 生成 bullet 数量过少（<3） | 提示"素材不足，建议补充后重新生成" |

---

## 5. 强表述降级器 (ExpressionGuard)

> **对应 MVP 要求 5**: 对弱素材使用保守表达，而非包装成强经历

### 5.1 职责

- 作为生成后的过滤器，检查每条 bullet 的表达是否过度
- 对过度表达自动降级
- 维护"动词强度表"和"程度词强度表"

### 5.2 输入

```typescript
interface ExpressionGuardInput {
  draft: ResumeDraft;
  evidenceMapping: EvidenceMappingResult;
}
```

### 5.3 输出

```typescript
interface ExpressionGuardOutput {
  revisedDraft: ResumeDraft;
  downgrades: DowngradeRecord[];
}

interface DowngradeRecord {
  bulletId: string;
  originalExpression: string;
  revisedExpression: string;
  reason: string;
  evidenceStrength: EvidenceStrength;
}
```

### 5.4 降级规则库

#### 动词降级表

| 强动词（高风险） | 降级后 | 适用证据强度 |
|---|---|---|
| 主导、负责、带领 | 参与、协助、配合 | weak / moderate |
| 设计、架构、规划 | 参与设计、协助规划 | weak |
| 精通、熟练掌握 | 了解、使用过 | weak / inferred |
| 独立完成 | 在指导下完成 | weak |
| 推动、落地 | 参与推进 | weak |

#### 程度词降级表

| 强程度词 | 降级后 | 适用证据强度 |
|---|---|---|
| 显著、大幅、全面 | 一定、部分 | weak |
| 深度、扎实、系统 | 基础、初步 | weak |
| 丰富、大量、众多 | 若干、一些 | weak |
| 成功、高效、优质 | （删除） | weak |

#### 成果表述降级

| 高风险表述 | 降级后 | 判定条件 |
|---|---|---|
| "提升 30%" | "有所提升" | 素材无具体数字 |
| "服务 1000+ 用户" | "获得一定用户反馈" | 素材无用户规模数据 |
| "获得一等奖" | "参与比赛并获得奖项" | 素材未明确奖项等级 |

### 5.5 关键设计决策

- **为什么不完全禁止强动词？**  
  强证据（strong）确实可以使用强动词。降级器的任务是根据证据强度做"适配"，而不是一刀切。

- **用户能否覆盖降级？**  
  可以。在确认阶段，用户可以查看降级记录并选择恢复原始表达。但系统会标记为"用户覆盖"，并记录原因。

---

## 6. 红线检测器 (RedlineDetector)

> **对应 MVP 要求 6**: 识别并阻止高风险表达（虚构技能、夸大职责、推断指标）

### 6.1 职责

- 扫描 `ResumeDraft` 中的每条 bullet
- 识别六类红线风险
- 对红线内容强制拦截或删除
- 生成风险报告

### 6.2 输入

```typescript
interface RedlineDetectorInput {
  draft: ResumeDraft;
  materialResult: MaterialParseResult;
}
```

### 6.3 输出

```typescript
interface RedlineDetectorOutput {
  cleanDraft: ResumeDraft;         // 清理后的草稿
  riskReport: RiskReport;
  blockedCount: number;            // 拦截的红线条数
}

interface RiskReport {
  flags: RiskFlag[];               // 见 data-structures-v0.1.md §5.1.4
  summary: {
    byType: Record<RiskType, number>;
    bySeverity: Record<"low" | "medium" | "high", number>;
  };
}
```

### 6.4 红线规则库

| 红线类型 | 检测逻辑 | 系统处理 |
|---|---|---|
| 虚构技能 | bullet 中的技能词不在素材 skillTags 中 | 删除该技能词，标记 risk |
| 夸大职责 | 动词强度 > roleIndicator 允许的范围 | 降级动词 |
| 推断指标 | bullet 中出现数字，但素材无对应数字 | 删除数字或模糊化 |
| 时间虚构 | bullet 中的时间范围超出素材 temporalScope | 删除时间或标注"未明确" |
| 课程包装 | 无 work 类型素材但出现实习/工作描述 | 明确标注"课程项目" |
| 关键词植入 | 为匹配 JD 而无证据添加的关键词 | 删除无证据关键词 |

### 6.5 与 ExpressionGuard 的区别

| | ExpressionGuard | RedlineDetector |
|---|---|---|
| 目标 | 弱素材的表述降级 | 识别并拦截高风险内容 |
| 处理强度 | 降级（moderate → conservative） | 拦截或删除 |
| 触发条件 | 证据强度弱 | 违反真实性规则 |
| 输出 | 降级后的 bullet | 清理后的 draft + 风险报告 |

### 6.6 关键设计决策

- **红线内容能否被用户覆盖？**  
  MVP 阶段：**不允许**。红线内容涉及真实性底线，用户不能覆盖。如果用户坚持要保留，系统建议用户先补充素材证据。

---

## 7. 保守模式 (ConservativeMode)

> **对应 MVP 要求 7**: 当 JD 与素材差距大时，采用保守策略 + gap 披露

### 7.1 职责

- 评估当前素材与 JD 的匹配度
- 当匹配度过低时，触发保守生成策略
- 生成 Gap 披露报告
- 调整生成参数（更严格的降级、更短的 bullet、更少的推测）

### 7.2 输入

```typescript
interface ConservativeModeInput {
  evidenceMapping: EvidenceMappingResult;
  draft: ResumeDraft;
}
```

### 7.3 输出

```typescript
interface ConservativeModeOutput {
  mode: "normal" | "conservative" | "minimal";
  adjustments: ConservativeAdjustment[];
  gapReport: GapReport;
}

interface ConservativeAdjustment {
  target: "expression" | "structure" | "scope";
  action: string;
  reason: string;
}
```

### 7.4 触发条件

| 条件 | 阈值 | 进入的模式 |
|---|---|---|
| Critical 覆盖率 | < 30% | minimal |
| Critical 覆盖率 | 30%-60% | conservative |
| 大量 composite mapping | > 50% 的 mapping 是 composite | conservative |
| 大量 weak evidence | > 70% 的 mapping 是 weak | conservative |
| 无 strong evidence | strong = 0 | minimal |

### 7.5 保守策略

#### Normal 模式（默认）

- 标准生成流程
- 表达强度按证据强度正常映射

#### Conservative 模式

- 所有表达强制降级一级（standard → conservative, conservative → literal）
- 禁止 emphasized 表达
- 增加 gap 披露段落（"以下 JD 要求当前素材未能充分支撑..."）
- 建议用户补充素材

#### Minimal 模式

- 仅生成基础信息 + 教育背景 + 技能列表
- 不生成项目经历 bullet（避免无证据编造）
- 详细列出所有 gap
- 强烈建议用户补充素材后重新生成

### 7.6 关键设计决策

- **为什么 gap 要披露而不是隐藏？**  
  Baseline 测试发现，BOSS 简历等工具会隐藏 gap 并用虚构内容填补。保守模式的核心原则是"诚实披露优于勉强匹配"。

---

## 8. 用户确认层 (UserConfirmation)

> **对应 MVP 要求 8**: 让用户能看到每条内容的证据来源，并有权修改或拒绝

### 8.1 职责

- 管理用户确认会话
- 展示 bullet、证据来源、风险提示
- 收集用户决策（认可/修改/拒绝）
- 整合用户反馈生成最终简历

### 8.2 输入

```typescript
interface UserConfirmationInput {
  draft: ResumeDraft;
  evidenceMapping: EvidenceMappingResult;
  validationResult: ValidationResult;
  gapItems: GapItem[];
}
```

### 8.3 输出

```typescript
interface UserConfirmationOutput {
  confirmedResume: ResumeDraft;
  session: ConfirmationSession;    // 见 data-structures-v0.1.md §7
  modifications: UserModification[];
}

interface UserModification {
  bulletId: string;
  type: "approved" | "revised" | "rejected";
  originalText: string;
  finalText?: string;
  timestamp: string;
}
```

### 8.4 确认优先级算法

系统按以下优先级决定展示顺序：

1. **P0（必须处理）**: RiskLevel = redline（虽已拦截，但展示给用户知晓）
2. **P1（高优先级）**: RiskLevel = warning, ExpressionLevel = emphasized, 包含数字
3. **P2（中优先级）**: MappingType = composite, ExpressionLevel = standard
4. **P3（低优先级）**: RiskLevel = safe, ExpressionLevel = literal/conservative

### 8.5 界面信息展示

对每个确认项，系统展示：

```
┌─────────────────────────────────────────┐
│ 📄 简历表达                               │
│ "持续关注近半年 AI 产品动态，整理多款主    │
│  流产品功能更新"                          │
├─────────────────────────────────────────┤
│ 📚 证据来源                               │
│ 原始素材：《市场信息整理》                  │
│ "收集过近半年 AI 产品发布信息，整理过      │
│  5-6 款主流 AI 产品的功能更新"             │
├─────────────────────────────────────────┤
│ 🧠 映射理由                               │
│ JD 要求"具备市场敏锐度和信息收集能力"，    │
│ 素材中体现：主动收集市场信息、持续跟踪     │
│ 多款产品动态。证据强度：moderate           │
├─────────────────────────────────────────┤
│ ⚠️ 风险提示                               │
│ 表达中"持续关注"略强于素材原话"收集过    │
│ 近半年"，系统已做保守处理                  │
├─────────────────────────────────────────┤
│ ✅ 建议：认可                              │
└─────────────────────────────────────────┘
```

### 8.6 关键设计决策

- **为什么证据来源必须展示原文？**  
  Baseline 测试发现，用户不信任 AI 生成的核心原因是"不知道这段话从哪里来的"。展示原文片段是建立信任的关键。

- **用户修改后的文本是否需要重新校验？**  
  是。用户修改可能引入新的风险（如添加了无证据的数字）。系统对用户修改后的文本执行轻量校验，如发现风险则提示用户。

---

## 9. 简历格式化器 (ResumeFormatter)

> **对应 MVP 要求 9**: 中文实习简历场景的结构、表达风格和素材采集策略适配

### 9.1 职责

- 将确认后的 `ResumeDraft` 转化为标准格式的简历文本
- 适配中文实习简历的排版和表达习惯
- 生成附加文档（证据映射表、gap 报告等）
- 输出最终 `ResumeOutput`

### 9.2 输入

```typescript
interface ResumeFormatterInput {
  confirmedResume: ResumeDraft;
  evidenceMapping: EvidenceMappingResult;
  gapItems: GapItem[];
  riskReport: RiskReport;
  userProfile: UserProfile;
  targetJob: TargetJob;
}
```

### 9.3 输出

```typescript
interface ResumeFormatterOutput {
  output: ResumeOutput;            // 见 data-structures-v0.1.md §8
}
```

### 9.4 格式化规则

#### 中文实习简历标准结构

```
【姓名】|【电话】|【邮箱】|【GitHub/博客】

教育背景
───
学校名称 | 专业 | 预计毕业时间
（可选）相关课程、GPA、荣誉

项目经历
───
项目名称 | 时间范围 | 角色
• Bullet 1
• Bullet 2

技能
───
• 技术栈/工具
• 语言能力

补充信息
───
• 竞赛、校园经历、其他
```

#### 表达风格适配

| 场景 | 风格规则 |
|---|---|
| 实习生简历 | 强调学习能力和成长潜力，而非资深经验 |
| 课程项目 | 明确标注"课程项目"，但可以强调所学技能 |
| 无实习经历 | 不编造实习，用项目经历填充 |
| 技术岗位 | 技术关键词前置，强调技术深度 |
| 产品岗位 | 强调产品思维、用户视角、分析能力 |

#### Bullet 格式规范

- 每条 bullet 1-2 行
- 以动词开头（参与、协助、完成、设计、分析...）
- 尽量包含：动作 + 方法/工具 + 结果/影响
- 数字如有素材支撑则保留，否则删除

### 9.5 附加文档生成

| 附件 | 内容 | 用途 |
|---|---|---|
| 证据映射表 | JD 要求 ↔ 简历表达 ↔ 素材来源 | 帮助用户理解生成逻辑 |
| Gap 报告 | 未满足的 JD 要求 + 用户决策 | 让用户知道能力缺口 |
| 风险提示 | 仍存在的 caution/warning | 投递前最后检查 |
| 修改建议 | 如何从 Level 2 进化为 Level 3 | 帮助用户最终定稿 |

### 9.6 关键设计决策

- **为什么先做 Markdown 而不是 PDF？**  
  MVP 阶段追求快速验证。Markdown 足够展示内容质量，且便于用户编辑。PDF 格式可在后续迭代中加入。

- **为什么需要"修改建议"附件？**  
  因为系统输出的是 Level 2（接近可投版），用户需要额外的指导才能进化为 Level 3（确认投递版）。这是产品价值主张的一部分。

---

## 10. 模块间交互协议

### 10.1 标准调用链

```
JDParser → MaterialParser → EvidenceMapper
                                    ↓
                           ConstrainedGenerator
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              ExpressionGuard  RedlineDetector  ConservativeMode
                    └───────────────┬───────────────┘
                                    ↓
                               Validator
                                    ↓
                           UserConfirmation
                                    ↓
                              ResumeFormatter
```

### 10.2 交互规范

1. **单向数据流**：模块之间通过不可变数据对象传递，不共享可变状态
2. **失败传播**：任何模块失败时，返回错误对象而非抛出异常，由编排器决定重试或降级
3. **审计链路**：每个模块的输出必须保留对上游数据的引用 ID，确保端到端溯源
4. **并行可能性**：JDParser 和 MaterialParser 可以并行执行（无依赖）

### 10.3 模块替换策略

每个模块的接口设计允许后续替换实现：

| 模块 | 当前实现策略 | 未来可能替换为 |
|---|---|---|
| JDParser | LLM + 规则混合 | 专用 JD 解析模型 |
| MaterialParser | LLM + 规则混合 | 更精细的 NER 模型 |
| EvidenceMapper | 语义相似度 + 规则 | 训练专门的映射模型 |
| ConstrainedGenerator | LLM + 强 prompt 约束 | 微调后的受约束生成模型 |
| ExpressionGuard | 规则库 | 学习式降级模型 |
| RedlineDetector | 规则 + LLM | 专用风险检测模型 |
| ConservativeMode | 规则 | 自适应策略模型 |
| UserConfirmation | 界面逻辑 | 更丰富的交互设计 |
| ResumeFormatter | 模板引擎 | 更智能的排版引擎 |

---

## 11. 模块与数据结构的对应

| 模块 | 主要读取的数据结构 | 主要输出的数据结构 |
|---|---|---|
| JDParser | `TargetJob` | `JDParsedResult` |
| MaterialParser | `RawMaterial[]` | `MaterialParseResult` |
| EvidenceMapper | `JDParsedResult`, `MaterialParseResult` | `EvidenceMappingResult` |
| ConstrainedGenerator | `EvidenceMappingResult`, `UserProfile`, `JobContext` | `ResumeDraft` |
| ExpressionGuard | `ResumeDraft`, `EvidenceMappingResult` | `ResumeDraft` (revised) |
| RedlineDetector | `ResumeDraft`, `MaterialParseResult` | `ResumeDraft` (cleaned) |
| ConservativeMode | `EvidenceMappingResult`, `ResumeDraft` | `ResumeDraft` (adjusted) |
| UserConfirmation | `ResumeDraft`, `EvidenceMappingResult`, `ValidationResult` | `ConfirmationSession` |
| ResumeFormatter | `ResumeDraft`, `EvidenceMappingResult`, `GapItem[]` | `ResumeOutput` |

---

*文档版本: v0.1*  
*状态: MVP 核心模块设计草稿*  
*关联文档: `product/specs/data-structures-v0.1.md`, `product/designs/mvp-workflow-v0.1.md`*
