# 测试用户初始化工具

## 📝 功能说明

这个脚本用于在数据库中创建固定的测试用户，避免每个 E2E 测试都需要注册新用户，大大提高测试执行效率。

## 🚀 快速使用

### 1. 启动数据库和 API

```bash
# 启动开发环境（包含数据库）
pnpm dev

# 或者只启动 API（会自动启动数据库）
pnpm dev:api
```

### 2. 运行初始化脚本

```bash
# 从项目根目录运行
pnpm test:seed
```

### 3. 验证测试用户

脚本会创建以下测试用户：

| Username | Password | Email | 用途 |
|----------|----------|-------|------|
| `testuser` | `Test123456!` | `testuser@example.com` | 主要测试用户 |
| `testuser2` | `Test123456!` | `testuser2@example.com` | 多用户测试 |
| `admintest` | `Admin123456!` | `admintest@example.com` | 管理员测试 |

## 📋 使用场景

### E2E 测试中使用

```typescript
// apps/web/e2e/goal/goal-crud.spec.ts
import { test, expect } from '@playwright/test';
import { login, TEST_USER } from '../helpers/testHelpers';

test.beforeEach(async ({ page }) => {
  // 直接使用预创建的测试用户
  await login(page, TEST_USER.username, TEST_USER.password);
  await page.goto('/goals');
});

test('should create a new goal', async ({ page }) => {
  // 测试逻辑...
});
```

### testHelpers.ts 配置

```typescript
// apps/web/e2e/helpers/testHelpers.ts
export const TEST_USER = {
  username: 'testuser',
  password: 'Test123456!',
};

export const TEST_USER_2 = {
  username: 'testuser2',
  password: 'Test123456!',
};

export const ADMIN_TEST_USER = {
  username: 'admintest',
  password: 'Admin123456!',
};
```

## 🔧 脚本特性

### 1. 幂等性（Idempotent）

- ✅ 如果用户已存在，跳过创建
- ✅ 自动更新现有用户的密码（保证测试可靠）
- ✅ 可以安全地多次运行

### 2. 事务安全

- ✅ 使用 Prisma 事务
- ✅ Account + AuthCredential + PasswordCredential 原子性创建
- ✅ 失败自动回滚

### 3. 密码加密

- ✅ 使用 bcrypt 加密（12 salt rounds）
- ✅ 与生产环境相同的加密算法
- ✅ 确保测试环境安全

## 📊 输出示例

```bash
╔════════════════════════════════════════════════════════════╗
║           测试用户数据库初始化脚本                         ║
╚════════════════════════════════════════════════════════════╝
✅ 数据库连接成功

📝 处理测试用户: testuser
  ➕ 创建新用户: testuser
  ✅ 创建成功: testuser (UUID: abc123...)

📝 处理测试用户: testuser2
  ➕ 创建新用户: testuser2
  ✅ 创建成功: testuser2 (UUID: def456...)

📝 处理测试用户: admintest
  ➕ 创建新用户: admintest
  ✅ 创建成功: admintest (UUID: ghi789...)

╔════════════════════════════════════════════════════════════╗
║                  ✅ 所有测试用户已就绪                     ║
╚════════════════════════════════════════════════════════════╝

�� 可用的测试用户:
  - Username: testuser
    Password: Test123456!
    Email:    testuser@example.com

  - Username: testuser2
    Password: Test123456!
    Email:    testuser2@example.com

  - Username: admintest
    Password: Admin123456!
    Email:    admintest@example.com
```

## 🔄 重新运行（更新密码）

```bash
# 如果密码被修改或忘记，重新运行脚本会重置密码
pnpm test:seed
```

输出示例：

```bash
📝 处理测试用户: testuser
  ✅ 用户已存在: testuser (UUID: abc123...)
  🔄 密码已更新
```

## ⚙️ 自定义测试用户

编辑 `tools/test/seed-test-user.ts` 中的 `TEST_USERS` 配置：

```typescript
const TEST_USERS = [
  {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'Test123456!',
    displayName: 'Test User',
  },
  // 添加更多测试用户...
];
```

## 🎯 最佳实践

### 1. CI/CD 集成

在 CI 管道中自动运行：

```yaml
# .github/workflows/e2e-tests.yml
- name: Setup test database
  run: |
    pnpm dev:api &  # 启动 API（后台）
    sleep 10        # 等待数据库就绪
    pnpm test:seed  # 创建测试用户

- name: Run E2E tests
  run: pnpm e2e
```

### 2. 本地开发

```bash
# 第一次运行 E2E 测试前
pnpm dev          # Terminal 1: 启动服务
pnpm test:seed    # Terminal 2: 创建测试用户
pnpm e2e:ui       # Terminal 2: 运行 E2E 测试
```

### 3. 测试数据隔离

- 每个测试使用唯一的数据（如 timestamp 后缀）
- 测试后清理创建的数据
- 不要依赖其他测试的数据

```typescript
test('[P0] should create a goal', async ({ page }) => {
  const goalTitle = `E2E Test Goal ${Date.now()}`; // 唯一标题
  
  // 创建目标...
  
  // 测试后清理
  await deleteGoal(page, goalTitle);
});
```

## 🐛 故障排除

### 问题 1: 数据库连接失败

```
Can't reach database server at `localhost:5432`
```

**解决方案**：
```bash
# 确保 API 服务正在运行
pnpm dev:api

# 或检查数据库容器
docker ps | grep postgres
```

### 问题 2: 用户创建失败

```
Unique constraint failed on the fields: (`username`)
```

**原因**: 用户已存在但脚本无法更新

**解决方案**：
```bash
# 重置数据库
pnpm prisma:migrate:reset

# 重新创建测试用户
pnpm test:seed
```

### 问题 3: 密码验证失败

```
Error: Invalid username or password
```

**解决方案**：
```bash
# 重新运行脚本更新密码
pnpm test:seed
```

## 📚 相关文档

- [E2E 测试文档](../../apps/web/e2e/goal/README.md)
- [E2E 故障排除](../../docs/E2E_TEST_TROUBLESHOOTING.md)
- [测试用户辅助函数](../../apps/web/e2e/helpers/testHelpers.ts)

## 🔐 安全注意事项

⚠️ **重要**：
- 这些是**测试用户**，仅用于开发和测试环境
- **切勿**在生产环境中运行此脚本
- **切勿**使用这些凭证在生产环境中创建用户
- 测试用户使用简单密码是为了方便测试，生产环境必须使用强密码

## 📝 更新日志

- **2024-11-01**: 初始版本
  - 支持创建 3 个固定测试用户
  - 幂等性设计（可重复运行）
  - 事务安全
  - 密码自动加密

