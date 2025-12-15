# EPIC-013: Desktop 全模块架构完善

## 概述

**目标**: 全面完善 Desktop 应用的所有模块，建立统一的架构模式，确保每个模块都有完整的 Main Process + Renderer Process 实现。

**背景**: 
- Main Process 的 SQLite 适配器和 DI 配置已基本完成
- Renderer Process 缺少统一的基础设施层，IPC 调用分散
- 各模块实现程度不一：部分模块较完善，部分模块仅有框架
- Repository、Editor、AI 等模块需要完整实现
- Goal 模块需要整合专注模式(Focus/Pomodoro)功能
- 需要统一的 IPC Client 模式替代 @dailyuse/application-client (HTTP 模式)

**预计工期**: 无时间限制，以完整高质量为目标

---

## 模块现状分析

| 模块 | Main IPC | Main AppService | Renderer IPC Client | Renderer Store | UI 组件 | 状态 |
|------|----------|-----------------|---------------------|----------------|---------|------|
| **Core 核心** |
| Task | ✅ 完整 | ✅ 完整 | ❌ 缺失 | ✅ 完整 | ✅ 完整 | 需 IPC Client |
| Goal | ✅ 完整 | ✅ 完整 | ❌ 缺失 | ✅ 完整 | ✅ 完整 | 需 IPC Client + 专注功能 |
| Schedule | ⚠️ 部分 | ✅ 完整 | ❌ TODO stubs | ⚠️ 部分 | ⚠️ 部分 | 需补全 |
| Reminder | ✅ 完整 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ✅ 完整 | 需 IPC Client |
| **Content 内容** |
| Repository | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | ⚠️ 部分 | 需完整实现 |
| Editor | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | ❌ 缺失 | 需完整实现 |
| **System 系统** |
| Account | ✅ 完整 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ⚠️ 部分 | 需补全 |
| Auth | ⚠️ 部分 | ⚠️ 部分 | ❌ 缺失 | ✅ 完整 | ✅ 完整 | 需补全 |
| Setting | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ⚠️ 部分 | 需补全 |
| Dashboard | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ⚠️ 部分 | 需补全 |
| **Feature 功能** |
| AI | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ⚠️ 部分 | 需完整实现 |
| Notification | ⚠️ 部分 | ✅ 完整 | ❌ 缺失 | ⚠️ 部分 | ⚠️ 部分 | 需补全 |
| **Platform 平台** |
| Window | ✅ 完整 | ✅ 完整 | - | - | - | 完成 |
| Tray | ✅ 完整 | ✅ 完整 | - | - | - | 完成 |
| Shortcuts | ✅ 完整 | ✅ 完整 | ⚠️ 部分 | - | - | 需 UI 配置 |
| Autolaunch | ✅ 完整 | ✅ 完整 | - | - | - | 完成 |

---

## 架构目标

```
┌────────────────────────────────────────────────────────────────────┐
│                      Renderer Process (目标架构)                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ Components  │  │   Stores    │  │  Application Services   │   │
│  │  (React)    │  │  (Zustand)  │  │  (Desktop Specific)     │   │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘   │
│         │                │                     │                  │
│         └────────────────┴─────────────────────┘                  │
│                          │                                        │
│                          ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Infrastructure Layer                           │  │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │   IPC Clients    │  │     DI Containers            │   │  │
│  │  │  (统一 IPC 封装)  │  │  (模块级 Composition Root)  │   │  │
│  │  └──────────────────┘  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │   Initialization Manager (统一初始化流程)             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│           ┌─────────────────────────────┐                        │
│           │  window.electronAPI.invoke  │                        │
│           └─────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘
                          │ IPC
                          ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Main Process (已完成大部分)                   │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │   IPC Handlers   │  │  App Services    │  │  Domain Layer  │  │
│  │  (各模块 Handler)│  │ (Desktop 封装)   │  │ @dailyuse/...  │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │   DI Container (Composition Root)                            │ │
│  │   - SQLite Adapters (29 files)                               │ │
│  │   - Domain Services                                           │ │
│  │   - Application Services                                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Stories 概览

### Phase 1: 基础设施层建设 (Stories 1-5)
建立统一的 IPC Client 基础架构和初始化机制

### Phase 2: 核心模块完善 (Stories 6-17)
完善 Task、Goal（含专注模式）、Schedule、Reminder 四个核心模块

### Phase 3: 内容模块实现 (Stories 16-25)
完整实现 Repository、Editor 模块

### Phase 4: 系统模块完善 (Stories 26-35)
完善 Account、Auth、Setting、Dashboard 模块

### Phase 5: 功能模块实现 (Stories 36-44)
完善 AI、Notification 模块

### Phase 6: 平台集成完善 (Stories 45-49)
完善 Shortcuts UI 配置、系统集成

### Phase 7: 测试与文档 (Stories 50-54)
单元测试、集成测试、架构文档

---

## Phase 1: 基础设施层建设

### Story 13.1: 创建统一的 IPC Client 基础架构
**优先级**: P0 | **复杂度**: Medium

**目标**: 建立类似 Web `apiClient` 的统一 IPC 调用层

**任务**:
- [ ] 创建 `renderer/shared/infrastructure/ipc/` 目录结构
- [ ] 实现 `BaseIPCClient` 基类，封装 `window.electronAPI.invoke`
- [ ] 实现 `IPCError` 错误类型体系
- [ ] 添加统一的错误处理和类型安全
- [ ] 添加请求/响应日志（开发模式）
- [ ] 添加超时处理机制
- [ ] 添加重试机制（可配置）
- [ ] 实现批量请求支持

**验收标准**:
```typescript
// 使用示例
const result = await ipcClient.invoke<TaskTemplateClientDTO>('task:get-template', { uuid });

// 批量调用
const results = await ipcClient.batch([
  { channel: 'task:list', payload: { accountUuid } },
  { channel: 'goal:list', payload: { accountUuid } },
]);
```

**文件**:
- `renderer/shared/infrastructure/ipc/base-ipc-client.ts`
- `renderer/shared/infrastructure/ipc/ipc-error.ts`
- `renderer/shared/infrastructure/ipc/ipc-types.ts`
- `renderer/shared/infrastructure/ipc/ipc-logger.ts`
- `renderer/shared/infrastructure/ipc/index.ts`

---

### Story 13.2: 建立 Renderer 端 DI 容器模式
**优先级**: P0 | **复杂度**: Medium

**目标**: 在 Renderer 端建立统一的依赖注入模式

**任务**:
- [ ] 创建 `renderer/shared/infrastructure/di/` 目录
- [ ] 实现 `RendererContainer` 基类
- [ ] 实现各模块的 Container 接口定义
- [ ] 实现 Container Registry (中央注册表)
- [ ] 提供 hooks 方便组件使用 (`useContainer`, `useService`)

**文件**:
- `renderer/shared/infrastructure/di/renderer-container.ts`
- `renderer/shared/infrastructure/di/container-registry.ts`
- `renderer/shared/infrastructure/di/container-hooks.ts`
- `renderer/shared/infrastructure/di/types.ts`
- `renderer/shared/infrastructure/di/index.ts`

---

### Story 13.3: 统一模块初始化机制
**优先级**: P0 | **复杂度**: Medium

**目标**: 建立统一的模块初始化流程

**任务**:
- [ ] 创建 `ModuleInitializer` 接口
- [ ] 实现 `InitializationManager` 管理器
- [ ] 建立初始化顺序和依赖管理
- [ ] 添加初始化状态追踪
- [ ] 添加初始化错误处理和恢复机制
- [ ] 实现延迟初始化支持

**文件**:
- `renderer/shared/infrastructure/initialization/module-initializer.ts`
- `renderer/shared/infrastructure/initialization/initialization-manager.ts`
- `renderer/shared/infrastructure/initialization/initialization-state.ts`
- `renderer/shared/infrastructure/initialization/index.ts`

---

### Story 13.4: IPC 通道类型定义
**优先级**: P0 | **复杂度**: Low

**目标**: 建立完整的 IPC 通道类型定义

**任务**:
- [ ] 创建所有模块的 IPC 通道名称常量
- [ ] 定义所有 IPC 请求/响应类型
- [ ] 更新 `electron.d.ts` 类型定义
- [ ] 确保 Main/Renderer 类型一致

**文件**:
- `shared/types/ipc-channels.ts`
- `shared/types/ipc-payloads.ts`
- `electron.d.ts` (更新)

---

### Story 13.5: IPC Client 测试基础设施
**优先级**: P1 | **复杂度**: Low

**目标**: 建立 IPC Client 的测试基础设施

**任务**:
- [ ] 创建 IPC mock 工具
- [ ] 创建 IPC Client 测试 helper
- [ ] 建立测试数据工厂

**文件**:
- `renderer/shared/infrastructure/ipc/__tests__/ipc-mock.ts`
- `renderer/shared/infrastructure/ipc/__tests__/test-helpers.ts`

---

## Phase 2: 核心模块完善

### Story 13.6: Task 模块 IPC Client
**优先级**: P0 | **复杂度**: High

**目标**: 创建完整的 Task IPC Client，作为其他模块的参考实现

**任务**:
- [ ] 创建 `TaskTemplateIPCClient` 类
- [ ] 创建 `TaskInstanceIPCClient` 类
- [ ] 创建 `TaskStatisticsIPCClient` 类
- [ ] 实现所有 Task Template 方法 (CRUD + 状态操作)
- [ ] 实现所有 Task Instance 方法
- [ ] 实现 Task Statistics/Dashboard 方法
- [ ] 添加完整的 TypeScript 类型

**验收标准**:
- 与 Web `TaskTemplateApiClient` 接口保持一致
- 所有方法有完整的类型定义
- 错误处理统一

**文件**:
- `renderer/modules/task/infrastructure/ipc/task-template.ipc-client.ts`
- `renderer/modules/task/infrastructure/ipc/task-instance.ipc-client.ts`
- `renderer/modules/task/infrastructure/ipc/task-statistics.ipc-client.ts`
- `renderer/modules/task/infrastructure/ipc/index.ts`

---

### Story 13.7: Task 模块 DI Container
**优先级**: P0 | **复杂度**: Low

**目标**: 为 Task 模块创建 DI Container

**任务**:
- [ ] 创建 `TaskContainer` 类
- [ ] 注册所有 Task IPC Clients
- [ ] 注册 Task Application Services
- [ ] 提供 `useTaskContainer` hook

**文件**:
- `renderer/modules/task/infrastructure/di/task.container.ts`
- `renderer/modules/task/infrastructure/di/index.ts`

---

### Story 13.8: Task Store 重构
**优先级**: P0 | **复杂度**: Medium

**目标**: 重构 Task Store 使用 IPC Client

**任务**:
- [ ] 重构 `taskTemplateStore` 使用 `TaskTemplateIPCClient`
- [ ] 重构 `taskInstanceStore` 使用 `TaskInstanceIPCClient`
- [ ] 移除对 `@dailyuse/application-client` 的依赖
- [ ] 确保向后兼容性
- [ ] 优化状态更新逻辑

**文件**:
- `renderer/modules/task/presentation/stores/taskTemplateStore.ts` (重构)
- `renderer/modules/task/presentation/stores/taskInstanceStore.ts` (重构)

---

### Story 13.9: Goal 模块 IPC Client
**优先级**: P0 | **复杂度**: Medium

**目标**: 创建 Goal 模块的 IPC Client

**任务**:
- [ ] 创建 `GoalIPCClient` 类
- [ ] 创建 `GoalStatisticsIPCClient` 类
- [ ] 创建 `KeyResultIPCClient` 类
- [ ] 实现 Goal CRUD 方法
- [ ] 实现 Goal Folder 方法
- [ ] 实现 Goal Statistics 方法
- [ ] 实现 KeyResult 相关方法

**文件**:
- `renderer/modules/goal/infrastructure/ipc/goal.ipc-client.ts`
- `renderer/modules/goal/infrastructure/ipc/goal-statistics.ipc-client.ts`
- `renderer/modules/goal/infrastructure/ipc/key-result.ipc-client.ts`
- `renderer/modules/goal/infrastructure/ipc/index.ts`

---

### Story 13.10: Goal 模块 DI Container 和 Store 重构
**优先级**: P0 | **复杂度**: Medium

**目标**: 为 Goal 模块创建 DI Container 并重构 Store

**任务**:
- [ ] 创建 `GoalContainer` 类
- [ ] 重构 `goalStore` 使用 `GoalIPCClient`
- [ ] 重构 `keyResultStore` 使用 `KeyResultIPCClient`
- [ ] 移除对 `@dailyuse/application-client` 的依赖

**文件**:
- `renderer/modules/goal/infrastructure/di/goal.container.ts`
- `renderer/modules/goal/presentation/stores/goalStore.ts` (重构)
- `renderer/modules/goal/presentation/stores/keyResultStore.ts` (重构)

---

### Story 13.11: Goal 模块专注功能 - Main Process 实现
**优先级**: P1 | **复杂度**: High

**目标**: 在 Goal 模块的 Main Process 中实现专注/番茄钟功能

**任务**:
- [ ] 在 `GoalDesktopApplicationService` 中添加专注会话方法
- [ ] 实现番茄钟计时逻辑 (start, pause, resume, stop)
- [ ] 实现专注统计数据持久化
- [ ] 实现专注历史记录
- [ ] 添加专注相关 IPC handlers
- [ ] 集成系统托盘专注状态显示

**文件**:
- `main/modules/goal/application/GoalDesktopApplicationService.ts` (扩展)
- `main/modules/goal/ipc/goal-focus.ipc-handler.ts` (新建)
- `main/modules/goal/domain/focus-session.ts` (新建)

---

### Story 13.12: Goal 模块专注功能 - IPC Client
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Goal 专注功能的 IPC Client

**任务**:
- [ ] 创建 `GoalFocusIPCClient` 类
- [ ] 实现会话管理方法 (startFocus, pauseFocus, resumeFocus, stopFocus)
- [ ] 实现番茄钟配置方法
- [ ] 实现专注统计方法
- [ ] 实现专注历史方法

**文件**:
- `renderer/modules/goal/infrastructure/ipc/goal-focus.ipc-client.ts`
- `renderer/modules/goal/infrastructure/ipc/index.ts` (更新)

---

### Story 13.13: Goal 模块专注功能 - Store 和 UI 组件
**优先级**: P1 | **复杂度**: High

**目标**: 实现 Goal 专注功能的 Store 和 UI 组件

**任务**:
- [ ] 创建 `focusStore` (或扩展 goalStore)
- [ ] 迁移 `renderer/modules/focus/presentation/components/` 到 Goal 模块
- [ ] 完善 `FocusModePanel` 组件
- [ ] 完善 `PomodoroTimer` 组件
- [ ] 完善 `FocusStatistics` 组件
- [ ] 实现 `FocusSessionControl` 会话控制
- [ ] 实现 `FocusTaskSelector` 目标选择器
- [ ] 添加专注历史视图

**文件**:
- `renderer/modules/goal/presentation/stores/focusStore.ts` (新建)
- `renderer/modules/goal/presentation/components/focus/FocusModePanel.tsx`
- `renderer/modules/goal/presentation/components/focus/PomodoroTimer.tsx`
- `renderer/modules/goal/presentation/components/focus/FocusStatistics.tsx`
- `renderer/modules/goal/presentation/components/focus/FocusSessionControl.tsx`
- `renderer/modules/goal/presentation/components/focus/FocusTaskSelector.tsx`
- `renderer/modules/goal/presentation/views/FocusView.tsx`

---

### Story 13.14: Schedule Main Process IPC Handler 补全
**优先级**: P0 | **复杂度**: Medium

**目标**: 补全 Schedule 模块的 Main Process IPC Handlers

**任务**:
- [ ] 审查现有 Schedule IPC handlers
- [ ] 补全缺失的 handlers (日程查询、批量操作)
- [ ] 添加日程冲突检测 handler
- [ ] 添加日程统计 handler
- [ ] 更新 electron.d.ts 类型

**文件**:
- `main/modules/schedule/ipc/schedule-ipc-handler.ts` (补全)
- `main/modules/schedule/ipc/schedule.ipc-handlers.ts` (补全)

---

### Story 13.15: Schedule 模块 IPC Client
**优先级**: P0 | **复杂度**: Medium

**目标**: 创建 Schedule 模块的 IPC Client，替换 TODO stubs

**任务**:
- [ ] 创建 `ScheduleIPCClient` 类
- [ ] 创建 `ScheduleStatisticsIPCClient` 类
- [ ] 实现日程 CRUD 方法
- [ ] 实现日程查询方法 (按日期范围、按状态)
- [ ] 实现冲突检测方法
- [ ] 实现统计方法

**文件**:
- `renderer/modules/schedule/infrastructure/ipc/schedule.ipc-client.ts`
- `renderer/modules/schedule/infrastructure/ipc/schedule-statistics.ipc-client.ts`
- `renderer/modules/schedule/infrastructure/ipc/index.ts`

---

### Story 13.16: Schedule 模块 Store 重构和组件完善
**优先级**: P0 | **复杂度**: Medium

**目标**: 重构 Schedule Store 并完善 UI 组件

**任务**:
- [ ] 创建 `ScheduleContainer` 类
- [ ] 重构 `scheduleStore` 使用 `ScheduleIPCClient`
- [ ] 移除 TODO stubs
- [ ] 完善 Schedule 日历视图组件
- [ ] 完善 Schedule 列表视图组件
- [ ] 添加日程冲突提示组件

**文件**:
- `renderer/modules/schedule/infrastructure/di/schedule.container.ts`
- `renderer/modules/schedule/presentation/stores/scheduleStore.ts` (重构)
- `renderer/modules/schedule/presentation/components/` (完善)

---

### Story 13.17: Reminder 模块 IPC Client
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Reminder 模块的 IPC Client

**任务**:
- [ ] 创建 `ReminderTemplateIPCClient` 类
- [ ] 创建 `ReminderGroupIPCClient` 类
- [ ] 创建 `ReminderStatisticsIPCClient` 类
- [ ] 实现 Template CRUD 方法
- [ ] 实现 Group 相关方法
- [ ] 实现 Upcoming/Statistics 方法

**文件**:
- `renderer/modules/reminder/infrastructure/ipc/reminder-template.ipc-client.ts`
- `renderer/modules/reminder/infrastructure/ipc/reminder-group.ipc-client.ts`
- `renderer/modules/reminder/infrastructure/ipc/reminder-statistics.ipc-client.ts`
- `renderer/modules/reminder/infrastructure/ipc/index.ts`

---

### Story 13.18: Reminder 模块 Store 重构
**优先级**: P1 | **复杂度**: Medium

**目标**: 重构 Reminder Store

**任务**:
- [ ] 创建 `ReminderContainer` 类
- [ ] 重构 `reminderStore` 使用 IPC Client
- [ ] 完善提醒通知集成
- [ ] 完善提醒时间计算逻辑

**文件**:
- `renderer/modules/reminder/infrastructure/di/reminder.container.ts`
- `renderer/modules/reminder/presentation/stores/reminderStore.ts` (重构)

---

## Phase 3: 内容模块实现

### Story 13.19: Repository Main Process IPC Handler 完善
**优先级**: P1 | **复杂度**: Medium

**目标**: 完善 Repository 模块的 Main Process 实现

**任务**:
- [ ] 审查 `RepositoryDesktopApplicationService` 实现
- [ ] 完善 IPC handlers
- [ ] 实现同步状态查询 (离线模式)
- [ ] 实现备份创建/恢复 handlers
- [ ] 实现导入/导出 handlers
- [ ] 添加备份列表管理

**文件**:
- `main/modules/repository/ipc/repository-ipc-handler.ts` (完善)
- `main/modules/repository/application/RepositoryDesktopApplicationService.ts` (验证)

---

### Story 13.20: Repository 模块 IPC Client
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Repository 模块完整的 IPC Client

**任务**:
- [ ] 创建 `RepositoryIPCClient` 类
- [ ] 实现同步操作方法 (离线提示)
- [ ] 实现备份方法 (create, restore, list, delete)
- [ ] 实现导入/导出方法 (JSON, CSV)
- [ ] 实现验证方法

**文件**:
- `renderer/modules/repository/infrastructure/ipc/repository.ipc-client.ts`
- `renderer/modules/repository/infrastructure/ipc/index.ts`

---

### Story 13.21: Repository 模块 Store 实现
**优先级**: P1 | **复杂度**: Medium

**目标**: 实现 Repository 模块的 Zustand Store

**任务**:
- [ ] 创建 `repositoryStore` 
- [ ] 实现同步状态管理
- [ ] 实现备份列表状态
- [ ] 实现导入/导出进度状态
- [ ] 添加错误状态管理

**文件**:
- `renderer/modules/repository/presentation/stores/repositoryStore.ts` (新建)
- `renderer/modules/repository/presentation/stores/index.ts`

---

### Story 13.22: Repository 模块 UI 组件完善
**优先级**: P1 | **复杂度**: High

**目标**: 完善 Repository 模块的 UI 组件

**任务**:
- [ ] 实现 `SyncStatusPanel` 组件 (显示离线状态)
- [ ] 实现 `BackupManager` 组件
- [ ] 实现 `BackupList` 组件
- [ ] 实现 `CreateBackupDialog` 组件
- [ ] 实现 `RestoreBackupDialog` 组件
- [ ] 实现 `ImportExportPanel` 组件
- [ ] 实现 `ImportDialog` 组件
- [ ] 实现 `ExportDialog` 组件
- [ ] 实现 `ValidationResultDialog` 组件

**文件**:
- `renderer/modules/repository/presentation/components/SyncStatusPanel.tsx`
- `renderer/modules/repository/presentation/components/BackupManager.tsx`
- `renderer/modules/repository/presentation/components/BackupList.tsx`
- `renderer/modules/repository/presentation/components/CreateBackupDialog.tsx`
- `renderer/modules/repository/presentation/components/RestoreBackupDialog.tsx`
- `renderer/modules/repository/presentation/components/ImportExportPanel.tsx`
- `renderer/modules/repository/presentation/components/ImportDialog.tsx`
- `renderer/modules/repository/presentation/components/ExportDialog.tsx`
- `renderer/modules/repository/presentation/components/ValidationResultDialog.tsx`

---

### Story 13.23: Repository 模块 Views 和路由
**优先级**: P1 | **复杂度**: Medium

**目标**: 完善 Repository 模块的页面视图

**任务**:
- [ ] 实现 `RepositoryView` 主页面
- [ ] 实现 `BackupView` 备份管理页面
- [ ] 实现 `ImportExportView` 导入导出页面
- [ ] 添加路由配置
- [ ] 添加导航菜单项

**文件**:
- `renderer/modules/repository/presentation/views/RepositoryView.tsx`
- `renderer/modules/repository/presentation/views/BackupView.tsx`
- `renderer/modules/repository/presentation/views/ImportExportView.tsx`
- `renderer/modules/repository/presentation/views/index.ts`

---

### Story 13.24: Editor Main Process IPC Handler 完善
**优先级**: P1 | **复杂度**: Medium

**目标**: 完善 Editor 模块的 Main Process 实现

**任务**:
- [ ] 审查 `EditorDesktopApplicationService` 实现
- [ ] 完善 IPC handlers
- [ ] 实现文档 CRUD handlers
- [ ] 实现自动保存/草稿恢复 handlers
- [ ] 实现模板管理 handlers

**文件**:
- `main/modules/editor/ipc/editor-ipc-handler.ts` (完善)
- `main/modules/editor/application/EditorDesktopApplicationService.ts` (验证)

---

### Story 13.25: Editor 模块 IPC Client
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Editor 模块完整的 IPC Client

**任务**:
- [ ] 创建 `EditorIPCClient` 类
- [ ] 实现文档管理方法 (create, open, save, close)
- [ ] 实现内容操作方法 (get/set content, undo/redo)
- [ ] 实现自动保存方法
- [ ] 实现模板方法

**文件**:
- `renderer/modules/editor/infrastructure/ipc/editor.ipc-client.ts`
- `renderer/modules/editor/infrastructure/ipc/index.ts`

---

### Story 13.26: Editor 模块 Store 实现
**优先级**: P1 | **复杂度**: Medium

**目标**: 实现 Editor 模块的 Zustand Store

**任务**:
- [ ] 创建 `editorStore`
- [ ] 实现打开文档列表状态
- [ ] 实现当前活动文档状态
- [ ] 实现 dirty 状态追踪
- [ ] 实现自动保存配置状态
- [ ] 实现模板列表状态

**文件**:
- `renderer/modules/editor/presentation/stores/editorStore.ts` (新建)
- `renderer/modules/editor/presentation/stores/index.ts`

---

### Story 13.27: Editor 模块 UI 组件实现
**优先级**: P1 | **复杂度**: High

**目标**: 实现 Editor 模块的 UI 组件

**任务**:
- [ ] 实现 `EditorContainer` 主编辑器容器
- [ ] 实现 `DocumentTabs` 文档标签页组件
- [ ] 实现 `MarkdownEditor` Markdown 编辑器
- [ ] 实现 `RichTextEditor` 富文本编辑器
- [ ] 实现 `EditorToolbar` 工具栏组件
- [ ] 实现 `TemplateSelector` 模板选择器
- [ ] 实现 `DraftRecoveryDialog` 草稿恢复对话框
- [ ] 实现 `AutoSaveIndicator` 自动保存指示器

**文件**:
- `renderer/modules/editor/presentation/components/EditorContainer.tsx`
- `renderer/modules/editor/presentation/components/DocumentTabs.tsx`
- `renderer/modules/editor/presentation/components/MarkdownEditor.tsx`
- `renderer/modules/editor/presentation/components/RichTextEditor.tsx`
- `renderer/modules/editor/presentation/components/EditorToolbar.tsx`
- `renderer/modules/editor/presentation/components/TemplateSelector.tsx`
- `renderer/modules/editor/presentation/components/DraftRecoveryDialog.tsx`
- `renderer/modules/editor/presentation/components/AutoSaveIndicator.tsx`

---

### Story 13.28: Editor 模块 Views 和集成
**优先级**: P1 | **复杂度**: Medium

**目标**: 完善 Editor 模块的页面视图和集成

**任务**:
- [ ] 实现 `EditorView` 主编辑页面
- [ ] 实现 `TemplateManagerView` 模板管理页面
- [ ] 添加路由配置
- [ ] 添加导航菜单项
- [ ] 与 Task/Goal 描述编辑集成

**文件**:
- `renderer/modules/editor/presentation/views/EditorView.tsx`
- `renderer/modules/editor/presentation/views/TemplateManagerView.tsx`
- `renderer/modules/editor/presentation/views/index.ts`

---

## Phase 4: 系统模块完善

### Story 13.29: Account Main Process IPC Handler 审查
**优先级**: P1 | **复杂度**: Low

**目标**: 审查并完善 Account 模块的 Main Process 实现

**任务**:
- [ ] 审查现有 IPC handlers
- [ ] 确认所有 Account 操作已覆盖
- [ ] 添加缺失的 handlers (如有)

**文件**:
- `main/modules/account/ipc/` (审查)

---

### Story 13.30: Account 模块 IPC Client
**优先级**: P1 | **复杂度**: Low

**目标**: 创建 Account 模块的 IPC Client

**任务**:
- [ ] 创建 `AccountIPCClient` 类
- [ ] 实现 Profile 方法
- [ ] 实现 Account Setting 方法

**文件**:
- `renderer/modules/account/infrastructure/ipc/account.ipc-client.ts`
- `renderer/modules/account/infrastructure/ipc/index.ts`

---

### Story 13.31: Account 模块 Store 重构和 UI 完善
**优先级**: P1 | **复杂度**: Medium

**目标**: 重构 Account Store 并完善 UI

**任务**:
- [ ] 创建 `AccountContainer` 类
- [ ] 重构 `accountStore` 使用 IPC Client
- [ ] 完善 Profile 编辑组件
- [ ] 完善 Account Setting 组件

**文件**:
- `renderer/modules/account/infrastructure/di/account.container.ts`
- `renderer/modules/account/presentation/stores/accountStore.ts` (重构)
- `renderer/modules/account/presentation/components/` (完善)

---

### Story 13.32: Auth Main Process IPC Handler 完善
**优先级**: P1 | **复杂度**: Medium

**目标**: 完善 Auth 模块的 Main Process 实现

**任务**:
- [ ] 审查现有 IPC handlers
- [ ] 完善 Session 管理 handlers
- [ ] 实现离线认证逻辑

**文件**:
- `main/modules/auth/ipc/` (完善)

---

### Story 13.33: Auth 模块 IPC Client 和 Store 重构
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Auth IPC Client 并重构 Store

**任务**:
- [ ] 创建 `AuthIPCClient` 类
- [ ] 重构 `authStore` 使用 IPC Client
- [ ] 确保离线模式下的认证逻辑

**文件**:
- `renderer/modules/auth/infrastructure/ipc/auth.ipc-client.ts`
- `renderer/modules/auth/presentation/stores/authStore.ts` (重构)

---

### Story 13.34: Setting Main Process IPC Handler 审查
**优先级**: P1 | **复杂度**: Low

**目标**: 审查 Setting 模块的 Main Process 实现

**任务**:
- [ ] 审查现有 IPC handlers
- [ ] 确认 App Config handlers
- [ ] 确认 User Setting handlers

**文件**:
- `main/modules/setting/ipc/` (审查)

---

### Story 13.35: Setting 模块 IPC Client
**优先级**: P1 | **复杂度**: Low

**目标**: 创建 Setting 模块的 IPC Client

**任务**:
- [ ] 创建 `SettingIPCClient` 类
- [ ] 实现 App Config 方法
- [ ] 实现 User Setting 方法
- [ ] 实现主题设置方法
- [ ] 实现语言设置方法

**文件**:
- `renderer/modules/setting/infrastructure/ipc/setting.ipc-client.ts`
- `renderer/modules/setting/infrastructure/ipc/index.ts`

---

### Story 13.36: Setting 模块 Store 重构和 UI 完善
**优先级**: P1 | **复杂度**: Medium

**目标**: 重构 Setting Store 并完善 UI

**任务**:
- [ ] 创建 `SettingContainer` 类
- [ ] 重构 `settingStore` 使用 IPC Client
- [ ] 完善 Setting 页面布局
- [ ] 完善各设置项组件
- [ ] 添加设置搜索功能

**文件**:
- `renderer/modules/setting/infrastructure/di/setting.container.ts`
- `renderer/modules/setting/presentation/stores/settingStore.ts` (重构)
- `renderer/modules/setting/presentation/components/` (完善)

---

### Story 13.37: Dashboard 模块 IPC Client
**优先级**: P1 | **复杂度**: Medium

**目标**: 创建 Dashboard 模块的 IPC Client

**任务**:
- [ ] 创建 `DashboardIPCClient` 类
- [ ] 实现 Widget Config 方法
- [ ] 实现 Dashboard 数据聚合方法
- [ ] 实现缓存策略

**文件**:
- `renderer/modules/dashboard/infrastructure/ipc/dashboard.ipc-client.ts`
- `renderer/modules/dashboard/infrastructure/ipc/index.ts`

---

### Story 13.38: Dashboard 模块 Store 重构和 UI 完善
**优先级**: P1 | **复杂度**: High

**目标**: 重构 Dashboard Store 并完善 UI

**任务**:
- [ ] 创建 `DashboardContainer` 类
- [ ] 重构 `dashboardStore` 使用 IPC Client
- [ ] 完善 Dashboard 布局组件
- [ ] 完善统计 Widget 组件
- [ ] 完善快捷操作 Widget 组件
- [ ] 实现 Widget 可配置/可拖拽

**文件**:
- `renderer/modules/dashboard/infrastructure/di/dashboard.container.ts`
- `renderer/modules/dashboard/presentation/stores/dashboardStore.ts` (重构)
- `renderer/modules/dashboard/presentation/components/` (完善)

---

## Phase 5: 功能模块实现

### Story 13.39: AI Main Process IPC Handler 完善
**优先级**: P2 | **复杂度**: Medium

**目标**: 完善 AI 模块的 Main Process 实现

**任务**:
- [ ] 审查 `AIDesktopApplicationService` 实现
- [ ] 完善 IPC handlers
- [ ] 实现 AI 对话 handlers
- [ ] 实现 AI 建议 handlers
- [ ] 实现 AI 配置 handlers

**文件**:
- `main/modules/ai/ipc/ai-ipc-handler.ts` (完善)
- `main/modules/ai/application/AIDesktopApplicationService.ts` (验证)

---

### Story 13.40: AI 模块 IPC Client
**优先级**: P2 | **复杂度**: Medium

**目标**: 创建 AI 模块完整的 IPC Client

**任务**:
- [ ] 创建 `AIIPCClient` 类
- [ ] 实现对话方法 (chat, stream)
- [ ] 实现建议方法 (task suggestions, schedule optimization)
- [ ] 实现配置方法 (API key, model selection)

**文件**:
- `renderer/modules/ai/infrastructure/ipc/ai.ipc-client.ts`
- `renderer/modules/ai/infrastructure/ipc/index.ts`

---

### Story 13.41: AI 模块 Store 实现
**优先级**: P2 | **复杂度**: Medium

**目标**: 实现 AI 模块的 Zustand Store

**任务**:
- [ ] 创建 `aiStore`
- [ ] 实现对话历史状态
- [ ] 实现流式响应状态
- [ ] 实现 AI 配置状态
- [ ] 实现建议缓存状态

**文件**:
- `renderer/modules/ai/presentation/stores/aiStore.ts` (新建/完善)
- `renderer/modules/ai/presentation/stores/index.ts`

---

### Story 13.42: AI 模块 UI 组件实现
**优先级**: P2 | **复杂度**: High

**目标**: 实现 AI 模块的 UI 组件

**任务**:
- [ ] 实现 `AIAssistantPanel` AI 助手面板
- [ ] 实现 `ChatInterface` 对话界面
- [ ] 实现 `ChatMessage` 消息组件
- [ ] 实现 `StreamingResponse` 流式响应组件
- [ ] 实现 `AISuggestionCard` 建议卡片
- [ ] 实现 `AIConfigDialog` 配置对话框
- [ ] 实现 `TaskSuggestionWidget` 任务建议组件
- [ ] 实现 `ScheduleOptimizationWidget` 日程优化组件

**文件**:
- `renderer/modules/ai/presentation/components/AIAssistantPanel.tsx`
- `renderer/modules/ai/presentation/components/ChatInterface.tsx`
- `renderer/modules/ai/presentation/components/ChatMessage.tsx`
- `renderer/modules/ai/presentation/components/StreamingResponse.tsx`
- `renderer/modules/ai/presentation/components/AISuggestionCard.tsx`
- `renderer/modules/ai/presentation/components/AIConfigDialog.tsx`
- `renderer/modules/ai/presentation/components/TaskSuggestionWidget.tsx`
- `renderer/modules/ai/presentation/components/ScheduleOptimizationWidget.tsx`

---

### Story 13.43: AI 模块 Views 和集成
**优先级**: P2 | **复杂度**: Medium

**目标**: 完善 AI 模块的页面视图和集成

**任务**:
- [ ] 实现 `AIAssistantView` AI 助手页面
- [ ] 添加路由配置
- [ ] 与 Dashboard 集成 AI Widget
- [ ] 与 Task/Goal 模块集成建议功能

**文件**:
- `renderer/modules/ai/presentation/views/AIAssistantView.tsx`
- `renderer/modules/ai/presentation/views/index.ts`

---

### Story 13.44: Notification Main Process IPC Handler 完善
**优先级**: P2 | **复杂度**: Medium

**目标**: 完善 Notification 模块的 Main Process 实现

**任务**:
- [ ] 审查现有 IPC handlers
- [ ] 完善系统通知集成
- [ ] 添加通知历史 handlers
- [ ] 添加通知偏好 handlers

**文件**:
- `main/modules/notification/ipc/notification-ipc-handler.ts` (完善)

---

### Story 13.45: Notification 模块 IPC Client
**优先级**: P2 | **复杂度**: Medium

**目标**: 创建 Notification 模块完整的 IPC Client

**任务**:
- [ ] 创建 `NotificationIPCClient` 类
- [ ] 实现通知 CRUD 方法
- [ ] 实现标记已读方法
- [ ] 实现通知偏好方法
- [ ] 实现统计方法

**文件**:
- `renderer/modules/notification/infrastructure/ipc/notification.ipc-client.ts`
- `renderer/modules/notification/infrastructure/ipc/index.ts`

---

### Story 13.46: Notification 模块 Store 重构
**优先级**: P2 | **复杂度**: Medium

**目标**: 重构 Notification Store

**任务**:
- [ ] 创建 `NotificationContainer` 类
- [ ] 重构 `notificationStore` 使用 IPC Client
- [ ] 添加与 Main Process 的实时同步
- [ ] 完善通知状态管理

**文件**:
- `renderer/modules/notification/infrastructure/di/notification.container.ts`
- `renderer/modules/notification/presentation/stores/notificationStore.ts` (重构)

---

### Story 13.47: Notification 模块 UI 组件完善
**优先级**: P2 | **复杂度**: Medium

**目标**: 完善 Notification 模块的 UI 组件

**任务**:
- [ ] 完善 `NotificationCenter` 通知中心
- [ ] 实现 `NotificationList` 通知列表
- [ ] 实现 `NotificationItem` 通知项
- [ ] 实现 `NotificationPreferencePanel` 偏好设置
- [ ] 实现 `NotificationBadge` 未读徽章

**文件**:
- `renderer/modules/notification/presentation/components/NotificationCenter.tsx`
- `renderer/modules/notification/presentation/components/NotificationList.tsx`
- `renderer/modules/notification/presentation/components/NotificationItem.tsx`
- `renderer/modules/notification/presentation/components/NotificationPreferencePanel.tsx`
- `renderer/modules/notification/presentation/components/NotificationBadge.tsx`

---

## Phase 6: 平台集成完善

### Story 13.48: Shortcuts UI 配置
**优先级**: P2 | **复杂度**: Medium

**目标**: 实现快捷键配置 UI

**任务**:
- [ ] 创建 `ShortcutsIPCClient` 类
- [ ] 实现快捷键列表获取
- [ ] 实现快捷键自定义设置
- [ ] 实现 `ShortcutConfigPanel` 组件
- [ ] 实现 `ShortcutItem` 组件
- [ ] 实现快捷键录入组件

**文件**:
- `renderer/modules/shortcuts/infrastructure/ipc/shortcuts.ipc-client.ts`
- `renderer/modules/shortcuts/presentation/components/ShortcutConfigPanel.tsx`
- `renderer/modules/shortcuts/presentation/components/ShortcutItem.tsx`
- `renderer/modules/shortcuts/presentation/components/ShortcutRecorder.tsx`

---

### Story 13.49: Window 管理增强
**优先级**: P2 | **复杂度**: Low

**目标**: 增强窗口管理功能

**任务**:
- [ ] 实现窗口状态持久化
- [ ] 实现多窗口支持
- [ ] 添加窗口 IPC Client (renderer 调用)

**文件**:
- `renderer/modules/window/infrastructure/ipc/window.ipc-client.ts`

---

### Story 13.50: Tray 菜单增强
**优先级**: P2 | **复杂度**: Low

**目标**: 增强系统托盘功能

**任务**:
- [ ] 添加快捷操作菜单
- [ ] 添加当前任务/专注状态显示
- [ ] 添加通知计数显示

**文件**:
- `main/modules/tray/` (完善)

---

### Story 13.51: 自动更新集成
**优先级**: P2 | **复杂度**: Medium

**目标**: 实现应用自动更新功能

**任务**:
- [ ] 实现更新检查 IPC handlers
- [ ] 实现更新下载 IPC handlers
- [ ] 实现 `UpdateNotification` 组件
- [ ] 实现 `UpdateProgressDialog` 组件

**文件**:
- `main/modules/updater/` (新建或完善)
- `renderer/modules/updater/presentation/components/`

---

### Story 13.52: 应用启动优化
**优先级**: P1 | **复杂度**: Medium

**目标**: 优化应用启动流程

**任务**:
- [ ] 实现启动 Splash Screen
- [ ] 优化模块懒加载
- [ ] 添加启动性能追踪
- [ ] 优化 IPC 初始化顺序

**文件**:
- `renderer/shared/infrastructure/initialization/` (完善)
- `renderer/components/SplashScreen.tsx`

---

## Phase 7: 测试与文档

### Story 13.53: IPC Client 单元测试
**优先级**: P1 | **复杂度**: High

**目标**: 为所有 IPC Client 添加单元测试

**任务**:
- [ ] 为 `TaskIPCClient` 编写测试
- [ ] 为 `GoalIPCClient` 编写测试
- [ ] 为 `ScheduleIPCClient` 编写测试
- [ ] 为 `ReminderIPCClient` 编写测试
- [ ] 为 `RepositoryIPCClient` 编写测试
- [ ] 为 `EditorIPCClient` 编写测试
- [ ] 为其他 IPC Client 编写测试

**文件**:
- `renderer/modules/**/infrastructure/ipc/__tests__/`

---

### Story 13.54: Store 单元测试
**优先级**: P1 | **复杂度**: High

**目标**: 为所有 Store 添加单元测试

**任务**:
- [ ] 为各模块 Store 编写测试
- [ ] 测试状态更新逻辑
- [ ] 测试与 IPC Client 的集成

**文件**:
- `renderer/modules/**/presentation/stores/__tests__/`

---

### Story 13.55: 集成测试
**优先级**: P1 | **复杂度**: High

**目标**: 添加 Electron E2E 测试

**任务**:
- [ ] 设置 Playwright/Spectron 测试框架
- [ ] 为核心模块添加 E2E 测试
- [ ] 为关键用户流程添加测试

**文件**:
- `apps/desktop/e2e/`

---

### Story 13.56: 架构文档更新
**优先级**: P1 | **复杂度**: Medium

**目标**: 更新 Desktop 架构文档

**任务**:
- [ ] 更新 `docs/architecture/` 相关文档
- [ ] 添加 IPC Client 使用指南
- [ ] 添加 DI 容器使用示例
- [ ] 添加模块开发指南
- [ ] 更新 README

**文件**:
- `docs/architecture/desktop-architecture.md` (新建或更新)
- `docs/guides/desktop-module-development.md` (新建)
- `apps/desktop/README.md` (更新)

---

### Story 13.57: 开发者工具
**优先级**: P2 | **复杂度**: Medium

**目标**: 添加开发者调试工具

**任务**:
- [ ] 实现 IPC 调用日志面板
- [ ] 实现 Store 状态查看器
- [ ] 实现模块状态仪表板

**文件**:
- `renderer/dev-tools/`

---

## Story 依赖关系图

```
Phase 1: 基础设施
┌─────────────┐
│ Story 13.1  │ IPC Client 基础架构
│ Story 13.2  │ DI 容器模式
│ Story 13.3  │ 初始化机制
│ Story 13.4  │ IPC 类型定义
│ Story 13.5  │ 测试基础设施
└──────┬──────┘
       │
       ▼
Phase 2: 核心模块
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────┐│
│  │ Task       │  │ Goal       │  │ Schedule   │  │Reminder││
│  │ 13.6-13.8  │  │ 13.9-13.10 │  │13.11-13.13 │  │13.14-15││
│  └────────────┘  └────────────┘  └────────────┘  └────────┘│
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
Phase 3: 内容模块
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │ Repository         │      │ Editor             │        │
│  │ 13.16-13.20        │      │ 13.21-13.25        │        │
│  └────────────────────┘      └────────────────────┘        │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
Phase 4: 系统模块
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Account  │ │ Auth     │ │ Setting  │ │ Dashboard    │   │
│  │13.26-28  │ │13.29-30  │ │13.31-33  │ │ 13.34-35     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
Phase 5: 功能模块
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │ AI             │ │ Notification   │ │ Focus          │  │
│  │ 13.36-13.40    │ │ 13.41-13.44    │ │ 13.45-13.50    │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
Phase 6: 平台集成
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Shortcuts │ │ Window   │ │ Tray     │ │ AutoUpdate   │   │
│  │  13.51   │ │  13.52   │ │  13.53   │ │ 13.54        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 启动优化 13.55                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
Phase 7: 测试与文档
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ 单元测试     │ │ 集成测试     │ │ 文档 + 开发者工具    │ │
│  │ 13.56-13.57  │ │ 13.58        │ │ 13.59-13.60          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 模块内依赖关系

### Task 模块
```
13.6 IPC Client ──→ 13.7 DI Container ──→ 13.8 Store 重构
```

### Goal 模块
```
13.9 IPC Client ──→ 13.10 DI Container + Store
```

### Schedule 模块
```
13.11 Main Handler ──→ 13.12 IPC Client ──→ 13.13 Store + UI
```

### Repository 模块
```
13.16 Main Handler ──→ 13.17 IPC Client ──→ 13.18 Store ──→ 13.19 UI ──→ 13.20 Views
```

### Editor 模块
```
13.21 Main Handler ──→ 13.22 IPC Client ──→ 13.23 Store ──→ 13.24 UI ──→ 13.25 Views
```

### Focus 模块 (全新)
```
13.45 Main Process ──→ 13.46 IPC Client ──→ 13.47 Store ──→ 13.48 UI ──→ 13.49 Views ──→ 13.50 集成
```

---

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| IPC 类型不匹配 | 高 | 中 | 使用 contracts 统一类型，添加运行时验证 |
| Store 重构影响现有功能 | 高 | 中 | 增量重构，保持向后兼容，添加测试 |
| 初始化顺序问题 | 中 | 中 | 建立明确的依赖图，添加初始化日志 |
| Focus 模块全新实现工作量 | 中 | 高 | 参考现有模块模式，复用基础设施 |
| Editor 组件复杂度 | 中 | 中 | 使用成熟的编辑器库，分阶段实现 |
| 性能问题 (IPC 频繁调用) | 中 | 低 | 添加 IPC 批量调用支持，实现缓存 |
| 测试覆盖不足 | 中 | 中 | 每个模块完成后立即添加测试 |

---

## 验收标准 (全局)

### 功能完整性
- [ ] 所有模块有完整的 Main Process 实现
- [ ] 所有模块有完整的 Renderer Process 实现
- [ ] 所有模块有对应的 UI 组件
- [ ] 所有模块可独立初始化和销毁

### 类型安全
- [ ] 所有 IPC 调用有完整的 TypeScript 类型
- [ ] 所有 Store 状态有完整类型
- [ ] 所有组件 Props 有完整类型

### 架构一致性
- [ ] Renderer 端架构与 Web 端模式一致
- [ ] 所有模块遵循统一的目录结构
- [ ] 所有 IPC Client 遵循统一的模式

### 可测试性
- [ ] IPC Client 层可以独立测试 (mock IPC)
- [ ] Store 层可以独立测试 (mock IPC Client)
- [ ] 组件层可以独立测试 (mock Store)

### 可维护性
- [ ] 代码结构清晰
- [ ] 有完整的文档
- [ ] 有开发者工具辅助调试

### 性能
- [ ] 无明显的性能回退
- [ ] 启动时间合理
- [ ] IPC 调用延迟可接受

---

## 完成定义 (DoD)

### 每个 Story 完成需要：
- [ ] 代码实现完成
- [ ] TypeScript 类型检查通过
- [ ] 与其他模块集成测试通过
- [ ] 代码已自测

### EPIC 整体完成需要：
- [ ] 所有 60 个 Stories 完成
- [ ] CI 流程通过
- [ ] 单元测试覆盖率 > 70%
- [ ] E2E 测试覆盖关键流程
- [ ] 架构文档已更新
- [ ] 代码已 Review

---

## 技术规范附录

### IPC 通道命名规范
```
{module}:{action}[-{sub-action}]

示例:
- task:create-template
- task:get-template
- goal:update
- schedule:list-by-date
- repository:create-backup
- editor:save-document
- focus:start-session
```

### 目录结构规范
```
renderer/modules/{module}/
├── infrastructure/
│   ├── ipc/
│   │   ├── {entity}.ipc-client.ts
│   │   └── index.ts
│   └── di/
│       ├── {module}.container.ts
│       └── index.ts
├── presentation/
│   ├── components/
│   │   ├── {Component}.tsx
│   │   └── index.ts
│   ├── stores/
│   │   ├── {entity}Store.ts
│   │   └── index.ts
│   ├── hooks/
│   │   └── index.ts
│   └── views/
│       ├── {View}.tsx
│       └── index.ts
├── initialization/
│   └── index.ts
└── index.ts
```

### IPC Client 模板
```typescript
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import type { EntityDTO } from '@dailyuse/contracts';

export class EntityIPCClient extends BaseIPCClient {
  async create(input: CreateInput): Promise<EntityDTO> {
    return this.invoke('entity:create', input);
  }

  async get(uuid: string): Promise<EntityDTO | null> {
    return this.invoke('entity:get', { uuid });
  }

  async update(uuid: string, input: UpdateInput): Promise<EntityDTO> {
    return this.invoke('entity:update', { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke('entity:delete', { uuid });
  }

  async list(filter?: FilterInput): Promise<EntityDTO[]> {
    return this.invoke('entity:list', filter);
  }
}

export const entityIPCClient = new EntityIPCClient();
```

### Store 模板
```typescript
import { create } from 'zustand';
import { entityIPCClient } from '../infrastructure/ipc';
import type { EntityDTO } from '@dailyuse/contracts';

interface EntityState {
  entities: EntityDTO[];
  isLoading: boolean;
  error: string | null;
}

interface EntityActions {
  fetch: () => Promise<void>;
  create: (input: CreateInput) => Promise<EntityDTO>;
  update: (uuid: string, input: UpdateInput) => Promise<void>;
  delete: (uuid: string) => Promise<void>;
}

export const useEntityStore = create<EntityState & EntityActions>((set, get) => ({
  entities: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const entities = await entityIPCClient.list();
      set({ entities, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  create: async (input) => {
    const entity = await entityIPCClient.create(input);
    set((state) => ({ entities: [...state.entities, entity] }));
    return entity;
  },

  update: async (uuid, input) => {
    const updated = await entityIPCClient.update(uuid, input);
    set((state) => ({
      entities: state.entities.map((e) => (e.uuid === uuid ? updated : e)),
    }));
  },

  delete: async (uuid) => {
    await entityIPCClient.delete(uuid);
    set((state) => ({
      entities: state.entities.filter((e) => e.uuid !== uuid),
    }));
  },
}));
```

---

## 参考资料

- [EPIC-010: Desktop Full DDD Refactor](./EPIC-010-DESKTOP-FULL-DDD-REFACTOR.md)
- [EPIC-011: Desktop Renderer React Migration](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [EPIC-012: Infrastructure Type Fixes](./EPIC-012-INFRASTRUCTURE-TYPE-FIXES.md)
- [Web Architecture](../architecture/web-architecture.md)
- [API Architecture](../architecture/api-architecture.md)
- [System Overview](../architecture/system-overview.md)
