/**
 * Authentication Login E2E ??
 * ???????????
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication - ????', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/login');
  });

  test('[P0] ?????????????', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'Test123456!';

    // Act: ??????
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // Assert: ????????
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // ????????
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    
    console.log('[PASS] ????????');
  });

  test('[P0] ?????????????????', async () => {
    // Act: ???????
    await page.fill('[data-testid="username-input"]', 'wronguser');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Assert: ??????
    await expect(page.locator('text=/????????|Invalid credentials/i')).toBeVisible({
      timeout: 5000,
    });

    // ?????????
    await expect(page).toHaveURL(/\/login/);
    
    console.log('[PASS] ????????');
  });

  test('[P1] ????????', async () => {
    // Act: ?????????????
    await page.click('[data-testid="login-button"]');

    // Assert: ????????
    const usernameError = page.locator('[data-testid="username-error"]');
    const passwordError = page.locator('[data-testid="password-error"]');

    await expect(
      usernameError.or(page.locator('text=/???????|Username is required/i'))
    ).toBeVisible({ timeout: 3000 });

    console.log('[PASS] ????????');
  });

  test('[P2] ??????/????', async () => {
    // Act: ????
    await page.fill('[data-testid="password-input"]', 'Test123456!');

    // ????????
    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // ????????
    await page.click('[data-testid="toggle-password-visibility"]');

    // Assert: ??????
    await expect(passwordInput).toHaveAttribute('type', 'text');

    console.log('[PASS] ????/??????');
  });
});
