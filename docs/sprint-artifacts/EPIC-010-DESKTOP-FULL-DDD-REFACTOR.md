# EPIC-010: Desktop 全面 DDD 模块化重构

> **创建日期**: 2025-12-09  
> **优先级**: HIGH  
> **预估工作量**: 80-120 小时  
> **前置条件**: 现有 `@dailyuse/*` 共享包已可用

---

## 📋 背景与问题分析

### 当前现状

Desktop 项目存在以下问题：

| 问题 | 详细描述 | 影响 |
|------|---------|------|
| **IPC Handlers 无实现** | Task、Schedule、Reminder 等模块的 IPC handlers 全部是 TODO 占位符 | 功能不可用 |
| **未复用 Application Services** | 直接在 IPC handler 中写业务逻辑，没有复用 `@dailyuse/application-server` | 代码重复、逻辑分散 |
| **缺少模块化结构** | services、ipc 平铺在一起，没有按业务模块组织 | 维护困难 |
| **Main 进程缺少 DDD 分层** | 没有 Application → Domain → Infrastructure 的清晰分层 | 架构混乱 |

### 三端对比矩阵

| 模块 | API 状态 | Web 状态 | Desktop Main | Desktop Renderer | 实现差距 |
|------|---------|---------|--------------|------------------|----------|
| **Goal** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ IPC 部分实现 | ✅ Views/Hooks | 40% |
| **Task** | ✅ 完整 DDD | ✅ 完整模块化 | ❌ 全是 TODO | ⚠️ 基础 Views | 10% |
| **Schedule** | ✅ 完整 DDD | ✅ 完整模块化 | ❌ 全是 TODO | ⚠️ 基础 Views | 10% |
| **Reminder** | ✅ 完整 DDD | ✅ 完整模块化 | ❌ 全是 TODO | ⚠️ 基础 Views | 10% |
| **Dashboard** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ 部分实现 | ⚠️ 基础 View | 30% |
| **Account** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ 部分实现 | ✅ Hooks | 50% |
| **Auth** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ 部分实现 | ✅ Hooks | 50% |
| **AI** | ✅ 完整 DDD | ✅ 完整模块化 | ❌ 全是 TODO | ⚠️ 基础 Views | 15% |
| **Notification** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ 混合实现 | ⚠️ 基础 Views | 30% |
| **Repository** | ✅ 完整 DDD | ✅ 完整模块化 | ⚠️ 部分实现 | ⚠️ 基础 Views | 30% |
| **Setting** | ✅ 完整 DDD | ✅ 完整模块化 | ❌ 全是 TODO | ⚠️ 基础 View | 20% |
| **Editor** | ✅ 完整 | ✅ 完整 | ❌ 未实现 | ❌ 未实现 | 0% |

### 可复用的共享包清单

```
@dailyuse/contracts          ← 已在 Desktop 使用 ✅
  └── 所有 DTO 类型定义

@dailyuse/domain-server      ← 部分使用
  ├── goal/       (Goal, GoalDomainService, IGoalRepository)
  ├── task/       (TaskTemplate, TaskInstance, TaskDependencyService, ITaskTemplateRepository...)
  ├── schedule/   (ScheduleTask, IScheduleTaskRepository)
  ├── reminder/   (ReminderTemplate, ReminderSchedulerService, IReminderTemplateRepository...)
  ├── notification/ (Notification, INotificationRepository)
  ├── account/    (Account, IAccountRepository)
  ├── authentication/ (AuthCredential, AuthSession, IAuthCredentialRepository...)
  ├── ai/         (AIConversation, IAIConversationRepository...)
  ├── dashboard/  (DashboardConfig, IDashboardConfigRepository)
  ├── repository/ (Repository, Folder, Resource, IRepositoryRepository...)
  └── setting/    (UserSetting, IUserSettingRepository)

@dailyuse/application-server ← ❌ 完全未使用！这是关键
  ├── goal/       (GoalApplicationService, CreateGoalUseCase...)
  ├── task/       (TaskTemplateApplicationService, TaskInstanceApplicationService...)
  ├── schedule/   (ScheduleApplicationService...)
  ├── reminder/   (ReminderApplicationService...)
  ├── notification/ (NotificationApplicationService...)
  ├── account/    (AccountApplicationService...)
  ├── authentication/ (AuthenticationApplicationService...)
  ├── ai/         (AIApplicationService...)
  ├── dashboard/  (DashboardApplicationService...)
  ├── repository/ (RepositoryApplicationService...)
  └── setting/    (SettingApplicationService...)

@dailyuse/infrastructure-server ← 已使用 Container 模式 ✅
  └── 所有模块的 Container (GoalContainer, TaskContainer, ...)

@dailyuse/utils              ← 仅使用 eventBus
  └── eventBus, InitializationManager, createLogger...
```

---

## 🎯 目标

### 主要目标
1. **全面复用 `@dailyuse/application-server`** - IPC handlers 调用 Application Service，而非直接操作 Repository
2. **模块化重构 Main 进程** - 按业务模块组织代码（modules/goal/, modules/task/...）
3. **完整实现所有 IPC Handlers** - 消除所有 TODO 占位符
4. **统一初始化流程** - 使用 `InitializationManager` 管理模块启动

### 次要目标
1. 复用 `@dailyuse/utils` 中的 Logger、事件系统
2. Renderer 进程的 hooks 模块化（可后续迭代）

---

## 📐 目标架构

### Main 进程目录结构（重构后）

```
apps/desktop/src/main/
├── main.ts                          # 入口
├── database/                        # SQLite 数据库连接
├── di/                              # 依赖注入配置
│   ├── composition-root.ts          # 组合根
│   └── sqlite-adapters/             # SQLite Repository 实现
│
├── modules/                         # 业务模块（DDD 模块化）
│   ├── goal/
│   │   ├── application/
│   │   │   └── GoalDesktopApplicationService.ts  # 复用 @dailyuse/application-server
│   │   ├── ipc/
│   │   │   └── goal.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── task/
│   │   ├── application/
│   │   │   └── TaskDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   ├── task-template.ipc-handlers.ts
│   │   │   ├── task-instance.ipc-handlers.ts
│   │   │   ├── task-dependency.ipc-handlers.ts
│   │   │   └── task-statistics.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── schedule/
│   │   ├── application/
│   │   │   └── ScheduleDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   ├── schedule-task.ipc-handlers.ts
│   │   │   ├── schedule-event.ipc-handlers.ts
│   │   │   └── schedule-statistics.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── reminder/
│   │   ├── application/
│   │   │   └── ReminderDesktopApplicationService.ts
│   │   ├── services/
│   │   │   └── ReminderNativeNotificationService.ts  # Electron 原生通知
│   │   ├── ipc/
│   │   │   ├── reminder-template.ipc-handlers.ts
│   │   │   ├── reminder-group.ipc-handlers.ts
│   │   │   └── reminder-statistics.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── notification/
│   │   ├── application/
│   │   │   └── NotificationDesktopApplicationService.ts
│   │   ├── services/
│   │   │   └── NotificationNativeService.ts  # 原生系统通知（从 services/ 迁移）
│   │   ├── ipc/
│   │   │   └── notification.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── dashboard/
│   │   ├── application/
│   │   │   └── DashboardDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   └── dashboard.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── account/
│   │   ├── application/
│   │   │   └── AccountDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   └── account.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── authentication/
│   │   ├── application/
│   │   │   └── AuthDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   └── auth.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── ai/
│   │   ├── application/
│   │   │   └── AIDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   ├── ai-conversation.ipc-handlers.ts
│   │   │   ├── ai-generation.ipc-handlers.ts
│   │   │   └── ai-settings.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── repository/
│   │   ├── application/
│   │   │   └── RepositoryDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   ├── repository.ipc-handlers.ts
│   │   │   ├── folder.ipc-handlers.ts
│   │   │   └── resource.ipc-handlers.ts
│   │   └── index.ts
│   │
│   ├── setting/
│   │   ├── application/
│   │   │   └── SettingDesktopApplicationService.ts
│   │   ├── ipc/
│   │   │   └── setting.ipc-handlers.ts
│   │   └── index.ts
│   │
│   └── editor/                      # 新增
│       ├── application/
│       │   └── EditorDesktopApplicationService.ts
│       ├── ipc/
│       │   └── editor.ipc-handlers.ts
│       └── index.ts
│
├── shared/
│   ├── services/
│   │   └── electron/                # Electron 特有服务
│   │       ├── TrayService.ts       # 从 modules/tray 迁移
│   │       ├── WindowService.ts     # 从 modules/window 迁移
│   │       ├── ShortcutsService.ts  # 从 modules/shortcuts 迁移
│   │       └── AutoLaunchService.ts # 从 modules/autolaunch 迁移
│   └── initialization/
│       └── ModuleInitializer.ts     # 使用 InitializationManager
│
└── events/                          # 事件处理
    └── event-handlers.ts
```

### IPC Handler 重构模式

**当前模式（错误）**：
```typescript
// ❌ 直接操作 Repository，业务逻辑散落在 IPC handler
ipcMain.handle('task-template:create', async (_, request) => {
  return { uuid: 'todo', ...request };  // 空实现！
});
```

**目标模式（正确）**：
```typescript
// ✅ 调用 Application Service
import { TaskTemplateApplicationService } from '@dailyuse/application-server';

ipcMain.handle('task-template:create', async (_, request) => {
  const appService = TaskContainer.getInstance().getApplicationService();
  return await appService.createTemplate(request);
});
```

---

## 📝 Story 拆分

### Story 1: 基础设施准备

**描述**：配置 Desktop 项目以正确引用 `@dailyuse/application-server`

**AC**：
1. [ ] 确认 `apps/desktop/package.json` 包含 `@dailyuse/application-server` 依赖
2. [ ] 更新 `desktop-main.composition-root.ts`，为每个 Container 注册 ApplicationService
3. [ ] 创建 `modules/` 目录结构骨架

**预估**：4 小时

---

### Story 2: Goal 模块完善

**描述**：Goal 模块已有部分实现，需要完善并复用 ApplicationService

**AC**：
1. [ ] 将 `ipc/goal.ipc-handlers.ts` 移动到 `modules/goal/ipc/`
2. [ ] 创建 `modules/goal/application/GoalDesktopApplicationService.ts` 包装 `@dailyuse/application-server/goal`
3. [ ] 重构 IPC handlers 调用 ApplicationService
4. [ ] 实现 Goal Folder 完整 CRUD
5. [ ] 实现 Goal Statistics 查询

**当前 IPC Channels**：
```
goal:create, goal:list, goal:get, goal:update, goal:delete
goal:activate, goal:pause, goal:complete, goal:archive
goal-folder:create, goal-folder:list, goal-folder:update, goal-folder:delete
```

**预估**：8 小时

---

### Story 3: Task 模块完整实现

**描述**：Task 模块当前全部是 TODO，需要完整实现

**AC**：
1. [ ] 创建 `modules/task/` 目录结构
2. [ ] 创建 `TaskDesktopApplicationService` 复用 `@dailyuse/application-server/task`
3. [ ] 实现 TaskTemplate CRUD（create, list, get, update, delete, archive, restore, duplicate, search, batch-update）
4. [ ] 实现 TaskInstance CRUD（create, list, get, update, delete, complete, uncomplete, reschedule, skip, start, pause, log-time, list-by-date, list-by-range, list-by-template, batch-update, batch-complete）
5. [ ] 实现 TaskDependency CRUD（create, list, delete, get-blocked, get-blocking, check-circular）
6. [ ] 实现 TaskStatistics（get-summary, get-by-date-range, get-by-template, get-productivity, get-trends）

**需实现的 IPC Channels（20+）**：
```
task-template:* (10 channels)
task-instance:* (15 channels)
task-dependency:* (6 channels)
task-statistics:* (5 channels)
```

**预估**：16 小时

---

### Story 4: Schedule 模块完整实现

**描述**：Schedule 模块当前全部是 TODO

**AC**：
1. [ ] 创建 `modules/schedule/` 目录结构
2. [ ] 创建 `ScheduleDesktopApplicationService` 复用 `@dailyuse/application-server/schedule`
3. [ ] 实现 ScheduleTask CRUD（create, list, get, update, delete, list-by-date, list-by-range, reschedule, batch-reschedule）
4. [ ] 实现 ScheduleEvent CRUD（create, list, get, update, delete, list-by-date, list-by-range, list-recurring, update-recurring, delete-recurring）
5. [ ] 实现 ScheduleStatistics（get-summary, get-by-date-range, get-upcoming）

**需实现的 IPC Channels（17）**：
```
schedule:task:* (9 channels)
schedule:event:* (10 channels)
schedule:statistics:* (3 channels)
```

**预估**：12 小时

---

### Story 5: Reminder 模块完整实现

**描述**：Reminder 模块当前全部是 TODO

**AC**：
1. [ ] 创建 `modules/reminder/` 目录结构
2. [ ] 创建 `ReminderDesktopApplicationService` 复用 `@dailyuse/application-server/reminder`
3. [ ] 创建 `ReminderNativeNotificationService` 使用 Electron Notification API
4. [ ] 实现 ReminderTemplate CRUD（create, list, get, update, delete, activate, deactivate）
5. [ ] 实现 Upcoming Reminders（list, get-next, dismiss, snooze, acknowledge）
6. [ ] 实现 ReminderGroup CRUD（create, list, get, update, delete）
7. [ ] 实现 ReminderStatistics（get-summary, get-by-date-range, get-completion-rate）

**需实现的 IPC Channels（15+）**：
```
reminder:template:* (7 channels)
reminder:upcoming:* (5 channels)
reminder:group:* (5 channels)
reminder:statistics:* (3 channels)
```

**预估**：12 小时

---

### Story 6: Notification 模块重构

**描述**：将现有 `services/notification.service.ts` 重构为 DDD 模块

**AC**：
1. [ ] 创建 `modules/notification/` 目录结构
2. [ ] 将 `notification.service.ts` 拆分为：
   - `NotificationDesktopApplicationService` (复用 @dailyuse/application-server)
   - `NotificationNativeService` (Electron 原生通知)
3. [ ] 实现 Notification CRUD IPC handlers
4. [ ] 实现 NotificationPreference CRUD
5. [ ] 保留 DND (Do Not Disturb) 功能

**需实现的 IPC Channels（10+）**：
```
notification:list, notification:get, notification:mark-read, notification:delete
notification:preference:get, notification:preference:update
notification:dnd:get, notification:dnd:set, notification:dnd:toggle
```

**预估**：8 小时

---

### Story 7: Dashboard 模块完善

**描述**：Dashboard 模块已有部分实现，需要复用 ApplicationService

**AC**：
1. [ ] 创建 `modules/dashboard/` 目录结构
2. [ ] 创建 `DashboardDesktopApplicationService`
3. [ ] 完善 Widget 配置 CRUD
4. [ ] 实现 Statistics 聚合查询

**需实现的 IPC Channels**：
```
dashboard:config:get, dashboard:config:update
dashboard:widget:*, dashboard:statistics:*
```

**预估**：6 小时

---

### Story 8: AI 模块完整实现

**描述**：AI 模块当前大部分是 TODO

**AC**：
1. [ ] 创建 `modules/ai/` 目录结构
2. [ ] 创建 `AIDesktopApplicationService` 复用 `@dailyuse/application-server/ai`
3. [ ] 实现 AIConversation CRUD
4. [ ] 实现 AIGenerationTask CRUD
5. [ ] 实现 AIProviderConfig CRUD
6. [ ] 实现 AIUsageQuota 查询

**需实现的 IPC Channels（15+）**：
```
ai:conversation:*, ai:generation:*, ai:provider:*, ai:quota:*
```

**预估**：10 小时

---

### Story 9: Account & Auth 模块完善

**描述**：Account 和 Auth 模块已有部分实现

**AC**：
1. [ ] 创建模块化目录结构
2. [ ] 复用 ApplicationService
3. [ ] 完善所有 IPC channels

**预估**：6 小时

---

### Story 10: Repository 模块完善

**描述**：Repository 模块需要完善文件管理功能

**AC**：
1. [ ] 创建模块化目录结构
2. [ ] 复用 ApplicationService
3. [ ] 实现 Repository、Folder、Resource 完整 CRUD
4. [ ] 实现 Statistics 查询

**预估**：8 小时

---

### Story 11: Setting 模块完整实现

**描述**：Setting 模块当前全部是 TODO

**AC**：
1. [ ] 创建 `modules/setting/` 目录结构
2. [ ] 创建 `SettingDesktopApplicationService`
3. [ ] 实现 AppConfig、UserSetting CRUD

**预估**：4 小时

---

### Story 12: Editor 模块新增

**描述**：Desktop 尚未实现 Editor 模块

**AC**：
1. [ ] 创建 `modules/editor/` 目录结构
2. [ ] 创建 `EditorDesktopApplicationService`
3. [ ] 实现编辑器相关 IPC handlers

**预估**：6 小时

---

### Story 13: 初始化流程统一

**描述**：使用 `InitializationManager` 统一模块初始化

**AC**：
1. [ ] 创建 `shared/initialization/ModuleInitializer.ts`
2. [ ] 每个模块提供 `registerModule()` 函数
3. [ ] 按依赖顺序启动模块
4. [ ] 添加启动性能监控日志

**预估**：4 小时

---

### Story 14: 清理与测试

**描述**：清理旧代码，补充测试

**AC**：
1. [ ] 删除旧的 `services/notification.service.ts`（已迁移）
2. [ ] 删除旧的 `ipc/*.ipc-handlers.ts` 文件（已迁移到模块内）
3. [ ] 为每个模块的 ApplicationService 补充单元测试
4. [ ] 集成测试 IPC channels

**预估**：8 小时

---

## 📊 工作量汇总

| Story | 描述 | 预估时间 |
|-------|------|----------|
| Story 1 | 基础设施准备 | 4h |
| Story 2 | Goal 模块完善 | 8h |
| Story 3 | Task 模块完整实现 | 16h |
| Story 4 | Schedule 模块完整实现 | 12h |
| Story 5 | Reminder 模块完整实现 | 12h |
| Story 6 | Notification 模块重构 | 8h |
| Story 7 | Dashboard 模块完善 | 6h |
| Story 8 | AI 模块完整实现 | 10h |
| Story 9 | Account & Auth 模块完善 | 6h |
| Story 10 | Repository 模块完善 | 8h |
| Story 11 | Setting 模块完整实现 | 4h |
| Story 12 | Editor 模块新增 | 6h |
| Story 13 | 初始化流程统一 | 4h |
| Story 14 | 清理与测试 | 8h |
| **Total** | | **112h** |

---

## 🔧 技术指南

### Application Service 包装模式

每个模块的 `*DesktopApplicationService` 遵循以下模式：

```typescript
// modules/task/application/TaskDesktopApplicationService.ts
import { TaskTemplateApplicationService } from '@dailyuse/application-server';
import { TaskContainer } from '@dailyuse/infrastructure-server';

export class TaskDesktopApplicationService {
  private templateService: TaskTemplateApplicationService;

  constructor() {
    const container = TaskContainer.getInstance();
    this.templateService = new TaskTemplateApplicationService(
      container.getTemplateRepository(),
      container.getInstanceRepository(),
      container.getStatisticsRepository()
    );
  }

  // 代理方法
  async createTemplate(request: CreateTaskTemplateRequest) {
    return this.templateService.create(request);
  }

  async listTemplates(params: ListTaskTemplatesParams) {
    return this.templateService.list(params);
  }

  // ... 其他方法
}
```

### IPC Handler 模式

```typescript
// modules/task/ipc/task-template.ipc-handlers.ts
import { ipcMain } from 'electron';
import { TaskDesktopApplicationService } from '../application/TaskDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('TaskTemplateIPC');

let appService: TaskDesktopApplicationService | null = null;

function getAppService() {
  if (!appService) {
    appService = new TaskDesktopApplicationService();
  }
  return appService;
}

export function registerTaskTemplateIpcHandlers(): void {
  ipcMain.handle('task-template:create', async (_, request) => {
    try {
      return await getAppService().createTemplate(request);
    } catch (error) {
      logger.error('Failed to create task template', error);
      throw error;
    }
  });

  ipcMain.handle('task-template:list', async (_, params) => {
    return await getAppService().listTemplates(params);
  });

  // ... 其他 handlers
}
```

### 模块注册模式

```typescript
// modules/task/index.ts
import { registerTaskTemplateIpcHandlers } from './ipc/task-template.ipc-handlers';
import { registerTaskInstanceIpcHandlers } from './ipc/task-instance.ipc-handlers';
import { registerTaskDependencyIpcHandlers } from './ipc/task-dependency.ipc-handlers';
import { registerTaskStatisticsIpcHandlers } from './ipc/task-statistics.ipc-handlers';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

export function registerTaskModule(): void {
  InitializationManager.getInstance().registerModule(
    'task',
    InitializationPhase.CORE_SERVICES,
    async () => {
      registerTaskTemplateIpcHandlers();
      registerTaskInstanceIpcHandlers();
      registerTaskDependencyIpcHandlers();
      registerTaskStatisticsIpcHandlers();
    }
  );
}
```

---

## ✅ 验收标准

1. **功能完整性**：所有 IPC channels 返回真实数据，无 TODO 占位符
2. **架构合规**：Main 进程遵循 DDD 分层（Application → Domain → Infrastructure）
3. **代码复用**：所有模块复用 `@dailyuse/application-server`
4. **测试覆盖**：每个 ApplicationService 有单元测试，IPC channels 有集成测试
5. **性能**：启动时间不超过现有水平（使用懒加载优化）

---

## 📚 参考资料

- [DDD 类型架构规范](./architecture/ddd-type-architecture.md)
- [Desktop 应用架构](./architecture/desktop-architecture.md)
- [API 模块结构示例](../apps/api/src/modules/goal/)
- [Web 模块结构示例](../apps/web/src/modules/goal/)
- [@dailyuse/application-server 源码](../packages/application-server/src/)
