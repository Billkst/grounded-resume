import type { Page, Route } from '@playwright/test'
import { mockConfig, mockSession, mockSessionId } from '../fixtures/resume-flow'

type MockApiOptions = {
  createSessionStatus?: number
  getSessionStatus?: number
  decisionsStatus?: number
  exportStatus?: number
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export async function mockResumeApi(page: Page, options: MockApiOptions = {}) {
  await page.route('**/config', async (route) => {
    await json(route, 200, mockConfig)
  })

  await page.route(/.*\/sessions(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()

    if (options.createSessionStatus && options.createSessionStatus >= 400) {
      return json(route, options.createSessionStatus, { detail: 'mock create session failed' })
    }

    return json(route, 200, { sessionId: mockSessionId, status: 'completed' })
  })

  await page.route(`**/sessions/${mockSessionId}/progress`, async (route) => {
    await json(route, 200, { currentStep: 'completed', totalSteps: 5 })
  })

  await page.route(`**/sessions/${mockSessionId}/decisions`, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()

    if (options.decisionsStatus && options.decisionsStatus >= 400) {
      return json(route, options.decisionsStatus, { detail: 'mock decisions failed' })
    }

    return json(route, 200, mockSession)
  })

  await page.route(`**/sessions/${mockSessionId}/export?format=markdown`, async (route) => {
    if (options.exportStatus && options.exportStatus >= 400) {
      return route.fulfill({ status: options.exportStatus, body: 'mock export failed' })
    }

    return route.fulfill({
      status: 200,
      contentType: 'text/markdown',
      body: mockSession.finalOutput.resumeMarkdown,
    })
  })

  await page.route(`**/sessions/${mockSessionId}`, async (route) => {
    if (options.getSessionStatus && options.getSessionStatus >= 400) {
      return json(route, options.getSessionStatus, { detail: 'mock get session failed' })
    }

    return json(route, 200, mockSession)
  })
}
