import { test, expect } from '@playwright/test';

test.setTimeout(300_000);

test('real end-to-end ideal resume generation with DeepSeek', async ({ page }) => {
  test.skip(!!process.env.CI, 'skip in CI — requires real DeepSeek API');
  await page.goto('/');

  // Fill form
  await page.selectOption('select', 'new_grad');
  await page.getByRole('button', { name: 'AI产品经理' }).click();
  await page.locator('textarea').first().fill('计算机科学本科，有产品实习经验');
  await page.locator('textarea').last().fill('负责AI产品需求分析和设计，要求计算机相关专业，有实习经验优先');

  // Fill API key in LLM config
  await page.locator('input[type="password"]').fill('sk-test-api-key');

  // Submit
  await page.getByRole('button', { name: '生成简历' }).click();

  // Wait for result page
  await page.waitForURL(/\/result\?session=/, { timeout: 30000 });

  // Wait for completion
  await expect(page.getByText('理想版简历')).toBeVisible({ timeout: 240_000 });

  // Take screenshot
  await page.screenshot({ path: 'test-results/real-end-to-end-result.png', fullPage: true });
});
