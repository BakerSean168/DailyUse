 # 🧪 DailyUse 测试完善计划

## 📊 当前状态

### 现有测试覆盖
- **Domain 层测试**: 13 个文件
- **API 层测试**: 16 个文件  
- **Web E2E 测试**: 38 个文件
- **test-utils 包**: ✅ 已就绪

### 测试缺口分析
- ❌ Goal 模块缺少完整的 domain 测试
- ❌ Task 模块缺少 API 集成测试
- ❌ Setting 模块缺少完整测试
- ❌ Authentication 模块缺少业务流程测试
- ❌ Web 端核心流程缺少 E2E 测试

---

## 🎯 测试完善目标

### 1. Domain 层测试 (packages/domain-server)

**优先级：🔴 高**

#### 目标模块：
1. **Task 模块** ⭐⭐⭐⭐⭐ (优先级提升)
   - `TaskInstance` 聚合根测试
   - `TaskTemplate` 聚合根测试（已有，需补充）
   - `TaskDependency` 实体测试
   - `RecurrenceConfig` 值对象测试
   - `TaskDomainService` 测试

2. **Authentication 模块** ⭐⭐⭐⭐⭐
   - `Account` 聚合根测试
   - `AuthSession` 实体测试
   - `AuthCredential` 值对象测试
   - 密码加密/验证测试

3. **Setting 模块** ⭐⭐⭐
   - `UserSetting` 聚合根测试
   - 主题设置值对象测试
   - 通知偏好值对象测试

4. **Notification 模块** ⭐⭐⭐
   - `Notification` 聚合根测试（已有，需补充）
   - 多渠道发送逻辑测试
   - 通知模板测试

5. **Goal 模块** ⭐⭐ (降低优先级 - 跳过)
   - `Goal` 聚合根完整测试
   - `KeyResult` 实体测试
   - `GoalReview` 实体测试
   - `FocusMode` 值对象测试
   - `GoalReminderConfig` 值对象测试（新增）
   - `GoalDomainService` 领域服务测试
   - `Notification` 聚合根测试（已有，需补充）
   - 多渠道发送逻辑测试
   - 通知模板测试

---

### 2. API 层集成测试 (apps/api)

**优先级：🔴 高**

#### 测试类型：
- **集成测试**：使用 test-utils 的数据库工具
- **端到端测试**：真实 API 调用

#### 目标模块：

1. **Task API** ⭐⭐⭐⭐⭐ (优先级提升)
   ```typescript
   // apps/api/src/modules/task/__tests__/task.integration.test.ts
   - POST /api/v1/tasks - 创建任务
   - GET /api/v1/tasks - 查询任务
   - PUT /api/v1/tasks/:id - 更新任务
   - POST /api/v1/tasks/:id/complete - 完成任务
   - POST /api/v1/tasks/batch - 批量操作
   ```

2. **Authentication API** ⭐⭐⭐⭐⭐
   ```typescript
   // apps/api/src/modules/authentication/__tests__/auth.integration.test.ts
   - POST /api/v1/auth/register - 注册
   - POST /api/v1/auth/login - 登录
   - POST /api/v1/auth/refresh - 刷新 Token
   - POST /api/v1/auth/logout - 登出
   - POST /api/v1/auth/change-password - 修改密码
   ```

3. **Goal API** ⭐⭐ (降低优先级 - 跳过)
   ```typescript
   // apps/api/src/modules/goal/__tests__/goal.integration.test.ts
   - POST /api/v1/goals - 创建目标
   - GET /api/v1/goals - 查询目标列表
   - PUT /api/v1/goals/:id - 更新目标
   - POST /api/v1/goals/:id/key-results - 添加关键结果
   - PUT /api/v1/goals/:id/progress - 更新进度
   - POST /api/v1/goals/:id/complete - 完成目标
   ```

4. **Setting API** ⭐⭐⭐
   ```typescript
   // apps/api/src/modules/setting/__tests__/setting.integration.test.ts
   - GET /api/v1/settings - 获取设置
   - PUT /api/v1/settings - 更新设置
   - PUT /api/v1/settings/theme - 更新主题
   ```

---

### 3. Web 端 E2E 测试 (apps/web)

**优先级：🟡 中**

使用 Playwright 进行端到端测试

#### 核心用户流程：

1. **认证流程** ⭐⭐⭐⭐⭐
   ```typescript
   // apps/web/e2e/auth.spec.ts
   - 用户注册流程
   - 用户登录流程
   - 退出登录流程
   - 记住我功能
   ```

2. **目标管理流程** ⭐⭐⭐⭐⭐
   ```typescript
   // apps/web/e2e/goal.spec.ts
   - 创建目标（完整表单填写）
   - 添加关键结果
   - 更新关键结果进度
   - 查看目标进度
   - 完成目标
   - 归档目标
   ```

3. **任务管理流程** ⭐⭐⭐⭐
   ```typescript
   // apps/web/e2e/task.spec.ts
   - 创建一次性任务
   - 创建重复任务
   - 任务拖拽排序
   - 批量操作任务
   - 任务完成流程
   ```

4. **专注模式流程** ⭐⭐⭐
   ```typescript
   // apps/web/e2e/focus-mode.spec.ts
   - 启用专注模式
   - 选择聚焦目标
   - 隐藏其他目标
   - 退出专注模式
   ```

---

## 🛠️ 实施步骤

### Phase 1: Domain 层测试补充 (Week 1)

**Day 1-2: Goal 模块**
- [ ] Goal 聚合根完整测试
- [ ] KeyResult 实体测试
- [ ] GoalReminderConfig 值对象测试
- [ ] FocusMode 值对象测试
- [ ] GoalDomainService 测试

**Day 3: Task 模块**
- [ ] TaskInstance 聚合根测试
- [ ] 补充 TaskTemplate 测试
- [ ] RecurrenceConfig 值对象测试

**Day 4: Authentication & Setting**
- [ ] Account 聚合根测试
- [ ] UserSetting 聚合根测试
- [ ] 密码加密测试

---

### Phase 2: API 集成测试 (Week 2)

**Day 5-6: 核心 API**
- [ ] Goal API 集成测试（完整 CRUD）
- [ ] Task API 集成测试
- [ ] Authentication API 测试（完整流程）

**Day 7: 次要 API**
- [ ] Setting API 测试
- [ ] Notification API 测试
- [ ] Reminder API 测试

---

### Phase 3: Web E2E 测试 (Week 3)

**Day 8-9: 核心流程**
- [ ] 认证流程 E2E
- [ ] 目标管理 E2E
- [ ] 任务管理 E2E

**Day 10: 高级功能**
- [ ] 专注模式 E2E
- [ ] 设置页面 E2E
- [ ] 通知功能 E2E

---

## 📝 测试模板

### Domain 测试模板

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Goal } from '../Goal';
import { GoalContracts } from '@dailyuse/contracts';

describe('Goal Aggregate', () => {
  let goal: Goal;

  beforeEach(() => {
    goal = Goal.create({
      accountUuid: 'test-account',
      title: 'Test Goal',
      importance: 'MEDIUM' as GoalContracts.ImportanceLevel,
      urgency: 'MEDIUM' as GoalContracts.UrgencyLevel,
    });
  });

  describe('创建', () => {
    it('应该创建有效的 Goal', () => {
      expect(goal.uuid).toBeDefined();
      expect(goal.title).toBe('Test Goal');
    });

    it('应该拒绝空标题', () => {
      expect(() => {
        Goal.create({
          accountUuid: 'test',
          title: '',
          importance: 'MEDIUM',
          urgency: 'MEDIUM',
        });
      }).toThrow('Title is required');
    });
  });

  describe('业务逻辑', () => {
    it('应该正确计算进度', () => {
      // 测试进度计算逻辑
    });

    it('应该正确触发领域事件', () => {
      // 测试事件触发
    });
  });
});
```

### API 集成测试模板

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
import { createGoalFixture } from '@dailyuse/test-utils/fixtures';
import request from 'supertest';
import { app } from '../../../app';

const { hooks, getClient } = setupDatabaseTests({
  databaseUrl: process.env.DATABASE_URL,
});

beforeAll(hooks.beforeAll);
afterAll(hooks.afterAll);
beforeEach(hooks.beforeEach);

describe('Goal API Integration', () => {
  let authToken: string;

  beforeEach(async () => {
    // 创建测试用户并获取 token
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123456',
      });
    authToken = res.body.token;
  });

  it('应该创建目标', async () => {
    const goalData = createGoalFixture();

    const res = await request(app)
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(goalData)
      .expect(201);

    expect(res.body.uuid).toBeDefined();
    expect(res.body.title).toBe(goalData.title);
  });

  it('应该查询目标列表', async () => {
    const res = await request(app)
      .get('/api/v1/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
```

### E2E 测试模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('Goal Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'Test123456');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('应该创建新目标', async ({ page }) => {
    await page.click('[data-testid="create-goal-button"]');
    await page.fill('[data-testid="goal-title"]', 'My Test Goal');
    await page.selectOption('[data-testid="importance"]', 'HIGH');
    await page.selectOption('[data-testid="urgency"]', 'MEDIUM');
    await page.click('[data-testid="save-goal"]');

    await expect(page.locator('text=My Test Goal')).toBeVisible();
  });

  test('应该添加关键结果', async ({ page }) => {
    // 打开目标详情
    await page.click('[data-testid="goal-item"]:first-child');
    
    // 添加关键结果
    await page.click('[data-testid="add-key-result"]');
    await page.fill('[data-testid="kr-title"]', 'Increase revenue');
    await page.fill('[data-testid="kr-target"]', '100000');
    await page.click('[data-testid="save-kr"]');

    await expect(page.locator('text=Increase revenue')).toBeVisible();
  });
});
```

---

## 🎭 推荐使用的 Agent

根据任务特性，推荐以下 Agent 组合：

### 1. **Test Architect Agent** 🏗️
**职责**：
- 设计测试架构
- 规划测试覆盖率
- 制定测试标准

**适用场景**：
- Phase 1: 设计 Domain 层测试结构
- 制定测试命名规范
- 定义测试覆盖率目标

### 2. **Domain Test Specialist** 🧪
**职责**：
- 编写 Domain 层测试
- 验证业务规则
- 测试领域事件

**适用场景**：
- Phase 1: 所有 Domain 层测试
- 聚合根、实体、值对象测试
- 领域服务测试

### 3. **API Test Engineer** 🔌
**职责**：
- 编写 API 集成测试
- 设置测试数据库
- Mock 外部依赖

**适用场景**：
- Phase 2: 所有 API 集成测试
- 数据库集成测试
- 端到端 API 流程测试

### 4. **E2E Test Automator** 🤖
**职责**：
- 编写 Playwright 测试
- 设计用户流程测试
- 维护测试选择器

**适用场景**：
- Phase 3: Web E2E 测试
- 用户流程测试
- UI 交互测试

---

## 📊 测试覆盖率目标

### Domain 层
- **目标**: 90%+ 代码覆盖率
- **聚合根**: 95%+ 
- **实体**: 90%+
- **值对象**: 85%+
- **领域服务**: 90%+

### API 层
- **目标**: 80%+ 代码覆盖率
- **Controller**: 85%+
- **Application Service**: 90%+
- **Repository**: 80%+

### Web E2E
- **目标**: 覆盖所有核心用户流程
- **认证流程**: 100%
- **目标管理**: 100%
- **任务管理**: 100%
- **设置管理**: 80%

---

## ✅ 验收标准

### Domain 测试
- ✅ 所有聚合根有完整测试
- ✅ 所有业务规则有测试覆盖
- ✅ 所有领域事件有验证
- ✅ 代码覆盖率达到 90%+

### API 测试
- ✅ 所有 REST 端点有集成测试
- ✅ 认证授权流程完整测试
- ✅ 数据库事务正确处理
- ✅ 错误处理有测试覆盖

### E2E 测试
- ✅ 所有核心用户流程可运行
- ✅ 测试在 CI/CD 中稳定通过
- ✅ 关键业务场景有覆盖
- ✅ 测试执行时间 < 10分钟

---

## 🚀 开始执行

### 立即开始
```bash
# 1. 确认 test-utils 可用
cd packages/test-utils && npm test

# 2. 创建第一个测试
cd packages/domain-server/src/goal/aggregates/__tests__
# 创建 Goal.test.ts

# 3. 运行测试
npm test Goal.test.ts
```

### 推荐工作流
1. **设计** → 使用 Test Architect Agent 规划
2. **实现** → 使用对应的 Specialist Agent 编写
3. **审查** → 检查覆盖率和质量
4. **集成** → 合并到 CI/CD

---

## �� 参考资源

- [test-utils README](../../packages/test-utils/README.md)
- [Vitest 文档](https://vitest.dev)
- [Playwright 文档](https://playwright.dev)
- [DDD 测试最佳实践](https://www.google.com/search?q=ddd+testing+best+practices)

---

**创建日期**: 2025-11-01  
**维护者**: BMad Master  
**状态**: 📋 待开始
