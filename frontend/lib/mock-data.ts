import type {
  ResumeBullet,
  GapItem,
  ResumeOutput,
  ResumeDraft,
  ResumeSection,
  OutputMetadata,
  OutputAttachment,
  EvidenceRef,
  RewriteStep,
  TargetJob,
} from "./types";

const mockTargetJob: TargetJob = {
  companyName: "字节跳动",
  jobTitle: "AI产品经理实习生",
  jobDescription:
    "负责 AI 创新产品功能迭代，参与用户调研与需求分析，协助完成产品原型设计与数据效果复盘。要求具备产品 sense、数据分析能力，熟悉 Python/SQL 优先。",
  sourceUrl: "https://jobs.bytedance.com/example",
};

const mockEvidenceRef1: EvidenceRef = {
  mappingId: "EM001",
  factIds: ["F001", "F002"],
  sourceFragments: ["SF001", "SF002"],
};

const mockEvidenceRef2: EvidenceRef = {
  mappingId: "EM002",
  factIds: ["F003"],
  sourceFragments: ["SF003"],
};

const mockRewriteChain1: RewriteStep[] = [
  {
    step: 1,
    from: "整理了 5-6 款 AI 产品功能更新，写了分析报告",
    to: "参与整理 5-6 款 AI 产品功能更新，输出结构化分析报告",
    reason: "弱化动词强度以匹配保守表达策略",
    operator: "system",
  },
];

const mockRewriteChain2: RewriteStep[] = [
  {
    step: 1,
    from: "参与用户调研，做了 20 多个访谈",
    to: "主导用户调研模块，独立完成 20+ 用户访谈并提炼 3 条产品优化建议",
    reason: "增强表达以突出产品判断力",
    operator: "system",
  },
  {
    step: 2,
    from: "主导用户调研模块，独立完成 20+ 用户访谈并提炼 3 条产品优化建议",
    to: "主导用户调研模块，独立完成 20+ 用户访谈并提炼 3 条产品优化建议",
    reason: "guardrail 触发：角色升级检测（参与→主导），建议保留但标记 warning",
    operator: "guardrail",
  },
];

export const mockBullets: ResumeBullet[] = [
  {
    id: "B001",
    text: "参与整理 5-6 款 AI 产品功能更新，输出结构化分析报告，为团队迭代提供参考",
    evidenceRefs: [mockEvidenceRef1],
    expressionLevel: "conservative",
    rewriteChain: mockRewriteChain1,
    riskLevel: "safe",
  },
  {
    id: "B002",
    text: "主导用户调研模块，独立完成 20+ 用户访谈并提炼 3 条产品优化建议",
    evidenceRefs: [mockEvidenceRef2],
    expressionLevel: "standard",
    rewriteChain: mockRewriteChain2,
    riskLevel: "warning",
  },
];

export const mockGaps: GapItem[] = [
  {
    id: "G001",
    jdRequirementId: "C003",
    gapType: "missing_evidence",
    description: "JD 要求具备数据分析能力（SQL/Python），现有素材中未体现相关经历",
    severity: "major",
    recommendation: "建议补充课程作业或自学项目，证明具备基础数据分析能力",
  },
];

const mockSections: ResumeSection[] = [
  {
    id: "S001",
    sectionType: "basic_info",
    title: "基本信息",
    bullets: [],
    order: 1,
  },
  {
    id: "S002",
    sectionType: "education",
    title: "教育背景",
    bullets: [
      {
        id: "B003",
        text: "某某大学 · 计算机科学与技术 · 本科 · 2022.09 - 2026.06",
        evidenceRefs: [
          {
            mappingId: "EM003",
            factIds: ["F004"],
            sourceFragments: ["SF004"],
          },
        ],
        expressionLevel: "literal",
        rewriteChain: [],
        riskLevel: "safe",
      },
    ],
    order: 2,
  },
  {
    id: "S003",
    sectionType: "experience",
    title: "项目经历",
    bullets: mockBullets,
    order: 3,
  },
  {
    id: "S004",
    sectionType: "skills",
    title: "技能",
    bullets: [
      {
        id: "B004",
        text: "产品工具：Figma、Axure；技术栈：Python（基础）、Markdown",
        evidenceRefs: [
          {
            mappingId: "EM004",
            factIds: ["F005"],
            sourceFragments: ["SF005"],
          },
        ],
        expressionLevel: "standard",
        rewriteChain: [],
        riskLevel: "safe",
      },
    ],
    order: 4,
  },
];

const mockResumeDraft: ResumeDraft = {
  version: 1,
  sections: mockSections,
  generationLog: [
    {
      step: "section_ordering",
      decision: "将项目经历排在教育背景之后",
      rationale: "用户为在校生，项目经历比教育背景更能体现岗位匹配度",
    },
    {
      step: "tone_selection",
      decision: "对弱证据使用 conservative 表达",
      rationale: "Bullet B001 的 evidence strength 为 moderate，降级表达以控制风险",
    },
  ],
  riskFlags: [
    {
      bulletId: "B002",
      riskType: "role_inflation",
      severity: "medium",
      description: "素材原文为'参与用户调研'，生成文本升级为'主导用户调研模块'",
      suggestedFix: "建议用户确认实际角色，或降级为'参与并负责访谈执行'",
      autoResolved: false,
    },
  ],
};

const mockMetadata: OutputMetadata = {
  targetJob: mockTargetJob,
  generationTimestamp: new Date().toISOString(),
  version: "0.1.0",
  confidence: 0.72,
  materialCoverage: 0.65,
  gapCount: mockGaps.length,
};

const mockAttachments: OutputAttachment[] = [
  {
    type: "evidence_map",
    title: "证据映射表",
    content:
      "| JD 要求 | 素材事实 | 映射类型 | 强度 |\n|---------|----------|----------|------|\n| 产品功能迭代 | 整理 5-6 款产品更新 | direct | moderate |\n| 用户调研 | 完成 20+ 用户访谈 | semantic | strong |",
  },
  {
    type: "gap_report",
    title: "Gap 分析报告",
    content:
      "## 未满足要求\n\n1. **数据分析能力（SQL/Python）** — major\n   - 类型：missing_evidence\n   - 建议：补充课程作业或自学项目\n",
  },
  {
    type: "risk_summary",
    title: "风险摘要",
    content:
      "## 风险标记\n\n- **B002** | role_inflation | medium\n  - 问题：'参与'升级为'主导'\n  - 建议：确认实际角色或降级表达\n",
  },
  {
    type: "modification_guide",
    title: "修改建议指南",
    content:
      "## 如何完善这份简历\n\n1. 补充 SQL/Python 相关经历以覆盖 Gap\n2. 确认 B002 的角色描述是否属实\n3. 考虑增加量化成果（如覆盖率、用户满意度）\n",
  },
];

export const resumeMarkdown = `# 张某某
**求职意向：** AI产品经理实习生 @ 字节跳动  
**邮箱：** zhang@example.com  

## 教育背景
**某某大学** · 计算机科学与技术 · 本科 · 2022.09 - 2026.06

## 项目经历
- 参与整理 5-6 款 AI 产品功能更新，输出结构化分析报告，为团队迭代提供参考
- 主导用户调研模块，独立完成 20+ 用户访谈并提炼 3 条产品优化建议

## 技能
- 产品工具：Figma、Axure；技术栈：Python（基础）、Markdown
`;

export const mockOutput: ResumeOutput = {
  resume: mockResumeDraft,
  metadata: mockMetadata,
  attachments: mockAttachments,
  resumeMarkdown,
};
