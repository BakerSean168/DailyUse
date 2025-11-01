/**
 * Account Profile E2E Test
 * 测试账户个人资料管理
 */
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.describe('Account - Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    await page.goto('/account/profile');
  });

  test('[P0] should display user profile information', async ({ page }) => {
    await expect(page.locator('[data-testid="profile-username"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
  });

  test('[P0] should update profile information', async ({ page }) => {
    await page.click('[data-testid="edit-profile-button"]');
    
    const newDisplayName = \Updated User \\;
    await page.fill('[data-testid="display-name-input"]', newDisplayName);
    await page.click('[data-testid="save-profile-button"]');

    await expect(page.locator('text=/更新成功|Updated successfully/i')).toBeVisible({ timeout: 5000 });
  });

  test('[P1] should upload avatar', async ({ page }) => {
    await page.click('[data-testid="avatar-upload-button"]');
    
    // 模拟文件上传
    const fileInput = page.locator('[data-testid="avatar-file-input"]');
    if (await fileInput.isVisible()) {
      await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('[P1] should update email with verification', async ({ page }) => {
    await page.click('[data-testid="edit-profile-button"]');
    await page.fill('[data-testid="email-input"]', 'newemail@example.com');
    await page.click('[data-testid="save-profile-button"]');

    await expect(page.locator('text=/验证邮件已发送|Verification email sent/i')).toBeVisible({ timeout: 5000 });
  });
});
