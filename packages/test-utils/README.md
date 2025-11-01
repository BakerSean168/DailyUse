# @dailyuse/test-utils

> 🧪 DailyUse 项目统一测试工具包

提供标准化的测试工具、Fixtures 和辅助函数,确保整个 monorepo 的测试一致性和可维护性。

## 📦 安装

这是一个内部包,已在 monorepo 中配置好,无需手动安装。

如需在测试文件中使用:

```typescript
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
import { createGoalFixture } from '@dailyuse/test-utils/fixtures';
import { waitFor, randomString } from '@dailyuse/test-utils/helpers';
```

## 🚀 快速开始

### 1. 数据库集成测试

```typescript
// apps/api/src/test/setup-database.ts
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// 自动配置数据库连接、清理和生命周期
const { hooks, getClient } = setupDatabaseTests({
  databaseUrl: 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
  debug: true,
});

beforeAll(hooks.beforeAll);
afterAll(hooks.afterAll);
beforeEach(hooks.beforeEach); // 每个测试前自动清理数据库

export { getClient };
```

```typescript
// apps/api/src/modules/goal/tests/goal.integration.test.ts
import { describe, it, expect } from 'vitest';
import { getClient } from '../../../test/setup-database';
import { createGoalFixture } from '@dailyuse/test-utils/fixtures';

describe('Goal Integration Tests', () => {
  it('should create a goal in database', async () => {
    const prisma = getClient();
    const goalData = createGoalFixture();
    
    const goal = await prisma.goal.create({ data: goalData });
    
    expect(goal.uuid).toBeDefined();
    expect(goal.title).toBe(goalData.title);
  });
});
```

### 2. 使用 Fixtures

```typescript
import { 
  createUserFixture, 
  createGoalFixture,
  createKeyResultFixture 
} from '@dailyuse/test-utils/fixtures';

// 使用默认值
const user = createUserFixture();

// 自定义部分字段
const goal = createGoalFixture({
  title: 'Custom Goal',
  ownerId: user.uuid,
});

// 创建关联数据
const keyResult = createKeyResultFixture({
  goalId: goal.uuid,
  title: 'KR 1',
});
```

### 3. 辅助函数

```typescript
import { 
  waitFor, 
  generateUUID, 
  randomString,
  randomEmail 
} from '@dailyuse/test-utils/helpers';

// 等待条件满足
await waitFor(
  async () => {
    const goal = await goalService.findById(goalId);
    return goal.status === 'COMPLETED';
  },
  { timeout: 5000, interval: 100 }
);

// 生成测试数据
const uuid = generateUUID();
const email = randomEmail(); // test-a8f3d2@example.com
const name = randomString(8); // 'k4Jd9Fxp'
```

## 📚 API 文档

### Database Tools (`/database`)

#### `setupDatabaseTests(config?)`

快速配置数据库测试环境。

**参数:**
- `config.databaseUrl` (string): 数据库连接 URL
- `config.schemaPath` (string): Prisma schema 文件路径
- `config.cleanBeforeEach` (boolean): 是否每个测试前清理数据库 (默认: true)
- `config.debug` (boolean): 是否启用调试日志

**返回:**
- `hooks`: Vitest 生命周期钩子 (beforeAll, afterAll, beforeEach)
- `getClient()`: 获取 Prisma 客户端实例
- `clean()`: 手动清理数据库
- `manager`: DatabaseTestManager 实例

#### `DatabaseTestManager`

更高级的数据库测试管理类。

```typescript
import { DatabaseTestManager } from '@dailyuse/test-utils/database';

const manager = new DatabaseTestManager({
  databaseUrl: 'postgresql://...',
  debug: true,
});

await manager.setup();      // 初始化数据库
await manager.clean();       // 清理数据
await manager.teardown();    // 断开连接

const prisma = manager.getClient();
```

### Fixtures (`/fixtures`)

#### Goal Fixtures

```typescript
createUserFixture(overrides?: Partial<User>): User
createGoalFixture(overrides?: Partial<Goal>): Goal
createKeyResultFixture(overrides?: Partial<KeyResult>): KeyResult
createWeightSnapshotFixture(overrides?: Partial<WeightSnapshot>): WeightSnapshot
```

#### Repository Fixtures

```typescript
createRepositoryFixture(overrides?): Repository
createResourceFixture(overrides?): Resource
createMarkdownResourceFixture(overrides?): MarkdownResource
```

**所有 Fixture 特性:**
- 自动生成合法的 UUID
- 提供符合业务规则的默认值
- 可通过 `overrides` 参数自定义任意字段
- 包含必要的关联字段 (如 ownerId, goalId)

### Helpers (`/helpers`)

#### `waitFor(condition, options?)`

等待条件满足或超时。

```typescript
await waitFor(
  async () => element.isVisible(),
  { 
    timeout: 5000,    // 最大等待时间 (毫秒)
    interval: 100,    // 轮询间隔 (毫秒)
    message: 'Element not visible' // 超时错误消息
  }
);
```

#### `generateUUID()`

生成符合 v4 标准的 UUID。

```typescript
const uuid = generateUUID(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

#### `randomString(length, charset?)`

生成随机字符串。

```typescript
randomString(8);              // 'aBc12XyZ'
randomString(6, 'numbers');   // '294857'
randomString(4, 'lowercase'); // 'jkdm'
```

#### `randomEmail(prefix?)`

生成随机测试邮箱。

```typescript
randomEmail();           // 'test-a8f3d2@example.com'
randomEmail('custom');   // 'custom-k4j9dx@example.com'
```

#### `randomNumber(min, max)`

生成指定范围的随机整数。

```typescript
randomNumber(1, 100); // 42
```

### Mocks (`/mocks`)

预配置的 Mock 对象 (TODO: 待实现)。

## 📖 使用指南

### 测试命名规范

```
<feature>.<test-type>.test.ts

例如:
- goal-creation.unit.test.ts        # 单元测试
- goal-creation.integration.test.ts # 集成测试
- goal-api.test.ts                  # API 测试
- goal-flow.e2e.test.ts             # E2E 测试
```

### 运行测试

```bash
# 从项目根目录运行统一脚本
./test.sh                    # 运行所有测试
./test.sh api                # 运行 API 测试
./test.sh api goal           # 运行包含 "goal" 的测试
./test.sh api --coverage     # 生成覆盖率报告
./test.sh web --watch        # 监视模式

# 或使用 pnpm/nx
pnpm nx test api
pnpm nx test api -- goal-creation.integration.test.ts
```

### 最佳实践

#### ✅ 好的做法

```typescript
// 1. 使用 Fixtures 而不是硬编码
const goal = createGoalFixture({ title: 'Test Goal' });

// 2. 使用辅助函数生成唯一数据
const email = randomEmail();
const uuid = generateUUID();

// 3. 每个测试独立,不依赖执行顺序
beforeEach(async () => {
  await clean(); // 清理数据
});

// 4. 使用 waitFor 处理异步条件
await waitFor(() => goalService.isReady());

// 5. 测试有意义的场景
it('should create goal with valid data', async () => {
  const goal = createGoalFixture();
  const result = await goalService.create(goal);
  expect(result.uuid).toBeDefined();
});
```

#### ❌ 避免的做法

```typescript
// 1. 不要硬编码测试数据
const goal = { uuid: '123', title: 'Test', ... }; // ❌

// 2. 不要在测试间共享状态
let sharedGoal; // ❌
beforeAll(() => { sharedGoal = createGoal(); });

// 3. 不要使用 sleep/setTimeout
await new Promise(resolve => setTimeout(resolve, 1000)); // ❌
// 使用 waitFor 代替

// 4. 不要忽略清理
// ❌ 没有 beforeEach/afterEach 清理逻辑
```

## 🛠️ 故障排查

### 问题 1: 数据库连接失败

```bash
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**解决方案:**
```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 验证容器运行
docker ps | grep postgres-test

# 测试连接
psql postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

### 问题 2: Prisma Schema 不同步

```bash
Error: Invalid `prisma.goal.create()` invocation
```

**解决方案:**
```bash
cd apps/api
pnpm prisma db push
```

### 问题 3: 导入路径错误

```bash
Cannot find module '@dailyuse/test-utils/database'
```

**解决方案:**

检查 `tsconfig.json` 路径映射:

```json
{
  "compilerOptions": {
    "paths": {
      "@dailyuse/test-utils/*": ["../../packages/test-utils/src/*"]
    }
  }
}
```

## 📚 相关文档

- [测试系统架构](./docs/TEST_SYSTEM_ARCHITECTURE.md) - 完整测试系统设计
- [API 测试指南](./docs/API_TESTING_GUIDE.md) - API 测试最佳实践
- [E2E 测试指南](./docs/E2E_TESTING_GUIDE.md) - 端到端测试指南
- [迁移指南](./docs/MIGRATION_GUIDE.md) - 从旧测试迁移

## 🤝 贡献

### 添加新的 Fixture

```typescript
// packages/test-utils/src/fixtures/myfeature.ts
import { generateUUID } from '../helpers';

export interface MyFeatureData {
  uuid: string;
  name: string;
  // ...
}

export function createMyFeatureFixture(
  overrides?: Partial<MyFeatureData>
): MyFeatureData {
  return {
    uuid: generateUUID(),
    name: 'Default Name',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
```

### 添加新的辅助函数

```typescript
// packages/test-utils/src/helpers/myhelper.ts
export async function myHelper(param: string): Promise<void> {
  // 实现...
}

// packages/test-utils/src/helpers/index.ts
export { myHelper } from './myhelper';
```

## 📄 许可证

MIT © DailyUse Team

---

**最后更新:** 2025-11-01  
**版本:** 0.1.0
