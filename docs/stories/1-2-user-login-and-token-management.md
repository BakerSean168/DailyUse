# Story 1.2: 用户登录与 Token 管理

> **Story ID**: STORY-1.2  
> **Epic**: Epic 1 - Account & Authentication  
> **优先级**: P0  
> **Story Points**: 5  
> **状态**: Drafted  
> **创建时间**: 2025-10-28  
> **依赖**: Story 1.1 (用户注册与邮箱验证)

---

## 📖 User Story

**As a** 已注册用户  
**I want to** 使用用户名或邮箱登录并获得 JWT Token  
**So that** 我可以安全地访问受保护的资源和功能

---

## 🎯 验收标准

### AC-1: 登录表单
```gherkin
Given 用户在登录页面
When 填写用户名或邮箱 "testuser" 和密码 "Test123456!"
Then 表单验证通过
And "登录"按钮变为可点击状态
```

### AC-2: 成功登录并获得 Token
```gherkin
Given 已注册用户 (username="testuser", password="Test123456!")
When 输入正确的凭证并点击"登录"
Then API 返回 200 OK
And 响应包含 accessToken (1小时有效)
And 响应包含 refreshToken (7天有效)
And 响应包含用户信息 (uuid, username, email, displayName)
And 前端存储 Token 到 localStorage
And 自动跳转到主页/仪表盘
```

**响应示例**:
```typescript
{
  success: true,
  data: {
    user: {
      uuid: "...",
      username: "testuser",
      email: "test@example.com",
      displayName: "Test User"
    },
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    expiresIn: 3600, // 秒
    tokenType: "Bearer",
    sessionId: "session-uuid"
  },
  message: "Login successful"
}
```

### AC-3: 支持用户名或邮箱登录
```gherkin
Given 已注册用户 (username="testuser", email="test@example.com")
When 输入用户名 "testuser" 和正确密码登录
Then 登录成功

When 输入邮箱 "test@example.com" 和正确密码登录
Then 登录成功
```

### AC-4: 密码错误处理
```gherkin
Given 已注册用户
When 输入错误的密码
Then API 返回 401 Unauthorized
And 错误消息为 "Invalid username or password"
And failedLoginAttempts 计数器 +1
And 前端显示友好的错误提示
```

### AC-5: 账户锁定机制
```gherkin
Given 已注册用户
When 连续输入错误密码 5 次
Then 账户被锁定 15 分钟
And lockedUntil 字段设置为 当前时间 + 15 分钟
And 第 6 次尝试返回 403 Forbidden
And 错误消息为 "Account locked due to too many failed attempts. Please try again in 15 minutes."
```

### AC-6: 成功登录重置失败计数
```gherkin
Given 用户之前有 3 次失败登录尝试
When 输入正确密码成功登录
Then failedLoginAttempts 重置为 0
And lastFailedLoginAt 清空
And lockedUntil 清空（如果存在）
```

### AC-7: 创建会话记录
```gherkin
Given 用户成功登录
When 后端生成 Token 后
Then 创建 Session 记录到数据库
And Session 包含: refreshToken, deviceType, deviceName, ipAddress, userAgent
And Session.expiresAt 设置为 7 天后
And Session.isActive 设置为 true
```

### AC-8: 更新最后登录时间
```gherkin
Given 用户成功登录
When 登录流程完成后
Then Account.lastLoginAt 更新为当前时间
```

### AC-9: Token 验证中间件
```gherkin
Given 用户请求受保护的 API 端点
When 请求头包含有效的 accessToken: "Bearer <token>"
Then 中间件解析 Token 并验证签名
And 验证 Token 未过期
And 从 Token payload 提取 accountUuid
And 将用户信息注入到 request.user
And 允许请求继续

When Token 无效或过期
Then 返回 401 Unauthorized
And 错误消息为 "Invalid or expired token"
```

### AC-10: Token 刷新机制
```gherkin
Given 用户的 accessToken 已过期但 refreshToken 有效
When 使用 refreshToken 请求 POST /api/auth/refresh
Then 生成新的 accessToken (1小时有效)
And 生成新的 refreshToken (7天有效)
And 旧的 refreshToken 失效
And Session.lastAccessedAt 更新
And 返回新的 Token 对
```

---

## 🔧 技术实现任务

### Backend Tasks

#### Task 1.2.1: 实现 TokenService
- [ ] 创建 `TokenService` (`apps/api/src/infrastructure/auth/TokenService.ts`)
- [ ] 实现 `generateAccessToken(accountUuid: string, expiresIn?: string)`
- [ ] 实现 `generateRefreshToken(accountUuid: string, sessionId: string)`
- [ ] 实现 `verifyAccessToken(token: string): TokenPayload`
- [ ] 实现 `verifyRefreshToken(token: string): TokenPayload`
- [ ] 配置 JWT 密钥和过期时间（从环境变量读取）
- [ ] 编写单元测试 (`TokenService.spec.ts`)

**Token Payload 结构**:
```typescript
interface TokenPayload {
  accountUuid: string;
  sessionId?: string; // refreshToken 包含
  iat: number; // issued at
  exp: number; // expiration
}
```

**配置示例**:
```typescript
{
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: '1h',
  refreshTokenExpiresIn: '7d'
}
```

#### Task 1.2.2: 实现 Session 实体和仓储
- [ ] 创建 `Session` 实体 (`apps/api/src/domain-server/auth/entity/Session.ts`)
- [ ] 创建 `ISessionRepository` 接口
- [ ] 实现 `PrismaSessionRepository`
- [ ] 实现方法: `save()`, `findByRefreshToken()`, `findActiveSessionsByAccountUuid()`, `deleteByUuid()`
- [ ] 编写集成测试

**Session 实体字段**:
- uuid, accountUuid, refreshToken, deviceType, deviceName
- ipAddress, userAgent, isActive, expiresAt
- createdAt, lastAccessedAt

#### Task 1.2.3: 实现 AuthenticationApplicationService
- [ ] 创建 `AuthenticationApplicationService` (`apps/api/src/application/services/AuthenticationApplicationService.ts`)
- [ ] 实现 `login(request: LoginRequest)` 方法
- [ ] 业务流程:
  1. 查询账户（支持用户名或邮箱）
  2. 查询 AuthCredential
  3. 检查账户锁定状态 (lockedUntil > now)
  4. 验证密码 (bcrypt.compare)
  5. 如果密码错误: failedLoginAttempts++, 达到5次则锁定
  6. 如果密码正确: 生成 accessToken + refreshToken
  7. 创建 Session 记录
  8. 重置 failedLoginAttempts = 0
  9. 更新 lastLoginAt
  10. 返回 LoginResponse (user, tokens, sessionId)
- [ ] 错误处理（用户不存在、密码错误、账户锁定）
- [ ] 编写集成测试 (`AuthenticationApplicationService.integration.test.ts`)

#### Task 1.2.4: 实现 refreshToken 功能
- [ ] 在 `AuthenticationApplicationService` 中实现 `refreshToken(refreshToken: string)` 方法
- [ ] 验证 refreshToken 签名和过期时间
- [ ] 查询 Session 记录（refreshToken 关联）
- [ ] 验证 Session.isActive = true 且未过期
- [ ] 生成新的 accessToken 和 refreshToken
- [ ] 使旧 refreshToken 失效（更新 Session 记录）
- [ ] 更新 Session.lastAccessedAt
- [ ] 返回新的 Token 对

#### Task 1.2.5: 创建登录 API 控制器
- [ ] 创建 `AuthenticationController` (`apps/api/src/presentation/controllers/AuthenticationController.ts`)
- [ ] 实现 `POST /api/auth/login` 端点
- [ ] 请求 DTO 验证（identifier, password, deviceInfo）
- [ ] 调用 `AuthenticationApplicationService.login()`
- [ ] 统一响应格式
- [ ] HTTP 状态码：200 (成功), 401 (认证失败), 403 (账户锁定), 500 (服务器错误)
- [ ] 编写 API 集成测试

**请求体**:
```typescript
{
  identifier: string; // 用户名或邮箱
  password: string;
  rememberMe?: boolean; // 默认 false
  deviceInfo: {
    deviceType: "WEB" | "DESKTOP" | "MOBILE";
    deviceName?: string;
    userAgent?: string;
  }
}
```

#### Task 1.2.6: 实现刷新 Token API
- [ ] 在 `AuthenticationController` 中实现 `POST /api/auth/refresh` 端点
- [ ] 请求 DTO: `{ refreshToken: string }`
- [ ] 调用 `AuthenticationApplicationService.refreshToken()`
- [ ] 返回新的 Token 对
- [ ] 编写 API 集成测试

#### Task 1.2.7: 实现 JWT 验证中间件
- [ ] 创建 `JwtAuthGuard` 中间件 (`apps/api/src/infrastructure/auth/guards/JwtAuthGuard.ts`)
- [ ] 从请求头提取 Authorization: Bearer <token>
- [ ] 调用 `TokenService.verifyAccessToken()`
- [ ] 如果有效: 提取 accountUuid, 查询账户信息, 注入到 request.user
- [ ] 如果无效/过期: 返回 401 Unauthorized
- [ ] 应用到所有受保护的路由
- [ ] 编写中间件测试

### Frontend Tasks

#### Task 1.2.8: 创建登录页面组件
- [ ] 创建 `LoginPage.vue` (`apps/web/src/pages/auth/LoginPage.vue`)
- [ ] 使用 Vuetify 表单组件
- [ ] 表单字段: 用户名/邮箱、密码、"记住我"复选框
- [ ] 客户端验证
- [ ] 提交按钮禁用状态管理
- [ ] 错误消息显示
- [ ] "忘记密码"链接（暂时禁用，Phase 2）
- [ ] "没有账户？去注册"链接

#### Task 1.2.9: 实现登录 API 调用
- [ ] 在 `authApi.ts` 中实现 `login(data: LoginRequest)` 方法
- [ ] 使用 axios 发送 POST 请求到 `/api/auth/login`
- [ ] 错误处理和重试逻辑
- [ ] 类型定义 (`LoginRequest`, `LoginResponse`)

#### Task 1.2.10: 更新 Auth Pinia Store
- [ ] 在 `useAuthStore` 中实现 `login(data)` action
- [ ] 调用 `authApi.login()`
- [ ] 存储 Token 到 localStorage (`accessToken`, `refreshToken`)
- [ ] 存储用户信息到 state
- [ ] 设置 `isAuthenticated = true`
- [ ] 实现 `logout()` action（清除 Token 和用户信息）
- [ ] 实现 `refreshToken()` action（自动刷新 Token）

#### Task 1.2.11: 实现 Axios 拦截器
- [ ] 创建 Axios 请求拦截器 (`apps/web/src/api/interceptors.ts`)
- [ ] 在每个请求头自动添加 `Authorization: Bearer <accessToken>`
- [ ] 创建 Axios 响应拦截器
- [ ] 如果响应 401: 尝试使用 refreshToken 刷新
- [ ] 刷新成功: 重试原请求
- [ ] 刷新失败: 跳转到登录页面

#### Task 1.2.12: 实现路由守卫
- [ ] 创建 `authGuard.ts` (`apps/web/src/router/guards/authGuard.ts`)
- [ ] 检查 `useAuthStore().isAuthenticated`
- [ ] 如果未认证: 跳转到登录页面
- [ ] 如果已认证: 允许访问
- [ ] 应用到需要认证的路由

#### Task 1.2.13: 登录成功流程
- [ ] 登录成功后显示 Snackbar 提示 "登录成功"
- [ ] 自动跳转到仪表盘/主页
- [ ] 在导航栏显示用户信息（头像、用户名）
- [ ] 显示"退出登录"按钮

### Database Tasks

#### Task 1.2.14: 创建 Session 表
- [ ] 在 Prisma Schema 中定义 `Session` 模型
- [ ] 设置外键关系 (Session.accountUuid → Account.uuid)
- [ ] 添加索引 (accountUuid, refreshToken, expiresAt)
- [ ] 添加唯一约束 (refreshToken)
- [ ] 运行 `prisma migrate dev --name create-session`

**Session Model**:
```prisma
model Session {
  uuid            String   @id @default(uuid())
  accountUuid     String
  refreshToken    String   @unique
  deviceType      String
  deviceName      String?
  ipAddress       String?
  userAgent       String?
  isActive        Boolean  @default(true)
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastAccessedAt  DateTime @default(now())
  
  account         Account  @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)
  
  @@index([accountUuid])
  @@index([refreshToken])
  @@index([expiresAt])
}
```

#### Task 1.2.15: 添加 Session 关联到 Account
- [ ] 在 Account 模型中添加 `sessions Session[]` 关系
- [ ] 运行 Prisma migrate

### Testing Tasks

#### Task 1.2.16: 编写集成测试
- [ ] 测试场景 1: 成功登录流程
- [ ] 测试场景 2: 用户名登录
- [ ] 测试场景 3: 邮箱登录
- [ ] 测试场景 4: 密码错误处理
- [ ] 测试场景 5: 账户锁定机制（5次失败）
- [ ] 测试场景 6: 锁定后15分钟自动解锁
- [ ] 测试场景 7: Token 刷新成功
- [ ] 测试场景 8: 刷新 Token 失效旧 Token

#### Task 1.2.17: 编写端到端测试
- [ ] 创建 E2E 测试文件 (`apps/web/e2e/login.spec.ts`)
- [ ] 测试场景 1: 完整登录流程（注册 → 登录 → 进入主页）
- [ ] 测试场景 2: 密码错误显示错误消息
- [ ] 测试场景 3: 登出后跳转到登录页
- [ ] 测试场景 4: 受保护路由未登录时跳转登录页
- [ ] 使用 Playwright 自动化测试

---

## 📐 技术规格引用

### 架构约束
- **JWT 算法**: HS256
- **Token 有效期**: AccessToken 1小时, RefreshToken 7天
- **密码验证**: bcrypt.compare
- **锁定机制**: 5次失败尝试锁定15分钟

### 相关文档
- [Epic 1 技术上下文](../epic-1-context.md) - §2.3.2 用户登录, §2.4.2 登录流程
- [Story 1.1](./1-1-user-registration-and-email-verification.md) - 依赖的用户注册功能
- [PRD - Authentication 模块](../PRD-PRODUCT-REQUIREMENTS.md#2-authentication-认证模块)

### 依赖包
- Backend: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- Frontend: `axios`, `pinia`, `vue-router`

---

## 🧪 测试策略

### 单元测试覆盖率目标: 80%
- TokenService (生成/验证 Token)
- AuthenticationApplicationService (登录流程)
- JwtAuthGuard (Token 验证中间件)

### 集成测试覆盖率目标: 70%
- 登录 API 完整流程
- Token 刷新流程
- 账户锁定机制
- Session 创建和管理

### E2E 测试: 100% 关键路径
- 完整登录流程
- Token 刷新自动重试
- 路由守卫保护

---

## 📊 Definition of Done (DoD)

- [ ] 所有后端单元测试通过（覆盖率 ≥ 80%）
- [ ] 所有集成测试通过（覆盖率 ≥ 70%）
- [ ] API 端点在 Postman/Insomnia 中手动测试通过
- [ ] 前端组件在浏览器中手动测试通过
- [ ] E2E 测试通过（Playwright）
- [ ] Token 刷新机制验证通过
- [ ] 账户锁定机制验证通过（5次失败+15分钟解锁）
- [ ] 代码通过 ESLint 检查（无 error）
- [ ] Session 数据库表创建成功
- [ ] 文档更新（API 文档）
- [ ] Code Review 完成并合并到 dev 分支
- [ ] Sprint Status 更新为 "done"

---

## 🚧 已知限制与未来改进

### Phase 1 限制
- ❌ "记住我"功能暂未实现（refreshToken 统一7天）
- ❌ 多设备会话管理暂未实现（查看/登出其他设备）
- ❌ IP 地址变化检测暂未实现

### Phase 2 计划
- ✅ 实现"记住我"功能（refreshToken 30天）
- ✅ 多设备会话管理（查看活跃会话列表）
- ✅ 可疑登录检测（IP/地理位置变化通知）
- ✅ 双因素认证 (2FA)
- ✅ OAuth 第三方登录

---

## 🔗 相关 Stories

- **前置 Story**: [Story 1.1: 用户注册与邮箱验证](./1-1-user-registration-and-email-verification.md)
- **下一个 Story**: [Story 1.3: 个人资料管理](./1-3-profile-management.md)
- **阻塞的 Stories**: Story 1.3-1.5, Story 2.1-2.5 (所有业务功能都依赖登录)

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
