import { test } from '@playwright/test';

test('探索应用路由', async ({ page }) => {
  const baseUrl = 'http://localhost:5173';
  
  console.log('访问首页...');
  await page.goto(baseUrl);
  await page.waitForTimeout(2000);
  console.log('当前 URL:', page.url());
  console.log('页面标题:', await page.title());
  
  // 截图
  await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
  
  // 尝试不同的登录路由
  const loginRoutes = ['/login', '/auth/login', '/authentication/login'];
  for (const route of loginRoutes) {
    console.log(`\n尝试访问 ${route}...`);
    await page.goto(`${baseUrl}${route}`);
    await page.waitForTimeout(1000);
    console.log('跳转后 URL:', page.url());
    
    // 查找输入框
    const emailInputs = await page.locator('input[type="email"], input[name="email"]').count();
    console.log(`找到 ${emailInputs} 个 email 输入框`);
    
    if (emailInputs > 0) {
      console.log(`✅ 找到登录页面：${route}`);
      await page.screenshot({ path: `test-results/login-${route.replace(/\//g, '_')}.png`, fullPage: true });
      break;
    }
  }
});
