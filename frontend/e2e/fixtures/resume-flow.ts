import type { Page } from '@playwright/test'

export const mockSessionId = 'e2e-session-001'

export const validHomeInput = {
  name: '张三',
  email: 'zhangsan@example.com',
  company: '字节跳动',
  jobTitle: 'AI 产品实习生',
  jobDescription:
    '负责 AI Agent 产品需求分析、用户研究、跨团队协作和功能交付，要求理解大模型应用、开发者工具链，并能够基于用户反馈持续优化产品体验。',
  material:
    '我在课程项目中负责 AI 问答助手的需求拆解、知识库整理和 prompt 评测，记录 bad case 并推动回答准确率优化。',
}

export const mockSession = {
  sessionId: mockSessionId,
  status: 'completed',
  result: {
    userInput: {
      profile: {
        name: validHomeInput.name,
        email: validHomeInput.email,
      },
      targetJob: {
        companyName: validHomeInput.company,
        jobTitle: validHomeInput.jobTitle,
        jobDescription: validHomeInput.jobDescription,
      },
      materials: [
        {
          id: 'material-1',
          type: 'project',
          title: 'AI 问答助手项目',
          content: validHomeInput.material,
        },
      ],
      preferences: {
        tone: 'balanced',
        allowDowngrade: true,
        showGapAnalysis: true,
        maxBullets: 10,
      },
    },
    draft: {
      version: 1,
      sections: [
        {
          id: 'experience',
          sectionType: 'experience',
          title: '项目经历',
          order: 1,
          bullets: [
            {
              id: 'bullet-1',
              text: '负责 AI 问答助手需求拆解与知识库整理，基于 bad case 优化 prompt 回答质量。',
              evidenceRefs: [
                {
                  mappingId: 'mapping-1',
                  factIds: ['fact-1'],
                  sourceFragments: ['fragment-1'],
                },
              ],
              expressionLevel: 'standard',
              riskLevel: 'safe',
              rewriteChain: [
                {
                  step: 1,
                  from: '负责 AI 问答助手的需求拆解、知识库整理和 prompt 评测',
                  to: '负责 AI 问答助手需求拆解与知识库整理，基于 bad case 优化 prompt 回答质量。',
                  reason: '保留真实职责并强化与 JD 的匹配度',
                  operator: 'system',
                },
              ],
            },
            {
              id: 'bullet-2',
              text: '整理多家公司岗位 JD，归纳 AI 产品岗位核心能力要求并输出分析文档。',
              evidenceRefs: [
                {
                  mappingId: 'mapping-2',
                  factIds: ['fact-2'],
                  sourceFragments: ['fragment-2'],
                },
              ],
              expressionLevel: 'conservative',
              riskLevel: 'caution',
              rewriteChain: [
                {
                  step: 1,
                  from: '收集过多家公司岗位 JD，做过关键词整理和要求归类',
                  to: '整理多家公司岗位 JD，归纳 AI 产品岗位核心能力要求并输出分析文档。',
                  reason: '用保守表达呈现研究分析能力',
                  operator: 'guardrail',
                },
              ],
            },
          ],
        },
      ],
      generationLog: [],
      riskFlags: [],
    },
    mappingResult: {
      mappings: [
        {
          id: 'mapping-1',
          jdRequirementId: 'capability-1',
          materialFactIds: ['fact-1'],
          mappingType: 'direct',
          strength: 'strong',
          reasoning: '素材直接体现 AI 产品分析与 prompt 评测经历。',
          directQuote: '负责 AI 问答助手的需求拆解、知识库整理和 prompt 评测',
        },
      ],
      gaps: [
        {
          id: 'gap-1',
          jdRequirementId: 'capability-2',
          gapType: 'insufficient_depth',
          description: '缺少跨职能团队协作的明确证据。',
          severity: 'minor',
          recommendation: '补充与研发或设计协作的具体案例。',
        },
      ],
      overclaims: [],
      mappingConfidence: 0.82,
    },
    gapAcknowledgments: [],
  },
  finalOutput: {
    resumeMarkdown:
      '# 张三\n\n## 项目经历\n- 负责 AI 问答助手需求拆解与知识库整理，基于 bad case 优化 prompt 回答质量。\n- 整理多家公司岗位 JD，归纳 AI 产品岗位核心能力要求并输出分析文档。',
    resume: {
      version: 1,
      sections: [
        {
          id: 'experience',
          sectionType: 'experience',
          title: '项目经历',
          order: 1,
          bullets: [],
        },
      ],
      generationLog: [],
      riskFlags: [],
    },
    metadata: {
      targetJob: {
        companyName: validHomeInput.company,
        jobTitle: validHomeInput.jobTitle,
        jobDescription: validHomeInput.jobDescription,
      },
      generationTimestamp: '2026-05-03T00:00:00.000Z',
      version: 'e2e',
      confidence: 0.82,
      materialCoverage: 0.76,
      gapCount: 1,
    },
    attachments: [
      {
        type: 'evidence_map',
        title: '证据映射',
        content: '## 证据映射\n- AI 问答助手项目 → AI 产品需求分析',
      },
      {
        type: 'risk_summary',
        title: '风险摘要',
        content: '## 风险摘要\n- 未发现高风险夸大表达',
      },
      {
        type: 'modification_guide',
        title: '修改指南',
        content: '## 修改指南\n- 补充跨团队协作细节',
      },
    ],
  },
}

export const mockConfig = {
  deploymentMode: 'local',
  enableAuth: false,
  supportedProviders: ['mock'],
  enableExport: true,
}

export async function fillHomeForm(page: Page) {
  await page.getByTestId('name-input').fill(validHomeInput.name)
  await page.getByTestId('email-input').fill(validHomeInput.email)
  await page.getByTestId('company-input').fill(validHomeInput.company)
  await page.getByTestId('job-title-input').fill(validHomeInput.jobTitle)
  await page.getByTestId('job-description-input').fill(validHomeInput.jobDescription)
  await page.getByTestId('material-input-0').fill(validHomeInput.material)
}
