# DailyUse 测试快速参考 🚀

> 这是最常用的测试命令和模式的快速参考。详细文档请查看 [`packages/test-utils/docs/`](./packages/test-utils/docs/)

## 📍 快速开始

```bash
# 1. 确保测试数据库运行
docker-compose -f docker-compose.test.yml up -d

# 2. 运行测试
./test.sh                    # 所有测试
./test.sh api                # API 测试
./test.sh api goal           # 特定测试
```

## 🎯 常用命令

### 运行测试

```bash
# 统一脚本 (推荐)
./test.sh                              # 所有测试
./test.sh api                          # API 所有测试
./test.sh api goal                     # API 包含 "goal" 的测试
./test.sh api integration              # API 集成测试
./test.sh web                          # Web 测试
./test.sh api --coverage               # 生成覆盖率
./test.sh api --watch                  # 监视模式
./test.sh --help                       # 查看帮助

# 直接使用 pnpm/nx
pnpm nx test api                       # API 测试
pnpm nx test web                       # Web 测试
pnpm nx test api -- goal-creation      # 运行特定测试
```

### 数据库管理

```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 停止测试数据库
docker-compose -f docker-compose.test.yml down

# 查看日志
docker-compose -f docker-compose.test.yml logs -f

# 同步 Prisma Schema
cd apps/api && pnpm prisma db push

# 连接数据库
psql postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

## 📝 测试模板

### 1. 集成测试 (有数据库)

```typescript
// apps/api/src/modules/goal/tests/feature.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
import { createGoalFixture } from '@dailyuse/test-utils/fixtures';

// 自动配置数据库
const { hooks, getClient } = setupDatabaseTests();
beforeAll(hooks.beforeAll);
afterAll(hooks.afterAll);
beforeEach(hooks.beforeEach); // 每个测试前清理数据库

describe('Feature Integration Tests', () => {
  it('should work with database', async () => {
    const prisma = getClient();
    const goalData = createGoalFixture();
    
    const goal = await prisma.goal.create({ data: goalData });
    
    expect(goal.uuid).toBeDefined();
  });
});
```

### 2. 单元测试 (无数据库)

```typescript
// apps/api/src/modules/goal/services/feature.unit.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyService } from './MyService';

describe('MyService Unit Tests', () => {
  it('should do something', () => {
    const service = new MyService();
    const result = service.doSomething();
    expect(result).toBe('expected');
  });
});
```

### 3. 组件测试 (Vue)

```typescript
// apps/web/src/components/MyComponent.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: { msg: 'Hello' }
    });
    expect(wrapper.text()).toContain('Hello');
  });
});
```

## 🔧 常用工具

### 测试数据 Fixtures

```typescript
import { 
  createUserFixture, 
  createGoalFixture,
  createKeyResultFixture 
} from '@dailyuse/test-utils/fixtures';

// 默认数据
const user = createUserFixture();

// 自定义数据
const goal = createGoalFixture({
  title: 'My Goal',
  ownerId: user.uuid,
});
```

### 辅助函数

```typescript
import { 
  waitFor, 
  generateUUID, 
  randomString,
  randomEmail 
} from '@dailyuse/test-utils/helpers';

// 等待条件
await waitFor(
  () => element.isVisible(),
  { timeout: 5000 }
);

// 生成数据
const uuid = generateUUID();
const email = randomEmail();
const name = randomString(8);
```

## 🐛 故障排查

### 问题: 数据库连接失败

```bash
# 检查容器
docker ps | grep postgres-test

# 启动容器
docker-compose -f docker-compose.test.yml up -d

# 测试连接
psql postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

### 问题: Vitest 找不到测试文件

```bash
# ❌ 错误
pnpm test --testPathPattern=goal

# ✅ 正确
pnpm test goal
pnpm test src/modules/goal/tests/
./test.sh api goal
```

### 问题: 测试超时

```typescript
// 增加超时时间
it('long running test', async () => {
  // ...
}, 30000); // 30 秒
```

### 问题: Mock 没有生效

检查测试文件是否使用了正确的 setup 文件:

```typescript
// apps/api/vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup-database.ts'], // ✅ 集成测试
    // setupFiles: ['./src/test/setup.ts'],        // ✅ 单元测试
  },
});
```

## 📚 项目结构

```
/workspaces/DailyUse/
├── test.sh                           # 统一测试脚本 ⭐
├── vitest.config.ts                  # 工作区配置
├── docker-compose.test.yml           # 测试数据库
├── apps/
│   ├── api/
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── test/
│   │       │   ├── setup-database.ts  # 集成测试配置
│   │       │   └── setup.ts           # 单元测试配置
│   │       └── modules/
│   │           └── goal/
│   │               └── tests/
│   │                   ├── *.integration.test.ts
│   │                   └── *.unit.test.ts
│   └── web/
│       ├── vitest.config.ts
│       └── src/
│           ├── test/
│           │   └── setup.ts
│           └── components/
│               └── *.spec.ts
└── packages/
    └── test-utils/                   # 统一测试工具 ⭐
        ├── README.md
        ├── docs/
        │   └── TEST_SYSTEM_ARCHITECTURE.md
        └── src/
            ├── setup/
            │   └── database.ts
            ├── fixtures/
            └── helpers/
```

## 🎓 学习资源

| 文档 | 内容 |
|-----|------|
| [`packages/test-utils/README.md`](./packages/test-utils/README.md) | 测试工具 API 文档 |
| [`packages/test-utils/docs/TEST_SYSTEM_ARCHITECTURE.md`](./packages/test-utils/docs/TEST_SYSTEM_ARCHITECTURE.md) | 完整测试架构设计 |
| [`./test.sh --help`](./test.sh) | 测试脚本使用说明 |

## ⚡ 最佳实践速查

### ✅ 好的做法

```typescript
// 使用 Fixtures
const goal = createGoalFixture({ title: 'Test' });

// 使用辅助函数
const email = randomEmail();

// 每个测试前清理
beforeEach(async () => await clean());

// 使用 waitFor
await waitFor(() => condition());
```

### ❌ 避免的做法

```typescript
// 硬编码数据
const goal = { uuid: '123', ... }; // ❌

// 共享状态
let shared; beforeAll(() => shared = ...); // ❌

// 使用 setTimeout
await new Promise(r => setTimeout(r, 1000)); // ❌

// 无清理逻辑
// 没有 beforeEach // ❌
```

---

**💡 提示:** 测试出问题了?先检查:
1. 测试数据库是否运行 (`docker ps`)
2. 是否使用正确的 setup 文件
3. 测试文件命名是否符合规范 (`*.test.ts` 或 `*.spec.ts`)

**📖 详细文档:** [`packages/test-utils/docs/`](./packages/test-utils/docs/)

---

最后更新: 2025-11-01
