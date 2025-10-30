# Goal 模块 E2E 测试 - 快速开始

## 📋 前置条件

### 1. 确保开发环境运行

```bash
# 终端 1: 启动 API 服务
cd /workspaces/DailyUse
nx run api:dev

# 终端 2: 启动 Web 服务
nx run web:dev
```

### 2. 确保测试用户存在

```bash
# 创建测试用户
cd /workspaces/DailyUse/apps/api
npx tsx src/__tests__/manual/setup-e2e-test-user.ts
```

测试用户凭据:
- **用户名**: `testuser`
- **密码**: `Test123456!`

### 3. 安装 Playwright 浏览器

```bash
cd /workspaces/DailyUse/apps/web
npx playwright install chromium
```

---

## 🚀 运行测试

### 运行所有 Goal 测试

```bash
cd /workspaces/DailyUse/apps/web
npx playwright test goal/
```

### 运行单个测试

```bash
# 运行 CRUD 测试
npx playwright test goal/goal-crud.spec.ts
```

### UI 模式运行（推荐）

```bash
npx playwright test goal/ --ui
```

在 UI 模式中，你可以：
- 👀 查看测试执行过程
- 🐛 调试失败的测试
- 📸 查看截图和追踪记录

### 调试模式

```bash
npx playwright test goal/ --debug
```

---

## 📊 测试覆盖

### 已实现的测试场景

#### CRUD 基础功能 (`goal-crud.spec.ts`)

| 优先级 | 测试场景 | 状态 |
|--------|---------|------|
| P0 | 创建新目标 | ✅ |
| P0 | 更新目标信息 | ✅ |
| P0 | 删除目标 | ✅ |
| P1 | 查看目标详情 | ✅ |
| P1 | 激活目标 | ✅ |
| P1 | 完成目标 | ✅ |
| P2 | 筛选目标 | ✅ |

---

## 🧪 测试架构

### Page Object Model

使用 POM 模式提高测试可维护性：

```typescript
import { GoalPage } from '../page-objects/GoalPage';

test('example', async ({ page }) => {
  const goalPage = new GoalPage(page);
  
  await goalPage.navigate();
  await goalPage.createGoal({
    title: 'My Goal',
    description: 'Description',
  });
  
  await goalPage.expectGoalToExist('My Goal');
});
```

### 测试辅助函数

位于 `e2e/helpers/testHelpers.ts`：

```typescript
import { login, TEST_USER } from '../helpers/testHelpers';

test.beforeEach(async ({ page }) => {
  await login(page, TEST_USER.username, TEST_USER.password);
});
```

---

## 📁 文件结构

```
apps/web/e2e/
├── goal/
│   └── goal-crud.spec.ts          # Goal CRUD 测试
├── page-objects/
│   └── GoalPage.ts                # Goal 页面对象
├── helpers/
│   └── testHelpers.ts             # 通用辅助函数
└── playwright.config.ts           # Playwright 配置
```

---

## 🔧 测试配置

### Playwright 配置亮点

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 5 * 60 * 1000,           // 5分钟超时
  workers: 1,                       // 单个 worker（避免并发冲突）
  retries: process.env.CI ? 2 : 0,  // CI 环境重试2次
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## 📝 编写新测试

### 1. 使用 Page Object（推荐）

```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';
import { GoalPage } from '../page-objects/GoalPage';

test.describe('My Feature', () => {
  let goalPage: GoalPage;

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER.username, TEST_USER.password);
    
    goalPage = new GoalPage(page);
    await goalPage.navigate();
  });

  test('should do something', async () => {
    await goalPage.createGoal({
      title: 'Test Goal',
      description: 'Test Description',
    });

    await goalPage.expectGoalToExist('Test Goal');
  });
});
```

### 2. 直接使用 Page API

```typescript
test('manual test', async ({ page }) => {
  await login(page, TEST_USER.username, TEST_USER.password);
  
  await page.goto('/goals');
  
  await page.click('button:has-text("创建目标")');
  await page.fill('input[name="title"]', 'My Goal');
  await page.click('button:has-text("保存")');
  
  await expect(page.locator('text=My Goal')).toBeVisible();
});
```

---

## 🐛 调试技巧

### 1. 使用 `page.pause()`

```typescript
test('debug test', async ({ page }) => {
  await login(page);
  await page.pause(); // 暂停测试，打开调试器
  
  // 继续测试...
});
```

### 2. 查看测试追踪

```bash
# 运行测试生成追踪
npx playwright test goal/ --trace on

# 查看追踪记录
npx playwright show-trace test-results/.../trace.zip
```

### 3. 查看测试报告

```bash
# 生成 HTML 报告
npx playwright test goal/

# 打开报告
npx playwright show-report
```

---

## ❌ 常见问题

### 测试超时

**原因**: API/Web 服务未启动或响应慢

**解决**:
```bash
# 确保服务运行
nx run api:dev
nx run web:dev

# 增加超时时间
test('my test', async ({ page }) => {
  test.setTimeout(120000); // 2分钟
});
```

### 元素未找到

**原因**: 选择器不匹配或元素未渲染

**解决**:
```typescript
// 使用更宽松的选择器
await page.locator('button:has-text("创建")').or(page.locator('[data-testid="create-btn"]')).click();

// 等待元素出现
await page.waitForSelector('button:has-text("创建")', { timeout: 10000 });
```

### 登录失败

**原因**: 测试用户不存在或密码错误

**解决**:
```bash
# 重新创建测试用户
cd /workspaces/DailyUse/apps/api
npx tsx src/__tests__/manual/setup-e2e-test-user.ts
```

---

## 📚 参考资源

- [Playwright 官方文档](https://playwright.dev/)
- [Page Object Model 指南](https://playwright.dev/docs/pom)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [项目完整 E2E 指南](./E2E_TESTING_GUIDE.md)

---

## ✅ 下一步

- [ ] 为 Key Result 功能编写 E2E 测试
- [ ] 添加 Goal Folder 管理测试
- [ ] 集成 CI/CD 管道
- [ ] 添加性能测试
