# Epic 1: Account & Authentication - 技术上下文文档

> **Epic ID**: EPIC-ACCOUNT-001  
> **Epic 标题**: Account & Authentication (账户与认证)  
> **生成时间**: 2025-10-28  
> **文档版本**: v1.0  
> **状态**: Contexted

---

## 1. 概述与范围

### 1.1 Epic 概述

Epic 1 建立用户账户体系和认证机制，为整个 DailyUse 平台提供安全的用户管理基础。该 Epic 包含用户注册、登录、个人资料管理、密码管理、会话管理等核心功能，以及 JWT Token 管理、邮箱验证、密码重置等认证相关功能。

本 Epic 是整个平台的基础设施，所有其他业务模块（Goal、Task、Schedule 等）都依赖于用户身份认证和授权。

### 1.2 目标与范围

**In-Scope (包含范围)**:
- ✅ 用户注册（用户名/邮箱注册）
- ✅ 用户登录（支持用户名或邮箱登录）
- ✅ JWT Token 生成与验证（AccessToken + RefreshToken）
- ✅ 邮箱验证流程
- ✅ 密码重置流程
- ✅ 个人资料管理（昵称、头像、简介等）
- ✅ 密码修改（需验证旧密码）
- ✅ 会话管理（查看活跃会话、登出设备）
- ✅ 账户注销（软删除）

**Out-of-Scope (不包含范围)**:
- ❌ OAuth 第三方登录（GitHub/Google/微信）- 放在 Phase 2 (P3)
- ❌ 双因素认证 (2FA) - 放在 Phase 2 (P2)
- ❌ 登录审计日志 - 放在 Phase 2 (P2)
- ❌ 数据导入导出 - 放在 Phase 2 (P2)
- ❌ 角色权限管理（RBAC）- 未来功能

### 1.3 系统架构对齐

**架构约束**:
- 采用 **领域驱动设计 (DDD)** 架构模式
- 使用 **Nx Monorepo** 组织代码
- 前后端分离：Vue 3 (Web) + NestJS (API)
- 数据库：PostgreSQL 16.10
- 认证方式：JWT (AccessToken + RefreshToken)

**依赖组件**:
- `@dailyuse/contracts`: 类型定义（DTOs, Entities）
- `@dailyuse/domain-server`: 服务端领域层（聚合根、仓储）
- `@dailyuse/domain-client`: 客户端领域层（Pinia Stores）
- `@dailyuse/utils`: 工具库（Logger、验证器）
- Prisma ORM: 数据库访问层

---

## 2. 详细设计

### 2.1 服务/模块划分

#### 2.1.1 Account 模块

| 服务/类 | 职责 | 输入 | 输出 | 所有者 |
|---------|------|------|------|--------|
| `RegistrationApplicationService` | 用户注册流程编排 | `RegisterUserRequest` | `RegisterUserResponse` | Backend Team |
| `AccountProfileApplicationService` | 个人资料管理 | `UpdateProfileRequest` | `AccountDTO` | Backend Team |
| `AccountEmailApplicationService` | 邮箱相关操作 | `UpdateEmailRequest` | `AccountDTO` | Backend Team |
| `Account` (聚合根) | 账户核心业务逻辑 | - | - | Backend Team |
| `IAccountRepository` | 账户仓储接口 | - | - | Backend Team |
| `PrismaAccountRepository` | Prisma 仓储实现 | - | - | Backend Team |

#### 2.1.2 Authentication 模块

| 服务/类 | 职责 | 输入 | 输出 | 所有者 |
|---------|------|------|------|--------|
| `AuthenticationApplicationService` | 登录流程编排 | `LoginRequest` | `LoginResponse` | Backend Team |
| `TokenService` | JWT Token 生成与验证 | `accountUuid` | `accessToken, refreshToken` | Backend Team |
| `PasswordService` | 密码加密与验证 | `plainPassword` | `hashedPassword` | Backend Team |
| `SessionDomainService` | 会话管理领域服务 | `CreateSessionRequest` | `Session` | Backend Team |
| `AuthCredential` (聚合根) | 认证凭证管理 | - | - | Backend Team |
| `Session` (实体) | 会话实体 | - | - | Backend Team |
| `IAuthCredentialRepository` | 凭证仓储接口 | - | - | Backend Team |
| `ISessionRepository` | 会话仓储接口 | - | - | Backend Team |

### 2.2 数据模型

#### 2.2.1 Account 表 (PostgreSQL)

```sql
CREATE TABLE "Account" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "phoneNumber" TEXT,
  "displayName" TEXT,
  "accountType" TEXT NOT NULL DEFAULT 'LOCAL',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "emailVerificationToken" TEXT,
  "phoneVerificationCode" TEXT,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  "deletedAt" TIMESTAMP,
  
  CONSTRAINT "Account_username_unique" UNIQUE("username"),
  CONSTRAINT "Account_email_unique" UNIQUE("email")
);

CREATE INDEX "Account_username_idx" ON "Account"("username");
CREATE INDEX "Account_email_idx" ON "Account"("email");
CREATE INDEX "Account_status_idx" ON "Account"("status");
```

#### 2.2.2 AuthCredential 表 (PostgreSQL)

```sql
CREATE TABLE "AuthCredential" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "accountUuid" TEXT NOT NULL UNIQUE,
  "hashedPassword" TEXT NOT NULL,
  "salt" TEXT,
  "passwordChangedAt" TIMESTAMP,
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP,
  "lastFailedLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "AuthCredential_accountUuid_fkey" 
    FOREIGN KEY ("accountUuid") REFERENCES "Account"("uuid") 
    ON DELETE CASCADE
);

CREATE INDEX "AuthCredential_accountUuid_idx" ON "AuthCredential"("accountUuid");
```

#### 2.2.3 Session 表 (PostgreSQL)

```sql
CREATE TABLE "Session" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "accountUuid" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL UNIQUE,
  "deviceType" TEXT NOT NULL,
  "deviceName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAccessedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "Session_accountUuid_fkey" 
    FOREIGN KEY ("accountUuid") REFERENCES "Account"("uuid") 
    ON DELETE CASCADE
);

CREATE INDEX "Session_accountUuid_idx" ON "Session"("accountUuid");
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
```

### 2.3 API 接口规范

#### 2.3.1 用户注册

**Endpoint**: `POST /api/auth/register`

**Request**:
```typescript
{
  username: string;        // 用户名，3-20字符，字母数字下划线
  email: string;           // 邮箱，符合邮箱格式
  password: string;        // 密码，最少8位，包含大小写字母和数字
  displayName?: string;    // 显示名称（可选）
}
```

**Response (201 Created)**:
```typescript
{
  success: true,
  data: {
    account: {
      uuid: string;
      username: string;
      email: string;
      displayName: string;
      accountType: "LOCAL";
      status: "ACTIVE";
      isEmailVerified: boolean;
      createdAt: string;
    }
  },
  message: "Registration successful. Please log in to continue."
}
```

**Error Codes**:
- `400`: 输入验证失败（用户名格式错误、密码强度不足等）
- `409`: 用户名或邮箱已存在
- `500`: 服务器内部错误

#### 2.3.2 用户登录

**Endpoint**: `POST /api/auth/login`

**Request**:
```typescript
{
  identifier: string;      // 用户名或邮箱
  password: string;        // 密码
  rememberMe?: boolean;    // 记住我（默认 false）
  deviceInfo: {
    deviceType: "WEB" | "DESKTOP" | "MOBILE";
    deviceName?: string;
    userAgent?: string;
  }
}
```

**Response (200 OK)**:
```typescript
{
  success: true,
  data: {
    user: {
      uuid: string;
      username: string;
      email: string;
      displayName: string;
    },
    accessToken: string;      // 1小时有效
    refreshToken: string;     // 7天有效（rememberMe=true 则30天）
    expiresIn: number;        // 过期时间（秒）
    tokenType: "Bearer",
    sessionId: string;
  },
  message: "Login successful"
}
```

**Error Codes**:
- `401`: 用户名或密码错误
- `403`: 账户已锁定（失败尝试超过5次）
- `500`: 服务器内部错误

#### 2.3.3 刷新 Token

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```typescript
{
  refreshToken: string;
}
```

**Response (200 OK)**:
```typescript
{
  success: true,
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}
```

#### 2.3.4 查看个人资料

**Endpoint**: `GET /api/accounts/me`

**Headers**: `Authorization: Bearer <accessToken>`

**Response (200 OK)**:
```typescript
{
  success: true,
  data: {
    uuid: string;
    username: string;
    email: string;
    phoneNumber?: string;
    displayName: string;
    accountType: string;
    status: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

#### 2.3.5 修改密码

**Endpoint**: `PUT /api/accounts/me/password`

**Headers**: `Authorization: Bearer <accessToken>`

**Request**:
```typescript
{
  oldPassword: string;
  newPassword: string;
}
```

**Response (200 OK)**:
```typescript
{
  success: true,
  message: "Password updated successfully. All sessions have been terminated."
}
```

**Error Codes**:
- `401`: 旧密码错误
- `400`: 新密码不符合强度要求

### 2.4 业务流程与时序

#### 2.4.1 用户注册流程

```
Client                  API Controller           Application Service         Domain Layer            Database
  |                          |                            |                         |                      |
  |--POST /auth/register---->|                            |                         |                      |
  |                          |---validateInput----------->|                         |                      |
  |                          |                            |---checkUniqueness------>|                      |
  |                          |                            |                         |---query------------>|
  |                          |                            |                         |<---result-----------|
  |                          |                            |---hashPassword--------->|                      |
  |                          |                            |<---hashedPassword-------|                      |
  |                          |                            |---createAccountTx------>|                      |
  |                          |                            |                         |---beginTx---------->|
  |                          |                            |                         |---createAccount---->|
  |                          |                            |                         |---createCredential->|
  |                          |                            |                         |---commitTx--------->|
  |                          |                            |<---account--------------|                      |
  |                          |<---RegisterResponse--------|                         |                      |
  |<---201 Created-----------|                            |                         |                      |
```

**关键步骤**:
1. 输入验证（用户名、邮箱格式、密码强度）
2. 唯一性检查（用户名、邮箱是否已存在）
3. 密码加密（bcrypt, saltRounds=10）
4. 事务创建（Account + AuthCredential 原子性）
5. 可选：发送验证邮件

#### 2.4.2 用户登录流程

```
Client                  API Controller           Application Service         Domain Service          Database
  |                          |                            |                         |                      |
  |--POST /auth/login------->|                            |                         |                      |
  |                          |---validateInput----------->|                         |                      |
  |                          |                            |---findAccount---------->|                      |
  |                          |                            |                         |---query------------>|
  |                          |                            |                         |<---account----------|
  |                          |                            |---findCredential------->|                      |
  |                          |                            |                         |---query------------>|
  |                          |                            |                         |<---credential-------|
  |                          |                            |---checkLocked---------->|                      |
  |                          |                            |<---isLocked-------------|                      |
  |                          |                            |---verifyPassword------->|                      |
  |                          |                            |<---isValid--------------|                      |
  |                          |                            |---generateTokens------->|                      |
  |                          |                            |<---tokens---------------|                      |
  |                          |                            |---createSession-------->|                      |
  |                          |                            |                         |---insert----------->|
  |                          |                            |<---session--------------|                      |
  |                          |                            |---resetFailedAttempts-->|                      |
  |                          |<---LoginResponse-----------|                         |                      |
  |<---200 OK----------------|                            |                         |                      |
```

**关键步骤**:
1. 查询账户（支持用户名或邮箱）
2. 查询认证凭证
3. 检查账户锁定状态
4. 验证密码（bcrypt.compare）
5. 生成 AccessToken (1小时) 和 RefreshToken (7天)
6. 创建会话记录
7. 重置失败尝试次数
8. 更新最后登录时间

---

## 3. 非功能需求 (NFR)

### 3.1 性能要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 注册响应时间 | < 500ms | 95%ile，包含密码加密时间 |
| 登录响应时间 | < 300ms | 95%ile，包含数据库查询和 Token 生成 |
| Token 验证时间 | < 50ms | 中间件验证 JWT |
| 并发用户数 | 1000 QPS | 登录接口峰值处理能力 |

**性能优化策略**:
- 使用数据库索引加速用户名/邮箱查询
- Token 验证使用内存缓存（Redis）减少数据库访问
- 密码加密使用异步处理避免阻塞

### 3.2 安全要求

**认证安全**:
- ✅ 密码加密：bcrypt (saltRounds=10)
- ✅ Token 安全：JWT 使用 HS256 签名算法
- ✅ 防暴力破解：5次失败尝试锁定15分钟
- ✅ 会话管理：每个设备独立会话，支持远程登出
- ✅ HTTPS 传输：生产环境强制 HTTPS

**数据安全**:
- ✅ 敏感数据加密存储（密码、Token）
- ✅ SQL 注入防护：使用 Prisma ORM 参数化查询
- ✅ XSS 防护：输入验证和输出转义
- ✅ CSRF 防护：Token 验证机制

**审计日志** (Phase 2):
- 记录所有登录尝试（成功/失败）
- 记录敏感操作（修改密码、注销账户）
- 日志保留90天

### 3.3 可靠性要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 系统可用性 | 99.9% | 月度停机时间 < 43.2分钟 |
| 数据持久性 | 99.99% | PostgreSQL 主从复制 |
| 故障恢复时间 (RTO) | < 5分钟 | 自动故障切换 |
| 数据恢复点 (RPO) | < 1分钟 | 数据库实时复制 |

**容错机制**:
- 数据库连接池：自动重连机制
- Token 生成失败：降级使用备用算法
- 邮件发送失败：异步重试（最多3次）

### 3.4 可观测性要求

**日志记录**:
- ✅ 结构化日志（JSON 格式）
- ✅ 日志级别：DEBUG, INFO, WARN, ERROR
- ✅ 关键操作日志：注册、登录、修改密码
- ✅ 错误堆栈跟踪

**指标监控**:
- 注册成功率
- 登录成功率
- 平均响应时间
- 失败登录尝试次数
- 活跃会话数

**追踪**:
- 请求追踪 ID（X-Request-ID）
- 分布式追踪（未来支持 OpenTelemetry）

---

## 4. 依赖与集成

### 4.1 技术依赖

#### 4.1.1 后端依赖 (package.json)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@prisma/client": "^5.20.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "uuid": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/uuid": "^9.0.0",
    "prisma": "^5.20.0"
  }
}
```

#### 4.1.2 前端依赖 (package.json)

```json
{
  "dependencies": {
    "vue": "^3.4.21",
    "pinia": "^2.1.7",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "@vueuse/core": "^10.0.0"
  }
}
```

### 4.2 外部服务集成

| 服务 | 用途 | 状态 | 备注 |
|------|------|------|------|
| PostgreSQL | 数据存储 | ✅ 已集成 | 版本 16.10 |
| Redis (未来) | Token 缓存 | ⏳ 计划中 | Phase 2 |
| SendGrid (未来) | 邮件发送 | ⏳ 计划中 | 邮箱验证 |
| Sentry (未来) | 错误追踪 | ⏳ 计划中 | 生产监控 |

### 4.3 内部模块依赖

```
Epic 1 (Account & Authentication)
├── 被依赖于: Epic 2-9 (所有业务模块)
└── 依赖: 无（基础设施层）
```

**跨模块通信**:
- Event Bus: 发布 `AccountCreatedEvent`, `UserLoggedInEvent`
- Shared Types: `@dailyuse/contracts` 包

---

## 5. 验收标准与可追溯性

### 5.1 验收标准

#### AC-1: 用户注册功能
```gherkin
Given 访客用户在注册页面
When 填写用户名 "testuser"、邮箱 "test@example.com"、密码 "Test123456!"
Then 注册成功并返回 201 状态码
And 数据库中存在该用户记录
And 用户状态为 "ACTIVE"
And isEmailVerified 为 false
```

#### AC-2: 用户登录功能
```gherkin
Given 已注册用户 (username="testuser", password="Test123456!")
When 使用正确的用户名和密码登录
Then 登录成功并返回 200 状态码
And 响应包含 accessToken 和 refreshToken
And accessToken 有效期为 1 小时
And refreshToken 有效期为 7 天
And 数据库中创建新会话记录
```

#### AC-3: 密码错误锁定机制
```gherkin
Given 已注册用户
When 连续 5 次输入错误密码
Then 账户被锁定 15 分钟
And 第 6 次尝试返回 403 错误
And 错误消息为 "Account locked due to too many failed attempts"
```

#### AC-4: Token 刷新功能
```gherkin
Given 用户已登录并持有有效的 refreshToken
When 使用 refreshToken 请求刷新
Then 返回新的 accessToken 和 refreshToken
And 旧的 refreshToken 失效
And 会话的 lastAccessedAt 更新
```

#### AC-5: 修改密码功能
```gherkin
Given 已登录用户
When 输入正确的旧密码和符合要求的新密码
Then 密码修改成功
And 所有活跃会话被清除
And 用户需要重新登录
And 发送密码修改通知邮件
```

### 5.2 可追溯性映射

| 验收标准 | 规格章节 | 组件/API | 测试用例 |
|----------|----------|----------|----------|
| AC-1 | §2.3.1, §2.4.1 | `RegistrationApplicationService` | `registration.integration.test.ts::register_success` |
| AC-2 | §2.3.2, §2.4.2 | `AuthenticationApplicationService` | `login.integration.test.ts::login_success` |
| AC-3 | §3.2 | `AuthCredential.checkLocked()` | `login.integration.test.ts::account_locked_after_5_failures` |
| AC-4 | §2.3.3 | `TokenService.refreshTokens()` | `token.integration.test.ts::refresh_token_success` |
| AC-5 | §2.3.5 | `AccountProfileApplicationService` | `password.integration.test.ts::change_password_success` |

---

## 6. 风险、假设与问题

### 6.1 风险 (Risks)

| 风险 ID | 描述 | 影响 | 概率 | 缓解措施 |
|---------|------|------|------|----------|
| R1 | 密码加密算法性能瓶颈 | 高 | 中 | 使用异步加密，考虑引入 Redis 缓存 |
| R2 | Token 泄露导致账户被盗 | 高 | 低 | 实施短期 Token + 设备绑定 |
| R3 | 数据库连接池耗尽 | 中 | 中 | 配置合理的连接池大小 + 监控 |
| R4 | 邮件服务不可用影响注册流程 | 中 | 低 | 异步发送 + 重试机制 |

### 6.2 假设 (Assumptions)

| 假设 ID | 描述 | 验证状态 |
|---------|------|----------|
| A1 | PostgreSQL 能满足并发需求 | ✅ 已验证（16.10 支持 200+ 并发） |
| A2 | 用户邮箱格式符合 RFC 5322 | ✅ 使用 Zod 验证 |
| A3 | 用户密码强度足够（8位+大小写+数字） | ✅ 前后端双重验证 |
| A4 | JWT Token 安全性可接受 | ⏳ 需生产环境验证 |

### 6.3 未决问题 (Questions)

| 问题 ID | 描述 | 负责人 | 截止日期 |
|---------|------|--------|----------|
| Q1 | 是否需要支持手机号注册？ | PM | Sprint 1 Week 1 |
| Q2 | Token 过期时间是否可配置？ | Tech Lead | Sprint 1 Week 1 |
| Q3 | 是否需要实现"记住我"功能？ | PM | Sprint 1 Week 2 |
| Q4 | 邮箱验证是否为强制流程？ | PM | Sprint 1 Week 1 |

---

## 7. 测试策略

### 7.1 测试层次

#### 7.1.1 单元测试 (Unit Tests)
- **目标覆盖率**: 80%
- **框架**: Vitest
- **范围**: 领域层（聚合根、值对象、领域服务）

**示例测试**:
```typescript
describe('Account Aggregate', () => {
  it('should create account with valid data', () => {
    const account = Account.create({
      username: 'testuser',
      email: 'test@example.com',
      accountType: AccountType.LOCAL
    });
    expect(account.username).toBe('testuser');
    expect(account.status).toBe(AccountStatus.ACTIVE);
  });
  
  it('should verify email successfully', () => {
    const account = Account.create({ ... });
    account.verifyEmail();
    expect(account.isEmailVerified).toBe(true);
  });
});
```

#### 7.1.2 集成测试 (Integration Tests)
- **目标覆盖率**: 70%
- **框架**: Vitest + Supertest
- **范围**: Application Service + Repository + Database

**示例测试**:
```typescript
describe('Registration Integration Test', () => {
  it('should register user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Test123456!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.account.username).toBe('newuser');
    
    // Verify database record
    const account = await prisma.account.findUnique({
      where: { username: 'newuser' }
    });
    expect(account).not.toBeNull();
  });
});
```

#### 7.1.3 E2E 测试 (End-to-End Tests)
- **目标覆盖率**: 关键用户路径 100%
- **框架**: Playwright
- **范围**: 前端 + API + Database

**示例测试**:
```typescript
test('User registration and login flow', async ({ page }) => {
  // 注册
  await page.goto('/register');
  await page.fill('[name="username"]', 'e2euser');
  await page.fill('[name="email"]', 'e2e@example.com');
  await page.fill('[name="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/login');
  
  // 登录
  await page.fill('[name="identifier"]', 'e2euser');
  await page.fill('[name="password"]', 'Test123456!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 7.2 测试数据准备

**测试用户数据**:
```typescript
export const testUsers = {
  validUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123456!'
  },
  lockedUser: {
    username: 'lockeduser',
    email: 'locked@example.com',
    password: 'Test123456!'
  }
};
```

### 7.3 性能测试

**工具**: k6 或 Artillery

**测试场景**:
- 登录接口：1000 QPS 持续 5 分钟
- 注册接口：100 QPS 持续 5 分钟
- Token 刷新：500 QPS 持续 5 分钟

**验收标准**:
- P95 响应时间 < 500ms
- 错误率 < 0.1%
- 无内存泄漏

---

## 8. 实施计划

### 8.1 Sprint 1 (Week 1-2)

**Stories**:
- ✅ STORY-1.1: 用户注册与邮箱验证 (5 SP)
- ✅ STORY-1.2: 用户登录与 Token 管理 (5 SP)
- ✅ STORY-1.3: 个人资料管理 (3 SP)

**交付物**:
- 用户注册 API
- 用户登录 API
- Token 生成与验证
- 个人资料查询与更新 API
- 数据库 Schema
- 单元测试 + 集成测试

### 8.2 Sprint 1 (Week 2)

**Stories**:
- ✅ STORY-1.4: 密码管理（修改/重置）(3 SP)
- ✅ STORY-1.5: 会话管理与账户注销 (2 SP)

**交付物**:
- 密码修改 API
- 密码重置流程
- 会话管理 API
- 账户注销功能
- E2E 测试

---

## 9. 相关文档

- [PRD - Account 模块](./PRD-PRODUCT-REQUIREMENTS.md#1-account-账户模块)
- [PRD - Authentication 模块](./PRD-PRODUCT-REQUIREMENTS.md#2-authentication-认证模块)
- [Epic 规划文档](./epic-planning.md#epic-1-account--authentication-账户与认证)
- [用户注册流程设计](./modules/auth-flows/USER_REGISTRATION_FLOW.md)
- [用户登录流程设计](./modules/auth-flows/USER_LOGIN_FLOW.md)
- [Prisma Schema](../apps/api/prisma/schema.prisma)

---

**文档维护**: Backend Team  
**最后更新**: 2025-10-28  
**审核状态**: ✅ 已审核  
**Epic 状态**: Contexted
