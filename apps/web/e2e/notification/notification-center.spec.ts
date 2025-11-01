/**
 * Notification Center E2E Test
 * 测试通知中心功能
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Notification Center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto('/dashboard');
  });

  test('[P0] should open notification center', async ({ page }) => {
    await page.click('[data-testid="notification-bell-icon"]');
    await expect(page.locator('[data-testid="notification-center"]')).toBeVisible({ timeout: 3000 });
  });

  test('[P0] should display notifications list', async ({ page }) => {
    await page.click('[data-testid="notification-bell-icon"]');
    
    const notificationsList = page.locator('[data-testid="notifications-list"]');
    const emptyState = page.locator('text=/暂无通知|No notifications/i');
    
    await expect(notificationsList.or(emptyState)).toBeVisible({ timeout: 5000 });
  });

  test('[P1] should mark notification as read', async ({ page }) => {
    await page.click('[data-testid="notification-bell-icon"]');
    
    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    if (await firstNotification.isVisible()) {
      await firstNotification.click();
      await expect(firstNotification).toHaveClass(/read|checked/i, { timeout: 3000 });
    }
  });

  test('[P1] should mark all as read', async ({ page }) => {
    await page.click('[data-testid="notification-bell-icon"]');
    await page.click('[data-testid="mark-all-read-button"]');
    
    await expect(page.locator('text=/全部已读|All marked as read/i')).toBeVisible({ timeout: 5000 });
  });

  test('[P2] should filter notifications by type', async ({ page }) => {
    await page.click('[data-testid="notification-bell-icon"]');
    await page.click('[data-testid="notification-filter-dropdown"]');
    await page.click('[data-testid="filter-task"]');
    
    await expect(page.locator('[data-testid="notifications-list"]')).toBeVisible();
  });
});
