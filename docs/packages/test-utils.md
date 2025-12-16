# 📦 packages/test-utils

> 测试工具库

## 概述

`@dailyuse/test-utils` 包提供单元测试、集成测试和 E2E 测试的辅助工具。

## 安装

```bash
pnpm add -D @dailyuse/test-utils
```

## 主要功能

### Test Factories

测试数据工厂：

```typescript
import { GoalFactory, TaskFactory, AccountFactory } from '@dailyuse/test-utils';

// 创建测试目标
const goal = GoalFactory.create({
  title: '测试目标',
  status: 'ACTIVE',
});

// 创建多个测试任务
const tasks = TaskFactory.createMany(5, {
  goalUuid: goal.uuid,
});

// 创建测试账户
const account = AccountFactory.create();
```

### Mock Repositories

模拟仓储：

```typescript
import { MockGoalRepository, MockTaskRepository } from '@dailyuse/test-utils';

const mockGoalRepo = new MockGoalRepository();

// 预设数据
mockGoalRepo.setData([
  GoalFactory.create({ title: 'Goal 1' }),
  GoalFactory.create({ title: 'Goal 2' }),
]);

// 在测试中使用
const service = new GoalApplicationService(mockGoalRepo);
```

### Test Helpers

测试辅助函数：

```typescript
import { 
  setupTestDatabase, 
  cleanupTestDatabase,
  waitFor,
  mockDate,
} from '@dailyuse/test-utils';

describe('GoalService', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create goal', async () => {
    // 模拟日期
    mockDate('2025-01-01');
    
    const result = await service.createGoal({ ... });
    
    // 等待异步操作完成
    await waitFor(() => {
      expect(result.createdAt).toBe('2025-01-01');
    });
  });
});
```

### API Mocks

API 模拟：

```typescript
import { mockApi, mockApiError } from '@dailyuse/test-utils';

// 模拟成功响应
mockApi('/api/v1/goals', {
  data: [GoalFactory.create()],
});

// 模拟错误响应
mockApiError('/api/v1/goals', {
  status: 404,
  message: 'Not found',
});
```

### IPC Mocks

IPC 通信模拟 (Desktop)：

```typescript
import { mockElectronAPI, resetElectronAPI } from '@dailyuse/test-utils';

beforeEach(() => {
  mockElectronAPI({
    goal: {
      getActive: vi.fn().mockResolvedValue([GoalFactory.create()]),
      create: vi.fn().mockImplementation(async (data) => ({
        uuid: 'new-uuid',
        ...data,
      })),
    },
  });
});

afterEach(() => {
  resetElectronAPI();
});
```

## 目录结构

```
packages/test-utils/
├── src/
│   ├── index.ts
│   ├── factories/
│   │   ├── GoalFactory.ts
│   │   ├── TaskFactory.ts
│   │   ├── AccountFactory.ts
│   │   └── ...
│   ├── mocks/
│   │   ├── repositories/
│   │   │   ├── MockGoalRepository.ts
│   │   │   └── MockTaskRepository.ts
│   │   ├── api/
│   │   │   └── mockApi.ts
│   │   └── ipc/
│   │       └── mockElectronAPI.ts
│   ├── helpers/
│   │   ├── database.ts
│   │   ├── date.ts
│   │   ├── waitFor.ts
│   │   └── assertions.ts
│   └── fixtures/
│       ├── goals.json
│       └── tasks.json
├── package.json
└── tsconfig.json
```

## Factory API

```typescript
interface Factory<T> {
  // 创建单个实体
  create(overrides?: Partial<T>): T;
  
  // 创建多个实体
  createMany(count: number, overrides?: Partial<T>): T[];
  
  // 创建持久化格式
  createPersistence(overrides?: Partial<T>): PersistenceDTO<T>;
  
  // 创建客户端格式
  createClient(overrides?: Partial<T>): ClientDTO<T>;
}
```

## 使用示例

### 单元测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GoalFactory, MockGoalRepository } from '@dailyuse/test-utils';
import { GoalApplicationService } from '@dailyuse/application-server';

describe('GoalApplicationService', () => {
  const mockRepo = new MockGoalRepository();
  const service = new GoalApplicationService(mockRepo);

  it('should return active goals', async () => {
    const goals = GoalFactory.createMany(3, { status: 'ACTIVE' });
    mockRepo.setData(goals);

    const result = await service.getActiveGoals('account-uuid');

    expect(result).toHaveLength(3);
    expect(result[0].status).toBe('ACTIVE');
  });
});
```

### 集成测试

```typescript
import { setupTestDatabase, cleanupTestDatabase, GoalFactory } from '@dailyuse/test-utils';

describe('Goal Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should persist goal to database', async () => {
    const goal = GoalFactory.create();
    await goalRepo.save(goal);

    const found = await goalRepo.findById(goal.uuid);
    expect(found).toBeDefined();
    expect(found?.title).toBe(goal.title);
  });
});
```

## 依赖关系

```
@dailyuse/test-utils
├── @dailyuse/contracts
├── vitest
└── @faker-js/faker
```

## 相关文档

- [开发指南](../development-instructions.md)
- [测试策略](../guides/testing-strategy.md)
