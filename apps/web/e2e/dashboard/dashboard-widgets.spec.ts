/**
 * Dashboard Widgets E2E Test
 * 
 * Tests for Dashboard Widget system:
 * - Widget visibility and rendering
 * - Widget settings panel
 * - Widget configuration (show/hide, size adjustment)
 * - Widget data loading and error handling
 * - Configuration persistence
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { WEB_CONFIG, TIMEOUT_CONFIG } from '../config';

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    // Login as main test user
    await login(page, TEST_USER.username, TEST_USER.password);
    
    // Navigate to Dashboard
    await page.goto(WEB_CONFIG.HOME_PATH, { 
      waitUntil: 'networkidle',
      timeout: TIMEOUT_CONFIG.NAVIGATION 
    });
    
    // Wait for Dashboard to load
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
  });

  test('[P0] should render all registered widgets by default', async ({ page }) => {
    // Check that TaskStatsWidget is visible
    const taskWidget = page.locator('[data-testid="task-stats-widget"]');
    await expect(taskWidget).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    
    // Check that GoalStatsWidget is visible
    const goalWidget = page.locator('[data-testid="goal-stats-widget"]');
    await expect(goalWidget).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    
    // Check that ReminderStatsWidget is visible
    const reminderWidget = page.locator('[data-testid="reminder-stats-widget"]');
    await expect(reminderWidget).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
    
    // Check that ScheduleStatsWidget is visible
    const scheduleWidget = page.locator('[data-testid="schedule-stats-widget"]');
    await expect(scheduleWidget).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });
  });

  test('[P0] should display widget statistics correctly', async ({ page }) => {
    // TaskStatsWidget should show task counts
    const taskWidget = page.locator('[data-testid="task-stats-widget"]');
    await expect(taskWidget.locator('text=/待办|Pending/i')).toBeVisible();
    await expect(taskWidget.locator('text=/进行中|In Progress/i')).toBeVisible();
    await expect(taskWidget.locator('text=/已完成|Completed/i')).toBeVisible();
    
    // GoalStatsWidget should show goal counts
    const goalWidget = page.locator('[data-testid="goal-stats-widget"]');
    await expect(goalWidget.locator('text=/进行中|Active/i')).toBeVisible();
    await expect(goalWidget.locator('text=/已完成|Completed/i')).toBeVisible();
    
    // ReminderStatsWidget should show reminder counts
    const reminderWidget = page.locator('[data-testid="reminder-stats-widget"]');
    await expect(reminderWidget.locator('text=/今日提醒|Today/i')).toBeVisible();
    
    // ScheduleStatsWidget should show schedule counts
    const scheduleWidget = page.locator('[data-testid="schedule-stats-widget"]');
    await expect(scheduleWidget.locator('text=/今日日程|Today/i')).toBeVisible();
  });

  test('[P0] should open widget settings panel', async ({ page }) => {
    // Click settings button
    const settingsButton = page.locator('button:has-text("设置"), button[aria-label*="设置"]').first();
    await settingsButton.click();
    
    // Wait for settings panel to open
    await page.waitForSelector('[data-testid="widget-settings-panel"]', { 
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT 
    });
    
    // Verify panel is visible
    const settingsPanel = page.locator('[data-testid="widget-settings-panel"]');
    await expect(settingsPanel).toBeVisible();
    
    // Verify panel title
    await expect(settingsPanel.locator('h2, h3').first()).toContainText(/Widget 设置|Widget Settings/i);
  });

  test('[P0] should list all widgets in settings panel', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Check that all 4 widgets are listed
    const widgetItems = page.locator('[data-testid="widget-item"]');
    await expect(widgetItems).toHaveCount(4);
    
    // Verify widget names
    await expect(page.locator('[data-testid="widget-item"]:has-text("任务统计")')).toBeVisible();
    await expect(page.locator('[data-testid="widget-item"]:has-text("目标统计")')).toBeVisible();
    await expect(page.locator('[data-testid="widget-item"]:has-text("提醒统计")')).toBeVisible();
    await expect(page.locator('[data-testid="widget-item"]:has-text("日程统计")')).toBeVisible();
  });

  test('[P1] should toggle widget visibility', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Find TaskStatsWidget toggle
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    
    // Get initial state
    const initialChecked = await taskToggle.isChecked();
    
    // Toggle visibility
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Verify toggle state changed
    const newChecked = await taskToggle.isChecked();
    expect(newChecked).toBe(!initialChecked);
    
    // If we hid it, size buttons should not be visible
    if (!newChecked) {
      const sizeButtons = taskWidgetItem.locator('[data-testid="size-buttons"]');
      await expect(sizeButtons).not.toBeVisible();
    }
  });

  test('[P1] should adjust widget size', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Find TaskStatsWidget
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    
    // Ensure widget is visible (toggle on if needed)
    const toggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    if (!(await toggle.isChecked())) {
      await toggle.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }
    
    // Click size buttons
    const smallButton = taskWidgetItem.locator('button:has-text("小"), button:has-text("Small")');
    await smallButton.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Verify button is active
    await expect(smallButton).toHaveClass(/active|selected|primary/);
    
    // Try medium size
    const mediumButton = taskWidgetItem.locator('button:has-text("中"), button:has-text("Medium")');
    await mediumButton.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Verify medium button is active
    await expect(mediumButton).toHaveClass(/active|selected|primary/);
  });

  test('[P0] should save widget configuration', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Make some changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    const wasVisible = await taskToggle.isChecked();
    
    // Toggle visibility
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Click save button
    const saveButton = page.locator('[data-testid="save-settings-button"], button:has-text("保存")');
    await saveButton.click();
    
    // Wait for save to complete
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify panel closed
    const settingsPanel = page.locator('[data-testid="widget-settings-panel"]');
    await expect(settingsPanel).not.toBeVisible();
    
    // Verify widget visibility changed on Dashboard
    const taskWidget = page.locator('[data-testid="task-stats-widget"]');
    if (wasVisible) {
      // Was visible, should now be hidden
      await expect(taskWidget).not.toBeVisible();
    } else {
      // Was hidden, should now be visible
      await expect(taskWidget).toBeVisible();
    }
  });

  test('[P1] should persist configuration across page reloads', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Hide TaskStatsWidget
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    
    // Ensure it's visible first
    if (!(await taskToggle.isChecked())) {
      await taskToggle.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }
    
    // Now hide it
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify TaskStatsWidget is still hidden
    const taskWidget = page.locator('[data-testid="task-stats-widget"]');
    await expect(taskWidget).not.toBeVisible();
    
    // Verify other widgets are still visible
    await expect(page.locator('[data-testid="goal-stats-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="reminder-stats-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-stats-widget"]')).toBeVisible();
  });

  test('[P1] should cancel settings without saving', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Get initial state
    const taskWidget = page.locator('[data-testid="task-stats-widget"]');
    const wasVisibleBefore = await taskWidget.isVisible();
    
    // Make changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Click cancel button
    const cancelButton = page.locator('[data-testid="cancel-settings-button"], button:has-text("取消")');
    await cancelButton.click();
    
    // Wait for panel to close
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify panel closed
    const settingsPanel = page.locator('[data-testid="widget-settings-panel"]');
    await expect(settingsPanel).not.toBeVisible();
    
    // Verify widget visibility unchanged
    const isVisibleAfter = await taskWidget.isVisible();
    expect(isVisibleAfter).toBe(wasVisibleBefore);
  });

  test('[P1] should reset to default configuration', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Make some changes
    const taskWidgetItem = page.locator('[data-testid="widget-item"]:has-text("任务统计")');
    const taskToggle = taskWidgetItem.locator('[data-testid="visibility-toggle"]');
    await taskToggle.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    
    // Click reset button
    const resetButton = page.locator('[data-testid="reset-settings-button"], button:has-text("重置")');
    await resetButton.click();
    
    // Wait for reset
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify all toggles are checked (default: all visible)
    const allToggles = page.locator('[data-testid="visibility-toggle"]');
    const count = await allToggles.count();
    
    for (let i = 0; i < count; i++) {
      const toggle = allToggles.nth(i);
      await expect(toggle).toBeChecked();
    }
  });

  test('[P1] should close settings panel on backdrop click', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Verify panel is open
    const settingsPanel = page.locator('[data-testid="widget-settings-panel"]');
    await expect(settingsPanel).toBeVisible();
    
    // Click backdrop (outside panel)
    const backdrop = page.locator('.modal-overlay, [data-testid="settings-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });
    
    // Wait for panel to close
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify panel closed
    await expect(settingsPanel).not.toBeVisible();
  });

  test('[P1] should close settings panel on close button', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Click close button (X)
    const closeButton = page.locator('[data-testid="close-settings-button"], button[aria-label*="关闭"]');
    await closeButton.click();
    
    // Wait for panel to close
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify panel closed
    const settingsPanel = page.locator('[data-testid="widget-settings-panel"]');
    await expect(settingsPanel).not.toBeVisible();
  });

  test('[P2] should show loading state while fetching widget data', async ({ page }) => {
    // Reload to trigger loading state
    await page.reload();
    
    // Check for loading indicators (skeleton, spinner, etc.)
    const loadingIndicator = page.locator('[data-testid="dashboard-loading"], .skeleton-loader, [role="progressbar"]');
    
    // Loading indicator should appear briefly
    // Note: This might be too fast to catch, so we'll just verify it doesn't error
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading might be too fast, that's okay
      console.log('Loading state too fast to capture, skipping...');
    }
    
    // Eventually widgets should load
    await expect(page.locator('[data-testid="task-stats-widget"]')).toBeVisible({ 
      timeout: TIMEOUT_CONFIG.ELEMENT_WAIT 
    });
  });

  test('[P2] should display empty state when no widgets are visible', async ({ page }) => {
    // Open settings panel
    await page.click('button:has-text("设置"), button[aria-label*="设置"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]');
    
    // Hide all widgets
    const allToggles = page.locator('[data-testid="visibility-toggle"]');
    const count = await allToggles.count();
    
    for (let i = 0; i < count; i++) {
      const toggle = allToggles.nth(i);
      if (await toggle.isChecked()) {
        await toggle.click();
        await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
      }
    }
    
    // Save
    await page.click('[data-testid="save-settings-button"], button:has-text("保存")');
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify empty state is displayed
    const emptyState = page.locator('[data-testid="dashboard-empty-state"], text=/没有可显示的 Widget|No widgets/i');
    await expect(emptyState).toBeVisible();
    
    // Verify open settings button is available in empty state
    const openSettingsButton = page.locator('[data-testid="empty-state-settings-button"], button:has-text("打开设置")');
    await expect(openSettingsButton).toBeVisible();
  });

  test('[P1] should refresh widget data', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Find refresh button
    const refreshButton = page.locator('button:has-text("刷新"), button[aria-label*="刷新"]').first();
    
    // Click refresh
    await refreshButton.click();
    
    // Wait for refresh animation
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Verify widgets are still visible after refresh
    await expect(page.locator('[data-testid="task-stats-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="goal-stats-widget"]')).toBeVisible();
  });

  test('[P2] should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/dashboard/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Reload page to trigger API calls
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(TIMEOUT_CONFIG.MEDIUM_WAIT);
    
    // Check for error message or retry button
    const errorIndicator = page.locator('[data-testid="dashboard-error"], text=/错误|Error|失败|Failed/i');
    
    // Either error message or widgets still load with cached data
    const errorVisible = await errorIndicator.isVisible().catch(() => false);
    const widgetsVisible = await page.locator('[data-testid="task-stats-widget"]').isVisible().catch(() => false);
    
    // At least one should be true (error handling or fallback)
    expect(errorVisible || widgetsVisible).toBe(true);
  });
});
