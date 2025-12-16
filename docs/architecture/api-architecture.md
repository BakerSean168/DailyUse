# API Backend 架构文档

> **更新时间**: 2025-12-16  
> **应用**: DailyUse API Backend  
> **技术栈**: Node.js 22+ / Express 5.2 / Prisma 6.17 / PostgreSQL  
> **架构模式**: DDD + Event-Driven

---

## 📋 架构概览

### 执行摘要

DailyUse API Backend 是一个基于 Express 框架的 RESTful API 服务，采用领域驱动设计（DDD）和事件驱动架构。使用 Prisma ORM 管理 PostgreSQL 数据库，支持 JWT 认证、Swagger API 文档和实时 SSE 通信。

### 核心特性

- ✅ **RESTful API**: 标准化的 HTTP 接口
- ✅ **JWT 认证**: 基于令牌的身份验证
- ✅ **Prisma ORM**: 类型安全的数据库访问
- ✅ **事件驱动**: 解耦的业务逻辑
- ✅ **SSE 支持**: 服务器推送事件
- ✅ **Swagger 文档**: 自动生成的 API 文档
- ✅ **分层架构**: 清晰的职责分离

---

## 🏗️ 架构模式

### DDD 分层架构

\\\
┌─────────────────────────────────────┐
│   Interface Layer (接口层)           │
│   - HTTP Controllers                │
│   - API Routes                      │
│   - Request/Response DTOs           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Application Layer (应用层)         │
│   - Application Services            │
│   - Use Cases                       │
│   - Event Handlers                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Domain Layer (领域层)              │
│   - Aggregate Roots                 │
│   - Entities & Value Objects        │
│   - Domain Services                 │
│   - Domain Events                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Infrastructure Layer (基础设施层)   │
│   - Repositories                    │
│   - Prisma Client                   │
│   - External APIs                   │
└─────────────────────────────────────┘
\\\

### 请求处理流程

\\\
Client Request
    ↓
Middleware (Authentication, Validation)
    ↓
Controller (Interface Layer)
    ↓
Application Service (Application Layer)
    ↓
Domain Service (Domain Layer)
    ↓
Repository (Infrastructure Layer)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
\\\

---

## 📁 目录结构

\\\
apps/api/
├── src/
│   ├── app.ts                      # Express 应用配置
│   ├── index.ts                    # 应用入口
│   ├── config/                     # 配置文件
│   │   ├── prisma.ts              # Prisma 客户端配置
│   │   ├── logger.config.ts       # 日志配置
│   │   └── swagger.config.ts      # Swagger 配置
│   ├── middleware/                 # 中间件
│   │   ├── auth.middleware.ts     # 认证中间件
│   │   ├── error.middleware.ts    # 错误处理中间件
│   │   └── validation.middleware.ts # 验证中间件
│   ├── shared/                     # 共享代码
│   │   ├── initialization/        # 初始化管理
│   │   └── utils/                 # 工具函数
│   └── modules/                    # 业务模块（按 DDD 组织）
│       ├── account/               # 账户模块
│       │   ├── application/       # 应用服务
│       │   ├── domain/            # 领域模型
│       │   ├── infrastructure/    # 基础设施
│       │   └── interface/         # HTTP 接口
│       ├── goal/                  # 目标模块
│       ├── task/                  # 任务模块
│       ├── schedule/              # 调度模块
│       ├── reminder/              # 提醒模块
│       ├── notification/          # 通知模块
│       ├── repository/            # 仓库模块
│       └── setting/               # 设置模块
├── prisma/
│   ├── schema.prisma              # 数据库模式定义
│   ├── migrations/                # 数据库迁移
│   └── seed.ts                    # 种子数据
└── package.json
\\\

---

## 🎯 核心技术栈

### 运行时环境

| 组件 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 22.20.0+ | JavaScript 运行时 |
| **TypeScript** | 5.8.3 | 类型安全 |

### 框架与库

| 组件 | 版本 | 用途 |
|------|------|------|
| **Express** | 5.2.1 | Web 框架 |
| **Prisma** | 6.17.1 | ORM |
| **Zod** | 4.1.13 | 数据验证 |
| **jsonwebtoken** | 9.0.2 | JWT 认证 |
| **bcryptjs** | 3.0.2 | 密码哈希 |
| **cors** | 2.8.5 | 跨域支持 |
| **helmet** | 8.1.0 | 安全头 |
| **compression** | 1.8.0 | 响应压缩 |
| **cookie-parser** | 1.4.7 | Cookie 解析 |

### API 文档

| 组件 | 版本 | 用途 |
|------|------|------|
| **swagger-jsdoc** | 6.2.8 | Swagger 生成 |
| **swagger-ui-express** | 5.0.1 | Swagger UI |

### 调度与任务

| 组件 | 版本 | 用途 |
|------|------|------|
| **node-cron** | 4.2.1 | Cron 任务调度 |

### 构建工具

| 组件 | 版本 | 用途 |
|------|------|------|
| **tsup** | 8.5.0 | TypeScript 构建 |
| **tsx** | 4.20.6 | TypeScript 执行器 |

---

## 🔐 认证与授权

### JWT 认证流程

\\\
1. 用户登录 → POST /api/auth/login
2. 验证凭据 (username + password)
3. 生成 JWT Token (Access + Refresh)
4. 返回 Token 给客户端
5. 后续请求携带 Access Token (Authorization: Bearer <token>)
6. 中间件验证 Token 有效性
7. Token 过期 → 使用 Refresh Token 刷新
\\\

### Token 结构

**Access Token**:
\\\json
{
  "accountUuid": "uuid-v4",
  "username": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490  // 1小时后过期
}
\\\

**Refresh Token**:
\\\json
{
  "accountUuid": "uuid-v4",
  "sessionUuid": "session-uuid",
  "iat": 1234567890,
  "exp": 1237159890  // 30天后过期
}
\\\

### 认证中间件

\\\typescript
// src/middleware/auth.middleware.ts
export const authMiddleware = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
\\\

---

## 🗄️ 数据库架构

### Prisma Schema 概览

**核心表**:
- \accounts\ - 账户信息
- \auth_credentials\ - 认证凭据
- \auth_sessions\ - 会话管理

**业务表**:
- \goals\ - 目标
- \task_templates\ - 任务模板
- \task_instances\ - 任务实例
- \schedule_tasks\ - 调度任务
- \schedules\ - 日程
- \reminder_templates\ - 提醒模板
- \reminder_instances\ - 提醒实例
- \repositories\ - 仓库
- \settings\ - 设置

**统计表**:
- \goal_statistics\ - 目标统计
- \task_statistics\ - 任务统计
- \schedule_statistics\ - 调度统计
- \reminder_statistics\ - 提醒统计
- \repository_statistics\ - 仓库统计

### 数据库关系

\\\
accounts (1) ←→ (N) goals
accounts (1) ←→ (N) task_templates
accounts (1) ←→ (N) task_instances
accounts (1) ←→ (N) schedules
accounts (1) ←→ (N) reminder_templates
accounts (1) ←→ (N) repositories

goals (1) ←→ (N) key_results
goals (1) ←→ (N) goal_tasks

task_templates (1) ←→ (N) task_instances
\\\

---

## 📡 API 端点结构

### 模块化路由

\\\
/api/
├── /auth/                    # 认证模块
│   ├── POST /login          # 登录
│   ├── POST /register       # 注册
│   ├── POST /refresh        # 刷新 Token
│   └── POST /logout         # 登出
├── /accounts/               # 账户模块
│   ├── GET /profile         # 获取用户资料
│   └── PATCH /profile       # 更新用户资料
├── /goals/                  # 目标模块
│   ├── GET /                # 获取目标列表
│   ├── POST /               # 创建目标
│   ├── GET /:id             # 获取目标详情
│   ├── PATCH /:id           # 更新目标
│   └── DELETE /:id          # 删除目标
├── /tasks/                  # 任务模块
├── /schedules/              # 调度模块
├── /reminders/              # 提醒模块
├── /notifications/          # 通知模块
├── /repositories/           # 仓库模块
└── /settings/               # 设置模块
\\\

### RESTful 规范

| HTTP 方法 | 用途 | 示例 |
|-----------|------|------|
| **GET** | 获取资源 | GET /api/goals |
| **POST** | 创建资源 | POST /api/goals |
| **PATCH** | 部分更新 | PATCH /api/goals/:id |
| **PUT** | 完全更新 | PUT /api/goals/:id |
| **DELETE** | 删除资源 | DELETE /api/goals/:id |

### 响应格式

**成功响应**:
\\\json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-10-28T13:00:00Z",
    "duration": 45
  }
}
\\\

**错误响应**:
\\\json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
\\\

---

## 🎭 事件驱动架构

### 事件总线

使用 \@dailyuse/utils\ 的 EventBus 实现事件发布/订阅。

\\\typescript
import { eventBus } from '@dailyuse/utils';

// 发布事件
eventBus.emit('goal.created', {
  goalUuid: 'uuid-123',
  accountUuid: 'uuid-456',
  title: 'Learn TypeScript'
});

// 订阅事件
eventBus.on('goal.created', async (event) => {
  // 创建统计记录
  await goalStatisticsService.incrementGoalCount(event.accountUuid);
});
\\\

### 核心事件

**Goal 模块**:
- \goal.created\
- \goal.updated\
- \goal.deleted\
- \goal.completed\

**Task 模块**:
- \task.created\
- \task.updated\
- \task.completed\
- \task.instance.generated\

**Schedule 模块**:
- \schedule.task.triggered\
- \schedule.task.completed\
- \schedule.task.failed\

---

## 🚀 应用启动流程

### 初始化序列

\\\
1. 加载环境变量 (.env)
2. 初始化日志系统 (Logger)
3. 连接数据库 (Prisma)
4. 运行应用初始化 (InitializationManager)
   - 加载配置
   - 注册事件处理器
   - 初始化调度器
5. 启动 Express 服务器
6. 监听端口 (默认: 3888)
\\\

### 代码示例

\\\typescript
// src/index.ts
(async () => {
  try {
    // 1. 初始化日志
    initializeLogger();
    const logger = createLogger('API');
    
    // 2. 连接数据库
    await connectPrisma();
    logger.info('Database connected');
    
    // 3. 运行应用初始化
    await initializeApp();
    logger.info('Application initialized');
    
    // 4. 启动服务器
    app.listen(PORT, () => {
      logger.info(\Server listening on http://localhost:\\);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
})();
\\\

---

## 🔧 配置管理

### 环境变量

\\\sh
# .env
NODE_ENV=development
PORT=3888
DATABASE_URL=postgresql://user:pass@localhost:5432/dailyuse
SHADOW_DATABASE_URL=postgresql://user:pass@localhost:5432/dailyuse_shadow
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d
\\\

### Prisma 配置

\\\prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
\\\

---

## 📊 性能监控

### Logger 系统

使用 \@dailyuse/utils\ 的 Logger 进行结构化日志记录。

\\\typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalService');

logger.info('Goal created', {
  goalUuid: 'uuid-123',
  accountUuid: 'uuid-456',
  duration: 45
});

logger.error('Failed to create goal', error);
\\\

### Metrics 端点

\\\
GET /api/metrics/performance
GET /api/metrics/health
\\\

---

## 🧪 测试策略

### 测试层次

1. **单元测试**: 领域逻辑测试
2. **集成测试**: API 端点测试
3. **E2E 测试**: 完整流程测试

### 测试工具

- **Vitest**: 测试框架
- **Supertest**: HTTP 测试

### 测试示例

\\\typescript
// __tests__/goal.test.ts
describe('Goal API', () => {
  it('should create a goal', async () => {
    const response = await request(app)
      .post('/api/goals')
      .set('Authorization', \Bearer \\)
      .send({
        title: 'Learn TypeScript',
        deadline: '2025-12-31'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Learn TypeScript');
  });
});
\\\

---

## 🚢 部署架构

### 生产环境

\\\
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Nginx  │ (反向代理)
    └────┬────┘
         │
┌────────▼─────────┐
│  API Instances   │ (多实例)
│  - Node.js       │
│  - Express       │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   PostgreSQL     │ (主从复制)
└──────────────────┘
\\\

### Docker 部署

\\\dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3888
CMD ["node", "dist/index.js"]
\\\

---

## 📚 相关文档

- [API 契约文档](./api-contracts.md)
- [数据模型文档](./data-models.md)
- [开发指南](./development-guide.md)
- [Prisma 事务架构](./systems/PRISMA_TRANSACTION_ARCHITECTURE.md)
- [事件 vs Saga 模式](./systems/EVENT_VS_SAGA_PATTERN_ANALYSIS.md)
- [DDD 规范](./DDD规范.md)

---

**文档维护**: BMAD v6 Analyst  
**最后更新**: 2025-10-28 14:28:07
