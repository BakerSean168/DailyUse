# STORY-004: Preload 脚本 API 暴露

## 📋 Story 概述

**Story ID**: STORY-004  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P0 (阻塞其他 Story)  
**预估工时**: 2 天  
**状态**: ✅ Completed  

---

## 🎯 用户故事

**作为** 桌面应用开发者  
**我希望** Preload 脚本暴露完整的 IPC API  
**以便于** IPC 适配器能够正确调用主进程服务，实现渲染进程与主进程的类型安全通信  

---

## 📋 验收标准

### 功能验收

- [x] Preload 脚本暴露所有 11 个模块的 IPC 方法
- [x] 每个方法的签名与 IPC 适配器期望一致
- [x] 主进程注册对应的 IPC Handler
- [ ] 渲染进程调用 → 主进程处理 → 返回结果 流程正常 (需运行时验证)

### 技术验收

- [x] `preload/preload.ts` 实现完成 (使用通用 invoke 模式)
- [x] 主进程 IPC Handler 注册完成 (12 个模块)
- [x] TypeScript 类型安全
- [x] 无安全警告 (使用白名单机制)

---

## 📐 技术设计

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              IPC Adapters (infrastructure-client)    │    │
│  │                                                       │    │
│  │  GoalIpcAdapter.getAll()                             │    │
│  │        ↓                                              │    │
│  │  window.electronAPI.goal.getAll()                    │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                      Preload Script                          │
│                                                              │
│  contextBridge.exposeInMainWorld('electronAPI', {            │
│    goal: {                                                   │
│      getAll: () => ipcRenderer.invoke('goal:getAll'),        │
│      create: (data) => ipcRenderer.invoke('goal:create', data),│
│      ...                                                     │
│    },                                                        │
│    task: { ... },                                            │
│    schedule: { ... },                                        │
│    ... (11 modules)                                          │
│  })                                                          │
│                                                              │
└─────────────────────────┬────────────────────────────────────┘
                          │ IPC Channel
┌─────────────────────────▼────────────────────────────────────┐
│                      Main Process                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  IPC Handlers                        │    │
│  │                                                       │    │
│  │  ipcMain.handle('goal:getAll', async () => {         │    │
│  │    const container = GoalContainer.getInstance();    │    │
│  │    const repo = container.getGoalRepository();       │    │
│  │    return repo.findAll();                            │    │
│  │  });                                                  │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Containers (infrastructure-server)            │    │
│  │                    ↓                                  │    │
│  │        SQLite Repositories                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 文件结构

```
apps/desktop/src/
├── preload/
│   ├── main.ts                           # 主 Preload 脚本
│   ├── channels/                         # IPC 通道定义
│   │   ├── index.ts
│   │   ├── goal.channels.ts
│   │   ├── task.channels.ts
│   │   ├── schedule.channels.ts
│   │   ├── reminder.channels.ts
│   │   ├── account.channels.ts
│   │   ├── auth.channels.ts
│   │   ├── notification.channels.ts
│   │   ├── ai.channels.ts
│   │   ├── dashboard.channels.ts
│   │   ├── repository.channels.ts
│   │   └── setting.channels.ts
│   └── types/
│       └── api.ts                        # ElectronAPI 类型定义
│
└── main/
    └── ipc-handlers/                     # 主进程 IPC 处理器
        ├── index.ts                      # 统一注册
        ├── goal.handler.ts
        ├── task.handler.ts
        ├── schedule.handler.ts
        ├── reminder.handler.ts
        ├── account.handler.ts
        ├── auth.handler.ts
        ├── notification.handler.ts
        ├── ai.handler.ts
        ├── dashboard.handler.ts
        ├── repository.handler.ts
        └── setting.handler.ts
```

---

## 📝 Task 分解

### Task 4.1: 审计 IPC 适配器需求

**工时**: 0.5 天

**输入**:
- `@dailyuse/infrastructure-client` 中所有 IPC 适配器

**输出**:
- IPC 通道清单文档

**执行命令**:
```bash
# 收集所有 IPC 调用
grep -r "ipcRenderer\|electronApi" packages/infrastructure-client/src --include="*.ts" | grep -oP "invoke\(['\"][\w:]+['\"]" | sort -u
```

**IPC 通道清单**:

| 模块 | 通道 | 方法 |
|------|------|------|
| Goal | `goal:getAll` | 获取所有目标 |
| Goal | `goal:getById` | 根据 ID 获取目标 |
| Goal | `goal:create` | 创建目标 |
| Goal | `goal:update` | 更新目标 |
| Goal | `goal:delete` | 删除目标 |
| Goal | `goal-folder:getAll` | 获取所有文件夹 |
| ... | ... | ... |

**验收**:
- [ ] 完整的 IPC 通道清单
- [ ] 每个通道的参数和返回类型

---

### Task 4.2: 扩展 Preload 脚本

**工时**: 0.5 天

**输入**:
- IPC 通道清单
- 现有 `preload/main.ts`

**输出**:
- 更新后的 `preload/main.ts`
- 模块化的 channels 文件

**实现示例**:
```typescript
// preload/main.ts
import { contextBridge, ipcRenderer } from 'electron';
import { goalChannels } from './channels/goal.channels';
import { taskChannels } from './channels/task.channels';
// ... 其他模块

const electronAPI = {
  goal: goalChannels,
  task: taskChannels,
  schedule: scheduleChannels,
  reminder: reminderChannels,
  account: accountChannels,
  auth: authChannels,
  notification: notificationChannels,
  ai: aiChannels,
  dashboard: dashboardChannels,
  repository: repositoryChannels,
  setting: settingChannels,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

```typescript
// preload/channels/goal.channels.ts
import { ipcRenderer } from 'electron';

export const goalChannels = {
  getAll: () => ipcRenderer.invoke('goal:getAll'),
  getById: (id: string) => ipcRenderer.invoke('goal:getById', id),
  create: (data: any) => ipcRenderer.invoke('goal:create', data),
  update: (id: string, data: any) => ipcRenderer.invoke('goal:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('goal:delete', id),
  
  // Folder
  getAllFolders: () => ipcRenderer.invoke('goal-folder:getAll'),
  createFolder: (data: any) => ipcRenderer.invoke('goal-folder:create', data),
  // ...
};
```

**验收**:
- [ ] 所有模块的 channels 定义完成
- [ ] contextBridge 正确暴露

---

### Task 4.3: 主进程 IPC Handler 注册

**工时**: 1 天

**输入**:
- IPC 通道清单
- STORY-002 完成的 Container

**输出**:
- 11 个 IPC Handler 文件
- 统一注册入口

**实现示例**:
```typescript
// main/ipc-handlers/goal.handler.ts
import { ipcMain } from 'electron';
import { GoalContainer } from '@dailyuse/infrastructure-server';

export function registerGoalHandlers(): void {
  const container = GoalContainer.getInstance();

  ipcMain.handle('goal:getAll', async () => {
    const repo = container.getGoalRepository();
    return repo.findAll();
  });

  ipcMain.handle('goal:getById', async (_, id: string) => {
    const repo = container.getGoalRepository();
    return repo.findById(id);
  });

  ipcMain.handle('goal:create', async (_, data) => {
    const repo = container.getGoalRepository();
    return repo.create(data);
  });

  ipcMain.handle('goal:update', async (_, id: string, data) => {
    const repo = container.getGoalRepository();
    return repo.update(id, data);
  });

  ipcMain.handle('goal:delete', async (_, id: string) => {
    const repo = container.getGoalRepository();
    return repo.delete(id);
  });

  // Folder handlers
  ipcMain.handle('goal-folder:getAll', async () => {
    const repo = container.getGoalFolderRepository();
    return repo.findAll();
  });

  // ...
}
```

```typescript
// main/ipc-handlers/index.ts
import { registerGoalHandlers } from './goal.handler';
import { registerTaskHandlers } from './task.handler';
// ... 其他模块

export function registerAllIpcHandlers(): void {
  registerGoalHandlers();
  registerTaskHandlers();
  registerScheduleHandlers();
  registerReminderHandlers();
  registerAccountHandlers();
  registerAuthHandlers();
  registerNotificationHandlers();
  registerAIHandlers();
  registerDashboardHandlers();
  registerRepositoryHandlers();
  registerSettingHandlers();
  
  console.log('✅ All IPC handlers registered');
}
```

**验收**:
- [ ] 所有 Handler 注册完成
- [ ] 在 appInitializer 中调用 registerAllIpcHandlers

---

## 🔗 依赖关系

### 前置依赖

- ✅ STORY-001 (包提取) - 已完成
- ⏳ STORY-002 (主进程 DI) - 需要 Container 可用

### 后续影响

- 🔜 STORY-003 (渲染进程 DI) - 需要 Preload API
- 🔜 所有 UI Story - 依赖本 Story

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| IPC 通道名称不一致 | 高 | 高 | 使用常量定义通道名 |
| 序列化问题 | 中 | 中 | 确保只传递可序列化数据 |
| 错误处理不完整 | 中 | 中 | Handler 中统一 try-catch |

---

## 🏗️ 技术实现方案 (架构师补充)

### 1. 关键设计决策: 简化 Preload API

**问题**: PM 创建的方案使用了模块化 API (如 `window.electronAPI.goal.create()`)，但 IPC 适配器期望的是统一的 invoke/on/off 接口。

**决策**: 采用简单的 invoke/on/off 模式，与 `@dailyuse/infrastructure-client` 的 `ElectronAPI` 接口完全一致。

```typescript
// ✅ 正确方式: 简单的 invoke/on/off
interface ElectronAPI {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (...args: unknown[]) => void): void;
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

// ❌ 错误方式: 模块化 API (IPC 适配器无法使用)
interface ElectronAPI {
  goal: { create: (data) => Promise<Goal>, ... };
  task: { ... };
}
```

### 2. 完整 Preload 脚本实现

```typescript
// apps/desktop/src/preload/main.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * 允许的 IPC 通道白名单
 * 防止渲染进程调用未授权的通道
 */
const ALLOWED_INVOKE_CHANNELS = [
  // Goal (21)
  'goal:create', 'goal:list', 'goal:get', 'goal:update', 'goal:delete',
  'goal:activate', 'goal:pause', 'goal:complete', 'goal:archive', 'goal:search',
  'goal:keyResult:add', 'goal:keyResult:list', 'goal:keyResult:update', 
  'goal:keyResult:delete', 'goal:keyResult:batchUpdateWeights', 'goal:progressBreakdown',
  'goal:review:create', 'goal:review:list', 'goal:review:update', 'goal:review:delete',
  'goal:record:create', 'goal:record:list', 'goal:aggregate',
  
  // GoalFolder (5)
  'goalFolder:create', 'goalFolder:list', 'goalFolder:get', 'goalFolder:update', 'goalFolder:delete',
  
  // Task Template (12)
  'taskTemplate:create', 'taskTemplate:list', 'taskTemplate:get', 'taskTemplate:update', 
  'taskTemplate:delete', 'taskTemplate:activate', 'taskTemplate:pause', 'taskTemplate:archive',
  'taskTemplate:generate', 'taskTemplate:instances', 'taskTemplate:bindGoal', 'taskTemplate:unbindGoal',
  
  // Task Instance (7)
  'taskInstance:list', 'taskInstance:get', 'taskInstance:delete',
  'taskInstance:start', 'taskInstance:complete', 'taskInstance:skip', 'taskInstance:checkExpired',
  
  // Task Dependency (7)
  'taskDependency:create', 'taskDependency:list', 'taskDependency:dependents',
  'taskDependency:chain', 'taskDependency:validate', 'taskDependency:delete', 'taskDependency:update',
  
  // Task Statistics (9)
  'taskStatistics:get', 'taskStatistics:recalculate', 'taskStatistics:delete',
  'taskStatistics:updateTemplate', 'taskStatistics:updateInstance', 'taskStatistics:updateCompletion',
  'taskStatistics:todayRate', 'taskStatistics:weekRate', 'taskStatistics:trend',
  
  // Schedule Event (10)
  'schedule:create', 'schedule:get', 'schedule:list', 'schedule:timeRange',
  'schedule:update', 'schedule:delete', 'schedule:conflicts', 'schedule:detectConflicts',
  'schedule:createWithConflict', 'schedule:resolveConflict',
  
  // Schedule Task (18)
  'scheduleTask:create', 'scheduleTask:createBatch', 'scheduleTask:list', 'scheduleTask:get',
  'scheduleTask:due', 'scheduleTask:bySource', 'scheduleTask:pause', 'scheduleTask:resume',
  'scheduleTask:complete', 'scheduleTask:cancel', 'scheduleTask:delete', 'scheduleTask:deleteBatch',
  'scheduleTask:updateMetadata', 'scheduleTask:statistics', 'scheduleTask:moduleStats',
  'scheduleTask:allModuleStats', 'scheduleTask:recalculate', 'scheduleTask:reset',
  
  // Reminder (18)
  'reminder:template:create', 'reminder:template:get', 'reminder:template:list',
  'reminder:template:user', 'reminder:template:update', 'reminder:template:delete',
  'reminder:template:toggle', 'reminder:template:move', 'reminder:template:search',
  'reminder:template:scheduleStatus', 'reminder:upcoming',
  'reminder:group:create', 'reminder:group:get', 'reminder:group:list', 'reminder:group:user',
  'reminder:group:update', 'reminder:group:delete', 'reminder:group:toggle', 'reminder:group:controlMode',
  'reminder:statistics',
  
  // Account (20)
  'account:create', 'account:get', 'account:list', 'account:delete',
  'account:myProfile', 'account:updateMyProfile', 'account:changePassword',
  'account:updateProfile', 'account:updatePreferences', 'account:updateEmail',
  'account:verifyEmail', 'account:updatePhone', 'account:verifyPhone',
  'account:deactivate', 'account:suspend', 'account:activate',
  'account:subscription', 'account:subscribe', 'account:cancelSubscription', 'account:history',
  
  // Auth (16)
  'auth:login', 'auth:register', 'auth:logout', 'auth:refresh',
  'auth:forgotPassword', 'auth:resetPassword', 'auth:changePassword',
  'auth:createApiKey', 'auth:getApiKeys', 'auth:revokeApiKey',
  'auth:sessions', 'auth:revokeSession', 'auth:revokeAllSessions',
  'auth:trustDevice', 'auth:revokeTrustedDevice', 'auth:trustedDevices',
  
  // Notification (8)
  'notification:create', 'notification:list', 'notification:get',
  'notification:markRead', 'notification:markAllRead', 'notification:delete',
  'notification:batchDelete', 'notification:unreadCount',
  
  // AI Conversation (7)
  'ai:conversation:create', 'ai:conversation:list', 'ai:conversation:get',
  'ai:conversation:update', 'ai:conversation:delete', 'ai:conversation:close', 'ai:conversation:archive',
  
  // AI Message (3)
  'ai:message:send', 'ai:message:list', 'ai:message:delete',
  
  // AI Generation Task (8)
  'ai:generation-task:create', 'ai:generation-task:list', 'ai:generation-task:get',
  'ai:generation-task:cancel', 'ai:generation-task:retry',
  'ai:generation-task:goal', 'ai:generation-task:goalWithKR', 'ai:generation-task:keyResults',
  
  // AI Provider (8)
  'ai:provider:create', 'ai:provider:list', 'ai:provider:get', 'ai:provider:update',
  'ai:provider:delete', 'ai:provider:test', 'ai:provider:setDefault', 'ai:provider:refreshModels',
  
  // AI Quota (3)
  'ai:quota:get', 'ai:quota:update', 'ai:quota:check',
  
  // Dashboard (5)
  'dashboard:statistics', 'dashboard:refresh', 'dashboard:config', 
  'dashboard:updateConfig', 'dashboard:resetConfig',
  
  // Repository (15)
  'repository:create', 'repository:list', 'repository:get', 'repository:delete',
  'repository:folder:create', 'repository:folder:contents', 'repository:folder:rename',
  'repository:folder:move', 'repository:folder:delete', 'repository:fileTree',
  'repository:search', 'repository:resource:get', 'repository:resource:rename',
  'repository:resource:move', 'repository:resource:delete',
  
  // Setting (10)
  'setting:user', 'setting:appearance', 'setting:locale', 'setting:workflow',
  'setting:privacy', 'setting:reset', 'setting:appConfig', 'setting:sync',
  'setting:export', 'setting:import',
];

const ALLOWED_LISTEN_CHANNELS = [
  // 主进程 → 渲染进程 的事件
  'ai:message:chunk',           // AI 流式响应
  'notification:new',           // 新通知
  'notification:closed',        // 通知已关闭
  'navigate',                   // 导航请求
  'action:quickNote',           // 快速记录
  'sync:status',                // 同步状态
  'app:focus',                  // 窗口聚焦
];

/**
 * 暴露给渲染进程的 API
 * 完全匹配 @dailyuse/infrastructure-client 的 ElectronAPI 接口
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 调用主进程 IPC Handler
   */
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    if (!ALLOWED_INVOKE_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  
  /**
   * 监听主进程事件
   */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!ALLOWED_LISTEN_CHANNELS.includes(channel)) {
      console.warn(`IPC channel not allowed for listening: ${channel}`);
      return;
    }
    
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };
    
    ipcRenderer.on(channel, subscription);
  },
  
  /**
   * 移除事件监听
   */
  off: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback as any);
  },
});

// 类型声明
export {};
```

### 3. IPC 通道统计

| 模块 | 通道数量 | 备注 |
|------|---------|------|
| Goal | 23 | 含 KeyResult, Review, Record |
| GoalFolder | 5 | - |
| TaskTemplate | 12 | - |
| TaskInstance | 7 | - |
| TaskDependency | 7 | - |
| TaskStatistics | 9 | - |
| ScheduleEvent | 10 | - |
| ScheduleTask | 18 | - |
| Reminder | 20 | 含 Template, Group |
| Account | 20 | - |
| Auth | 16 | - |
| Notification | 8 | - |
| AI:Conversation | 7 | - |
| AI:Message | 3 | - |
| AI:GenerationTask | 8 | - |
| AI:Provider | 8 | - |
| AI:Quota | 3 | - |
| Dashboard | 5 | - |
| Repository | 15 | - |
| Setting | 10 | - |
| **总计** | **~204** | - |

### 4. 安全最佳实践

```typescript
// ❌ 不安全: 暴露原始 ipcRenderer
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer, // 危险！
});

// ✅ 安全: 白名单 + 包装
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      throw new Error('Channel not allowed');
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
```

### 5. 依赖顺序

```
STORY-002 (主进程 DI) 
    ↓ 提供 Container
STORY-004 (Preload + IPC Handlers) ← 当前 Story
    ↓ 提供 window.electronAPI
STORY-003 (渲染进程 DI)
    ↓ 调用 configureDesktopDependencies
所有 UI Stories
```

---

## 📚 参考资料

- IPC 适配器: `packages/infrastructure-client/src/*/adapters/ipc/*.ts`
- ElectronAPI 接口: `packages/infrastructure-client/src/shared/ipc-client.types.ts`
- Electron 文档: [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge)

---

## ✅ 完成定义 (DoD)

- [ ] 代码实现完成
- [ ] TypeScript 编译通过
- [ ] 所有 IPC 通道可用
- [ ] 端到端通信测试通过 (至少 Goal 模块)
- [ ] 代码已提交到分支
- [ ] PR 创建并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: STORY-002 完成后  
