/**
 * Dashboard Overview E2E Test
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto('/dashboard');
  });

  test('[P0] should display main statistics', async ({ page }) => {
    await expect(page.locator('[data-testid="today-tasks-count"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="active-goals-count"]')).toBeVisible();
  });

  test('[P0] should display today tasks list', async ({ page }) => {
    await expect(page.locator('[data-testid="today-tasks-section"]')).toBeVisible({ timeout: 5000 });
  });
});
