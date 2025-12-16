# 📦 packages/infrastructure-server

> DI Container 和服务端基础设施层实现

## 概述

`@dailyuse/infrastructure-server` 包提供服务端 (API 和 Desktop Main Process) 的依赖注入容器和仓储实现。

## 安装

```bash
pnpm add @dailyuse/infrastructure-server
```

## 主要组件

### DI Containers

每个业务模块都有独立的 DI 容器：

| 容器 | 描述 | 注册的服务 |
|------|------|-----------|
| `GoalContainer` | 目标模块 | GoalService, GoalRepository |
| `TaskContainer` | 任务模块 | TaskService, TaskRepository |
| `ScheduleContainer` | 日程模块 | ScheduleService, ScheduleRepository |
| `ReminderContainer` | 提醒模块 | ReminderService, ReminderRepository |
| `NotificationContainer` | 通知模块 | NotificationService |
| `SettingContainer` | 设置模块 | SettingService, SettingRepository |
| `AccountContainer` | 账户模块 | AccountService, AccountRepository |
| `AIContainer` | AI 模块 | AIService, AIProviderFactory |
| `RepositoryModuleContainer` | 知识库模块 | ResourceService, FolderService |

### 使用示例

```typescript
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { SqliteGoalRepository } from './sqlite-adapters';

// 注册仓储
GoalContainer.getInstance()
  .registerGoalRepository(new SqliteGoalRepository())
  .registerGoalFolderRepository(new SqliteGoalFolderRepository());

// 获取服务
const goalService = GoalContainer.getInstance().getGoalService();
const goals = await goalService.getActiveGoals(accountUuid);
```

### Container API

```typescript
// GoalContainer
interface GoalContainer {
  getInstance(): GoalContainer;
  registerGoalRepository(repo: IGoalRepository): this;
  registerGoalFolderRepository(repo: IGoalFolderRepository): this;
  registerStatisticsRepository(repo: IGoalStatisticsRepository): this;
  getGoalService(): GoalApplicationService;
  getGoalFolderService(): GoalFolderService;
}

// TaskContainer
interface TaskContainer {
  getInstance(): TaskContainer;
  registerTemplateRepository(repo: ITaskTemplateRepository): this;
  registerInstanceRepository(repo: ITaskInstanceRepository): this;
  registerStatisticsRepository(repo: ITaskStatisticsRepository): this;
  getTemplateService(): TaskTemplateService;
  getInstanceService(): TaskInstanceService;
}
```

## 目录结构

```
packages/infrastructure-server/
├── src/
│   ├── index.ts              # 公共导出
│   ├── goal/
│   │   └── GoalContainer.ts
│   ├── task/
│   │   └── TaskContainer.ts
│   ├── schedule/
│   │   └── ScheduleContainer.ts
│   ├── reminder/
│   │   └── ReminderContainer.ts
│   ├── notification/
│   │   └── NotificationContainer.ts
│   ├── setting/
│   │   └── SettingContainer.ts
│   ├── account/
│   │   └── AccountContainer.ts
│   ├── ai/
│   │   └── AIContainer.ts
│   └── repository/
│       └── RepositoryModuleContainer.ts
├── package.json
└── tsconfig.json
```

## 依赖关系

```
@dailyuse/infrastructure-server
├── @dailyuse/contracts
├── @dailyuse/utils
├── @dailyuse/domain-server
└── @dailyuse/application-server
```

## 相关文档

- [Desktop 架构](../../architecture/desktop-architecture.md)
- [API 架构](../../architecture/api-architecture.md)
- [ADR-006: Desktop IPC](../../architecture/adr/ADR-006-desktop-ipc-communication.md)
