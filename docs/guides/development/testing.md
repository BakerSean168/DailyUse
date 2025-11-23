---
tags:
  - guide
  - development
  - testing
  - vitest
  - e2e
  - playwright
description: DailyUse测试指南 - 单元测试、集成测试、E2E测试完整实践
created: 2025-11-23T16:10:00
updated: 2025-11-23T16:10:00
---

# 🧪 测试指南 (Testing Guide)

> 全面的测试策略，保障代码质量和系统稳定性

## 📋 目录

- [测试策略](#测试策略)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [E2E测试](#e2e测试)
- [测试覆盖率](#测试覆盖率)
- [测试最佳实践](#测试最佳实践)

---

## 📊 测试策略

### 测试金字塔

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Playwright
     /      \    
    /        \   Integration Tests (30%)
   /__________\  - API Tests, Module Tests
  /            \ 
 /              \ Unit Tests (60%)
/________________\- Vitest
```

### 测试类型分布

| 测试类型 | 比例 | 工具 | 运行速度 | 覆盖范围 |
|---------|------|------|---------|---------|
| **单元测试** | 60% | Vitest | 快 | 函数、类 |
| **集成测试** | 30% | Vitest + Supertest | 中 | 模块、API |
| **E2E测试** | 10% | Playwright | 慢 | 完整流程 |

---

## 🔬 单元测试

### 运行单元测试

```bash
# 运行所有单元测试
pnpm nx run-many --target=test --all

# 运行特定项目的测试
pnpm nx test api

# Watch模式
pnpm nx test api --watch

# 生成覆盖率报告
pnpm nx test api --coverage
```

### 测试文件结构

```
goal/
├── domain/
│   ├── entities/
│   │   ├── goal.entity.ts
│   │   └── goal.entity.spec.ts     # 单元测试
│   └── value-objects/
│       ├── goal-title.vo.ts
│       └── goal-title.vo.spec.ts   # 单元测试
├── application/
│   ├── commands/
│   │   ├── create-goal.command.ts
│   │   └── create-goal.command.spec.ts
│   └── queries/
│       ├── get-goal.query.ts
│       └── get-goal.query.spec.ts
└── presentation/
    └── controllers/
        ├── goal.controller.ts
        └── goal.controller.spec.ts
```

### 实体测试示例

**`goal.entity.spec.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GoalEntity } from './goal.entity';
import { GoalTitle } from '../value-objects/goal-title.vo';

describe('GoalEntity', () => {
  let goal: GoalEntity;

  beforeEach(() => {
    goal = GoalEntity.create({
      title: GoalTitle.create('Learn TypeScript'),
      description: 'Master TypeScript in 30 days',
      userId: 'user-123',
    });
  });

  describe('创建目标', () => {
    it('应该成功创建目标', () => {
      expect(goal).toBeDefined();
      expect(goal.title.value).toBe('Learn TypeScript');
      expect(goal.status).toBe('draft');
    });

    it('应该生成UUID', () => {
      expect(goal.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('应该设置创建时间', () => {
      expect(goal.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('更新目标', () => {
    it('应该成功更新标题', () => {
      const newTitle = GoalTitle.create('Master TypeScript');
      goal.updateTitle(newTitle);

      expect(goal.title.value).toBe('Master TypeScript');
      expect(goal.updatedAt).toBeInstanceOf(Date);
    });

    it('应该发布GoalUpdated事件', () => {
      const newTitle = GoalTitle.create('Master TypeScript');
      goal.updateTitle(newTitle);

      const events = goal.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('goal.updated');
    });
  });

  describe('激活目标', () => {
    it('应该从草稿状态激活', () => {
      goal.activate();
      expect(goal.status).toBe('active');
    });

    it('不应该从已完成状态激活', () => {
      goal.complete();
      
      expect(() => goal.activate()).toThrow('Cannot activate completed goal');
    });
  });

  describe('完成目标', () => {
    it('应该设置完成时间', () => {
      goal.complete();
      
      expect(goal.status).toBe('completed');
      expect(goal.completedAt).toBeInstanceOf(Date);
    });

    it('应该发布GoalCompleted事件', () => {
      goal.complete();

      const events = goal.getUncommittedEvents();
      expect(events.some(e => e.eventType === 'goal.completed')).toBe(true);
    });
  });
});
```

### 值对象测试示例

**`goal-title.vo.spec.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { GoalTitle } from './goal-title.vo';

describe('GoalTitle', () => {
  describe('创建标题', () => {
    it('应该成功创建有效标题', () => {
      const title = GoalTitle.create('Learn TypeScript');
      expect(title.value).toBe('Learn TypeScript');
    });

    it('应该去除首尾空格', () => {
      const title = GoalTitle.create('  Learn TypeScript  ');
      expect(title.value).toBe('Learn TypeScript');
    });

    it('应该拒绝空标题', () => {
      expect(() => GoalTitle.create('')).toThrow('Goal title cannot be empty');
    });

    it('应该拒绝超长标题', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => GoalTitle.create(longTitle)).toThrow(
        'Goal title cannot exceed 200 characters'
      );
    });
  });

  describe('相等性判断', () => {
    it('相同内容的标题应该相等', () => {
      const title1 = GoalTitle.create('Learn TypeScript');
      const title2 = GoalTitle.create('Learn TypeScript');

      expect(title1.equals(title2)).toBe(true);
    });

    it('不同内容的标题应该不相等', () => {
      const title1 = GoalTitle.create('Learn TypeScript');
      const title2 = GoalTitle.create('Master TypeScript');

      expect(title1.equals(title2)).toBe(false);
    });
  });
});
```

### Service测试示例

**`goal.service.spec.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalService } from './goal.service';
import { GoalRepository } from '../domain/repositories/goal.repository';
import { EventBus } from '@nestjs/cqrs';

describe('GoalService', () => {
  let service: GoalService;
  let repository: GoalRepository;
  let eventBus: EventBus;

  beforeEach(() => {
    // 创建Mock对象
    repository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as any;

    eventBus = {
      publish: vi.fn(),
    } as any;

    service = new GoalService(repository, eventBus);
  });

  describe('创建目标', () => {
    it('应该保存目标并发布事件', async () => {
      const dto = {
        title: 'Learn TypeScript',
        description: 'Master TypeScript in 30 days',
        userId: 'user-123',
      };

      const goal = await service.create(dto);

      expect(repository.save).toHaveBeenCalledWith(expect.any(Object));
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'goal.created',
        })
      );
    });
  });

  describe('获取目标', () => {
    it('应该返回目标', async () => {
      const mockGoal = { id: 'goal-123', title: 'Learn TypeScript' };
      vi.mocked(repository.findById).mockResolvedValue(mockGoal as any);

      const goal = await service.findById('goal-123');

      expect(goal).toEqual(mockGoal);
      expect(repository.findById).toHaveBeenCalledWith('goal-123');
    });

    it('目标不存在时应该抛出异常', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(
        'Goal not found'
      );
    });
  });
});
```

---

## 🔗 集成测试

### API集成测试

**`goal.controller.e2e-spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

describe('GoalController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.goal.deleteMany();
  });

  describe('POST /api/goals', () => {
    it('应该创建新目标', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/goals')
        .send({
          title: 'Learn TypeScript',
          description: 'Master TypeScript in 30 days',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Learn TypeScript',
        description: 'Master TypeScript in 30 days',
        status: 'draft',
      });
      expect(response.body.id).toBeDefined();
    });

    it('应该验证必填字段', async () => {
      await request(app.getHttpServer())
        .post('/api/goals')
        .send({})
        .expect(400);
    });

    it('应该验证标题长度', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/goals')
        .send({
          title: 'a'.repeat(201),
        })
        .expect(400);

      expect(response.body.message).toContain('title');
    });
  });

  describe('GET /api/goals/:id', () => {
    it('应该返回目标详情', async () => {
      // 准备测试数据
      const goal = await prisma.goal.create({
        data: {
          title: 'Learn TypeScript',
          description: 'Master TypeScript in 30 days',
          status: 'draft',
          userId: 'user-123',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/goals/${goal.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: goal.id,
        title: 'Learn TypeScript',
        status: 'draft',
      });
    });

    it('目标不存在时应该返回404', async () => {
      await request(app.getHttpServer())
        .get('/api/goals/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/goals/:id', () => {
    it('应该更新目标', async () => {
      const goal = await prisma.goal.create({
        data: {
          title: 'Learn TypeScript',
          status: 'draft',
          userId: 'user-123',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/goals/${goal.id}`)
        .send({
          title: 'Master TypeScript',
          status: 'active',
        })
        .expect(200);

      expect(response.body.title).toBe('Master TypeScript');
      expect(response.body.status).toBe('active');
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('应该删除目标', async () => {
      const goal = await prisma.goal.create({
        data: {
          title: 'Learn TypeScript',
          status: 'draft',
          userId: 'user-123',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/goals/${goal.id}`)
        .expect(204);

      // 验证已删除
      const deletedGoal = await prisma.goal.findUnique({
        where: { id: goal.id },
      });
      expect(deletedGoal).toBeNull();
    });
  });
});
```

### 模块测试

**`goal.module.spec.ts`**

```typescript
import { Test } from '@nestjs/testing';
import { GoalModule } from './goal.module';
import { GoalService } from './application/services/goal.service';
import { GoalController } from './presentation/controllers/goal.controller';

describe('GoalModule', () => {
  it('应该正确配置依赖注入', async () => {
    const module = await Test.createTestingModule({
      imports: [GoalModule],
    }).compile();

    const service = module.get(GoalService);
    const controller = module.get(GoalController);

    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });
});
```

---

## 🌐 E2E测试

### 运行E2E测试

```bash
# 运行所有E2E测试
pnpm nx e2e web-e2e

# UI模式
pnpm nx e2e web-e2e --ui

# 调试模式
pnpm nx e2e web-e2e --debug

# 指定浏览器
pnpm nx e2e web-e2e --headed --browser=chromium
```

### E2E测试示例

**`goal.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('目标管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:4200/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待跳转到首页
    await page.waitForURL('http://localhost:4200/dashboard');
  });

  test('应该创建新目标', async ({ page }) => {
    // 点击创建按钮
    await page.click('button:has-text("创建目标")');

    // 填写表单
    await page.fill('[name="title"]', 'Learn TypeScript');
    await page.fill('[name="description"]', 'Master TypeScript in 30 days');
    await page.selectOption('[name="status"]', 'active');

    // 提交表单
    await page.click('button:has-text("保存")');

    // 验证成功消息
    await expect(page.locator('.toast-success')).toContainText('目标创建成功');

    // 验证目标出现在列表中
    await expect(page.locator('.goal-item')).toContainText('Learn TypeScript');
  });

  test('应该编辑目标', async ({ page }) => {
    // 准备：创建一个目标
    await page.click('button:has-text("创建目标")');
    await page.fill('[name="title"]', 'Original Title');
    await page.click('button:has-text("保存")');

    // 点击编辑按钮
    await page.click('.goal-item:has-text("Original Title") button:has-text("编辑")');

    // 修改标题
    await page.fill('[name="title"]', 'Updated Title');
    await page.click('button:has-text("保存")');

    // 验证更新成功
    await expect(page.locator('.goal-item')).toContainText('Updated Title');
    await expect(page.locator('.goal-item')).not.toContainText('Original Title');
  });

  test('应该删除目标', async ({ page }) => {
    // 准备：创建一个目标
    await page.click('button:has-text("创建目标")');
    await page.fill('[name="title"]', 'To Be Deleted');
    await page.click('button:has-text("保存")');

    // 点击删除按钮
    await page.click('.goal-item:has-text("To Be Deleted") button:has-text("删除")');

    // 确认删除
    await page.click('button:has-text("确认")');

    // 验证目标已删除
    await expect(page.locator('.goal-item')).not.toContainText('To Be Deleted');
  });

  test('应该搜索目标', async ({ page }) => {
    // 准备：创建多个目标
    const goals = ['Learn TypeScript', 'Learn Vue', 'Learn React'];
    for (const title of goals) {
      await page.click('button:has-text("创建目标")');
      await page.fill('[name="title"]', title);
      await page.click('button:has-text("保存")');
      await page.waitForTimeout(500);
    }

    // 搜索
    await page.fill('[placeholder="搜索目标"]', 'TypeScript');

    // 验证搜索结果
    await expect(page.locator('.goal-item')).toHaveCount(1);
    await expect(page.locator('.goal-item')).toContainText('Learn TypeScript');
  });

  test('应该切换目标状态', async ({ page }) => {
    // 创建草稿目标
    await page.click('button:has-text("创建目标")');
    await page.fill('[name="title"]', 'Draft Goal');
    await page.click('button:has-text("保存")');

    // 激活目标
    await page.click('.goal-item:has-text("Draft Goal") button:has-text("激活")');
    await expect(page.locator('.goal-item:has-text("Draft Goal") .status')).toContainText('进行中');

    // 完成目标
    await page.click('.goal-item:has-text("Draft Goal") button:has-text("完成")');
    await expect(page.locator('.goal-item:has-text("Draft Goal") .status')).toContainText('已完成');
  });
});
```

### Page Object模式

**`goal.page.ts`**

```typescript
import { Page, Locator } from '@playwright/test';

export class GoalPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly goalList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("创建目标")');
    this.titleInput = page.locator('[name="title"]');
    this.descriptionInput = page.locator('[name="description"]');
    this.saveButton = page.locator('button:has-text("保存")');
    this.goalList = page.locator('.goal-list');
  }

  async goto() {
    await this.page.goto('/goals');
  }

  async createGoal(title: string, description: string) {
    await this.createButton.click();
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
    await this.saveButton.click();
  }

  async getGoalByTitle(title: string) {
    return this.goalList.locator(`.goal-item:has-text("${title}")`);
  }
}

// 使用示例
test('创建目标 - Page Object模式', async ({ page }) => {
  const goalPage = new GoalPage(page);
  await goalPage.goto();
  await goalPage.createGoal('Learn TypeScript', 'Master TypeScript in 30 days');
  
  const goal = await goalPage.getGoalByTitle('Learn TypeScript');
  await expect(goal).toBeVisible();
});
```

---

## 📈 测试覆盖率

### 查看覆盖率

```bash
# 生成覆盖率报告
pnpm nx test api --coverage

# 打开HTML报告
open coverage/index.html
```

### 覆盖率标准

| 指标 | 最低要求 | 推荐 |
|------|---------|------|
| **语句覆盖率** | 80% | 90% |
| **分支覆盖率** | 75% | 85% |
| **函数覆盖率** | 80% | 90% |
| **行覆盖率** | 80% | 90% |

### 配置覆盖率阈值

**`vitest.config.ts`**

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/*.spec.ts',
        '**/*.e2e-spec.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## ✅ 测试最佳实践

### AAA模式

```typescript
test('应该创建目标', () => {
  // Arrange - 准备测试数据
  const dto = {
    title: 'Learn TypeScript',
    userId: 'user-123',
  };

  // Act - 执行操作
  const goal = GoalEntity.create(dto);

  // Assert - 验证结果
  expect(goal.title.value).toBe('Learn TypeScript');
  expect(goal.status).toBe('draft');
});
```

### 测试命名

```typescript
// ✅ Good - 清晰描述测试意图
test('应该在标题超过200字符时抛出异常', () => {});
test('应该在目标完成时发布GoalCompleted事件', () => {});

// ❌ Bad - 模糊的描述
test('测试标题', () => {});
test('测试1', () => {});
```

### 独立性原则

```typescript
// ✅ Good - 每个测试独立
test('测试A', () => {
  const goal = createTestGoal();
  // ...
});

test('测试B', () => {
  const goal = createTestGoal();
  // ...
});

// ❌ Bad - 测试相互依赖
let sharedGoal;

test('测试A', () => {
  sharedGoal = createTestGoal();
});

test('测试B', () => {
  sharedGoal.update(); // 依赖测试A
});
```

### 使用测试工厂

**`test-helpers.ts`**

```typescript
export function createTestGoal(overrides?: Partial<GoalProps>) {
  return GoalEntity.create({
    title: GoalTitle.create('Test Goal'),
    description: 'Test description',
    userId: 'user-123',
    ...overrides,
  });
}

export function createTestUser(overrides?: Partial<UserProps>) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}
```

### Mock外部依赖

```typescript
import { vi } from 'vitest';

// Mock整个模块
vi.mock('@dailyuse/utils', () => ({
  generateId: vi.fn(() => 'test-id'),
  formatDate: vi.fn(() => '2025-01-01'),
}));

// Mock部分导出
vi.mock('./email.service', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendEmail: vi.fn(), // Mock这个函数
  };
});
```

---

## 🔧 调试测试

### VS Code调试配置

**`.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "test", "api", "--run", "--inspect-brk"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 调试单个测试

```typescript
import { test } from 'vitest';

// 只运行这个测试
test.only('调试这个测试', () => {
  debugger; // 设置断点
  // ...
});

// 跳过这个测试
test.skip('暂时跳过', () => {
  // ...
});
```

---

## 📚 参考资源

### 测试工具文档

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest](https://github.com/visionmedia/supertest)

### 最佳实践

- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Vue Testing Handbook](https://lmiller1990.github.io/vue-testing-handbook/)

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
