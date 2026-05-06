import { expect, test } from '@playwright/test'
import { fillHomeForm, mockSessionId } from './fixtures/resume-flow'
import { mockResumeApi } from './support/mock-api'

test.describe('error states', () => {
  test('shows submit error when session creation fails', async ({ page }) => {
    await mockResumeApi(page, { createSessionStatus: 500 })

    await page.goto('/')
    await fillHomeForm(page)
    await page.getByTestId('submit-resume-button').click()

    await expect(page.getByTestId('submit-error')).toContainText('API request failed: 500')
    await expect(page).toHaveURL('/')
  })

  test('shows confirmation load error when session fetch fails', async ({ page }) => {
    await mockResumeApi(page, { getSessionStatus: 500 })

    await page.goto(`/confirmation?sessionId=${mockSessionId}`)

    await expect(page.getByText('确认数据加载失败')).toBeVisible()
    await expect(page.getByText(/API request failed: 500/)).toBeVisible()
  })

  test('shows result export error when markdown export fails', async ({ page }) => {
    await mockResumeApi(page, { exportStatus: 500 })

    await page.goto(`/result?sessionId=${mockSessionId}`)

    await expect(page.getByTestId('result-page')).toBeVisible()

    await page.getByTestId('export-markdown-button').click()

    await expect(page.getByTestId('export-error')).toContainText('API request failed: 500')
  })
})
