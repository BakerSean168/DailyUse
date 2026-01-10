---
tags:
  - architecture
  - index
  - design
description: 架构文档索引 - 系统设计的完整视图
created: 2025-11-23T15:00:00
updated: 2026-01-08T10:00:00
---

# 🏗️ Architecture Documentation

> 深入理解 DailyUse 的系统架构设计

## 📖 架构文档导航

### ✨ 最新文档（2026-01-08 更新）

**必读：新的五层架构、包实现细节、重构计划**

| 文档 | 描述 | 阅读时间 |
|------|------|--------|
| **[拼项目.md](./拼项目.md)** | DailyUse 五层积木塔完整讲解 | 60 min |
| **[Package Implementation Guide](./package-implementation-guide.md)** | 每个包的结构化实现细节和容器组装最佳实践 | 45 min |
| **[Desktop Architecture](./desktop-architecture.md)** | Desktop 应用的积木组装指南 | 40 min |
| **[EPIC-017: 重构 Utils + 创建 Patterns](./EPIC-017-refactoring-utils-patterns.md)** | 完整的工作分解、验收标准和时间表 | 30 min |

📌 **新手必读：** 按顺序阅读上面 4 份文档，就能完全理解 DailyUse 的架构。

### 核心架构文档

| 文档 | 描述 | C4 层级 |
|------|------|--------|
| [[system-overview|System Overview]] | 系统整体架构和技术栈 | Level 1: Context |
| [[api-architecture|API Architecture]] | 后端服务架构设计 | Level 2: Container |
| [[web-architecture|Web Architecture]] | 前端应用架构设计 | Level 2: Container |
| [[integration-architecture|Integration Architecture]] | 应用间集成方案 | Level 2: Container |

### 领域驱动设计 (DDD)

本项目采用 DDD 分层架构：

```
┌─────────────────────────────────────┐
│   Presentation Layer (Web/API)     │  ← 表示层
├─────────────────────────────────────┤
│   Application Layer                │  ← 应用层
├─────────────────────────────────────┤
│   Domain Layer (Business Logic)    │  ← 领域层
├─────────────────────────────────────┤
│   Infrastructure Layer (Data/IO)   │  ← 基础设施层
└─────────────────────────────────────┘
```

详细了解：
- [[../concepts/ddd-patterns|DDD 模式指南]]
- [[ddd-type-architecture|DDD 类型架构规范]] ⭐ 新增（2025-12）
- **[Package Implementation Guide](./package-implementation-guide.md)** ⭐ 新增（2026-01）
- **[拼项目.md](./拼项目.md)** ⭐ 新增（2026-01）

### 架构决策记录 (ADR)

我们使用 ADR 记录重要的架构决策：

- [[adr/001-use-nx-monorepo|ADR-001: 使用 Nx Monorepo]]
- [[adr/002-ddd-pattern|ADR-002: 采用 DDD 架构模式]]
- [[adr/003-event-driven-architecture|ADR-003: 事件驱动架构]]

> 📝 更多 ADR 请查看 [[adr/README|ADR 目录]]

## 🎯 架构核心原则

### 1. 模块化 (Modularity)
- 清晰的模块边界
- 松耦合、高内聚
- 独立部署能力

### 2. 可扩展性 (Scalability)
- 水平扩展设计
- 缓存策略
- 异步处理

### 3. 可维护性 (Maintainability)
- 代码清晰易懂
- 文档完善
- 测试覆盖充分

### 4. 安全性 (Security)
- 认证与授权
- 数据加密
- 输入验证

## 📊 技术栈概览

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI**: Vuetify Material Design
- **状态**: Pinia
- **构建**: Vite + Nx

### 后端技术栈
- **运行时**: Node.js 22+
- **框架**: Express + TypeScript
- **数据库**: SQLite (Prisma ORM)
- **构建**: tsup + Nx

### 共享技术
- **Monorepo**: Nx Workspace
- **包管理**: pnpm
- **类型系统**: TypeScript 5+
- **测试**: Vitest

详细技术栈：[[system-overview#技术栈|系统概览 - 技术栈]]

## 🔄 数据流设计

### 请求流程

```
User Action (Web)
    ↓
Vue Component
    ↓
Pinia Store (domain-client)
    ↓
API Client
    ↓
HTTP Request
    ↓
Express Controller (API)
    ↓
Application Service (domain-server)
    ↓
Domain Entity
    ↓
Repository (Infrastructure)
    ↓
Prisma ORM
    ↓
SQLite Database
```

详细了解：[[data-flow|数据流设计]]

## 🧩 模块架构

DailyUse 包含以下业务模块：

| 模块 | 职责 | 文档 |
|------|------|------|
| Goal | OKR 目标管理 | [[../modules/goal/README|Goal 模块]] |
| Task | GTD 任务管理 | [[../modules/task/README|Task 模块]] |
| Schedule | 日程调度 | [[../modules/schedule/README|Schedule 模块]] |
| Reminder | 智能提醒 | [[../modules/reminder/README|Reminder 模块]] |
| Notification | 通知中心 | [[../modules/notification/README|Notification 模块]] |
| Repository | 知识仓库 | [[../modules/repository/README|Repository 模块]] |
| Editor | Markdown 编辑器 | [[../modules/editor/README|Editor 模块]] |
| Authentication | 认证授权 | [[../modules/authentication/README|Auth 模块]] |

## 📦 包架构

共享代码组织为独立的包：

| 包 | 职责 | 文档 |
|------|------|------|
| @dailyuse/contracts | 类型契约 | [[../packages/packages-contracts|Contracts]] |
| @dailyuse/domain-client | 客户端领域层 | [[../packages/packages-domain-client|Domain Client]] |
| @dailyuse/domain-server | 服务端领域层 | [[../packages/packages-domain-server|Domain Server]] |
| @dailyuse/utils | 工具库 | [[../packages/packages-utils|Utils]] |
| @dailyuse/ui | UI 组件 | [[../packages/packages-ui|UI]] |

详细了解：[[../packages/packages-index|包文档索引]]

## 🔐 安全架构

### 认证流程
- JWT Token 认证
- Access Token + Refresh Token
- HttpOnly Cookie 存储

### 授权模型
- 基于账户的权限控制
- 资源所有权验证

详细了解：[[../modules/authentication/README|认证模块文档]]

## 🚀 部署架构

### 开发环境
- 本地开发服务器
- Docker Compose

### 生产环境
- Electron 桌面应用打包
- API 服务部署
- 数据库备份策略

详细了解：[[../guides/deployment/README|部署指南]]

## 📈 性能优化

### 前端优化
- 代码分割
- 懒加载
- 虚拟滚动

### 后端优化
- 数据库索引
- 查询优化
- 缓存策略

详细了解：[[../guides/development/performance|性能优化指南]]

## 🔍 相关文档

### 概念文档
- [[../concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM|统一日程事件系统]]
- [[../concepts/weight-system/WEIGHT_SYSTEM_COMPLETE_OVERHAUL|权重系统设计]]
- [[../concepts/ddd-patterns|DDD 模式]]
- [[../concepts/event-driven|事件驱动架构]]

### 开发指南
- [[../guides/development/coding-standards|代码规范]]
- [[../guides/development/testing|测试指南]]
- [[../guides/development/debugging|调试技巧]]

### 配置参考
- [[../configs/NX_CONFIGURATION_GUIDE|Nx 配置指南]]
- [[../configs/TSCONFIG_MONOREPO_BEST_PRACTICES|TypeScript 配置]]

## 🤝 贡献架构文档

添加新的架构文档？请遵循：

1. 使用 YAML front matter
2. 添加到本 README 索引
3. 链接到相关文档
4. 包含图表（如果需要）

详细了解：[[../contributing/documentation-guide|文档贡献指南]]

---

**架构原则**: 简单、清晰、可扩展  
**设计哲学**: 领域驱动、事件驱动、模块化
