/**
 * Authentication Login Debug - 登录调试测试
 * 专门用于调试和排查登录问题的测试套件
 * 包含详细的日志和截图
 */

import { test, expect } from '@playwright/test';
import { WEB_CONFIG, TIMEOUT_CONFIG, API_CONFIG, TEST_USERS } from '../config';

test.describe('Login Debug - 登录调试', () => {
  test.beforeEach(async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 登录调试测试开始');
    console.log('='.repeat(80));
    console.log(`API 地址: ${API_CONFIG.FULL_URL}`);
    console.log(`Web 地址: ${WEB_CONFIG.BASE_URL}`);
    console.log(`测试用户: ${TEST_USERS.MAIN.username}`);
    console.log('='.repeat(80) + '\n');

    // 设置详细的网络日志
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`📤 [REQUEST] ${request.method()} ${request.url()}`);
        if (request.postData()) {
          try {
            const data = JSON.parse(request.postData() || '{}');
            console.log(`   Body:`, JSON.stringify(data, null, 2));
          } catch (e) {
            console.log(`   Body:`, request.postData());
          }
        }
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
        console.log(`📥 [RESPONSE] ${statusEmoji} ${status} ${response.url()}`);
        
        try {
          const body = await response.text();
          if (body) {
            console.log(`   Response:`, body.substring(0, 500));
          }
        } catch (e) {
          console.log(`   (无法读取响应体)`);
        }
      }
    });

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`🖥️  [BROWSER ${type.toUpperCase()}]`, msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.log(`🖥️  [BROWSER PAGE ERROR]`, error.message);
    });
  });

  test('[DEBUG] 完整登录流程调试', async ({ page }) => {
    console.log('\n�� 步骤 1: 导航到登录页\n');
    
    await page.goto(WEB_CONFIG.getFullUrl(WEB_CONFIG.LOGIN_PATH), {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT_CONFIG.NAVIGATION,
    });

    console.log(`   当前 URL: ${page.url()}`);
    await page.screenshot({ path: '/tmp/01-login-page-loaded.png' });
    console.log('   📸 截图已保存: /tmp/01-login-page-loaded.png');

    // 清理存储
    console.log('\n📍 步骤 2: 清理 localStorage\n');
    await page.evaluate(() => {
      console.log('[清理前] localStorage keys:', Object.keys(localStorage));
      localStorage.clear();
      sessionStorage.clear();
      console.log('[清理后] localStorage keys:', Object.keys(localStorage));
    });

    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    console.log('   ✅ 页面加载完成');

    // 查找登录标签
    console.log('\n📍 步骤 3: 查找并点击登录标签\n');
    
    const loginTab = page.locator('button.v-tab, [role="tab"]').filter({ hasText: /登录|Login/i });
    const loginTabCount = await loginTab.count();
    console.log(`   找到 ${loginTabCount} 个登录标签`);

    if (loginTabCount > 0) {
      await loginTab.first().click();
      console.log('   ✅ 已点击登录标签');
      await page.waitForTimeout(TIMEOUT_CONFIG.SHORT_WAIT);
    } else {
      console.log('   ⚠️  未找到登录标签，可能已经在登录表单');
    }

    await page.screenshot({ path: '/tmp/02-login-tab-selected.png' });
    console.log('   📸 截图已保存: /tmp/02-login-tab-selected.png');

    // 查找用户名输入框
    console.log('\n📍 步骤 4: 定位用户名输入框\n');
    
    // 尝试多种定位方式
    const usernameStrategies = [
      { name: '通过 label "用户名" 定位', locator: page.locator('label:has-text("用户名")').locator('..').locator('input') },
      { name: '通过 placeholder 定位', locator: page.locator('input[placeholder*="用户名"]') },
      { name: '通过 name 属性定位', locator: page.locator('input[name="username"]') },
      { name: '通过 v-combobox 定位', locator: page.locator('.v-combobox input') },
    ];

    let usernameInput = null;
    for (const strategy of usernameStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: 找到 ${count} 个元素`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        usernameInput = strategy.locator.first();
        console.log(`   ✅ 使用策略: ${strategy.name}`);
        break;
      }
    }

    if (!usernameInput) {
      console.log('   ❌ 未找到用户名输入框');
      await page.screenshot({ path: '/tmp/03-error-no-username-input.png' });
      throw new Error('无法找到用户名输入框');
    }

    // 填写用户名
    console.log(`\n📍 步骤 5: 填写用户名 "${TEST_USERS.MAIN.username}"\n`);
    await usernameInput.click();
    await page.waitForTimeout(100);
    await usernameInput.fill(TEST_USERS.MAIN.username);
    const usernameValue = await usernameInput.inputValue();
    console.log(`   输入框值: "${usernameValue}"`);
    
    if (usernameValue !== TEST_USERS.MAIN.username) {
      console.log('   ⚠️  用户名填写可能失败，重试一次');
      await usernameInput.clear();
      await usernameInput.fill(TEST_USERS.MAIN.username);
    }

    await page.screenshot({ path: '/tmp/04-username-filled.png' });
    console.log('   📸 截图已保存: /tmp/04-username-filled.png');

    // 查找密码输入框
    console.log('\n📍 步骤 6: 定位密码输入框\n');
    
    const passwordStrategies = [
      { name: '通过 label "密码" 定位', locator: page.locator('label:has-text("密码")').locator('..').locator('input[type="password"]') },
      { name: '通过 placeholder 定位', locator: page.locator('input[type="password"][placeholder*="密码"]') },
      { name: '通过 name 属性定位', locator: page.locator('input[type="password"][name="password"]') },
      { name: '通过类型定位 (第一个)', locator: page.locator('input[type="password"]').first() },
    ];

    let passwordInput = null;
    for (const strategy of passwordStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: 找到 ${count} 个元素`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        passwordInput = strategy.locator.first();
        console.log(`   ✅ 使用策略: ${strategy.name}`);
        break;
      }
    }

    if (!passwordInput) {
      console.log('   ❌ 未找到密码输入框');
      await page.screenshot({ path: '/tmp/05-error-no-password-input.png' });
      throw new Error('无法找到密码输入框');
    }

    // 填写密码
    console.log(`\n📍 步骤 7: 填写密码\n`);
    await passwordInput.click();
    await page.waitForTimeout(100);
    await passwordInput.fill(TEST_USERS.MAIN.password);
    console.log('   ✅ 密码已填写');

    await page.screenshot({ path: '/tmp/06-password-filled.png' });
    console.log('   📸 截图已保存: /tmp/06-password-filled.png');

    // 查找登录按钮
    console.log('\n📍 步骤 8: 查找登录按钮\n');
    
    const loginButtonStrategies = [
      { name: '通过 type="submit" 和文本定位', locator: page.locator('button[type="submit"]:has-text("登录")') },
      { name: '通过文本定位', locator: page.locator('button:has-text("登录")') },
      { name: '通过 data-testid 定位', locator: page.locator('[data-testid="login-button"]') },
    ];

    let loginButton = null;
    for (const strategy of loginButtonStrategies) {
      const count = await strategy.locator.count();
      console.log(`   ${strategy.name}: 找到 ${count} 个元素`);
      if (count > 0 && (await strategy.locator.first().isVisible())) {
        loginButton = strategy.locator.first();
        console.log(`   ✅ 使用策略: ${strategy.name}`);
        break;
      }
    }

    if (!loginButton) {
      console.log('   ❌ 未找到登录按钮');
      await page.screenshot({ path: '/tmp/07-error-no-login-button.png' });
      throw new Error('无法找到登录按钮');
    }

    // 点击登录按钮
    console.log('\n📍 步骤 9: 点击登录按钮\n');
    
    // 开始监听网络请求
    const loginRequest = page.waitForRequest(
      (req) => req.url().includes('/auth/login') || req.url().includes('/login'),
      { timeout: TIMEOUT_CONFIG.API_REQUEST }
    ).catch(() => null);

    await loginButton.click();
    console.log('   ✅ 已点击登录按钮');

    // 等待网络请求
    console.log('   ⏳ 等待登录 API 请求...');
    const request = await loginRequest;
    
    if (request) {
      console.log(`   ✅ 检测到登录请求: ${request.url()}`);
    } else {
      console.log('   ⚠️  未检测到登录 API 请求');
    }

    // 等待响应
    await page.waitForTimeout(TIMEOUT_CONFIG.LONG_WAIT);
    await page.screenshot({ path: '/tmp/08-after-login-click.png' });
    console.log('   📸 截图已保存: /tmp/08-after-login-click.png');

    // 检查是否有错误提示
    console.log('\n📍 步骤 10: 检查登录结果\n');
    
    const errorSnackbar = page.locator('.v-snackbar:visible, [role="alert"]:visible');
    const hasError = await errorSnackbar.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorSnackbar.textContent();
      console.log(`   ❌ 发现错误提示: "${errorText}"`);
      await page.screenshot({ path: '/tmp/09-login-error.png' });
      console.log('   📸 错误截图: /tmp/09-login-error.png');
    }

    // 检查 URL 是否改变
    const currentUrl = page.url();
    console.log(`   当前 URL: ${currentUrl}`);
    
    if (currentUrl.includes(WEB_CONFIG.LOGIN_PATH)) {
      console.log('   ⚠️  仍在登录页面，登录可能失败');
    } else {
      console.log('   ✅ 已离开登录页面');
    }

    // 检查 localStorage
    const authInfo = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token') ? '已存在' : '不存在',
        userInfo: localStorage.getItem('userInfo') ? '已存在' : '不存在',
        allKeys: Object.keys(localStorage),
      };
    });

    console.log('   localStorage 状态:');
    console.log(`     - token: ${authInfo.token}`);
    console.log(`     - userInfo: ${authInfo.userInfo}`);
    console.log(`     - 所有 keys: ${authInfo.allKeys.join(', ')}`);

    await page.screenshot({ path: '/tmp/10-final-state.png' });
    console.log('   📸 最终状态截图: /tmp/10-final-state.png');

    console.log('\n' + '='.repeat(80));
    console.log('🏁 登录调试测试结束');
    console.log('='.repeat(80) + '\n');

    // 断言：登录应该成功
    expect(currentUrl).not.toContain(WEB_CONFIG.LOGIN_PATH);
    expect(authInfo.token).toBe('已存在');
  });

  test('[DEBUG] 测试 API 健康检查', async ({ page }) => {
    console.log('\n🏥 测试 API 健康检查\n');

    const healthUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.HEALTH_ENDPOINT}`;
    console.log(`   健康检查 URL: ${healthUrl}`);

    await page.goto(healthUrl);
    const content = await page.textContent('body');
    
    console.log(`   响应内容: ${content}`);
    
    expect(content).toContain('ok');
    console.log('   ✅ API 健康检查通过');
  });
});
