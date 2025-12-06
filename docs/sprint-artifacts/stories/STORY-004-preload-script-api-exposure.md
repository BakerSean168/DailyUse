# STORY-004: Preload 脚本 API 暴露

## 📋 Story 概述

**Story ID**: STORY-004  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P0 (阻塞其他 Story)  
**预估工时**: 2 天  
**状态**: 🔵 Ready for Dev  

---

## 🎯 用户故事

**作为** 桌面应用开发者  
**我希望** Preload 脚本暴露完整的 IPC API  
**以便于** IPC 适配器能够正确调用主进程服务，实现渲染进程与主进程的类型安全通信  

---

## 📋 验收标准

### 功能验收

- [ ] Preload 脚本暴露所有 11 个模块的 IPC 方法
- [ ] 每个方法的签名与 IPC 适配器期望一致
- [ ] 主进程注册对应的 IPC Handler
- [ ] 渲染进程调用 → 主进程处理 → 返回结果 流程正常

### 技术验收

- [ ] `preload/main.ts` 更新完成
- [ ] 主进程 IPC Handler 注册完成
- [ ] TypeScript 类型安全
- [ ] 无安全警告

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

## 📚 参考资料

- 现有文件: `apps/desktop/src/preload/main.ts`
- IPC 适配器: `packages/infrastructure-client/src/*/adapters/*-ipc.adapter.ts`
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
