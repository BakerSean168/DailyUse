/**
 * Authentication Login E2E 测试
 * 测试用户登录的关键流程
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication - 用户登录', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/login');
  });

  test('[P0] 应该成功登录并跳转到仪表板', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'Test123456!';

    // Act: 填写登录表单
    await page.fill('[data-testid="username-input"]', username);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // Assert: 验证跳转到仪表板
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // 验证用户信息显示
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    
    console.log('✅ 登录成功测试通过');
  });

  test('[P0] 应该正确显示错误的用户名或密码提示', async () => {
    // Act: 使用错误的凭据
    await page.fill('[data-testid="username-input"]', 'wronguser');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Assert: 验证错误提示
    await expect(page.locator('text=/用户名或密码错误|Invalid credentials/i')).toBeVisible({
      timeout: 5000,
    });

    // 验证仍然在登录页面
    await expect(page).toHaveURL(/\/login/);
    
    console.log('✅ 错误凭据测试通过');
  });

  test('[P1] 应该验证必填字段', async () => {
    // Act: 不填写任何信息直接点击登录
    await page.click('[data-testid="login-button"]');

    // Assert: 验证表单验证提示
    const usernameError = page.locator('[data-testid="username-error"]');
    const passwordError = page.locator('[data-testid="password-error"]');

    await expect(
      usernameError.or(page.locator('text=/用户名不能为空|Username is required/i'))
    ).toBeVisible({ timeout: 3000 });

    console.log('✅ 表单验证测试通过');
  });

  test('[P2] 应该支持显示/隐藏密码', async () => {
    // Act: 填写密码
    await page.fill('[data-testid="password-input"]', 'Test123456!');

    // 验证密码默认隐藏
    const passwordInput = page.locator('[data-testid="password-input"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 点击显示密码按钮
    await page.click('[data-testid="toggle-password-visibility"]');

    // Assert: 验证密码可见
    await expect(passwordInput).toHaveAttribute('type', 'text');

    console.log('✅ 密码显示/隐藏测试通过');
  });
});
