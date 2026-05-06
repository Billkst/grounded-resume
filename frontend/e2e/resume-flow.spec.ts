import { expect, test } from '@playwright/test'
import { fillHomeForm, mockSessionId } from './fixtures/resume-flow'
import { mockResumeApi } from './support/mock-api'

test.describe('mocked resume generation flow', () => {
  test('generates and exports a resume without real backend calls', async ({ page }) => {
    await mockResumeApi(page)

    await page.goto('/')
    await fillHomeForm(page)
    await page.getByTestId('submit-resume-button').click()

    await expect(page).toHaveURL(new RegExp(`/result\\?sessionId=${mockSessionId}`))
    await expect(page.getByTestId('result-page')).toBeVisible()
    await expect(page.getByText('生成报告')).toBeVisible()
    await expect(page.getByText('负责 AI 问答助手需求拆解')).toBeVisible()

    await page.getByTestId('tab-evidence').click()
    await expect(page.getByText('AI 问答助手项目 → AI 产品需求分析')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-markdown-button').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe(`grounded-resume-${mockSessionId}.md`)
  })
})
