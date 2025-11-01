/**
 * Setting Appearance E2E Test
 * 测试外观设置功能
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Setting - Appearance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto('/settings');
    await page.click('[data-testid="appearance-tab"]');
  });

  test('[P0] should switch theme mode', async ({ page }) => {
    // 切换到深色模式
    await page.click('[data-testid="theme-dark-button"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark/i, { timeout: 3000 });

    // 切换回浅色模式
    await page.click('[data-testid="theme-light-button"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light/i, { timeout: 3000 });
  });

  test('[P1] should change primary color', async ({ page }) => {
    await page.click('[data-testid="primary-color-picker"]');
    await page.click('[data-testid="color-option-blue"]');
    
    await expect(page.locator('text=/颜色已更新|Color updated/i')).toBeVisible({ timeout: 5000 });
  });

  test('[P1] should change font size', async ({ page }) => {
    const fontSizeSlider = page.locator('[data-testid="font-size-slider"]');
    await fontSizeSlider.click();
    
    await expect(page.locator('text=/字体大小已更新|Font size updated/i')).toBeVisible({ timeout: 5000 });
  });

  test('[P2] should preview theme changes', async ({ page }) => {
    await page.click('[data-testid="theme-preview-button"]');
    await expect(page.locator('[data-testid="theme-preview-modal"]')).toBeVisible({ timeout: 3000 });
  });
});
