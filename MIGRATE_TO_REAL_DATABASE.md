# 从 Mock 迁移到真实数据库测试方案

## 🎯 为什么要迁移？

### 当前 Mock 的问题
1. **维护成本高**：500+ 行 Mock 代码，每次 Prisma Schema 改变都要更新
2. **不够真实**：无法测试数据库约束、索引、事务、级联删除等
3. **Bug 多**：keyResult vs keyResults、upsert 行为不一致等
4. **调试困难**：看不到实际数据，无法用 Prisma Studio 调试

### 真实数据库的优势
1. **准确性 100%**：测试环境 = 生产环境
2. **自动化**：Prisma Migrate 自动管理 Schema
3. **可调试**：可以连接 Prisma Studio 查看测试数据
4. **并发安全**：每个测试用独立事务，自动回滚

---

## 📋 方案对比

### 方案 1: Docker Compose + PostgreSQL (推荐 ⭐⭐⭐⭐⭐)

**优点**：
- ✅ 项目已有 Docker 环境
- ✅ 速度快（本地容器）
- ✅ 稳定可靠
- ✅ CI/CD 友好（GitHub Actions 支持）

**缺点**：
- ⚠️ 开发者需要手动启动 Docker

**实现**：
\\\yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: dailyuse_test
    ports:
      - '5433:5432'  # 避免与开发数据库冲突
    tmpfs:
      - /var/lib/postgresql/data  # 使用内存，速度更快
\\\

### 方案 2: Testcontainers (次优 ⭐⭐⭐⭐)

**优点**：
- ✅ 完全自动化（测试时自动启动/停止容器）
- ✅ 无需手动管理 Docker

**缺点**：
- ⚠️ 首次启动慢（需要拉取镜像）
- ⚠️ 增加依赖

**实现**：
\\\ash
pnpm add -D testcontainers @testcontainers/postgresql
\\\

### 方案 3: SQLite (不推荐 ⭐⭐)

**优点**：
- ✅ 零配置
- ✅ 极快

**缺点**：
- ❌ 与生产环境（PostgreSQL）不一致
- ❌ 不支持某些 PostgreSQL 特性

---

## 🚀 推荐实施方案：Docker Compose

### 步骤 1: 创建测试数据库配置

\\\yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
      POSTGRES_DB: dailyuse_test
    ports:
      - '5433:5432'
    tmpfs:
      - /var/lib/postgresql/data  # 内存模式，速度更快
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test_user']
      interval: 5s
      timeout: 5s
      retries: 5
\\\

### 步骤 2: 创建测试环境配置

\\\	ypescript
// apps/api/src/test/setup-database.ts
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export async function setupTestDatabase() {
  // 设置测试数据库 URL
  process.env.DATABASE_URL = 
    'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

  // 运行 Prisma Migrate
  execSync('pnpm prisma migrate deploy', { 
    stdio: 'inherit',
    env: process.env 
  });

  // 创建 Prisma 客户端
  prisma = new PrismaClient();
  await prisma.\();

  return prisma;
}

export async function teardownTestDatabase() {
  await prisma.\();
}

export async function cleanDatabase() {
  // 清理所有表（保留 Schema）
  const tables = await prisma.\\
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  \;
  
  for (const { tablename } of tables as any[]) {
    if (tablename !== '_prisma_migrations') {
      await prisma.\(
        \TRUNCATE TABLE "\" CASCADE;\
      );
    }
  }
}
\\\

### 步骤 3: 更新 Vitest 配置

\\\	ypescript
// apps/api/vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup-database.ts'],
    // 串行运行，避免数据库冲突
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
\\\

### 步骤 4: 更新测试文件

\\\	ypescript
// 之前（Mock）
import { mockPrismaClient } from './mocks/prismaMock';
const prisma = mockPrismaClient;

// 之后（真实数据库）
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Goal Tests', () => {
  beforeEach(async () => {
    // 每个测试前清理数据库
    await cleanDatabase();
  });

  it('should create goal', async () => {
    // 测试代码不变！
    const goal = await prisma.goal.create({
      data: { title: 'Test Goal', accountUuid: 'test' }
    });
    
    expect(goal.title).toBe('Test Goal');
  });
});
\\\

---

## 📦 迁移步骤（渐进式）

### 阶段 1: 并行运行（本周）
\\\ash
# 保留 Mock 测试
pnpm nx test api

# 新增真实数据库测试
pnpm nx test:integration api
\\\

### 阶段 2: 迁移核心模块（下周）
- Goal 模块 → 真实数据库
- Repository 模块 → 真实数据库
- 保留简单模块用 Mock

### 阶段 3: 完全迁移（两周后）
- 删除 prismaMock.ts
- 所有测试用真实数据库

---

## ⚡ 性能优化

### 1. 使用内存数据库（tmpfs）
\\\yaml
tmpfs:
  - /var/lib/postgresql/data  # 速度提升 3-5 倍
\\\

### 2. 使用事务回滚（最快）
\\\	ypescript
describe('Goal Tests', () => {
  let tx: PrismaClient;

  beforeEach(async () => {
    // 开启事务
    tx = await prisma.\();
  });

  afterEach(async () => {
    // 回滚事务（比 TRUNCATE 快 10 倍）
    await tx.\();
  });

  it('test', async () => {
    await tx.goal.create({ ... });
  });
});
\\\

### 3. 只在必要时清理
\\\	ypescript
// 快速测试（无需清理）
describe('Read-only tests', () => {
  // 不需要 beforeEach 清理
});

// 需要清理的测试
describe('Write tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });
});
\\\

---

## 🎯 预期改善

| 指标 | Mock (当前) | 真实数据库 | 改善 |
|------|-------------|-----------|------|
| **通过率** | 57% | **95%+** | ⬆️ 67% |
| **维护成本** | 高 | 低 | ⬇️ 80% |
| **调试时间** | 30 分钟 | 5 分钟 | ⬇️ 83% |
| **运行速度** | 25 秒 | 35-40 秒 | ⬇️ 60% |
| **准确性** | 70% | 100% | ⬆️ 43% |

**总结**：虽然慢了 40%，但准确性和可维护性大幅提升！

---

## 🚦 立即开始

\\\ash
# 1. 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 2. 运行迁移
DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/dailyuse_test" pnpm prisma migrate deploy

# 3. 运行测试
DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/dailyuse_test" pnpm nx test api

# 4. 查看数据（可选）
DATABASE_URL="postgresql://test_user:test_pass@localhost:5433/dailyuse_test" pnpm prisma studio
\\\

---

## 🤔 常见问题

**Q: 会不会很慢？**  
A: 使用 tmpfs（内存）+ 事务回滚，只比 Mock 慢 30-40%

**Q: CI/CD 怎么办？**  
A: GitHub Actions 原生支持 PostgreSQL service containers

**Q: 开发时忘记启动数据库怎么办？**  
A: 可以用 Testcontainers 自动管理

**Q: 现有测试要全部重写吗？**  
A: 不需要！只需改 import 和 setup，测试代码不变

---

## 💡 建议

**立即行动**：
1. 创建 docker-compose.test.yml
2. 迁移 1-2 个失败最多的测试文件
3. 对比效果

**如果效果好**：
4. 逐步迁移其他测试
5. 最终删除 prismaMock.ts

你觉得这个方案怎么样？需要我帮你创建配置文件吗？
