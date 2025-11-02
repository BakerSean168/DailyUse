import { test, expect, type Page } from '@playwright/test';
import { WEB_CONFIG, TIMEOUT_CONFIG, TEST_USERS } from '../config';

test.describe('Authentication - 登录页基础验证', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.LOGIN_PATH), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    // 默认展示登录表单
    const loginTab = page.locator('button.v-tab:has-text("登录")');
    if (await loginTab.isVisible()) {
      await loginTab.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }
  });

  test('[P0] 正确凭证可以成功登录', async () => {
    const { username, password } = TEST_USERS.MAIN;

    await fillLoginForm(page, username, password);
    await submitLoginForm(page);

    await expect.poll(async () => page.url(), {
      timeout: TIMEOUT_CONFIG.LOGIN,
    }).not.toContain(WEB_CONFIG.LOGIN_PATH);

    const authState = await readAuthState(page);
    expect(authState.accessToken).toBe(true);
    expect(authState.refreshToken).toBe(true);

    console.log('[PASS] 成功登录校验通过');
  });

  test('[P0] 错误凭证会显示错误提示', async () => {
    // 使用满足密码规则的错误密码
    await fillLoginForm(page, 'wronguser', 'WrongPass123!');
    await submitLoginForm(page);

    // 等待错误提示出现（使用全局 snackbar）
    const errorSnackbar = page.locator('[data-testid="global-snackbar"]');
    await expect(errorSnackbar).toBeVisible({ timeout: 5000 });
    await expect.poll(async () => page.url()).toContain(WEB_CONFIG.LOGIN_PATH);

    console.log('[PASS] 错误凭证提示校验通过');
  });

  test('[P1] 空表单会提示必填错误', async () => {
    await submitLoginForm(page);

    const validationMessages = page.locator('.v-messages__message, [role="alert"]');
    await expect(validationMessages.first()).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    console.log('[PASS] 空表单错误提示校验通过');
  });

  test('[P2] 可以切换密码可见性', async () => {
    const passwordInput = page.locator('[data-testid="login-password-input"] input');
    await passwordInput.fill(TEST_USERS.MAIN.password);

    await expect(passwordInput).toHaveAttribute('type', 'password');

    const visibilityToggle = page.locator('[data-testid="login-password-input"] i.mdi-eye-off, [data-testid="login-password-input"] i.mdi-eye');
    await visibilityToggle.click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
    console.log('[PASS] 密码可见性切换通过');
  });
});

async function fillLoginForm(page: Page, username: string, password: string): Promise<void> {
  const usernameField = page.locator('[data-testid="login-username-input"] input');
  await usernameField.fill(username);

  const passwordField = page.locator('[data-testid="login-password-input"] input');
  await passwordField.fill(password);
}

async function submitLoginForm(page: Page): Promise<void> {
  const submitButton = page.locator('[data-testid="login-submit-button"]');
  await submitButton.click();
}

async function readAuthState(page: Page): Promise<{ accessToken: boolean; refreshToken: boolean }> {
  return page.evaluate(() => ({
    accessToken: !!localStorage.getItem('access_token') || !!sessionStorage.getItem('access_token'),
    refreshToken: !!localStorage.getItem('refresh_token') || !!sessionStorage.getItem('refresh_token'),
  }));
}
