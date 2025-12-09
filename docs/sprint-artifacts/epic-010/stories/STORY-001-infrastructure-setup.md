# STORY-001: 基础设施准备

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 1  
> **预估**: 4 小时  
> **优先级**: P0 (阻塞其他所有 Story)

---

## 📋 概述

配置 Desktop 项目以正确引用 `@dailyuse/application-server`，建立模块化目录结构骨架。

---

## 🎯 目标

1. 确保 Desktop 可以正确使用 `@dailyuse/application-server` 包
2. 创建新的模块化目录结构
3. 更新依赖注入配置

---

## ✅ 验收标准 (AC)

### AC-1: 依赖配置
```gherkin
Given Desktop 项目的 package.json
When 检查 dependencies
Then 应包含 "@dailyuse/application-server": "workspace:*"
And 应包含 "@dailyuse/domain-server": "workspace:*"
And 应包含 "@dailyuse/infrastructure-server": "workspace:*"
And 应包含 "@dailyuse/contracts": "workspace:*"
And 应包含 "@dailyuse/utils": "workspace:*"
```

### AC-2: 模块目录结构
```gherkin
Given Desktop Main 进程目录
When 查看 src/main/modules/
Then 应存在以下模块目录骨架:
  - goal/
  - task/
  - schedule/
  - reminder/
  - notification/
  - dashboard/
  - account/
  - authentication/
  - ai/
  - repository/
  - setting/
  - editor/
And 每个模块目录应包含:
  - application/
  - ipc/
  - index.ts
```

### AC-3: 导入验证
```gherkin
Given 模块目录已创建
When 在任意模块中导入 application-server
Then 应能成功编译
And TypeScript 不报错
```

---

## 📁 任务清单

### Task 1.1: 检查并更新 package.json
**文件**: `apps/desktop/package.json`

```json
{
  "dependencies": {
    "@dailyuse/application-server": "workspace:*",
    "@dailyuse/domain-server": "workspace:*",
    "@dailyuse/infrastructure-server": "workspace:*",
    "@dailyuse/contracts": "workspace:*",
    "@dailyuse/utils": "workspace:*"
    // ... 其他依赖
  }
}
```

### Task 1.2: 创建模块目录结构

```bash
# 创建模块骨架
mkdir -p apps/desktop/src/main/modules/{goal,task,schedule,reminder,notification,dashboard,account,authentication,ai,repository,setting,editor}/{application,ipc}

# 创建 shared 目录
mkdir -p apps/desktop/src/main/shared/{services/electron,initialization}
```

### Task 1.3: 创建模块 index.ts 模板

每个模块的 `index.ts`:

```typescript
// modules/{module}/index.ts
/**
 * {Module} Module - Desktop Main Process
 * 
 * 模块入口，负责注册 IPC handlers 和初始化
 */

import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

// TODO: 导入 IPC handlers
// import { register{Module}IpcHandlers } from './ipc/{module}.ipc-handlers';

export function register{Module}Module(): void {
  InitializationManager.getInstance().registerModule(
    '{module}',
    InitializationPhase.CORE_SERVICES,
    async () => {
      // TODO: 注册 IPC handlers
      console.log('[{Module}Module] Registered');
    }
  );
}
```

### Task 1.4: 创建模块注册入口

**文件**: `apps/desktop/src/main/modules/index.ts`

```typescript
/**
 * 模块注册入口
 * 
 * 集中管理所有业务模块的注册
 */

export { registerGoalModule } from './goal';
export { registerTaskModule } from './task';
export { registerScheduleModule } from './schedule';
export { registerReminderModule } from './reminder';
export { registerNotificationModule } from './notification';
export { registerDashboardModule } from './dashboard';
export { registerAccountModule } from './account';
export { registerAuthModule } from './authentication';
export { registerAIModule } from './ai';
export { registerRepositoryModule } from './repository';
export { registerSettingModule } from './setting';
export { registerEditorModule } from './editor';

/**
 * 注册所有模块
 */
export function registerAllModules(): void {
  // 核心模块
  registerGoalModule();
  registerTaskModule();
  registerScheduleModule();
  registerDashboardModule();
  
  // 用户相关
  registerAccountModule();
  registerAuthModule();
  
  // 功能模块
  registerReminderModule();
  registerNotificationModule();
  registerAIModule();
  registerRepositoryModule();
  registerSettingModule();
  registerEditorModule();
}
```

### Task 1.5: 验证编译

```bash
cd apps/desktop
pnpm build
```

---

## 📚 技术上下文

### 相关包结构

```
@dailyuse/application-server
├── goal/       - GoalApplicationService
├── task/       - CreateTaskTemplate, ListTaskTemplates, CompleteTaskInstance...
├── schedule/   - CreateScheduleTask, ListScheduleTasks...
├── reminder/   - CreateReminderTemplate, ListReminderTemplates...
├── notification/ - NotificationApplicationService
├── account/    - AccountApplicationService
├── authentication/ - AuthenticationApplicationService
├── ai/         - AIApplicationService
├── dashboard/  - DashboardApplicationService
├── repository/ - RepositoryApplicationService
└── setting/    - SettingApplicationService

@dailyuse/infrastructure-server
├── GoalContainer
├── TaskContainer
├── ScheduleContainer
├── ReminderContainer
├── NotificationContainer
├── AccountContainer
├── AuthContainer
├── AIContainer
├── DashboardContainer
├── RepositoryContainer
└── SettingContainer
```

### 当前 Desktop 目录结构（重构前）

```
apps/desktop/src/main/
├── main.ts
├── database/
├── di/
│   ├── desktop-main.composition-root.ts
│   ├── lazy-module-loader.ts
│   └── sqlite-adapters/
├── events/
├── ipc/                          # ← 将被迁移到 modules/*/ipc/
│   ├── goal.ipc-handlers.ts
│   ├── task.ipc-handlers.ts
│   └── ...
├── modules/                      # ← 当前只有 Electron 特有模块
│   ├── autolaunch/
│   ├── shortcuts/
│   ├── tray/
│   └── window/
├── services/                     # ← 将被迁移到 modules/*/services/
│   └── notification.service.ts
└── utils/
```

---

## 🔗 依赖关系

- **阻塞**: 所有其他 Stories (STORY-002 ~ STORY-014)
- **被阻塞**: 无

---

## 📝 备注

- 此 Story 只创建骨架，不实现具体功能
- 保留现有 `ipc/` 目录，后续 Story 逐步迁移
- Electron 特有模块（autolaunch, shortcuts, tray, window）保持在 `modules/` 下，但移到 `shared/services/electron/`
