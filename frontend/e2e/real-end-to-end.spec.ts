import { test, expect } from '@playwright/test'

test.setTimeout(300_000) // 5 minutes total timeout for DeepSeek latency

test('real end-to-end resume generation with DeepSeek', async ({ page }) => {
  // 1. Configure LLM settings
  await page.goto('/settings')
  await page.waitForSelector('#provider')

  await page.selectOption('#provider', 'deepseek')
  await page.selectOption('#mode', 'hybrid')

  // Wait for model options to update after provider change
  await page.waitForFunction(() => {
    const options = document.querySelectorAll('#model option')
    return options.length > 0
  })

  await page.selectOption('#model', 'deepseek-v4-pro')

  // API key input is password type, fill it
  await page.fill('#apiKey', 'sk-0e2def73ef214cd9a954179af43b28d2')

  // Wait a moment for auto-save
  await page.waitForTimeout(500)

  // 2. Go to home and load test data
  await page.goto('/')
  await page.waitForSelector('[data-testid="load-test-data-button"]')
  await page.click('[data-testid="load-test-data-button"]')

  // 3. Submit form
  await page.click('[data-testid="submit-resume-button"]')

  // 4. Wait for result page
  await page.waitForURL(/\/result\?sessionId=/, { timeout: 30000 })

  // 5. Wait for generation to complete (result page shows resume content)
  await expect(page.locator('[data-testid="result-page"]')).toBeVisible({ timeout: 240_000 })

  // Wait for a resume section heading to appear (not error state)
  await expect(page.getByRole('heading', { name: '基本信息' })).toBeVisible({ timeout: 240_000 })

  // 6. Extract and print the generated resume text
  const resumeContainer = page.locator('[data-testid="result-page"] section').first()
  const resumeText = await resumeContainer.innerText()
  console.log('\n========== GENERATED RESUME ==========\n')
  console.log(resumeText)
  console.log('\n======================================\n')

  // 7. Take screenshot for visual verification
  await page.screenshot({ path: 'test-results/real-end-to-end-result.png', fullPage: true })
})
