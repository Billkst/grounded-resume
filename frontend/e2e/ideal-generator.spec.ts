import { test, expect } from '@playwright/test';

test('ideal generator input page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('一键生成完美简历');
  await expect(page.locator('select')).toBeVisible();
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(page.getByText('AI产品经理')).toBeVisible();
});

test('quick role tags fill input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '后端工程师' }).click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('后端工程师（实习）');
});

test('experience level changes suffix', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI产品经理' }).click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('AI产品经理（实习）');
  await page.selectOption('select', '1_3_years');
  await expect(input).toHaveValue('AI产品经理');
});

test('generate button disabled without API key', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').first().fill('test background');
  await page.locator('textarea').last().fill('test JD');
  const btn = page.getByRole('button', { name: '生成简历' });
  await expect(btn).toBeDisabled();
});
