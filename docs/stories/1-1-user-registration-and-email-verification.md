# Story 1.1: 用户注册与邮箱验证

> **Story ID**: STORY-1.1  
> **Epic**: Epic 1 - Account & Authentication  
> **优先级**: P0  
> **Story Points**: 5  
> **状态**: Drafted  
> **创建时间**: 2025-10-28  
> **依赖**: 无

---

## 📖 User Story

**As a** 新用户  
**I want to** 使用邮箱和用户名注册账户并完成邮箱验证  
**So that** 我可以安全地访问 DailyUse 平台的所有功能

---

## 🎯 验收标准

### AC-1: 用户注册表单
```gherkin
Given 访客用户在注册页面
When 填写用户名 "testuser"、邮箱 "test@example.com"、密码 "Test123456!"
And 密码满足强度要求（8位+大小写字母+数字）
Then 表单验证通过
And "注册"按钮变为可点击状态
```

### AC-2: 注册成功创建账户
```gherkin
Given 用户填写了有效的注册信息
When 点击"注册"按钮
Then API 返回 201 Created
And 响应包含账户信息 (uuid, username, email)
And 数据库中创建 Account 记录 (status=ACTIVE, isEmailVerified=false)
And 数据库中创建 AuthCredential 记录 (hashedPassword, salt)
And 两条记录在同一事务中原子性创建
```

### AC-3: 用户名/邮箱唯一性检查
```gherkin
Given 已存在用户 (username="existing", email="existing@example.com")
When 新用户尝试注册相同用户名或邮箱
Then API 返回 409 Conflict
And 错误消息为 "Username already exists" 或 "Email already registered"
And 前端显示友好的错误提示
```

### AC-4: 密码强度验证
```gherkin
Given 用户在注册表单中输入密码
When 密码不符合要求（如 "123" 或 "abc"）
Then 前端实时显示密码强度提示
And 后端 API 返回 400 Bad Request
And 错误消息详细说明密码要求
```

**密码强度要求**:
- 最少 8 位字符
- 至少 1 个大写字母
- 至少 1 个小写字母
- 至少 1 个数字
- 可选：特殊字符 (!@#$%^&*)

### AC-5: 密码加密存储
```gherkin
Given 用户提交注册请求
When 后端处理密码
Then 使用 bcrypt 加密密码 (saltRounds=10)
And 数据库中存储 hashedPassword（不存储明文密码）
And salt 存储在 AuthCredential.salt 字段
```

### AC-6: 邮箱验证流程（Phase 1 简化版）
```gherkin
Given 用户注册成功
When 后端创建账户后
Then 生成邮箱验证 Token (emailVerificationToken)
And Token 存储在 Account.emailVerificationToken 字段
And isEmailVerified 设置为 false
And 注册响应提示"请查收验证邮件"

Note: Phase 1 暂不实现邮件发送，Token 生成即可
```

### AC-7: 注册后引导用户登录
```gherkin
Given 用户注册成功
When 收到注册成功响应
Then 前端显示成功消息 "注册成功，请登录"
And 自动跳转到登录页面
And 用户名字段自动填充已注册的用户名

Note: 由于 AuthCredential 异步创建，注册成功后需要单独登录
```

---

## 🔧 技术实现任务

### Backend Tasks

#### Task 1.1.1: 创建 Account 聚合根
- [ ] 创建 `Account` 聚合根类 (`apps/api/src/domain-server/account/aggregate/Account.ts`)
- [ ] 实现 `Account.create()` 静态工厂方法
- [ ] 添加字段验证（username, email, accountType, status）
- [ ] 实现 `generateEmailVerificationToken()` 方法
- [ ] 编写单元测试 (`Account.spec.ts`)

**验证标准**:
- Account 聚合根包含所有必需字段
- 验证规则覆盖用户名格式（3-20字符，字母数字下划线）
- emailVerificationToken 使用 UUID v4 生成

#### Task 1.1.2: 创建 AuthCredential 聚合根
- [ ] 创建 `AuthCredential` 聚合根类 (`apps/api/src/domain-server/auth/aggregate/AuthCredential.ts`)
- [ ] 实现密码加密方法 `hashPassword(plainPassword: string)`
- [ ] 实现密码验证方法 `verifyPassword(plainPassword: string)`
- [ ] 添加锁定机制字段 (failedLoginAttempts, lockedUntil)
- [ ] 编写单元测试 (`AuthCredential.spec.ts`)

**验证标准**:
- 使用 bcrypt 加密（saltRounds=10）
- 密码验证方法使用 bcrypt.compare
- 单元测试覆盖加密和验证流程

#### Task 1.1.3: 实现 Account 仓储
- [ ] 创建 `IAccountRepository` 接口
- [ ] 实现 `PrismaAccountRepository` (`apps/api/src/infrastructure/prisma/repositories/PrismaAccountRepository.ts`)
- [ ] 实现方法: `save()`, `findByUuid()`, `findByUsername()`, `findByEmail()`
- [ ] 添加唯一性检查辅助方法 `existsByUsername()`, `existsByEmail()`
- [ ] 编写集成测试 (`PrismaAccountRepository.integration.test.ts`)

#### Task 1.1.4: 实现 AuthCredential 仓储
- [ ] 创建 `IAuthCredentialRepository` 接口
- [ ] 实现 `PrismaAuthCredentialRepository`
- [ ] 实现方法: `save()`, `findByAccountUuid()`
- [ ] 编写集成测试

#### Task 1.1.5: 实现 RegistrationApplicationService
- [ ] 创建 `RegistrationApplicationService` (`apps/api/src/application/services/RegistrationApplicationService.ts`)
- [ ] 实现 `registerUser(request: RegisterUserRequest)` 方法
- [ ] 业务流程:
  1. 验证输入（用户名、邮箱格式、密码强度）
  2. 检查用户名/邮箱唯一性
  3. 创建 Account 聚合
  4. 生成 emailVerificationToken
  5. 创建 AuthCredential 聚合（密码加密）
  6. 使用事务保存 Account + AuthCredential
  7. 返回 AccountDTO（不包含敏感信息）
- [ ] 错误处理（唯一性冲突、验证失败）
- [ ] 编写集成测试 (`RegistrationApplicationService.integration.test.ts`)

**验证标准**:
- 事务保证 Account 和 AuthCredential 原子性创建
- 错误情况回滚事务
- 返回 DTO 不包含 hashedPassword 等敏感字段

#### Task 1.1.6: 创建注册 API 控制器
- [ ] 创建 `RegistrationController` (`apps/api/src/presentation/controllers/RegistrationController.ts`)
- [ ] 实现 `POST /api/auth/register` 端点
- [ ] 请求 DTO 验证（使用 class-validator）
- [ ] 调用 `RegistrationApplicationService.registerUser()`
- [ ] 统一响应格式 `{success, data, message}`
- [ ] HTTP 状态码：201 Created (成功), 400 (验证失败), 409 (冲突), 500 (服务器错误)
- [ ] 编写 API 集成测试 (`registration.api.test.ts`)

**请求体示例**:
```typescript
{
  username: string;
  email: string;
  password: string;
  displayName?: string;
}
```

**响应示例**:
```typescript
{
  success: true,
  data: {
    account: {
      uuid: "...",
      username: "testuser",
      email: "test@example.com",
      displayName: "Test User",
      accountType: "LOCAL",
      status: "ACTIVE",
      isEmailVerified: false,
      createdAt: "2025-10-28T12:00:00Z"
    }
  },
  message: "Registration successful. Please log in to continue."
}
```

### Frontend Tasks

#### Task 1.1.7: 创建注册页面组件
- [ ] 创建 `RegisterPage.vue` (`apps/web/src/pages/auth/RegisterPage.vue`)
- [ ] 使用 Vuetify 表单组件 (v-form, v-text-field)
- [ ] 表单字段: 用户名、邮箱、密码、确认密码
- [ ] 实时密码强度指示器
- [ ] 客户端验证（用户名格式、邮箱格式、密码强度）
- [ ] 提交按钮禁用状态管理
- [ ] 错误消息显示（服务器返回的错误）

#### Task 1.1.8: 实现注册 API 调用
- [ ] 创建 `authApi.ts` (`apps/web/src/api/authApi.ts`)
- [ ] 实现 `register(data: RegisterRequest)` 方法
- [ ] 使用 axios 发送 POST 请求到 `/api/auth/register`
- [ ] 错误处理和重试逻辑
- [ ] 类型定义 (`RegisterRequest`, `RegisterResponse`)

#### Task 1.1.9: 创建 Auth Pinia Store
- [ ] 创建 `useAuthStore` (`apps/web/src/stores/authStore.ts`)
- [ ] State: `isAuthenticated`, `user`, `loading`, `error`
- [ ] Action: `register(data)`, `login(data)`, `logout()`
- [ ] 持久化（localStorage 或 sessionStorage）
- [ ] 编写 Pinia Store 测试

#### Task 1.1.10: 注册成功流程
- [ ] 注册成功后显示 Snackbar 提示
- [ ] 自动跳转到登录页面（使用 Vue Router）
- [ ] 登录表单自动填充用户名

### Database Tasks

#### Task 1.1.11: 创建 Prisma Schema
- [ ] 定义 `Account` 模型 (`apps/api/prisma/schema.prisma`)
- [ ] 定义 `AuthCredential` 模型
- [ ] 设置外键关系 (AuthCredential.accountUuid → Account.uuid)
- [ ] 添加索引 (username, email, accountUuid)
- [ ] 添加唯一约束 (username, email)
- [ ] 运行 `prisma migrate dev --name create-account-auth`

**Account Model**:
```prisma
model Account {
  uuid                    String   @id @default(uuid())
  username                String   @unique
  email                   String?  @unique
  phoneNumber             String?
  displayName             String?
  accountType             String   @default("LOCAL")
  status                  String   @default("ACTIVE")
  isEmailVerified         Boolean  @default(false)
  isPhoneVerified         Boolean  @default(false)
  emailVerificationToken  String?
  phoneVerificationCode   String?
  lastLoginAt             DateTime?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  deletedAt               DateTime?
  
  authCredential          AuthCredential?
  
  @@index([username])
  @@index([email])
  @@index([status])
}
```

**AuthCredential Model**:
```prisma
model AuthCredential {
  uuid                  String   @id @default(uuid())
  accountUuid           String   @unique
  hashedPassword        String
  salt                  String?
  passwordChangedAt     DateTime?
  failedLoginAttempts   Int      @default(0)
  lockedUntil           DateTime?
  lastFailedLoginAt     DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  account               Account  @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  
  @@index([accountUuid])
}
```

### Testing Tasks

#### Task 1.1.12: 编写端到端测试
- [ ] 创建 E2E 测试文件 (`apps/web/e2e/registration.spec.ts`)
- [ ] 测试场景 1: 成功注册流程
- [ ] 测试场景 2: 用户名已存在错误
- [ ] 测试场景 3: 邮箱已存在错误
- [ ] 测试场景 4: 密码强度不足错误
- [ ] 测试场景 5: 表单验证错误显示
- [ ] 使用 Playwright 自动化测试

---

## 📐 技术规格引用

### 架构约束
- **领域驱动设计 (DDD)**: Account 和 AuthCredential 作为聚合根
- **前后端分离**: Vue 3 (Web) + NestJS (API)
- **数据库**: PostgreSQL 16.10
- **ORM**: Prisma

### 相关文档
- [Epic 1 技术上下文](../epic-1-context.md) - 详细的架构设计和 API 规范
- [PRD - Account 模块](../PRD-PRODUCT-REQUIREMENTS.md#1-account-账户模块)
- [数据库 Schema](../../apps/api/prisma/schema.prisma)

### 依赖包
- Backend: `@nestjs/common`, `@nestjs/jwt`, `@prisma/client`, `bcrypt`, `class-validator`, `uuid`
- Frontend: `vue`, `pinia`, `axios`, `vuetify`, `zod`

---

## 🧪 测试策略

### 单元测试覆盖率目标: 80%
- Account 聚合根方法
- AuthCredential 加密和验证方法
- RegistrationApplicationService 业务逻辑

### 集成测试覆盖率目标: 70%
- Prisma 仓储 CRUD 操作
- API 端点完整流程
- 事务回滚测试

### E2E 测试: 100% 关键路径
- 成功注册并跳转登录
- 唯一性冲突错误处理
- 表单验证错误显示

---

## 📊 Definition of Done (DoD)

- [ ] 所有后端单元测试通过（覆盖率 ≥ 80%）
- [ ] 所有集成测试通过（覆盖率 ≥ 70%）
- [ ] API 端点在 Postman/Insomnia 中手动测试通过
- [ ] 前端组件在浏览器中手动测试通过
- [ ] E2E 测试通过（Playwright）
- [ ] 代码通过 ESLint 检查（无 error）
- [ ] 数据库迁移成功执行
- [ ] 文档更新（API 文档、README）
- [ ] Code Review 完成并合并到 dev 分支
- [ ] Sprint Status 更新为 "done"

---

## 🚧 已知限制与未来改进

### Phase 1 限制
- ❌ 邮件发送功能暂未实现（Token 生成但不发送）
- ❌ 邮箱验证页面暂未实现
- ❌ 手机号注册暂不支持

### Phase 2 计划
- ✅ 集成邮件服务（SendGrid/AWS SES）
- ✅ 实现邮箱验证页面和 API
- ✅ 添加手机号注册支持
- ✅ OAuth 第三方登录（GitHub/Google）

---

## 🔗 相关 Stories

- **下一个 Story**: [Story 1.2: 用户登录与 Token 管理](./1-2-user-login-and-token-management.md)
- **阻塞的 Stories**: Story 1.2-1.5 都依赖本 Story 完成

---

## 📝 Dev Agent 工作记录

### 实施日志
_(开发过程中填写)_

### 遇到的问题与解决方案
_(开发过程中记录)_

### 实际 Story Points 消耗
_(完成后填写)_

---

**Story Owner**: Backend Team + Frontend Team  
**最后更新**: 2025-10-28  
**状态**: Drafted
