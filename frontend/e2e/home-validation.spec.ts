import { expect, test } from '@playwright/test'
import { mockResumeApi } from './support/mock-api'

test.describe('home form validation', () => {
  test.beforeEach(async ({ page }) => {
    await mockResumeApi(page)
    await page.goto('/')
  })

  test('shows required field errors without calling the API', async ({ page }) => {
    let createSessionCalls = 0
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/sessions')) {
        createSessionCalls += 1
      }
    })

    await page.getByTestId('submit-resume-button').click()

    await expect(page.getByText('请输入姓名')).toBeVisible()
    await expect(page.getByText('请输入邮箱')).toBeVisible()
    await expect(page.getByText('请输入公司名')).toBeVisible()
    await expect(page.getByText('请输入岗位名称')).toBeVisible()
    await expect(page.getByText('请输入岗位描述')).toBeVisible()
    await expect(page.getByText('请至少提供一条素材')).toBeVisible()
    expect(createSessionCalls).toBe(0)
  })

  test('validates email format and minimum JD length', async ({ page }) => {
    await page.getByTestId('name-input').fill('张三')
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('company-input').fill('字节跳动')
    await page.getByTestId('job-title-input').fill('AI 产品实习生')
    await page.getByTestId('job-description-input').fill('太短的 JD')
    await page.getByTestId('material-input-0').fill('课程项目中整理知识库并评测 prompt。')

    await page.getByTestId('submit-resume-button').click()

    await expect(page.getByText('请输入有效的邮箱地址')).toBeVisible()
    await expect(page.getByText('岗位描述至少 50 个字符')).toBeVisible()
  })
})
