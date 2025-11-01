/**
 * Schedule CRUD E2E Test
 * 测试日程管理的增删改查功能
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Schedule CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto('/schedule');
  });

  test('[P0] should create a new schedule', async ({ page }) => {
    const scheduleTitle = \E2E Schedule \\;
    
    await page.click('[data-testid="create-schedule-button"]');
    await page.fill('[data-testid="schedule-title-input"]', scheduleTitle);
    await page.fill('[data-testid="schedule-date-input"]', '2025-12-01');
    await page.fill('[data-testid="schedule-time-input"]', '10:00');
    await page.click('[data-testid="save-schedule-button"]');

    await expect(page.locator(\	ext=\\)).toBeVisible({ timeout: 5000 });
  });

  test('[P0] should update schedule', async ({ page }) => {
    // 假设列表中有日程
    const firstSchedule = page.locator('[data-testid="schedule-item"]').first();
    await firstSchedule.click();

    await page.click('[data-testid="edit-schedule-button"]');
    await page.fill('[data-testid="schedule-title-input"]', 'Updated Schedule');
    await page.click('[data-testid="save-schedule-button"]');

    await expect(page.locator('text=Updated Schedule')).toBeVisible({ timeout: 5000 });
  });

  test('[P0] should delete schedule', async ({ page }) => {
    const firstSchedule = page.locator('[data-testid="schedule-item"]').first();
    await firstSchedule.hover();
    await page.click('[data-testid="delete-schedule-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('text=/删除成功|Deleted/i')).toBeVisible({ timeout: 5000 });
  });
});
