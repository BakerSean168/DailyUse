# DailyUse 项目概览

> **生成时间**: 2025-10-28 14:17:15
> **文档版本**: 1.0.0
> **项目版本**: 0.1.10

---

## 📋 项目概要

**DailyUse** 是一个基于 Electron + Vue 3 + TypeScript 的现代化个人效率管理平台，采用 Nx Monorepo 架构。该项目结合了桌面应用、Web 应用和后端 API 服务，为用户提供跨平台的生产力工具。

### 核心特性

- ✅ **跨平台**: Windows/macOS/Linux 支持
- ✅ **离线优先**: 本地 SQLite 数据库
- ✅ **模块化架构**: Nx Monorepo + DDD 领域驱动设计
- ✅ **全栈 TypeScript**: 类型安全的前后端代码
- ✅ **现代 UI**: Vuetify Material Design 3

---

## 🏗️ 仓库结构

**仓库类型**: Nx Monorepo  
**包管理器**: pnpm v10.18.3  
**构建工具**: Nx v21.4.1 + Vite v7.1.7

### 架构组成

\\\
DailyUse/
├── apps/                    # 应用程序 (3个独立应用)
│   ├── api/                # Node.js 后端 API 服务
│   ├── web/                # Vue 3 Web 应用
│   └── desktop/            # Electron 桌面应用
├── packages/               # 共享代码包 (5个核心包)
│   ├── contracts/          # TypeScript 类型定义和接口契约
│   ├── domain-client/      # 客户端业务逻辑层
│   ├── domain-server/      # 服务端业务逻辑层
│   ├── ui/                 # 共享 Vue 组件库
│   └── utils/              # 工具函数和实用程序
├── docs/                   # 项目文档 (422+ 文件)
├── tools/                  # 构建和开发工具
└── bmad/                   # BMAD Method v6 (开发方法论)
\\\

---

## 🎯 应用部分详情

### Part 1: API Backend

**路径**: \pps/api/\  
**类型**: Node.js 后端服务  
**包名**: \@dailyuse/api\

#### 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| **运行时** | Node.js | 22.20.0+ |
| **框架** | Express | 4.21.2 |
| **数据库** | Prisma + PostgreSQL/SQLite | 6.17.1 |
| **认证** | JWT (jsonwebtoken) | 9.0.2 |
| **API 文档** | Swagger (swagger-jsdoc) | 6.2.8 |
| **构建工具** | tsup | 8.5.0 |

#### 核心功能

- RESTful API 端点
- JWT 认证和授权
- Prisma ORM 数据访问
- Swagger API 文档
- 定时任务调度 (node-cron)
- 数据库迁移管理

#### 入口文件

- \src/index.ts\ - 应用主入口
- \prisma/schema.prisma\ - 数据库模式定义

---

### Part 2: Web Application

**路径**: \pps/web/\  
**类型**: Vue 3 单页应用  
**包名**: \@dailyuse/web\

#### 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| **框架** | Vue 3 (Composition API) | 3.4.21 |
| **UI 库** | Vuetify 3 | 3.7.5 |
| **状态管理** | Pinia + persistedstate | 3.0.3 |
| **路由** | Vue Router 4 | 4.x |
| **HTTP 客户端** | Axios | 1.9.0 |
| **富文本编辑器** | TipTap 3 | 3.6.6 |
| **图表** | ECharts + vue-echarts | 5.6.0 |
| **代码编辑器** | Monaco Editor | 0.52.2 |
| **构建工具** | Vite | 7.1.7 |

#### 核心功能

- 响应式 Material Design UI
- Pinia 状态持久化
- 国际化 (vue-i18n)
- Markdown 编辑和预览
- 数据可视化 (ECharts)
- E2E 测试 (Playwright)

#### 入口文件

- \src/main.ts\ - 应用主入口
- \src/router/index.ts\ - 路由配置
- \src/stores/\ - Pinia stores

---

### Part 3: Desktop Application

**路径**: \pps/desktop/\  
**类型**: Electron 桌面应用  
**包名**: \@dailyuse/desktop\

#### 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| **桌面框架** | Electron | 30.5.1 |
| **前端** | Vue 3 + Vuetify 3 | 3.4.21 / 3.7.5 |
| **本地数据库** | better-sqlite3 | 11.10.0 |
| **文件监控** | chokidar | 4.0.3 |
| **Git 集成** | simple-git | 3.27.0 |
| **任务调度** | node-schedule | 2.1.1 |
| **日志** | electron-log | 5.4.2 |
| **打包** | electron-builder | 26.0.12 |

#### 核心功能

- 原生桌面应用体验
- 本地 SQLite 数据存储
- 系统托盘集成
- 快捷键支持 (Alt+Space)
- 桌面通知
- 文件系统监控
- Git 版本控制集成

#### 入口文件

- \lectron/main.ts\ - Electron 主进程
- \src/main.ts\ - 渲染进程 (Vue app)

---

## 📦 共享包详情

### @dailyuse/contracts

**功能**: TypeScript 类型定义和接口契约  
**用途**: 跨应用类型共享，确保前后端类型一致性

**关键导出**:
- DTO (Data Transfer Objects)
- API 请求/响应类型
- 领域模型接口
- 枚举和常量

### @dailyuse/domain-client

**功能**: 客户端业务逻辑层  
**用途**: Web 和 Desktop 应用共享的业务逻辑

**关键模块**:
- 实体类 (Goal, Task, Reminder, etc.)
- Repository 接口实现
- 状态管理服务
- 本地数据缓存

### @dailyuse/domain-server

**功能**: 服务端业务逻辑层  
**用途**: API 服务的业务逻辑实现

**关键模块**:
- 聚合根 (Aggregate Roots)
- 领域服务 (Domain Services)
- 应用服务 (Application Services)
- 事件处理 (Event Handlers)

### @dailyuse/ui

**功能**: 共享 Vue 组件库  
**用途**: Web 和 Desktop 应用共享的 UI 组件

**关键组件**:
- 基础组件 (Button, Input, Dialog)
- 业务组件 (TaskCard, GoalCard)
- 布局组件 (Header, Sidebar)
- Composables (Vue 3 组合式函数)

### @dailyuse/utils

**功能**: 工具函数和实用程序  
**用途**: 跨应用共享的通用功能

**关键模块**:
- API 响应处理系统
- Logger 日志系统
- SSE (Server-Sent Events)
- 初始化管理器
- 验证工具
- 防抖/节流函数
- 事件总线

---

## 🎨 业务模块

### 核心模块

1. **Goal (目标管理)**
   - OKR 目标设定
   - Key Results 跟踪
   - 进度自动计算
   - 目标复盘

2. **Task (任务管理)**
   - 任务 CRUD
   - 任务模板和实例
   - 循环任务
   - 任务依赖
   - 优先级矩阵

3. **Reminder (提醒)**
   - 智能提醒
   - 提醒模板
   - 位置提醒
   - 历史追踪

4. **Notification (通知)**
   - 多渠道通知
   - 优先级分类
   - 通知摘要
   - 统计分析

5. **Schedule (调度)**
   - 日程管理
   - 冲突检测
   - 日历视图
   - 时间热力图

6. **Repository (仓库)**
   - 文档存储
   - 资源管理
   - Markdown 支持
   - Git 集成

7. **Setting (设置)**
   - 用户偏好
   - 主题管理
   - 国际化配置
   - 编辑器设置

8. **Account (账户)**
   - 用户管理
   - 认证授权
   - 数据管理

---

## 📊 技术架构

### 架构模式

- **DDD (领域驱动设计)**: 清晰的业务逻辑分层
- **CQRS**: 命令查询职责分离
- **Event-Driven**: 事件驱动架构
- **Repository Pattern**: 数据访问抽象

### 数据流

\\\
用户界面 (Vue Components)
    ↓
应用服务 (Application Services)
    ↓
领域服务 (Domain Services)
    ↓
仓储层 (Repositories)
    ↓
数据库 (Prisma + SQLite/PostgreSQL)
\\\

### 跨应用通信

- **API ↔ Web**: HTTP/REST API + SSE
- **API ↔ Desktop**: HTTP/REST API (本地或远程)
- **共享逻辑**: 通过 packages 层复用

---

## 🚀 快速开始

### 环境要求

- Node.js 22.20.0+
- pnpm 10.0.0+
- PostgreSQL 或 SQLite

### 安装

\\\ash
# 克隆仓库
git clone https://github.com/BakerSean168/DailyUse.git
cd DailyUse

# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate
\\\

### 开发模式

\\\ash
# 启动所有服务 (API + Web)
pnpm dev:all

# 或单独启动
pnpm dev:api      # API 服务 (http://localhost:3888)
pnpm dev:web      # Web 应用 (http://localhost:5173)
pnpm dev:desktop  # 桌面应用
\\\

### 构建

\\\ash
# 构建所有应用
pnpm build

# 或单独构建
pnpm build:api
pnpm build:web
pnpm build:desktop
\\\

---

## 📚 文档资源

### 已有文档 (422+ 文件)

#### 系统级文档
- [DDD 规范](./DDD规范.md)
- [事件 vs Saga 模式分析](./systems/EVENT_VS_SAGA_PATTERN_ANALYSIS.md)
- [Prisma 事务架构](./systems/PRISMA_TRANSACTION_ARCHITECTURE.md)
- [SSE 技术文档](./systems/SSE_TECHNICAL_DOCUMENTATION.md)
- [初始化错误处理最佳实践](./systems/INITIALIZATION_ERROR_HANDLING_BEST_PRACTICES.md)

#### 配置文档
- [Nx 配置完整指南](./configs/NX_CONFIGURATION_GUIDE.md)
- [Nx 使用指南](./configs/NX_USAGE_GUIDE.md)
- [TSConfig 优化总结](./configs/TSCONFIG_OPTIMIZATION_SUMMARY.md)
- [项目 JSON 指南](./configs/PROJECT_JSON_GUIDE.md)

#### 模块文档
- [Goal 模块规划](./modules/goal/GOAL_MODULE_PLAN.md)
- [Task 模块规划](./modules/task/TASK_MODULE_PLAN.md)
- [Schedule 模块设计](./modules/schedule/01-SCHEDULE_MODULE_DESIGN.md)
- [Setting 模块规划](./modules/setting/SETTING_MODULE_PLAN.md)

#### 包文档
- [Logger 快速参考](./packages/utils/LOGGER_QUICK_REFERENCE.md)
- [API 响应系统指南](./packages/utils/API_RESPONSE_SYSTEM_GUIDE.md)
- [SSE 实现指南](./packages/utils/SSE_IMPLEMENTATION_GUIDE.md)

### 生成文档 (本次)

- ✅ [项目概览](./project-overview.md) *(当前文档)*
- 🔄 [架构文档 - API](./architecture-api.md) *(待生成)*
- 🔄 [架构文档 - Web](./architecture-web.md) *(待生成)*
- 🔄 [架构文档 - Desktop](./architecture-desktop.md) *(待生成)*
- �� [源码树分析](./source-tree-analysis.md) *(待生成)*
- 🔄 [集成架构](./integration-architecture.md) *(待生成)*
- 🔄 [开发指南](./development-guide.md) *(待生成)*
- 🔄 [API 契约文档](./api-contracts.md) *(待生成)*
- 🔄 [数据模型](./data-models.md) *(待生成)*

---

## 🔗 相关链接

- **主仓库**: [GitHub - BakerSean168/DailyUse](https://github.com/BakerSean168/DailyUse)
- **Nx 文档**: [https://nx.dev](https://nx.dev)
- **Vue 3 文档**: [https://vuejs.org](https://vuejs.org)
- **Electron 文档**: [https://electronjs.org](https://electronjs.org)
- **Prisma 文档**: [https://prisma.io](https://prisma.io)

---

## 📝 下一步

1. 阅读 [架构文档](./architecture-api.md) 了解技术细节
2. 查看 [开发指南](./development-guide.md) 开始开发
3. 参考 [API 契约文档](./api-contracts.md) 了解 API 端点
4. 浏览 [模块文档](./modules/) 了解业务逻辑

---

**文档维护**: 本文档由 BMAD v6 Analyst 自动生成  
**最后更新**: 2025-10-28 14:17:15
