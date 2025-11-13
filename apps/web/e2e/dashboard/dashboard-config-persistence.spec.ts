/**
 * Dashboard Configuration Persistence E2E Test
 *
 * Tests for Dashboard widget configuration persistence:
 * - Configuration save to backend
 * - Configuration load from backend
 * - Configuration reset to defaults
 * - Multi-session persistence
 * - Configuration sync across tabs
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test.describe('Dashboard Configuration Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to Dashboard
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto(WEB_CONFIG.HOME_PATH, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
  });

  test('[P0] should save configuration to backend', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Make changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Listen for API call
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/dashboard/widget-config') &&
        (response.request().method() === 'PUT' || response.request().method() === 'POST'),
      { timeout: TIMEOUT_CONFIG.API_REQUEST },
    );

    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');

    // Wait for API call to complete
    const response = await responsePromise;

    // Verify response is successful
    expect(response.status()).toBeLessThan(400);
  });

  test('[P0] should load configuration from backend on page load', async ({ page }) => {
    // First, set a known configuration
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Hide TaskStatsWidget
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');

    // Ensure it's visible first, then hide it
    if (!(await taskToggle.isChecked())) {
      await taskToggle.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Verify widget is hidden
    await expect(page.locator('[data-testid="task-stats-widget"]')).not.toBeVisible();

    // Open new page in same context (simulates new tab)
    const newPage = await page.context().newPage();
    await login(newPage, TEST_USER.username, TEST_USER.password);

    // Navigate to Dashboard
    await newPage.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await newPage.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Verify configuration was loaded (TaskStatsWidget should be hidden)
    await expect(newPage.locator('[data-testid="task-stats-widget"]')).not.toBeVisible();

    // Cleanup
    await newPage.close();
  });

  test('[P1] should reset configuration to defaults via API', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Make some changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Re-open settings
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Listen for reset API call
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/dashboard/widget-config/reset') &&
        response.request().method() === 'POST',
      { timeout: TIMEOUT_CONFIG.API_REQUEST },
    );

    // Click reset
    await page.click('[data-testid="reset-settings-button"], button:has-text("重置")');

    // Wait for API call
    const response = await responsePromise;

    // Verify response is successful
    expect(response.status()).toBeLessThan(400);

    // Verify all widgets are now visible (default state)
    const allToggles = page.locator('[data-testid="visibility-toggle"]');
    const count = await allToggles.count();

    for (let i = 0; i < count; i++) {
      const toggle = allToggles.nth(i);
      await expect(toggle).toBeChecked();
    }
  });

  test('[P1] should persist configuration across browser sessions', async ({ browser }) => {
    // Get current page
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    // Login and navigate
    await login(page1, TEST_USER.username, TEST_USER.password);
    await page1.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page1.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Make configuration change
    await page1.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page1.waitForSelector('[data-testid="widget-settings-panel"]');

    const taskWidgetItem = page1.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');

    // Ensure visible first
    if (!(await taskToggle.isChecked())) {
      await taskToggle.click();
      await page1.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }

    // Hide it
    await taskToggle.click();
    await page1.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Save
    await page1.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page1.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Close first session
    await context1.close();

    // Create new session (simulates browser restart)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Login again
    await login(page2, TEST_USER.username, TEST_USER.password);
    await page2.goto(WEB_CONFIG.HOME_PATH, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Verify configuration persisted (TaskStatsWidget should be hidden)
    await expect(page2.locator('[data-testid="task-stats-widget"]')).not.toBeVisible();

    // Cleanup
    await context2.close();
  });

  test('[P2] should handle API errors during save', async ({ page }) => {
    // Intercept and fail the save API call
    await page.route('**/api/dashboard/widget-config', (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    // Open settings
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Make changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Try to save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Should show error message
    const errorMessage = page.locator('text=/保存失败|Save failed|错误|Error/i');
    await expect(errorMessage).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  });

  test('[P2] should handle API errors during load', async ({ page }) => {
    // Intercept and fail the load API call
    await page.route('**/api/dashboard/widget-config', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Should either show error or fall back to defaults
    const hasError = await page
      .locator('text=/错误|Error/i')
      .isVisible()
      .catch(() => false);
    const hasWidgets = await page
      .locator('[data-testid$="-stats-widget"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Either shows error or loads with default configuration
    expect(hasError || hasWidgets).toBe(true);
  });

  test('[P2] should batch update multiple widget configurations', async ({ page }) => {
    // Open settings
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');

    // Change multiple widgets
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const goalWidgetItem = page.locator('[data-testid="widget-item"]:has-text("目标统计")');

    // Toggle both
    await taskWidgetItem.locator('[data-testid="visibility-toggle"]').click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    await goalWidgetItem.locator('[data-testid="visibility-toggle"]').click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

    // Listen for single API call (batch update)
    let apiCallCount = 0;
    page.on('response', (response) => {
      if (
        response.url().includes('/api/dashboard/widget-config') &&
        (response.request().method() === 'PUT' || response.request().method() === 'POST')
      ) {
        apiCallCount++;
      }
    });

    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Should make only 1 API call (batch update)
    expect(apiCallCount).toBeLessThanOrEqual(1);

    // Verify both widgets updated
    await expect(page.locator('[data-testid="task-stats-widget"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="goal-stats-widget"]')).not.toBeVisible();
  });

  test('[P1] should validate configuration data format', async ({ page }) => {
    // Intercept API response with invalid data
    await page.route('**/api/dashboard/widget-config', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ invalid: 'data' }),
        });
      } else {
        route.continue();
      }
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);

    // Should handle invalid data gracefully (fall back to defaults)
    const hasWidgets = await page
      .locator('[data-testid$="-stats-widget"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Should still show widgets with default config
    expect(hasWidgets).toBe(true);
  });
});
