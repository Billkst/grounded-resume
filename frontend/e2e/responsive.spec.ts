import { expect, test } from '@playwright/test'
import { mockSessionId } from './fixtures/resume-flow'
import { mockResumeApi } from './support/mock-api'

test.describe('responsive layout', () => {
  test('home form remains usable on mobile viewport', async ({ page }) => {
    await mockResumeApi(page)
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/')

    await expect(page.getByTestId('home-page')).toBeVisible()
    await expect(page.getByTestId('intake-form')).toBeVisible()
    await expect(page.getByTestId('submit-resume-button')).toBeInViewport()
  })

  test('confirmation cards stack within the mobile viewport', async ({ page }) => {
    await mockResumeApi(page)
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto(`/confirmation?sessionId=${mockSessionId}`)

    const board = page.getByTestId('confirmation-board')
    await expect(board).toBeVisible()
    await expect(page.getByTestId('bullet-card-bullet-1')).toBeInViewport()
  })

  test('result page exposes tab navigation on desktop', async ({ page }) => {
    await mockResumeApi(page)
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.goto(`/result?sessionId=${mockSessionId}`)

    await expect(page.getByTestId('result-tabs')).toBeVisible()
    await expect(page.getByTestId('tab-resume')).toBeVisible()
    await expect(page.getByTestId('tab-evidence')).toBeVisible()
  })
})
