import { test, expect } from '@playwright/test'

const mockSessionId = 'gap-report-test-001'

const mockSessionWithGapReport = {
  sessionId: mockSessionId,
  status: 'completed',
  result: {
    userInput: {
      profile: { name: '张三', email: 'zhangsan@example.com' },
      targetJob: {
        companyName: '字节跳动',
        jobTitle: '前端开发工程师',
        jobDescription: '负责字节跳动电商业务前端开发，使用 React、TypeScript、Node.js 等技术栈。要求有大型前端架构经验，熟悉性能优化，具备团队协作能力。',
      },
      materials: [
        {
          id: 'material-1',
          type: 'project',
          title: '电商小程序项目',
          content: '个人项目：开发了一个电商小程序，使用 React 和 Node.js，实现了商品展示、购物车、订单管理功能。',
        },
      ],
      preferences: { tone: 'balanced', allowDowngrade: true, showGapAnalysis: true, maxBullets: 10 },
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
              text: '独立开发电商小程序前端，使用 React 实现商品展示与购物车功能。',
              evidenceRefs: [{ mappingId: 'mapping-1', factIds: ['fact-1'], sourceFragments: ['fragment-1'] }],
              expressionLevel: 'standard',
              riskLevel: 'safe',
              rewriteChain: [],
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
          reasoning: '素材直接体现 React 开发经历。',
          directQuote: '使用 React 和 Node.js，实现了商品展示、购物车、订单管理功能',
        },
      ],
      gaps: [
        {
          id: 'gap-1',
          jdRequirementId: 'capability-2',
          gapType: 'missing_evidence',
          description: '缺少大型前端架构设计经验。',
          severity: 'major',
          recommendation: '补充微前端或组件库设计经历。',
        },
      ],
      overclaims: [],
      mappingConfidence: 0.72,
    },
    gapAcknowledgments: [],
  },
  finalOutput: {
    resumeMarkdown: '# 张三\n\n## 项目经历\n- 独立开发电商小程序前端，使用 React 实现商品展示与购物车功能。',
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
      targetJob: { companyName: '字节跳动', jobTitle: '前端开发工程师' },
      generationTimestamp: '2026-05-04T00:00:00.000Z',
      version: '1.0',
      confidence: 0.72,
      materialCoverage: 0.65,
      gapCount: 1,
    },
    attachments: [],
    separatedOutput: {
      deliveryResume: {
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
                text: '独立开发电商小程序前端，使用 React 实现商品展示与购物车功能。',
                evidenceRefs: [],
                expressionLevel: 'standard',
                riskLevel: 'safe',
                rewriteChain: [],
              },
            ],
          },
        ],
        generationLog: [],
        riskFlags: [],
      },
      gapReport: {
        gaps: [],
        wordingGaps: [
          {
            gapId: 'wg-1',
            jdKeyword: '用户增长',
            currentWording: '拉新',
            suggestedWording: '建议改为「用户增长」以匹配 JD 关键词',
            rationale: 'JD 要求用「用户增长」，你的简历写的是「拉新」，建议替换。',
          },
          {
            gapId: 'wg-2',
            jdKeyword: '性能优化',
            currentWording: '提速',
            suggestedWording: '建议改为「性能优化」以匹配 JD 关键词',
            rationale: 'JD 要求用「性能优化」，你的简历写的是「提速」，建议替换。',
          },
        ],
        understatedGaps: [
          {
            gapId: 'ug-1',
            capability: 'A/B 测试',
            currentBulletId: 'bullet-1',
            currentText: '测试过不同方案',
            suggestion: '设计并执行 A/B 测试，验证不同方案对转化率的影响',
            rationale: '你提到了测试，但表达深度不足，建议补充具体数据和方法。',
          },
        ],
        interviewPrep: [
          {
            gapId: 'ip-1',
            capability: '大型前端架构',
            actionSteps: [
              '学习微前端架构方案（qiankun / Module Federation）',
              '尝试在 side project 中实践组件库设计',
              '记录设计决策与遇到的挑战',
            ],
          },
          {
            gapId: 'ip-2',
            capability: '性能优化',
            actionSteps: [
              '学习 React 性能优化最佳实践',
              '使用 Lighthouse 对现有项目进行性能审计',
              '尝试实现代码分割与懒加载',
            ],
          },
        ],
        supplementTemplates: [
          {
            gapId: 'st-1',
            capability: '大型前端架构',
            templateText: '如果你具备大型前端架构的相关经历，可以这样写：',
            exampleText: '主导设计前端微服务架构，将单体应用拆分为 5 个独立子应用，使用 Module Federation 实现模块共享，构建时间从 8 分钟降至 2 分钟。',
          },
          {
            gapId: 'st-2',
            capability: '性能优化',
            templateText: '如果你具备性能优化的相关经历，可以这样写：',
            exampleText: '针对首屏加载慢的问题，实施代码分割、图片懒加载和 CDN 加速策略，将 LCP 从 4.2s 优化至 1.1s，跳出率下降 35%。',
          },
        ],
        supplementationSuggestions: [],
        highRiskClaims: [],
      },
      scoreCard: {
        dimensionScores: [
          { dimensionKey: 'technical_depth', score: 65, rationale: '技术栈描述较完整，但缺少架构深度' },
          { dimensionKey: 'impact', score: 45, rationale: '缺少量化成果' },
        ],
        overallScore: 55,
        atsMatchScore: 60,
        quantificationScore: 30,
        starComplianceScore: 70,
      },
    },
  },
}

test('gap report visual verification', async ({ page }) => {
  // Mock API
  await page.route(`**/sessions/${mockSessionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSessionWithGapReport),
    })
  })

  await page.route(`**/sessions/${mockSessionId}/export?format=markdown`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/markdown',
      body: mockSessionWithGapReport.finalOutput.resumeMarkdown,
    })
  })

  // Navigate to result page
  await page.goto(`/result?sessionId=${mockSessionId}`)
  await page.waitForLoadState('networkidle')

  // Click on the "Gap 报告" tab
  await page.getByTestId('tab-gaps').click()

  // Take screenshot of the full page
  await page.screenshot({ path: 'gap-report-full.png', fullPage: true })

  // Verify EnhancedGapReport sections are visible (use heading role to avoid matching body text)
  await expect(page.getByRole('heading', { name: '措辞优化建议' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '表达深度不足' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '面试准备建议' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '待补充模板' })).toBeVisible()

  // Verify specific gap content (use first() to handle multiple matches)
  await expect(page.getByText('用户增长').first()).toBeVisible()
  await expect(page.getByText('测试过不同方案').first()).toBeVisible()
  await expect(page.getByText('qiankun').first()).toBeVisible()
  await expect(page.getByText('Module Federation').first()).toBeVisible()
})
