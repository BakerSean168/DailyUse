import { test } from '@playwright/test';
import { login, TEST_USER } from './helpers/testHelpers';

test('Debug Task Page', async ({ page }) => {
  // 登录
  await page.goto('/auth');
  await login(page, TEST_USER.username, TEST_USER.password);
  
  // 访问tasks页面
  await page.goto('/tasks/one-time');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: 'test-results/debug-task-page.png', fullPage: true });
  
  // 打印页面信息
  console.log('=== PAGE URL ===');
  console.log(page.url());
  
  console.log('=== PAGE TITLE ===');
  console.log(await page.title());
  
  console.log('=== BUTTONS ON PAGE ===');
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    const testId = await btn.getAttribute('data-testid');
    const visible = await btn.isVisible().catch(() => false);
    console.log(`Button: "${text?.trim()}" | testid: ${testId} | visible: ${visible}`);
  }
});
