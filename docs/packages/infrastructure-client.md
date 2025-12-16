# 📦 packages/infrastructure-client

> IPC Client 和客户端基础设施层实现

## 概述

`@dailyuse/infrastructure-client` 包提供客户端 (Desktop Renderer Process) 的 IPC 通信客户端，封装了与主进程的所有通信逻辑。

## 安装

```bash
pnpm add @dailyuse/infrastructure-client
```

## 主要组件

### IPC Clients

每个业务模块都有独立的 IPC 客户端：

| 客户端 | 描述 | IPC 通道前缀 |
|--------|------|-------------|
| `GoalIpcClient` | 目标模块 | `goal:*` |
| `TaskIpcClient` | 任务模块 | `task:*` |
| `ScheduleIpcClient` | 日程模块 | `schedule:*` |
| `ReminderIpcClient` | 提醒模块 | `reminder:*` |
| `NotificationIpcClient` | 通知模块 | `notification:*` |
| `SettingIpcClient` | 设置模块 | `setting:*` |
| `AccountIpcClient` | 账户模块 | `account:*` |
| `AIIpcClient` | AI 模块 | `ai:*` |
| `RepositoryIpcClient` | 知识库模块 | `repository:*` |
| `AutoUpdateIpcClient` | 自动更新 | `autoUpdate:*` |

### 使用示例

```typescript
import { GoalIpcClient } from '@dailyuse/infrastructure-client';

// 创建客户端实例
const goalClient = new GoalIpcClient();

// 获取活跃目标
const goals = await goalClient.getActive(accountUuid);

// 创建目标
const newGoal = await goalClient.create({
  title: '学习 TypeScript',
  type: 'LEARNING',
  targetDate: '2025-06-01',
});

// 更新目标
await goalClient.update(goalUuid, { title: '深入学习 TypeScript' });

// 删除目标
await goalClient.delete(goalUuid);
```

### IPC Client 接口

```typescript
// GoalIpcClient
interface GoalIpcClient {
  getActive(accountUuid: string): Promise<GoalClientDTO[]>;
  getById(uuid: string): Promise<GoalClientDTO | null>;
  create(data: CreateGoalDTO): Promise<GoalClientDTO>;
  update(uuid: string, data: UpdateGoalDTO): Promise<GoalClientDTO>;
  delete(uuid: string): Promise<void>;
  archive(uuid: string): Promise<void>;
  getStatistics(accountUuid: string): Promise<GoalStatistics>;
}

// TaskIpcClient
interface TaskIpcClient {
  getByGoal(goalUuid: string): Promise<TaskClientDTO[]>;
  create(data: CreateTaskDTO): Promise<TaskClientDTO>;
  update(uuid: string, data: UpdateTaskDTO): Promise<TaskClientDTO>;
  complete(uuid: string): Promise<void>;
  delete(uuid: string): Promise<void>;
}

// AutoUpdateIpcClient
interface AutoUpdateIpcClient {
  checkForUpdates(): Promise<UpdateCheckResult>;
  downloadUpdate(): Promise<void>;
  quitAndInstall(): void;
  onUpdateAvailable(callback: (info: UpdateInfo) => void): void;
  onDownloadProgress(callback: (progress: ProgressInfo) => void): void;
  onUpdateDownloaded(callback: (info: UpdateInfo) => void): void;
}
```

## 目录结构

```
packages/infrastructure-client/
├── src/
│   ├── index.ts              # 公共导出
│   ├── goal/
│   │   └── GoalIpcClient.ts
│   ├── task/
│   │   └── TaskIpcClient.ts
│   ├── schedule/
│   │   └── ScheduleIpcClient.ts
│   ├── reminder/
│   │   └── ReminderIpcClient.ts
│   ├── notification/
│   │   └── NotificationIpcClient.ts
│   ├── setting/
│   │   └── SettingIpcClient.ts
│   ├── account/
│   │   └── AccountIpcClient.ts
│   ├── ai/
│   │   └── AIIpcClient.ts
│   ├── repository/
│   │   └── RepositoryIpcClient.ts
│   └── auto-update/
│       └── AutoUpdateIpcClient.ts
├── package.json
└── tsconfig.json
```

## 类型声明

IPC Client 依赖 `window.electronAPI`，需要在全局声明类型：

```typescript
// types/electron.d.ts
declare global {
  interface Window {
    electronAPI: {
      goal: {
        getActive: (accountUuid: string) => Promise<GoalClientDTO[]>;
        create: (data: CreateGoalDTO) => Promise<GoalClientDTO>;
        update: (uuid: string, data: UpdateGoalDTO) => Promise<GoalClientDTO>;
        delete: (uuid: string) => Promise<void>;
      };
      task: {
        getByGoal: (goalUuid: string) => Promise<TaskClientDTO[]>;
        complete: (uuid: string) => Promise<void>;
      };
      // ... 其他模块
    };
  }
}
```

## 依赖关系

```
@dailyuse/infrastructure-client
├── @dailyuse/contracts
├── @dailyuse/utils
├── @dailyuse/domain-client
└── @dailyuse/application-client
```

## 相关文档

- [Desktop 架构](../../architecture/desktop-architecture.md)
- [ADR-006: Desktop IPC](../../architecture/adr/ADR-006-desktop-ipc-communication.md)
- [Infrastructure Server 包](./infrastructure-server.md)
