# Data Structures Specification v0.1

> **Scope**: 定义 MVP 工作流中各阶段交换的数据 Schema。  
> **Status**: Draft for MVP Workflow Design Phase.  
> **Principle**: 所有数据结构必须支持"可审计"——即每条输出都能追溯到输入来源。

---

## 1. 用户输入层 (User Input)

### 1.1 UserInput

MVP 阶段用户需要提供的全部输入。

```typescript
interface UserInput {
  // 基础身份信息
  profile: UserProfile;

  // 目标岗位
  targetJob: TargetJob;

  // 原始素材包
  materials: RawMaterial[];

  // 可选：用户偏好
  preferences?: UserPreferences;
}
```

#### 1.1.1 UserProfile

```typescript
interface UserProfile {
  name: string;                    // 姓名
  email: string;                   // 邮箱
  phone?: string;                  // 电话（可选）
  github?: string;                 // GitHub（可选）
  blog?: string;                   // 个人博客（可选）
  location?: string;               // 所在城市（可选）
}
```

#### 1.1.2 TargetJob

```typescript
interface TargetJob {
  companyName: string;             // 公司名
  jobTitle: string;                // 岗位名称
  jobDescription: string;          // JD 原文（完整粘贴）
  sourceUrl?: string;              // 招聘页面 URL（可选，用于溯源）
}
```

#### 1.1.3 RawMaterial

用户提供的原始素材，最小粒度为"一段描述"。

```typescript
interface RawMaterial {
  id: string;                      // 唯一标识，如 "M001"
  type: MaterialType;              // 素材类型
  title: string;                   // 素材标题（用户自填或系统默认）
  content: string;                 // 原始内容（保留用户原话）
  timestamp?: string;              // 时间范围（如 "2024.03 - 2024.06"）
  sourceHint?: string;             // 用户补充的上下文（如"这是课程大作业"）
}

type MaterialType =
  | "education"        // 教育背景
  | "project"          // 项目经历（课程项目、个人项目、科研）
  | "competition"      // 竞赛经历
  | "campus"           // 校园经历（社团、学生会、志愿者）
  | "skill"            // 技能自评
  | "work"             // 实习/工作（如有）
  | "other";           // 其他
```

#### 1.1.4 UserPreferences

```typescript
interface UserPreferences {
  // 表达风格偏好
  tone?: "conservative" | "balanced" | "confident";  // 默认 balanced

  // 是否允许系统对弱素材进行降级表达（而非直接删除）
  allowDowngrade?: boolean;        // 默认 true

  // 是否显示 gap 分析
  showGapAnalysis?: boolean;       // 默认 true

  // 最大简历长度偏好（以 bullet 数估算）
  maxBullets?: number;             // 默认 8-10 条
}
```

---

## 2. JD 解析层 (JD Parsing)

### 2.1 JDParsedResult

JD 解析后的结构化结果。

```typescript
interface JDParsedResult {
  jobId: string;                   // 关联的 TargetJob 标识
  hardRequirements: HardRequirement[];     // 硬门槛（必须满足）
  coreCapabilities: CapabilityRequirement[]; // 核心能力要求
  niceToHave: CapabilityRequirement[];       // 加分项
  derivedContext: JobContext;      // 推导出的岗位上下文
  parserConfidence: number;        // 解析置信度 0-1
  rawExcerpts: JDExcerpt[];        // 原始文本切片（用于溯源）
}
```

#### 2.1.1 HardRequirement

```typescript
interface HardRequirement {
  id: string;                      // 如 "H001"
  category: HardType;
  description: string;             // 要求描述（系统提取）
  sourceText: string;              // JD 原文片段
  isSatisfiableByEvidence: boolean; // 是否可通过素材证据直接验证
}

type HardType =
  | "education"        // 学历要求
  | "major"            // 专业要求
  | "location"         // 地点/到岗要求
  | "availability"     // 实习时长/每周天数
  | "language"         // 语言要求
  | "tool"             // 特定工具/软件
  | "visa"             // 签证/身份
  | "other";           // 其他硬条件
```

#### 2.1.2 CapabilityRequirement

```typescript
interface CapabilityRequirement {
  id: string;                      // 如 "C001"
  capability: string;              // 能力名称（系统提炼）
  description: string;             // 能力描述
  evidenceType: EvidenceType;      // 需要什么类型的证据来支撑
  priority: "critical" | "important" | "nice_to_have";
  sourceText: string;              // JD 原文片段
  relatedKeywords: string[];       // 相关关键词
}

// 证据类型：系统根据 JD 要求推断需要什么样的素材证据
type EvidenceType =
  | "project_outcome"      // 项目成果
  | "technical_depth"      // 技术深度
  | "product_judgment"     // 产品判断
  | "research_analysis"    // 研究分析
  | "collaboration"        // 协作经历
  | "learning_agility"     // 学习能力
  | "communication";       // 沟通能力
```

#### 2.1.3 JobContext

```typescript
interface JobContext {
  jobLevel: "intern" | "junior" | "mid" | "senior";  // 职级推断
  teamFocus: string[];             // 团队方向标签
  productStage?: string;           // 产品阶段（如"早期探索"/"成熟迭代"）
  techStackMentioned: string[];    // JD 中提到的技术栈
  cultureSignals: string[];        // 文化信号（如"快节奏""研究驱动"）
}
```

#### 2.1.4 JDExcerpt

```typescript
interface JDExcerpt {
  id: string;
  text: string;                    // 原文片段
  section: "description" | "requirements" | "preferred" | "other";
  lineNumber?: number;             // 原文行号（如果可用）
}
```

---

## 3. 素材解析层 (Material Parsing)

### 3.1 MaterialParseResult

将用户原始素材解析为结构化事实。

```typescript
interface MaterialParseResult {
  facts: MaterialFact[];           // 抽取的事实
  fragments: SourceFragment[];     // 原始文本切片（用于证据溯源）
  parserNotes: ParserNote[];       // 解析过程中的注释/警告
}
```

#### 3.1.1 MaterialFact

素材解析后的最小事实单元。

```typescript
interface MaterialFact {
  id: string;                      // 如 "F001"
  sourceMaterialId: string;        // 关联的 RawMaterial.id
  factType: FactType;

  // 事实内容（保留用户原意，不做包装）
  statement: string;               // 陈述句形式的事实

  // 元数据
  confidence: FactConfidence;      // 解析置信度
  temporalScope?: string;          // 时间范围
  roleIndicator?: RoleLevel;       // 角色/贡献度指示

  // 可用于后续映射的标签
  skillTags: string[];             // 涉及的技能标签
  topicTags: string[];             // 涉及的主题标签
  outcomeTags: string[];           // 涉及的成果类型标签
}

type FactType =
  | "action"           // 用户做过什么（"整理过知识库"）
  | "outcome"          // 产生的成果（"完成 5-6 款产品功能更新整理"）
  | "skill_possessed"  // 掌握的技能（"会 Python"）
  | "skill_used"       // 使用过的技能（"用 Figma 做过原型"）
  | "knowledge"        // 知识/认知（"理解 Agent 与 Workflow 差异"）
  | "trait";           // 特质/软素质（"对市场变化敏感"）

type FactConfidence =
  | "explicit"         // 用户明确陈述（"我负责整理知识库"）
  | "inferred_weak"    // 弱推断（"我参加过这个项目"→可能参与过协作）
  | "inferred_strong"; // 强推断（"独立开发"→具备技术深度）

type RoleLevel =
  | "solo"             // 独立完成
  | "lead"             // 主导/负责
  | "core"             // 核心成员
  | "participant"      // 参与者
  | "observer";        // 观察者/学习者
```

#### 3.1.2 SourceFragment

```typescript
interface SourceFragment {
  id: string;
  materialId: string;              // 关联 RawMaterial.id
  text: string;                    // 原始文本片段
  startOffset: number;             // 在原始素材中的起始位置
  endOffset: number;               // 结束位置
}
```

#### 3.1.3 ParserNote

```typescript
interface ParserNote {
  level: "info" | "warning" | "critical";
  materialId: string;
  message: string;                 // 如 "素材描述模糊，建议用户补充具体时间"
}
```

---

## 4. 证据映射层 (Evidence Mapping)

### 4.1 EvidenceMappingResult

JD 要求与素材事实之间的映射关系。

```typescript
interface EvidenceMappingResult {
  mappings: EvidenceMapping[];     // 成功映射的关系
  gaps: GapItem[];                 // 未满足的 JD 要求
  overclaims: OverclaimItem[];     // 素材中无法被 JD 利用的"过剩"内容
  mappingConfidence: number;       // 整体映射置信度
}
```

#### 4.1.1 EvidenceMapping

```typescript
interface EvidenceMapping {
  id: string;                      // 如 "EM001"
  jdRequirementId: string;         // 关联的 CapabilityRequirement.id
  materialFactIds: string[];       // 支撑该要求的事实 ID 列表
  mappingType: MappingType;
  strength: EvidenceStrength;      // 证据强度
  reasoning: string;               // 映射理由（为什么这个事实能支撑这个要求）
  directQuote: string;             // 用户原话引用（用于用户确认时展示）
}

type MappingType =
  | "direct"           // 直接对应（JD 要求"会用 Python"，素材"会 Python"）
  | "semantic"         // 语义对应（JD 要求"数据品味"，素材"整理 bad case 并分类"）
  | "inferential"      // 推断对应（JD 要求"产品判断"，素材"做过竞品功能对比"）
  | "composite";       // 组合对应（多个弱事实组合支撑一个要求）

type EvidenceStrength =
  | "strong"           // 强证据（直接匹配，素材明确支持）
  | "moderate"         // 中等证据（语义相关，但需一定解释）
  | "weak"             // 弱证据（间接相关，只能做保守表达）
  | "insufficient";    // 证据不足（无法支撑，需 gap 披露）
```

#### 4.1.2 GapItem

```typescript
interface GapItem {
  id: string;
  jdRequirementId: string;         // 关联的 JD 要求
  gapType: GapType;
  description: string;             // gap 描述
  severity: "critical" | "major" | "minor";
  recommendation?: string;         // 给用户的建议（如"建议补充相关项目经历"）
}

type GapType =
  | "missing_evidence"     // 完全无证据
  | "insufficient_depth"   // 有证据但深度不足
  | "unclear_scope"        // 证据范围不明确
  | "temporal_mismatch";   // 时间范围不匹配
```

#### 4.1.3 OverclaimItem

```typescript
interface OverclaimItem {
  id: string;
  materialFactId: string;          // 未被利用的事实
  reason: string;                  // 未被利用的原因
  suggestion?: string;             // 是否建议放入"补充信息"栏
}
```

---

## 5. 简历生成层 (Resume Generation)

### 5.1 ResumeDraft

生成过程中的简历草稿。

```typescript
interface ResumeDraft {
  version: number;                 // 生成轮次
  sections: ResumeSection[];
  generationLog: GenerationLog[];  // 生成决策日志（用于审计）
  riskFlags: RiskFlag[];           // 生成阶段发现的风险标记
}
```

#### 5.1.1 ResumeSection

```typescript
interface ResumeSection {
  id: string;
  sectionType: SectionType;
  title: string;                   // 如 "项目经历"
  bullets: ResumeBullet[];
  order: number;                   // 排序权重
}

type SectionType =
  | "basic_info"       // 基本信息
  | "education"        // 教育背景
  | "experience"       // 经历（项目/实习/竞赛等）
  | "skills"           // 技能
  | "summary"          // 个人总结（可选）
  | "additional";      // 补充信息
```

#### 5.1.2 ResumeBullet

简历中的每一条内容（bullet）。

```typescript
interface ResumeBullet {
  id: string;
  text: string;                    // 最终展示文本
  evidenceRefs: EvidenceRef[];     // 证据引用
  expressionLevel: ExpressionLevel; // 表达强度
  rewriteChain: RewriteStep[];     // 改写历史（用于审计）
  riskLevel: RiskLevel;
  userOverride?: UserOverride;     // 用户覆盖（在确认阶段填写）
}

interface EvidenceRef {
  mappingId: string;               // EvidenceMapping.id
  factIds: string[];               // 引用的 MaterialFact.id
  sourceFragments: string[];       // SourceFragment.id（用户可查看的原文）
}

type ExpressionLevel =
  | "literal"          //  literal 表达，几乎原话转述
  | "conservative"     // 保守表达，弱化动词和程度
  | "standard"         // 标准简历表达
  | "emphasized";      // 适度强调（仅限强证据）

type RiskLevel =
  | "safe"             // 安全，无风险
  | "caution"          // 需谨慎，存在弱推断
  | "warning"          // 警告，存在较大推断或模糊性
  | "redline";         // 红线，必须拦截或降级

interface RewriteStep {
  step: number;
  from: string;
  to: string;
  reason: string;                  // 改写原因
  operator: "system" | "guardrail" | "user";
}

interface UserOverride {
  approved: boolean;               // 用户是否认可
  modifiedText?: string;           // 用户修改后的文本
  rejectionReason?: string;        // 用户拒绝理由
}
```

#### 5.1.3 GenerationLog

```typescript
interface GenerationLog {
  step: string;                    // 如 "section_ordering"
  decision: string;                // 如 "将项目经历排在教育背景之后"
  rationale: string;               // 决策理由
}
```

#### 5.1.4 RiskFlag

```typescript
interface RiskFlag {
  bulletId: string;
  riskType: RiskType;
  severity: "low" | "medium" | "high";
  description: string;
  suggestedFix: string;
  autoResolved: boolean;           // 是否已被系统自动处理
}

type RiskType =
  | "fabrication"          // 疑似虚构
  | "exaggeration"         // 疑似夸大
  | "role_inflation"       // 角色升级（"参与"→"主导"）
  | "outcome_inference"    // 推断成果
  | "scope_ambiguity"      // 范围模糊
  | "temporal_fabrication" // 时间虚构
  | "keyword_injection";   // 无证据关键词植入
```

---

## 6. 校验层 (Validation)

### 6.1 ValidationResult

对生成简历的多维度校验结果。

```typescript
interface ValidationResult {
  passed: boolean;                 // 是否通过校验
  checks: CheckResult[];           // 各检查项结果
  overallScore: ValidationScore;
  mandatoryRevisions: RevisionItem[];  // 必须修改项
  suggestedRevisions: RevisionItem[];  // 建议修改项
}
```

#### 6.1.1 CheckResult

```typescript
interface CheckResult {
  checkId: string;
  checkName: string;               // 如 "真实性检查"
  passed: boolean;
  score: number;                   // 0-100
  findings: Finding[];
}

interface Finding {
  bulletId: string;
  issue: string;
  severity: "info" | "warning" | "error";
  evidence?: string;               // 发现依据
}
```

#### 6.1.2 ValidationScore

```typescript
interface ValidationScore {
  authenticity: number;            // 真实性得分
  jdAlignment: number;             // 岗位匹配度
  expressionQuality: number;       // 表达质量
  structuralCompleteness: number;  // 结构完整度
  modificationCostEstimate: number; // 预估修改成本（越低越好）
}
```

#### 6.1.3 RevisionItem

```typescript
interface RevisionItem {
  id: string;
  bulletId: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  priority: "mandatory" | "suggested";
  resolved: boolean;
}
```

---

## 7. 用户确认层 (User Confirmation)

### 7.1 ConfirmationSession

用户确认阶段的完整会话。

```typescript
interface ConfirmationSession {
  sessionId: string;
  resumeVersion: number;
  items: ConfirmationItem[];
  userDecisions: UserDecision[];
  finalResume: ResumeDraft;
  gapAcknowledgments: GapAcknowledgment[];
}
```

#### 7.1.1 ConfirmationItem

```typescript
interface ConfirmationItem {
  id: string;
  bulletId: string;
  proposedText: string;
  evidencePreview: EvidencePreview; // 证据来源预览
  riskNotes: string[];             // 风险提示
  systemRecommendation: "approve" | "revise" | "reject";
}

interface EvidencePreview {
  sourceMaterialTitle: string;     // 原始素材标题
  directQuotes: string[];          // 用户原话引用
  mappingReasoning: string;        // 系统映射理由
}
```

#### 7.1.2 UserDecision

```typescript
interface UserDecision {
  confirmationItemId: string;
  decision: "approve" | "revise" | "reject";
  revisedText?: string;            // 如选择 revise
  userComment?: string;            // 用户备注
  timestamp: string;
}
```

#### 7.1.3 GapAcknowledgment

```typescript
interface GapAcknowledgment {
  gapId: string;
  userAction: "accept" | "will_supplement" | "acknowledge";
  userComment?: string;
}
```

---

## 8. 输出层 (Output)

### 8.1 ResumeOutput

最终交付给用户的结果。

```typescript
interface ResumeOutput {
  // 接近可投版简历
  resume: ResumeDraft;

  // 元信息
  metadata: OutputMetadata;

  // 辅助信息
  attachments: OutputAttachment[];
}
```

#### 8.1.1 OutputMetadata

```typescript
interface OutputMetadata {
  targetJob: TargetJob;            // 目标岗位信息
  generationTimestamp: string;     // 生成时间
  version: string;                 // 系统版本
  confidence: number;              // 整体置信度
  materialCoverage: number;        // 素材利用率
  gapCount: number;                // 未满足要求数
}
```

#### 8.1.2 OutputAttachment

```typescript
interface OutputAttachment {
  type: AttachmentType;
  title: string;
  content: string;                 // Markdown 或 JSON
}

type AttachmentType =
  | "evidence_map"       // 证据映射表
  | "gap_report"         // Gap 分析报告
  | "risk_summary"       // 风险摘要
  | "modification_guide"; // 修改建议指南
```

---

## 9. 跨层关联图

```
UserInput
  ├── UserProfile ──────→ ResumeDraft.sections[basic_info]
  ├── TargetJob ────────→ JDParsedResult
  └── RawMaterial[] ────→ MaterialParseResult.facts[]
                               ↓
                        EvidenceMappingResult
                               ↓
                        ResumeDraft
                               ↓
                        ValidationResult
                               ↓
                        ConfirmationSession
                               ↓
                        ResumeOutput
```

**关联规则**:

1. 每条 `ResumeBullet` 必须通过 `EvidenceRef` 关联到至少一个 `MaterialFact`
2. 每个 `MaterialFact` 必须保留到 `RawMaterial` 的溯源链路
3. 每个 `GapItem` 必须关联到具体的 `CapabilityRequirement`
4. 每次 `RewriteStep` 必须记录操作理由和操作者
5. `RiskFlag.riskLevel = "redline"` 的 bullet 不得进入最终输出，除非用户明确覆盖

---

## 10. 关键设计决策

### 10.1 为什么用 `MaterialFact` 而不是直接引用 `RawMaterial`

- `RawMaterial` 是用户提供的原始文本，可能包含冗余、口语化、甚至矛盾的内容
- `MaterialFact` 是解析后的结构化事实，便于与 JD 要求进行精确映射
- 保留 `SourceFragment` 确保审计链路不中断

### 10.2 为什么 `EvidenceMapping` 需要 `reasoning` 字段

- 抽象 JD 要求（如"数据品味"）与素材事实（如"整理 bad case"）之间的映射不是显然的
- `reasoning` 记录系统的映射逻辑，用于用户确认时解释"为什么这段经历能支撑这个要求"
- 也是后续评测和迭代的重要审计数据

### 10.3 为什么 `ResumeBullet` 需要 `rewriteChain`

- Baseline 测试发现，通用 LLM 经常"越改越包装"
- `rewriteChain` 强制记录每次文本变更的原因和审批者
- 支持"回滚到上一版本"和"查看修改历史"

### 10.4 为什么 `ExpressionLevel` 区分四个档位

- Baseline 中 ChatGPT 的优势是"克制"，GLM/DeepSeek 的弱点是"过度包装"
- 通过显式标注表达强度，系统可以：
  - 对弱证据强制使用 `literal` 或 `conservative`
  - 对强证据允许 `standard` 或 `emphasized`
  - 在确认界面向用户解释"为什么这条用了保守表达"

### 10.5 为什么 `GapItem` 区分四种类型

- 不是所有 gap 都一样严重
- `missing_evidence` → 完全无素材，需用户补充或接受
- `insufficient_depth` → 有素材但不够深入，系统可用保守表达
- `unclear_scope` → 素材范围模糊，需用户澄清
- `temporal_mismatch` → 时间不匹配（如要求"3 个月以上"但素材只有"2 周"）

---

*文档版本: v0.1*  
*状态: MVP 工作流设计阶段草稿*  
*关联文档: `product/designs/mvp-workflow-v0.1.md`, `product/designs/core-modules-v0.1.md`*
