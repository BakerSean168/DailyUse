# 测试驱动开发 + 重构 + 错误修复工作流

## 概述

本工作流实现了一个完整的开发循环：
1. **需求分析** → 2. **生成测试** → 3. **运行测试** → 4. **修复错误** → 5. **重构优化** → 6. **验证完成**

## 快速开始

```bash
# 安装依赖（如果还没安装）
pnpm install

# 方式1: 使用完整自动化工作流
./tools/scripts/tdd-workflow.sh "任务模板CRUD" task

# 方式2: 手动步骤
# 步骤1: 生成测试规格
pnpm test:generate:spec --feature="新功能" --module=task

# 步骤2: 生成测试代码
pnpm test:generate:unit --module=task

# 步骤3: 启动测试监控（在一个终端）
pnpm test:watch --filter="*task*"

# 步骤4: 启动类型检查监控（在另一个终端）
pnpm typecheck:watch

# 步骤5: 编写代码直到测试通过

# 步骤6: 重构优化
pnpm lint:fix
pnpm format

# 步骤7: 生成覆盖率报告
pnpm test:coverage --filter="*task*"
```

## 工作流阶段

### 阶段 1: 红灯 🔴 - 先写测试

**目标**: 编写一个失败的测试，明确需求

```bash
# 在 apps/api/src/modules/task/task-template.spec.ts 中编写测试
describe('TaskTemplate', () => {
  it('should create a new task template', () => {
    const template = TaskTemplate.create({
      title: '每日站会',
      description: '团队同步'
    });
    
    expect(template.title).toBe('每日站会');
    expect(template.isActive).toBe(true);
  });
});

# 运行测试（预期失败）
pnpm test:run --filter="TaskTemplate"
# ❌ TaskTemplate is not defined
```

### 阶段 2: 绿灯 🟢 - 最小实现

**目标**: 用最简单的代码让测试通过

```typescript
// apps/api/src/modules/task/domain/task-template.entity.ts
export class TaskTemplate {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly isActive: boolean = true
  ) {}
  
  static create(props: { title: string; description: string }) {
    return new TaskTemplate(props.title, props.description);
  }
}
```

```bash
# 再次运行测试
pnpm test:run --filter="TaskTemplate"
# ✅ All tests passed!
```

### 阶段 3: 重构 ♻️ - 优化代码

**目标**: 在测试保护下改进设计

```typescript
// 重构后
export class TaskTemplate {
  private constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date
  ) {}
  
  static create(props: CreateTaskTemplateProps): TaskTemplate {
    this.validateTitle(props.title);
    
    return new TaskTemplate(
      crypto.randomUUID(),
      props.title,
      props.description,
      true,
      new Date()
    );
  }
  
  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
  }
}
```

```bash
# 确保重构后测试仍然通过
pnpm test:run --filter="TaskTemplate"
# ✅ All tests passed!
```

## 错误修复流程

### 快速修复脚本

```bash
#!/bin/bash
# tools/scripts/quick-fix.sh

MODULE=$1
echo "🔧 快速修复: $MODULE"

# 1. 运行测试找出错误
pnpm test:run --filter="*$MODULE*" --reporter=verbose

# 2. 类型检查
pnpm typecheck --filter="@dailyuse/*$MODULE*"

# 3. 自动修复Lint错误
pnpm lint:fix --filter="@dailyuse/*$MODULE*"

# 4. 格式化代码
pnpm format

# 5. 重新运行测试
pnpm test:run --filter="*$MODULE*"

echo "✅ 修复完成！"
```

### 使用示例

```bash
# 快速修复task模块的所有错误
./tools/scripts/quick-fix.sh task

# 或者使用package.json脚本
pnpm quick-fix task
```

## 测试类型和策略

### 1. 单元测试（70%）

**目标**: 测试单个函数/类的逻辑

```typescript
// apps/api/src/modules/task/domain/task-template.spec.ts
describe('TaskTemplate Domain', () => {
  describe('create', () => {
    it('should create with valid data', () => {
      const template = TaskTemplate.create({
        title: 'Test',
        description: 'Description'
      });
      expect(template.title).toBe('Test');
    });
    
    it('should throw error with empty title', () => {
      expect(() => {
        TaskTemplate.create({ title: '', description: 'Test' });
      }).toThrow('Title cannot be empty');
    });
  });
});
```

### 2. 集成测试（20%）

**目标**: 测试多个组件协同工作

```typescript
// apps/api/src/modules/task/task.integration.spec.ts
describe('Task API Integration', () => {
  it('should create and retrieve task template', async () => {
    // 创建
    const response = await request(app)
      .post('/api/tasks/templates')
      .send({ title: 'Test Template', description: 'Test' });
    
    expect(response.status).toBe(201);
    const templateId = response.body.id;
    
    // 获取
    const getResponse = await request(app)
      .get(`/api/tasks/templates/${templateId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe('Test Template');
  });
});
```

### 3. E2E测试（10%）

**目标**: 测试完整用户流程

```typescript
// apps/web/e2e/task-template.spec.ts
import { test, expect } from '@playwright/test';

test('user can create and use task template', async ({ page }) => {
  // 登录
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // 创建模板
  await page.goto('/tasks/templates');
  await page.click('[data-testid="create-template"]');
  await page.fill('[data-testid="template-title"]', '每日站会');
  await page.click('[data-testid="save-template"]');
  
  // 验证创建成功
  await expect(page.locator('text=每日站会')).toBeVisible();
});
```

## 覆盖率目标

```yaml
coverage:
  global:
    statements: 80
    branches: 75
    functions: 80
    lines: 80
  
  critical_paths:
    statements: 100
    branches: 90
    functions: 100
    lines: 100
```

## 测试数据管理

### 使用工厂模式

```typescript
// tests/factories/task-template.factory.ts
import { faker } from '@faker-js/faker';

export class TaskTemplateFactory {
  static create(overrides?: Partial<TaskTemplate>): TaskTemplate {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      isActive: true,
      createdAt: faker.date.recent(),
      ...overrides
    };
  }
  
  static createMany(count: number): TaskTemplate[] {
    return Array.from({ length: count }, () => this.create());
  }
}

// 使用
const template = TaskTemplateFactory.create({ title: 'Custom Title' });
const templates = TaskTemplateFactory.createMany(10);
```

## 持续集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: dailyuse_test
        ports:
          - 5433:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm test:coverage
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% below 80%"
            exit 1
          fi
```

## 常见场景

### 场景1: 添加新功能

```bash
# 1. 创建测试文件
touch apps/api/src/modules/task/new-feature.spec.ts

# 2. 编写失败的测试
# ... 编写测试代码 ...

# 3. 启动监控
pnpm test:watch --filter="new-feature"

# 4. 实现功能直到测试通过

# 5. 重构优化
pnpm lint:fix
pnpm format

# 6. 提交
git add .
git commit -m "feat: add new feature"
```

### 场景2: 修复Bug

```bash
# 1. 编写重现Bug的测试
touch apps/api/src/modules/task/bug-fix.spec.ts

# 2. 确认测试失败（重现Bug）
pnpm test:run --filter="bug-fix"

# 3. 修复代码

# 4. 确认测试通过
pnpm test:run --filter="bug-fix"

# 5. 运行完整测试套件确保没有破坏其他功能
pnpm test:run

# 6. 提交
git add .
git commit -m "fix: resolve bug in task module"
```

### 场景3: 重构代码

```bash
# 1. 确保现有测试全部通过
pnpm test:run

# 2. 启动测试监控
pnpm test:watch &

# 3. 进行重构（保持测试实时通过）

# 4. 检查覆盖率是否保持
pnpm test:coverage

# 5. 类型和Lint检查
pnpm typecheck
pnpm lint

# 6. 提交
git add .
git commit -m "refactor: improve task module structure"
```

## 最佳实践

### ✅ DO

1. **先写测试，再写实现**
   ```typescript
   // ✅ Good
   it('should validate email', () => {
     expect(isValidEmail('test@example.com')).toBe(true);
   });
   // 然后实现 isValidEmail 函数
   ```

2. **测试要清晰描述行为**
   ```typescript
   // ✅ Good
   it('should throw error when title is empty', () => { });
   
   // ❌ Bad
   it('test1', () => { });
   ```

3. **保持测试独立**
   ```typescript
   // ✅ Good - 每个测试独立创建数据
   beforeEach(() => {
     template = TaskTemplateFactory.create();
   });
   ```

4. **使用AAA模式**
   ```typescript
   it('should update template', () => {
     // Arrange - 准备
     const template = TaskTemplateFactory.create();
     
     // Act - 执行
     template.update({ title: 'New Title' });
     
     // Assert - 断言
     expect(template.title).toBe('New Title');
   });
   ```

### ❌ DON'T

1. **不要跳过测试**
   ```typescript
   // ❌ Bad
   it.skip('complex test', () => { });
   ```

2. **不要测试实现细节**
   ```typescript
   // ❌ Bad - 测试私有方法
   expect(template['_internalMethod']()).toBe(true);
   
   // ✅ Good - 测试公共接口
   expect(template.isValid()).toBe(true);
   ```

3. **不要在测试中使用真实数据库（单元测试）**
   ```typescript
   // ❌ Bad
   it('should save to database', async () => {
     await realDatabase.save(template);
   });
   
   // ✅ Good - 使用mock
   it('should call repository save', async () => {
     await service.save(template);
     expect(mockRepository.save).toHaveBeenCalled();
   });
   ```

## 工具配置

### Vitest 配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    environment: 'node'
  }
});
```

### Package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "quick-fix": "bash tools/scripts/quick-fix.sh",
    "typecheck:watch": "tsc --noEmit --watch"
  }
}
```

## 资源

- [TDD 实践指南](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [测试金字塔](https://martinfowler.com/bliki/TestPyramid.html)
