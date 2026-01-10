---
stepsCompleted:
  - step-01-validate-prerequisites
inputDocuments:
  - docs/architecture/dashboard-architecture.md
  - docs/architecture/api-architecture.md
  - docs/architecture/web-architecture.md
  - docs/architecture/integration-architecture.md
  - docs/architecture/desktop-architecture.md
  - docs/architecture/ddd-type-architecture.md
  - docs/architecture/adr/003-event-driven-architecture.md
  - docs/architecture/adr/004-electron-desktop-architecture.md
---

# DailyUse - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for DailyUse, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- （暂无，未提供 PRD/功能需求文档）

### NonFunctional Requirements

- （暂无，未提供 PRD/NFR 文档）

### Additional Requirements

- Dashboard 采用 CQRS 读写分离，Read Side 允许跨聚合查询；Dashboard Query Service 可直接 SQL/Prisma 查询或组合各模块 Query Service，禁止依赖 domain-server 聚合。
- Dashboard 操作（如完成任务）仍通过各模块 Command API，Dashboard 自身不实现 Command 逻辑。
- API Backend 基于 Express + Prisma + PostgreSQL，遵循 DDD 分层（Interface/Application/Domain/Infrastructure），使用 JWT 认证、Swagger 文档、SSE 推送，模块化路由覆盖 goal/task/schedule/reminder/notification/repository 等。
- 事件驱动（ADR-003）：内存事件总线 + Redis Pub/Sub + SSE；事件命名 {module}.{entity}.{action}，处理器需幂等并记录日志/关联 ID，支持跨进程分发。
- Web 前端（Vue3 + Vuetify + Pinia）：DDD 分层（presentation/application/domain/infrastructure/initialization），Pattern A 数据流（Composable → ApplicationService → ApiClient），支持 i18n、SSE、状态持久化与 Axios 拦截器规范。
- Desktop 应用（Electron 39 + React 19）：Local-First，本地 SQLite（Prisma），主进程运行 L1-L4 业务/依赖注入与 IPC handlers，powerMonitor 集成；复用 @dailyuse/domain-server、application-server、infrastructure-server，并依赖新 @dailyuse/patterns（MinHeap/TaskQueue 等）。
- DDD 类型规范：三层 DTO 体系（ServerDTO/ClientDTO/Interface），实体类实现接口；Store 类型声明用 Interface，运行时存实体；序列化用 toServerDTO，反序列化重建实例；命名规则统一（{Name}ServerDTO/ClientDTO 等）。
- 集成架构：Web/API/Desktop 通过 REST + SSE + IPC 协同，端口约定 API 3888、Web dev 5173；共享包 contracts/domain-client/domain-server/utils/ui 供跨端复用。
- 包/层次重构（ADR-004）：分层提取与 Ports & Adapters，Prisma 统一支持 PostgreSQL/SQLite；Application Service 拆为 Use Cases；为 Desktop/Web 复用同一领域与基础设施实现。

### FR Coverage Map

- 将在后续步骤补充（尚未生成 FR 列表）。

## Epic List

- 将在后续步骤补充（下一步设计 epics）。

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}
