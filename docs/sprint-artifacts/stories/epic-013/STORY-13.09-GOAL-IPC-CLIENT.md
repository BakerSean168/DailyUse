# Story 13.9: Goal 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.9 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 5h |
| 状态 | Backlog |

## 目标

为 Goal 模块创建完整的 IPC Client 实现，包括目标管理和进度追踪功能。

## 背景

Goal 是核心业务模块，管理用户的长期目标和进度追踪。在 Desktop 中需要提供高效的本地数据访问。

## 任务列表

- [ ] 1. 创建 `renderer/modules/goal/infrastructure/ipc/` 目录
- [ ] 2. 实现 `GoalIPCClient`
  - [ ] create(input) - 创建目标
  - [ ] get(uuid) - 获取目标
  - [ ] list(filter) - 列出目标
  - [ ] update(uuid, input) - 更新目标
  - [ ] delete(uuid) - 删除目标
  - [ ] archive(uuid) - 归档目标
  - [ ] restore(uuid) - 恢复目标
- [ ] 3. 实现 `GoalProgressIPCClient`
  - [ ] addProgress(goalUuid, value) - 添加进度
  - [ ] getHistory(goalUuid) - 获取进度历史
  - [ ] getStatistics(goalUuid) - 获取统计
- [ ] 4. 实现 `GoalTaskLinkIPCClient`
  - [ ] linkTask(goalUuid, taskUuid) - 关联任务
  - [ ] unlinkTask(goalUuid, taskUuid) - 取消关联
  - [ ] getLinkedTasks(goalUuid) - 获取关联任务
- [ ] 5. 添加类型定义
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/goal/infrastructure/ipc/
├── goal.ipc-client.ts
├── goal-progress.ipc-client.ts
├── goal-task-link.ipc-client.ts
├── types.ts
└── index.ts
```

### GoalIPCClient

```typescript
// renderer/modules/goal/infrastructure/ipc/goal.ipc-client.ts
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';
import type {
  GoalClientDTO,
  CreateGoalInput,
  UpdateGoalInput,
  ListGoalsFilter,
} from '@dailyuse/contracts/goal';

export class GoalIPCClient extends BaseIPCClient {
  async create(input: CreateGoalInput): Promise<GoalClientDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.CREATE, input);
  }

  async get(uuid: string): Promise<GoalClientDTO | null> {
    return this.invoke(IPC_CHANNELS.GOAL.GET, { uuid });
  }

  async list(filter?: ListGoalsFilter): Promise<GoalClientDTO[]> {
    return this.invoke(IPC_CHANNELS.GOAL.LIST, filter);
  }

  async update(uuid: string, input: UpdateGoalInput): Promise<GoalClientDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.UPDATE, { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.DELETE, { uuid });
  }

  async archive(uuid: string): Promise<GoalClientDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.ARCHIVE, { uuid });
  }

  async restore(uuid: string): Promise<GoalClientDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.RESTORE, { uuid });
  }

  async getWithProgress(uuid: string): Promise<GoalWithProgressDTO> {
    return this.invoke(IPC_CHANNELS.GOAL.GET_WITH_PROGRESS, { uuid });
  }
}
```

### GoalProgressIPCClient

```typescript
// renderer/modules/goal/infrastructure/ipc/goal-progress.ipc-client.ts
export class GoalProgressIPCClient extends BaseIPCClient {
  async addProgress(goalUuid: string, value: number, note?: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.PROGRESS.ADD, { goalUuid, value, note });
  }

  async getHistory(
    goalUuid: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<GoalProgressEntry[]> {
    return this.invoke(IPC_CHANNELS.GOAL.PROGRESS.HISTORY, { goalUuid, ...options });
  }

  async getStatistics(goalUuid: string): Promise<GoalProgressStatistics> {
    return this.invoke(IPC_CHANNELS.GOAL.PROGRESS.STATISTICS, { goalUuid });
  }

  async updateProgress(entryUuid: string, value: number): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.PROGRESS.UPDATE, { entryUuid, value });
  }

  async deleteProgress(entryUuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.PROGRESS.DELETE, { entryUuid });
  }
}
```

### GoalTaskLinkIPCClient

```typescript
// renderer/modules/goal/infrastructure/ipc/goal-task-link.ipc-client.ts
export class GoalTaskLinkIPCClient extends BaseIPCClient {
  async linkTask(goalUuid: string, taskUuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.TASK.LINK, { goalUuid, taskUuid });
  }

  async unlinkTask(goalUuid: string, taskUuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.TASK.UNLINK, { goalUuid, taskUuid });
  }

  async getLinkedTasks(goalUuid: string): Promise<TaskTemplateClientDTO[]> {
    return this.invoke(IPC_CHANNELS.GOAL.TASK.LIST, { goalUuid });
  }

  async linkMultipleTasks(goalUuid: string, taskUuids: string[]): Promise<void> {
    return this.invoke(IPC_CHANNELS.GOAL.TASK.LINK_MULTIPLE, { goalUuid, taskUuids });
  }
}
```

### IPC Channels 定义

```typescript
// 在 IPC_CHANNELS 中添加
GOAL: {
  CREATE: 'goal:create',
  GET: 'goal:get',
  LIST: 'goal:list',
  UPDATE: 'goal:update',
  DELETE: 'goal:delete',
  ARCHIVE: 'goal:archive',
  RESTORE: 'goal:restore',
  GET_WITH_PROGRESS: 'goal:getWithProgress',
  PROGRESS: {
    ADD: 'goal:progress:add',
    HISTORY: 'goal:progress:history',
    STATISTICS: 'goal:progress:statistics',
    UPDATE: 'goal:progress:update',
    DELETE: 'goal:progress:delete',
  },
  TASK: {
    LINK: 'goal:task:link',
    UNLINK: 'goal:task:unlink',
    LIST: 'goal:task:list',
    LINK_MULTIPLE: 'goal:task:linkMultiple',
  },
}
```

## 验收标准

- [ ] `GoalIPCClient` 完整实现
- [ ] `GoalProgressIPCClient` 完整实现
- [ ] `GoalTaskLinkIPCClient` 完整实现
- [ ] TypeScript 类型完整无错误
- [ ] 与 Web 端 ApiClient 接口一致
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/goal/infrastructure/ipc/goal.ipc-client.ts` | 新建 | Goal IPC Client |
| `renderer/modules/goal/infrastructure/ipc/goal-progress.ipc-client.ts` | 新建 | Progress IPC Client |
| `renderer/modules/goal/infrastructure/ipc/goal-task-link.ipc-client.ts` | 新建 | Task Link IPC Client |
| `renderer/modules/goal/infrastructure/ipc/types.ts` | 新建 | 类型定义 |
| `renderer/modules/goal/infrastructure/ipc/index.ts` | 新建 | 导出 |
| `shared/types/ipc-channels.ts` | 修改 | 添加 Goal channels |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.10 (Goal DI Container), Stories 13.11-13.13 (Goal Focus)
