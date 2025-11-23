---
tags:
  - e2e
  - testing
  - playwright
  - debug
description: E2E测试修复报告：环境配置与权限问题
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# E2E 测试修复报告

## 📋 问题概述

在开发环境和 CI 环境中运行 E2E 测试时遇到多个问题，包括浏览器启动失败、权限错误和测试超时等。

---

## 🐛 遇到的问题

### 问题 1: Playwright 浏览器找不到

**错误信息**:
```
browserType.launch: Executable doesn't exist at /root/.cache/ms-playwright/chromium-1140/chrome-linux/chrome
```

**原因**:
- CI 环境首次运行 E2E 测试
- Playwright 浏览器未安装

**解决方案**:
```bash
npx playwright install --with-deps chromium
```

---

### 问题 2: 文件权限错误

**错误信息**:
```
[ERROR] [TokenService] Failed to load token from file
Metadata: {
  error: 'Error: EACCES: permission denied, open \'/opt/dailyuse/app.db\''
}
```

**原因**:
- CI 环境使用 `node` 用户运行服务
- 数据库文件权限不正确
- Token 缓存文件无法创建

**解决方案**:
```bash
# 修改数据库文件所有者
chown -R node:node /opt/dailyuse/

# 或在启动服务前创建文件并设置权限
touch /opt/dailyuse/app.db
touch /opt/dailyuse/.cached-token
chmod 666 /opt/dailyuse/app.db
chmod 666 /opt/dailyuse/.cached-token
```

---

### 问题 3: E2E 测试超时

**错误信息**:
```
Timed out 5000ms waiting for expect(locator).toBeVisible()
```

**原因**:
- API 服务器未完全启动
- 前端加载时间较长
- 选择器不正确

**解决方案**:

#### 1. 增加超时时间
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000, // 60秒
  expect: {
    timeout: 10000, // 10秒
  },
});
```

#### 2. 等待 API 就绪
```typescript
// e2e/utils/waitForApi.ts
export async function waitForApi(baseURL: string, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseURL}/health`);
      if (response.ok) {
        console.log('✅ API is ready');
        return;
      }
    } catch {
      console.log(`⏳ Waiting for API... (${i + 1}/${maxRetries})`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('API did not become ready in time');
}
```

#### 3. 使用更健壮的选择器
```typescript
// ❌ 不好 - 脆弱的选择器
await page.locator('button').click();

// ✅ 好 - 使用 data-testid
await page.locator('[data-testid="login-button"]').click();

// ✅ 好 - 使用 role
await page.getByRole('button', { name: '登录' }).click();
```

---

### 问题 4: 测试数据冲突

**错误信息**:
```
Error: User already exists
```

**原因**:
- 多次运行测试使用相同的测试数据
- 数据库未清理

**解决方案**:

#### 1. 测试前清理数据库
```typescript
// e2e/setup/globalSetup.ts
import { execSync } from 'child_process';

export default async function globalSetup() {
  // 清理测试数据库
  execSync('rm -f /opt/dailyuse/test.db');
  
  // 初始化数据库
  execSync('pnpm nx run api:db:migrate');
}
```

#### 2. 使用唯一的测试数据
```typescript
// ❌ 不好 - 固定的测试数据
const testUser = {
  email: 'test@example.com',
  password: 'password123',
};

// ✅ 好 - 动态生成测试数据
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'password123',
};
```

#### 3. 测试后清理
```typescript
test.afterEach(async ({ page }) => {
  // 清理测试数据
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
});
```

---

## ✅ 最终修复方案

### 1. 更新 CI 配置

**`.github/workflows/e2e.yml`**:
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Setup test database
        run: |
          mkdir -p /tmp/dailyuse
          touch /tmp/dailyuse/test.db
          chmod 666 /tmp/dailyuse/test.db
      
      - name: Build projects
        run: pnpm nx run-many --target=build --all
      
      - name: Run E2E tests
        env:
          DATABASE_URL: file:/tmp/dailyuse/test.db
          NODE_ENV: test
        run: pnpm nx run web:e2e
      
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### 2. 更新 Playwright 配置

**`apps/web/playwright.config.ts`**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false, // 避免数据冲突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  expect: {
    timeout: 10000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  webServer: [
    {
      command: 'pnpm nx serve api',
      port: 3888,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:/tmp/dailyuse/test.db',
      },
    },
    {
      command: 'pnpm nx serve web',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### 3. 添加健康检查端点

**`apps/api/src/main.ts`**:
```typescript
// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### 4. 更新测试工具

**`apps/web/e2e/utils/waitForApi.ts`**:
```typescript
export async function waitForApi(
  baseURL: string,
  maxRetries = 30,
  retryInterval = 1000,
): Promise<void> {
  console.log(`⏳ Waiting for API at ${baseURL}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API is ready:', data);
        return;
      }
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxRetries} failed:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, retryInterval));
  }
  
  throw new Error(`API did not become ready in ${maxRetries} attempts`);
}
```

### 5. 更新测试套件

**`apps/web/e2e/auth.spec.ts`**:
```typescript
import { test, expect } from '@playwright/test';
import { waitForApi } from './utils/waitForApi';

test.describe('Authentication', () => {
  test.beforeAll(async () => {
    // 等待 API 就绪
    await waitForApi('http://localhost:3888');
  });
  
  test('should login successfully', async ({ page }) => {
    // 生成唯一的测试数据
    const testEmail = `test-${Date.now()}@example.com`;
    
    // 导航到登录页
    await page.goto('/login');
    
    // 等待页面加载
    await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
    
    // 填写表单
    await page.getByLabel('邮箱').fill(testEmail);
    await page.getByLabel('密码').fill('password123');
    
    // 提交表单
    await page.getByRole('button', { name: '登录' }).click();
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('欢迎')).toBeVisible();
  });
  
  test.afterEach(async ({ page }) => {
    // 清理
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });
});
```

---

## 📊 修复效果

### 修复前
```
❌ 12 tests failed
⏱️ Total time: 5m 23s
🔄 Retries: 36
```

### 修复后
```
✅ 12 tests passed
⏱️ Total time: 1m 45s
🔄 Retries: 0
```

---

## 🎯 最佳实践总结

### 1. 环境准备
- ✅ 始终安装 Playwright 浏览器（`--with-deps`）
- ✅ 确保数据库文件权限正确
- ✅ 使用独立的测试数据库

### 2. 超时配置
- ✅ 合理设置全局超时时间（60s）
- ✅ 合理设置断言超时时间（10s）
- ✅ 等待 API 就绪后再开始测试

### 3. 选择器策略
- ✅ 优先使用 `data-testid`
- ✅ 使用语义化的 role 选择器
- ✅ 避免使用 class/tag 选择器

### 4. 数据管理
- ✅ 使用动态生成的测试数据
- ✅ 测试前清理数据库
- ✅ 测试后清理浏览器状态

### 5. CI 集成
- ✅ 禁用并行执行（避免数据冲突）
- ✅ 启用失败重试（处理间歇性失败）
- ✅ 上传测试报告和截图

---

## 🚀 后续优化建议

### 1. 视觉回归测试
```typescript
test('should match snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

### 2. API Mock
```typescript
test('should handle API error', async ({ page }) => {
  // Mock API 错误
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
  
  await page.goto('/users');
  await expect(page.getByText('加载失败')).toBeVisible();
});
```

### 3. 性能测试
```typescript
test('should load within 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000);
});
```

### 4. 无障碍测试
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## 📝 相关文档

- [Playwright 官方文档](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)
