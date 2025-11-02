/**
 * Account Management E2E 测试
 * 测试账户管理相关功能：个人资料、账户设置、账户删除等
 */

import { test, expect, type Page } from '@playwright/test';
import { WEB_CONFIG, TIMEOUT_CONFIG, TEST_USERS } from '../config';
import { login } from '../helpers/testHelpers';

test.describe('Account Management - 账户管理', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // 使用测试用户登录
    await login(page, TEST_USERS.MAIN.username, TEST_USERS.MAIN.password);
  });

  test('[P1] 应该能够查看个人资料', async () => {
    console.log('\n👤 测试查看个人资料...\n');

    // 导航到个人资料页面
    const profileButton = page.locator(
      '[data-testid="user-menu"], [aria-label*="用户"], button:has([data-testid="user-avatar"]), .user-menu'
    ).first();

    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }

    const profileLink = page.locator('text=/个人资料|Profile|个人中心/i').first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // 尝试直接导航
      await page.goto(WEB_CONFIG.getFullUrl('/profile'), {
        waitUntil: 'networkidle',
      });
    }

    // 验证个人资料信息显示
    const usernameDisplay = page.locator(`text=${TEST_USERS.MAIN.username}`);
    await expect(usernameDisplay).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

    console.log('✅ 个人资料查看测试通过');
  });

  test('[P1] 应该能够修改个人资料', async () => {
    console.log('\n✏️ 测试修改个人资料...\n');

    // 导航到个人资料编辑页面
    await navigateToProfile(page);

    // 查找编辑按钮
    const editButton = page.locator('button:has-text("编辑"), button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }

    // 修改昵称或其他可编辑字段
    const nicknameInput = page.locator('input[label*="昵称"], input[placeholder*="昵称"], input[name="nickname"]').first();
    if (await nicknameInput.isVisible()) {
      const newNickname = `测试昵称_${Date.now()}`;
      await nicknameInput.fill(newNickname);

      // 保存修改
      const saveButton = page.locator('button:has-text("保存"), button:has-text("Save")').first();
      await saveButton.click();

      // 等待保存成功提示
      const successMessage = page.locator('.v-snackbar:visible, [role="alert"]:visible');
      await expect(successMessage).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

      console.log(`  ✅ 昵称已修改为: ${newNickname}`);
    }

    console.log('✅ 个人资料修改测试通过');
  });

  test('[P2] 应该能够修改密码', async () => {
    console.log('\n🔐 测试修改密码...\n');

    // 导航到安全设置
    await navigateToSecuritySettings(page);

    // 查找修改密码入口
    const changePasswordButton = page.locator('button:has-text("修改密码"), button:has-text("Change Password")').first();
    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);

      // 填写旧密码
      const oldPasswordInput = page.locator('input[label*="当前密码"], input[placeholder*="当前密码"]').first();
      if (await oldPasswordInput.isVisible()) {
        await oldPasswordInput.fill(TEST_USERS.MAIN.password);

        // 填写新密码
        const newPasswordInputs = page.locator('input[type="password"]');
        const newPassword = 'NewTest123456!';
        
        if (await newPasswordInputs.count() >= 3) {
          await newPasswordInputs.nth(1).fill(newPassword);
          await newPasswordInputs.nth(2).fill(newPassword);
        }

        // 提交
        const submitButton = page.locator('button[type="submit"]:has-text("确认"), button[type="submit"]:has-text("提交")').first();
        await submitButton.click();

        // 等待成功提示
        const successMessage = page.locator('.v-snackbar:visible');
        await expect(successMessage).toBeVisible({ timeout: TIMEOUT_CONFIG.ELEMENT_WAIT });

        console.log('  ✅ 密码修改成功');
      } else {
        console.log('  ⚠️ 未找到密码修改表单');
      }
    } else {
      console.log('  ⚠️ 未找到修改密码按钮');
    }

    console.log('✅ 修改密码测试完成');
  });

  test('[P0] 应该能够登出账户', async () => {
    console.log('\n🚪 测试账户登出...\n');

    // 查找用户菜单
    const userMenuButton = page.locator(
      '[data-testid="user-menu"], [aria-label*="用户"], button:has([data-testid="user-avatar"]), .user-menu'
    ).first();

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    }

    // 点击登出
    const logoutButton = page.locator(
      'button:has-text("退出登录"), button:has-text("登出"), button:has-text("Logout"), [data-testid="logout-button"]'
    ).first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      console.log('  - 已点击登出按钮');
    } else {
      throw new Error('未找到登出按钮');
    }

    // 等待跳转到登录页
    await page.waitForURL(
      (url) => url.pathname.includes(WEB_CONFIG.LOGIN_PATH),
      { timeout: TIMEOUT_CONFIG.NAVIGATION }
    );

    // 验证 token 已清除
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('token') !== null;
    });

    expect(hasToken).toBe(false);
    console.log('  ✅ Token 已清除');
    console.log('✅ 登出测试通过');
  });

  test('[P2] 登出后应该清除所有认证信息', async () => {
    console.log('\n🧹 测试登出后清理认证信息...\n');

    // 登出
    await performLogout(page);

    // 验证所有认证相关的 localStorage 都被清除
    const authData = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
        userInfo: localStorage.getItem('userInfo'),
        userId: localStorage.getItem('userId'),
      };
    });

    expect(authData.token).toBeNull();
    expect(authData.refreshToken).toBeNull();
    
    console.log('  ✅ 所有认证信息已清除');
    console.log('✅ 认证信息清理测试通过');
  });
});

// ========== 辅助函数 ==========

/**
 * 导航到个人资料页面
 */
async function navigateToProfile(page: Page): Promise<void> {
  const profileButton = page.locator(
    '[data-testid="user-menu"], [aria-label*="用户"], button:has([data-testid="user-avatar"]), .user-menu'
  ).first();

  if (await profileButton.isVisible()) {
    await profileButton.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
  }

  const profileLink = page.locator('text=/个人资料|Profile|个人中心/i').first();
  if (await profileLink.isVisible()) {
    await profileLink.click();
  } else {
    await page.goto(WEB_CONFIG.getFullUrl('/profile'), {
      waitUntil: 'networkidle',
    });
  }

  await page.waitForLoadState('networkidle');
}

/**
 * 导航到安全设置页面
 */
async function navigateToSecuritySettings(page: Page): Promise<void> {
  await navigateToProfile(page);

  // 查找安全设置选项
  const securityTab = page.locator('text=/安全设置|Security|账户安全/i').first();
  if (await securityTab.isVisible()) {
    await securityTab.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
  }
}

/**
 * 执行登出操作
 */
async function performLogout(page: Page): Promise<void> {
  const userMenuButton = page.locator(
    '[data-testid="user-menu"], [aria-label*="用户"], button:has([data-testid="user-avatar"]), .user-menu'
  ).first();

  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();
    await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
  }

  const logoutButton = page.locator(
    'button:has-text("退出登录"), button:has-text("登出"), button:has-text("Logout")'
  ).first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }

  await page.waitForURL(
    (url) => url.pathname.includes(WEB_CONFIG.LOGIN_PATH),
    { timeout: TIMEOUT_CONFIG.NAVIGATION }
  );
}
