# DailyUse 统一测试系统架构

## 📖 概述

本文档定义了 DailyUse 项目的统一测试系统架构,确保 API、Web 和 E2E 测试都使用标准化的工具和流程。

## 🎯 设计目标

1. **统一性**: 所有测试使用相同的工具和模式
2. **可发现性**: 测试工具集中在 `@dailyuse/test-utils` 包中
3. **易用性**: 提供简单的 API,减少样板代码
4. **可维护性**: 测试配置和工具版本集中管理
5. **类型安全**: 完整的 TypeScript 支持

## 📦 包结构

```
packages/test-utils/
├── src/
│   ├── setup/              # 测试环境配置
│   │   ├── database.ts     # 数据库测试工具
│   │   ├── api.ts          # API 测试工具
│   │   └── e2e.ts          # E2E 测试工具
│   ├── fixtures/           # 测试数据 Fixtures
│   │   ├── goal.ts         # Goal 模块测试数据
│   │   ├── user.ts         # User 模块测试数据
│   │   └── repository.ts   # Repository 模块测试数据
│   ├── helpers/            # 测试辅助函数
│   │   ├── assertions.ts   # 自定义断言
│   │   ├── wait.ts         # 等待工具
│   │   └── random.ts       # 随机数据生成
│   ├── mocks/              # 通用 Mock
│   │   ├── prisma.ts       # Prisma Mock
│   │   ├── axios.ts        # HTTP Mock
│   │   └── websocket.ts    # WebSocket Mock
│   └── index.ts            # 主入口
├── docs/
│   ├── TEST_SYSTEM_ARCHITECTURE.md  # 本文档
│   ├── API_TESTING_GUIDE.md         # API 测试指南
│   ├── E2E_TESTING_GUIDE.md         # E2E 测试指南
│   └── MIGRATION_GUIDE.md           # 迁移指南
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 核心组件

### 1. 数据库测试工具 (`setup/database.ts`)

用于需要真实数据库的集成测试。

**特性:**
- 自动初始化 PostgreSQL 测试数据库
- 每个测试前自动清理数据
- 支持 Prisma ORM
- 提供 Vitest 钩子函数

**使用示例:**
```typescript
// apps/api/src/test/setup-database.ts
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const { hooks, getClient } = setupDatabaseTests({
  databaseUrl: 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
  debug: true,
});

beforeAll(hooks.beforeAll);
afterAll(hooks.afterAll);
beforeEach(hooks.beforeEach);

export { getClient };
```

### 2. API 测试工具 (`setup/api.ts`)

用于 HTTP API 端点测试。

**特性:**
- Express/Fastify 应用启动
- JWT 认证 Token 生成
- HTTP 请求辅助函数
- 响应验证工具

**使用示例:**
```typescript
import { createApiTestClient } from '@dailyuse/test-utils/api';

const client = await createApiTestClient({
  baseURL: 'http://localhost:3888',
  authToken: 'test-token',
});

const response = await client.post('/api/v1/goals', {
  title: 'Test Goal',
});

expect(response.status).toBe(201);
```

### 3. E2E 测试工具 (`setup/e2e.ts`)

用于端到端浏览器测试。

**特性:**
- Playwright 浏览器管理
- 页面对象模型 (POM) 基类
- 通用交互辅助函数
- 截图和视频录制

**使用示例:**
```typescript
import { createE2ETestContext } from '@dailyuse/test-utils/e2e';

const { page, goto, login } = await createE2ETestContext({
  browser: 'chromium',
  viewport: { width: 1280, height: 720 },
});

await goto('/login');
await login('test@example.com', 'password123');
await expect(page.locator('h1')).toHaveText('Dashboard');
```

### 4. Fixtures (`fixtures/`)

提供标准化的测试数据。

**使用示例:**
```typescript
import { createGoalFixture, createUserFixture } from '@dailyuse/test-utils/fixtures';

const user = createUserFixture({ email: 'custom@example.com' });
const goal = createGoalFixture({ 
  ownerId: user.uuid,
  title: 'Custom Goal',
});
```

### 5. Helpers (`helpers/`)

通用辅助函数。

**使用示例:**
```typescript
import { waitFor, generateUUID, randomString } from '@dailyuse/test-utils/helpers';

// 等待条件满足
await waitFor(() => element.isVisible(), { timeout: 5000 });

// 生成测试数据
const uuid = generateUUID();
const email = `test-${randomString(8)}@example.com`;
```

## 🏗️ 测试分层架构

```
┌─────────────────────────────────────────────────┐
│            E2E Tests (Playwright)               │
│  测试完整用户流程 (Web + API + Database)           │
└─────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────┐
│      Integration Tests (Vitest + Real DB)      │
│  测试模块间交互 (Service + Repository + DB)        │
└─────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────┐
│         Unit Tests (Vitest + Mocks)             │
│  测试单个函数/类 (纯逻辑,无外部依赖)                 │
└─────────────────────────────────────────────────┘
```

## 📋 测试类型和工具映射

| 测试类型 | 测试框架 | 环境 | 数据库 | 测试对象 | 工具包 |
|---------|---------|------|--------|---------|--------|
| 单元测试 | Vitest | Node | Mock | 函数/类 | `@dailyuse/test-utils` + Vitest |
| 集成测试 | Vitest | Node | 真实 PostgreSQL | Service/Repository | `@dailyuse/test-utils/database` |
| API 测试 | Vitest + Supertest | Node | 真实 PostgreSQL | HTTP 端点 | `@dailyuse/test-utils/api` |
| E2E 测试 | Playwright | Browser | 真实 PostgreSQL | 完整流程 | `@dailyuse/test-utils/e2e` |
| 组件测试 | Vitest + Testing Library | Happy-DOM | Mock | Vue 组件 | `@dailyuse/test-utils` + `@testing-library/vue` |

## 🚀 快速开始

### 1. 运行所有测试

```bash
# 从项目根目录运行所有测试
pnpm test

# 运行特定项目的测试
pnpm nx test api          # API 单元+集成测试
pnpm nx test web          # Web 单元+组件测试
pnpm nx test:e2e web      # E2E 测试
```

### 2. 运行特定测试文件

```bash
# 使用 Vitest CLI
cd apps/api
pnpm test src/modules/goal/tests/goal-creation.integration.test.ts

# 使用 Nx
pnpm nx test api -- goal-creation.integration.test.ts
```

### 3. 调试测试

```bash
# 开启调试模式
TEST_DEBUG=true pnpm test

# 使用 VS Code 调试器
# 1. 在测试文件中设置断点
# 2. 按 F5 或使用 "Debug: Start Debugging"
# 3. 选择 "Vitest Debug" 配置
```

## 📚 配置文件说明

### 工作区配置 (`vitest.config.ts`)

项目根目录的配置文件,定义所有测试项目:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      { name: 'api', root: './apps/api', ... },
      { name: 'web', root: './apps/web', ... },
      { name: 'domain-server', root: './packages/domain-server', ... },
    ],
  },
});
```

### 项目配置 (各项目的 `vitest.config.ts`)

每个项目可以有自己的配置:

```typescript
// apps/api/vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup-database.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
```

## 🔍 测试命名规范

```
<feature>.<test-type>.test.ts

例如:
- goal-creation.unit.test.ts        # 单元测试
- goal-creation.integration.test.ts # 集成测试
- goal-creation.api.test.ts         # API 测试
- goal-creation.e2e.test.ts         # E2E 测试
```

## 🎯 最佳实践

### 1. 选择合适的测试类型

- **单元测试**: 测试纯函数、工具类、领域逻辑
- **集成测试**: 测试 Service + Repository + Database 交互
- **API 测试**: 测试 HTTP 端点的输入/输出
- **E2E 测试**: 测试关键用户流程

### 2. 使用 Fixtures 而不是硬编码

```typescript
// ❌ 不好
const goal = {
  uuid: '123',
  title: 'Test',
  status: 'DRAFT',
  // ...50 个字段
};

// ✅ 好
import { createGoalFixture } from '@dailyuse/test-utils/fixtures';
const goal = createGoalFixture({ title: 'Test' });
```

### 3. 使用统一的数据库工具

```typescript
// ❌ 不好 - 每个测试文件都写一遍
beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
  // ...
});

// ✅ 好 - 使用统一工具
import { setupDatabaseTests } from '@dailyuse/test-utils/database';
const { hooks, getClient } = setupDatabaseTests();
beforeAll(hooks.beforeAll);
```

### 4. 保持测试独立

- 每个测试前清理数据库
- 不依赖测试执行顺序
- 使用唯一的测试数据

## 🛠️ 故障排查

### 问题: 测试找不到数据库

**解决方案:**
```bash
# 1. 检查 Docker 容器是否运行
docker ps | grep postgres-test

# 2. 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 3. 验证连接
psql postgresql://test_user:test_pass@localhost:5433/dailyuse_test
```

### 问题: Vitest 命令参数错误

**错误:** `Unknown option --testPathPattern`

**原因:** Vitest 3.x 移除了某些参数

**解决方案:**
```bash
# ❌ 不支持
pnpm test --testPathPattern=goal

# ✅ 正确
pnpm test goal
pnpm test src/modules/goal/tests/
```

### 问题: Shell 路径错误 (ENOENT /bin/sh)

**原因:** `execSync` 找不到 shell

**解决方案:**
```typescript
execSync('command', {
  shell: '/bin/bash',  // ✅ 显式指定 shell
});
```

## 📖 相关文档

- [API 测试指南](./API_TESTING_GUIDE.md)
- [E2E 测试指南](./E2E_TESTING_GUIDE.md)
- [测试工具 API 文档](../README.md)
- [迁移指南](./MIGRATION_GUIDE.md)

## 🤝 贡献

如需添加新的测试工具或改进现有工具,请:

1. 在 `packages/test-utils/src/` 中添加代码
2. 更新本文档
3. 添加使用示例
4. 更新 `packages/test-utils/README.md`

---

**最后更新:** 2025-11-01  
**维护者:** DailyUse Team
