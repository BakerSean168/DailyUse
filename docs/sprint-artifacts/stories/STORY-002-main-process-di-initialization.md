# STORY-002: 主进程 DI 初始化重构

## 📋 Story 概述

**Story ID**: STORY-002  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P0 (阻塞其他 Story)  
**预估工时**: 3-5 天  
**状态**: 🔵 Ready for Dev  

---

## 🎯 用户故事

**作为** 桌面应用开发者  
**我希望** 主进程使用统一的依赖注入容器管理所有服务  
**以便于** 保持与共享包的架构一致性，便于测试和维护  

---

## 📋 验收标准

### 功能验收

- [ ] 主进程通过 `@dailyuse/infrastructure-server` 的 Container 获取所有服务
- [ ] 所有 11 个模块的 Container 正确初始化
- [ ] SQLite Repository 适配器实现 `@dailyuse/domain-server` 定义的接口
- [ ] 应用启动时自动完成 DI 配置
- [ ] 无硬编码依赖，可通过 Container 替换任意实现

### 技术验收

- [ ] `desktop-main.composition-root.ts` 创建完成
- [ ] `appInitializer.ts` 重构完成
- [ ] 现有 SQLite Repository 迁移完成
- [ ] TypeScript 编译无错误
- [ ] 应用正常启动

---

## 📐 技术设计

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Composition Root (DI Configuration)        │    │
│  │  desktop-main.composition-root.ts                    │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            @dailyuse/infrastructure-server           │    │
│  │                                                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │    │
│  │  │  Goal   │ │  Task   │ │Schedule │ │Reminder │    │    │
│  │  │Container│ │Container│ │Container│ │Container│    │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │    │
│  │       │           │           │           │          │    │
│  │  ┌────┴───────────┴───────────┴───────────┴────┐    │    │
│  │  │           + 7 more Containers               │    │    │
│  │  │  (Account, Auth, AI, Notification,          │    │    │
│  │  │   Dashboard, Repository, Setting)           │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SQLite Repository Adapters              │    │
│  │                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │    │
│  │  │ SqliteGoal   │  │ SqliteTask   │  │ Sqlite...  │ │    │
│  │  │ Repository   │  │ Repository   │  │ Repository │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │    │
│  │         │                 │                │        │    │
│  │  ┌──────┴─────────────────┴────────────────┴──────┐ │    │
│  │  │              better-sqlite3 (SQLite)           │ │    │
│  │  └────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 文件结构

```
apps/desktop/src/main/
├── di/
│   ├── index.ts
│   ├── desktop-main.composition-root.ts    # 主 Composition Root
│   └── sqlite-adapters/                     # SQLite 仓库适配器
│       ├── index.ts
│       ├── goal.sqlite-repository.ts
│       ├── task.sqlite-repository.ts
│       ├── schedule.sqlite-repository.ts
│       ├── reminder.sqlite-repository.ts
│       ├── account.sqlite-repository.ts
│       ├── auth.sqlite-repository.ts
│       ├── notification.sqlite-repository.ts
│       ├── dashboard.sqlite-repository.ts
│       ├── repository.sqlite-repository.ts
│       ├── setting.sqlite-repository.ts
│       └── ai.sqlite-repository.ts
├── shared/
│   ├── initialization/
│   │   └── appInitializer.ts              # 重构：使用 DI
│   └── database/
│       └── index.ts                        # SQLite 连接管理
```

---

## 📝 Task 分解

### Task 2.1: 创建主进程 Composition Root

**工时**: 1 天

**输入**:
- `@dailyuse/infrastructure-server` 的 Container 类
- 现有 `repositoryFactory.ts` 的逻辑

**输出**:
- `apps/desktop/src/main/di/desktop-main.composition-root.ts`

**实现要点**:
```typescript
// desktop-main.composition-root.ts
import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AccountContainer,
  AuthContainer,
  NotificationContainer,
  AIContainer,
  DashboardContainer,
  RepositoryContainer,
  SettingContainer,
} from '@dailyuse/infrastructure-server';

import {
  SqliteGoalRepository,
  SqliteTaskRepository,
  // ... 其他 SQLite 适配器
} from './sqlite-adapters';

export function configureMainProcessDependencies(): void {
  // Goal Module
  GoalContainer.getInstance()
    .registerGoalRepository(new SqliteGoalRepository())
    .registerGoalFolderRepository(new SqliteGoalFolderRepository());

  // Task Module
  TaskContainer.getInstance()
    .registerTaskTemplateRepository(new SqliteTaskTemplateRepository())
    .registerTaskInstanceRepository(new SqliteTaskInstanceRepository())
    // ...

  // ... 其他模块
}
```

**验收**:
- [ ] 函数可被调用且无错误
- [ ] 所有 11 个 Container 正确注册

---

### Task 2.2: 重构 appInitializer.ts

**工时**: 1 天

**输入**:
- 现有 `apps/desktop/src/main/shared/initialization/appInitializer.ts`
- 新创建的 Composition Root

**输出**:
- 重构后的 `appInitializer.ts`

**实现要点**:
```typescript
// appInitializer.ts (重构后)
import { configureMainProcessDependencies } from '../../di';

export async function initializeApp(): Promise<void> {
  // 1. 初始化数据库连接
  await initializeDatabase();
  
  // 2. 配置依赖注入 (新增)
  configureMainProcessDependencies();
  
  // 3. 注册 IPC 处理器
  registerAllIpcHandlers();
  
  // 4. 其他初始化...
}
```

**验收**:
- [ ] 应用启动流程正常
- [ ] DI 配置在其他初始化之前完成

---

### Task 2.3: 创建 SQLite Repository 适配器

**工时**: 2-3 天

**输入**:
- `@dailyuse/domain-server` 定义的 Repository 接口
- 现有 SQLite 操作逻辑

**输出**:
- 11 个 SQLite Repository 适配器

**模块优先级**:
1. Account, Auth (登录依赖)
2. Goal, Task (核心功能)
3. Schedule, Reminder (核心功能)
4. 其他模块

**实现示例**:
```typescript
// goal.sqlite-repository.ts
import type { IGoalRepository, Goal } from '@dailyuse/domain-server';
import { getDatabase } from '../database';

export class SqliteGoalRepository implements IGoalRepository {
  async findAll(): Promise<Goal[]> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM goals').all();
    return rows.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Goal | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    return row ? this.mapToEntity(row) : null;
  }

  async create(goal: Goal): Promise<Goal> {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO goals (id, title, description, ...)
      VALUES (?, ?, ?, ...)
    `).run(goal.id, goal.title, goal.description, ...);
    return goal;
  }

  // ... 其他方法

  private mapToEntity(row: any): Goal {
    return new Goal({
      id: row.id,
      title: row.title,
      // ...
    });
  }
}
```

**验收**:
- [ ] 每个适配器实现对应的 Repository 接口
- [ ] CRUD 操作正常工作
- [ ] 类型安全，无 TypeScript 错误

---

## 🔗 依赖关系

### 前置依赖

- ✅ STORY-001 (包提取) - 已完成
- ✅ `@dailyuse/infrastructure-server` 可用
- ✅ `@dailyuse/domain-server` 可用

### 后续影响

- 🔜 STORY-003 (渲染进程 DI) - 可并行
- 🔜 STORY-004 (Preload API) - 依赖本 Story
- 🔜 所有 UI Story - 依赖本 Story

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| Repository 接口不匹配 | 中 | 高 | 先审计接口定义，必要时调整 |
| 现有 SQLite 逻辑复杂 | 低 | 中 | 渐进式迁移，保留兼容层 |
| 循环依赖问题 | 低 | 高 | 使用延迟注入模式 |

---

## 📚 参考资料

- 现有文件: `apps/desktop/src/main/shared/services/repositoryFactory.ts`
- 现有文件: `apps/desktop/src/main/shared/database/index.ts`
- 包导出: `packages/infrastructure-server/src/index.ts`
- 接口定义: `packages/domain-server/src/*/ports/*.ts`

---

## ✅ 完成定义 (DoD)

- [ ] 代码实现完成
- [ ] TypeScript 编译通过
- [ ] 应用正常启动
- [ ] 基本功能验证通过
- [ ] 代码已提交到分支
- [ ] PR 创建并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Sprint 开始时  
