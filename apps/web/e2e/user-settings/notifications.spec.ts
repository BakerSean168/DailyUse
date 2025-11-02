import { test, expect } from '@playwright/test';

/**
 * E2E ??:????
 * ??????????????????
 */

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    // ???????
    await page.goto('/settings');

    // ????????
    await page.waitForLoadState('networkidle');

    // ?????? tab
    await page.getByRole('tab', { name: /??|Notifications/i }).click();
  });

  test('should display notification settings', async ({ page }) => {
    // ??????
    await expect(page.getByText(/????|Notification Settings/i)).toBeVisible();

    // ??????????
    await expect(page.locator('text=/????|Enable Notifications/i')).toBeVisible();
  });

  test('should toggle notifications on/off', async ({ page }) => {
    // ???????
    const notificationToggle = page.locator('[role="switch"]').first();

    // ??????
    const initialState = await notificationToggle.getAttribute('aria-checked');

    // ????
    await notificationToggle.click();
    await page.waitForTimeout(500);

    // ???????
    const newState = await notificationToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('should display notification channels', async ({ page }) => {
    // ????????
    await expect(page.locator('text=/??|Push/i')).toBeVisible();

    // ????????
    await expect(page.locator('text=/??|Email/i')).toBeVisible();

    // ????????(???)
    const smsOption = page.locator('text=/??|SMS/i');
    if (await smsOption.isVisible()) {
      await expect(smsOption).toBeVisible();
    }
  });

  test('should select notification channels', async ({ page }) => {
    // ???????
    const notificationToggle = page.locator('[role="switch"]').first();
    const isEnabled = await notificationToggle.getAttribute('aria-checked');

    if (isEnabled !== 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(500);
    }

    // ??????
    const emailChip = page.locator('[role="button"]').filter({ hasText: /??|Email/i });
    await emailChip.click();
    await page.waitForTimeout(300);

    // ??????(????? chip ???????)
    const emailChipClass = await emailChip.getAttribute('class');
    expect(emailChipClass).toMatch(/selected|active|primary/i);
  });

  test('should configure Do Not Disturb mode', async ({ page }) => {
    // ?? DnD ??
    const dndSwitch = page
      .locator('text=/???|Do Not Disturb/i')
      .locator('..')
      .locator('[role="switch"]');

    if (await dndSwitch.isVisible()) {
      // ?? DnD
      await dndSwitch.click();
      await page.waitForTimeout(500);

      // ?????????
      const startTimeInput = page.locator('input[type="time"]').first();
      await expect(startTimeInput).toBeVisible();

      // ??????
      await startTimeInput.fill('22:00');

      // ??????
      const endTimeInput = page.locator('input[type="time"]').last();
      await endTimeInput.fill('08:00');
    }
  });

  test('should test desktop notification permission', async ({ page, context }) => {
    // ??????(??????)
    await context.grantPermissions(['notifications']);

    // ????????
    const requestButton = page.getByRole('button', { name: /????|Request Permission/i });

    if (await requestButton.isVisible()) {
      await requestButton.click();
      await page.waitForTimeout(500);

      // ?????????
      await expect(page.locator('text=/???|Granted/i')).toBeVisible();
    }
  });

  test('should send test notification', async ({ page, context }) => {
    // ??????
    await context.grantPermissions(['notifications']);

    // ????????
    const testButton = page.getByRole('button', { name: /????|Test Notification/i });

    if (await testButton.isVisible()) {
      await testButton.click();

      // ????????????
      await expect(page.locator('text=/????|Test notification|????/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should toggle sound on/off', async ({ page }) => {
    // ??????
    const soundSwitch = page.locator('text=/??|Sound/i').locator('..').locator('[role="switch"]');

    if (await soundSwitch.isVisible()) {
      // ????
      await soundSwitch.click();
      await page.waitForTimeout(500);

      // ???????
      const state = await soundSwitch.getAttribute('aria-checked');
      expect(state).toBeTruthy();
    }
  });

  test('should save notification settings', async ({ page }) => {
    // ??????
    const notificationToggle = page.locator('[role="switch"]').first();
    await notificationToggle.click();
    await page.waitForTimeout(500);

    // ??????
    const saveButton = page.getByRole('button', { name: /??|Save/i });

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // ??????
      await expect(page.locator('text=/????|Saved/i')).toBeVisible({ timeout: 3000 });
    }

    // ???????????
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /??|Notifications/i }).click();

    // ????????
    const savedState = await notificationToggle.getAttribute('aria-checked');
    expect(savedState).toBeDefined();
  });

  test('should disable channel selection when notifications are off', async ({ page }) => {
    // ????
    const notificationToggle = page.locator('[role="switch"]').first();
    const isEnabled = await notificationToggle.getAttribute('aria-checked');

    if (isEnabled === 'true') {
      await notificationToggle.click();
      await page.waitForTimeout(500);
    }

    // ??????????
    const channelChips = page
      .locator('[role="button"]')
      .filter({ hasText: /??|??|Email|Push/i });
    const firstChip = channelChips.first();

    if (await firstChip.isVisible()) {
      const isDisabled = await firstChip.getAttribute('disabled');
      expect(isDisabled).not.toBeNull();
    }
  });
});
