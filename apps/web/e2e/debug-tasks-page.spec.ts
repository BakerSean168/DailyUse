import { test } from '@playwright/test';

test('Debug: 查看 tasks 页面的元素', async ({ page }) => {
  // 1. 登录
  await page.goto('http://localhost:5173/auth');
  await page.locator('[data-testid="login-username-input"] input').fill('Test123123');
  await page.locator('[data-testid="login-password-input"] input').fill('Llh123123!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1000);
  
  // 2. 导航到 tasks 页面
  await page.goto('http://localhost:5173/tasks');
  await page.waitForTimeout(2000);
  
  console.log('当前 URL:', page.url());
  console.log('页面标题:', await page.title());
  
  // 3. 查看所有按钮
  const buttons = await page.locator('button').all();
  console.log(`\n找到 ${buttons.length} 个按钮:`);
  for (let i = 0; i < Math.min(buttons.length, 15); i++) {
    const text = await buttons[i].textContent();
    const visible = await buttons[i].isVisible();
    const ariaLabel = await buttons[i].getAttribute('aria-label');
    console.log(`  按钮 ${i+1}: "${text}" (可见: ${visible}, aria-label: "${ariaLabel}")`);
  }
  
  // 4. 查看所有文本内容
  const body = await page.locator('body').textContent();
  console.log(`\n页面文本内容（前500字）:\n${body?.substring(0, 500)}`);
  
  // 5. 截图
  await page.screenshot({ path: 'test-results/debug-tasks-page.png', fullPage: true });
  console.log('\n截图已保存');
});
