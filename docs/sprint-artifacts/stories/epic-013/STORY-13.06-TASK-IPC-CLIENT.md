# Story 13.6: Task 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.6 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

创建完整的 Task IPC Client，作为其他模块 IPC Client 的参考实现。

## 背景

Task 模块是 DailyUse 的核心模块之一，当前 Renderer 端使用 `@dailyuse/application-client` (HTTP API 模式)，需要替换为 IPC Client 模式。

## 任务列表

- [ ] 1. 创建 `renderer/modules/task/infrastructure/ipc/` 目录
- [ ] 2. 实现 `TaskTemplateIPCClient`
  - [ ] create(input) - 创建任务模板
  - [ ] get(uuid) - 获取任务模板
  - [ ] list(filter) - 列出任务模板
  - [ ] update(uuid, input) - 更新任务模板
  - [ ] delete(uuid) - 删除任务模板
  - [ ] archive(uuid) - 归档任务模板
  - [ ] restore(uuid) - 恢复任务模板
  - [ ] batchUpdate(uuids, input) - 批量更新
- [ ] 3. 实现 `TaskInstanceIPCClient`
  - [ ] create(templateUuid) - 创建任务实例
  - [ ] get(uuid) - 获取任务实例
  - [ ] list(filter) - 列出任务实例
  - [ ] complete(uuid) - 完成任务实例
  - [ ] skip(uuid) - 跳过任务实例
  - [ ] reschedule(uuid, newDate) - 重新安排
- [ ] 4. 实现 `TaskStatisticsIPCClient`
  - [ ] getStatistics(accountUuid, dateRange) - 获取统计
  - [ ] getDashboard(accountUuid) - 获取仪表板数据
  - [ ] getCompletionTrend(accountUuid, period) - 完成趋势
- [ ] 5. 添加完整的 TypeScript 类型
- [ ] 6. 添加单元测试

## 技术设计

### 目录结构

```
renderer/modules/task/infrastructure/ipc/
├── task-template.ipc-client.ts
├── task-instance.ipc-client.ts
├── task-statistics.ipc-client.ts
├── types.ts
└── index.ts
```

### TaskTemplateIPCClient

```typescript
import { BaseIPCClient } from '@/shared/infrastructure/ipc';
import { IPC_CHANNELS } from '@/shared/types/ipc-channels';
import type {
  TaskTemplateClientDTO,
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  ListTaskTemplatesFilter,
} from '@dailyuse/contracts/task';

export class TaskTemplateIPCClient extends BaseIPCClient {
  async create(input: CreateTaskTemplateInput): Promise<TaskTemplateClientDTO> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.CREATE, input);
  }

  async get(uuid: string): Promise<TaskTemplateClientDTO | null> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.GET, { uuid });
  }

  async list(filter?: ListTaskTemplatesFilter): Promise<TaskTemplateClientDTO[]> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.LIST, filter);
  }

  async update(uuid: string, input: UpdateTaskTemplateInput): Promise<TaskTemplateClientDTO> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.UPDATE, { uuid, ...input });
  }

  async delete(uuid: string): Promise<void> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.DELETE, { uuid });
  }

  async archive(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.ARCHIVE, { uuid });
  }

  async restore(uuid: string): Promise<TaskTemplateClientDTO> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.RESTORE, { uuid });
  }

  async batchUpdate(
    uuids: string[], 
    input: Partial<UpdateTaskTemplateInput>
  ): Promise<TaskTemplateClientDTO[]> {
    return this.invoke(IPC_CHANNELS.TASK.TEMPLATE.BATCH_UPDATE, { uuids, ...input });
  }
}

export const taskTemplateIPCClient = new TaskTemplateIPCClient();
```

### 与 Web 端接口对比

| Web (ApiClient) | Desktop (IPCClient) | 备注 |
|-----------------|---------------------|------|
| `taskTemplateApiClient.create()` | `taskTemplateIPCClient.create()` | 接口一致 |
| `taskTemplateApiClient.get()` | `taskTemplateIPCClient.get()` | 接口一致 |
| 使用 HTTP/REST | 使用 Electron IPC | 传输层不同 |

## 验收标准

- [ ] 所有 Task Template 方法实现完整
- [ ] 所有 Task Instance 方法实现完整
- [ ] 所有 Task Statistics 方法实现完整
- [ ] 与 Web `TaskTemplateApiClient` 接口保持一致
- [ ] TypeScript 类型完整无错误
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/task/infrastructure/ipc/task-template.ipc-client.ts` | 新建 | Template IPC Client |
| `renderer/modules/task/infrastructure/ipc/task-instance.ipc-client.ts` | 新建 | Instance IPC Client |
| `renderer/modules/task/infrastructure/ipc/task-statistics.ipc-client.ts` | 新建 | Statistics IPC Client |
| `renderer/modules/task/infrastructure/ipc/types.ts` | 新建 | 类型定义 |
| `renderer/modules/task/infrastructure/ipc/index.ts` | 新建 | 导出 |
| `renderer/modules/task/infrastructure/ipc/__tests__/` | 新建 | 测试 |

## 依赖关系

- **前置依赖**: Stories 13.1, 13.4
- **后续依赖**: Story 13.7 (Task DI Container), Story 13.8 (Task Store 重构)

## 参考实现

- Main Process Handler: `main/modules/task/ipc/task-ipc-handler.ts`
- Web ApiClient: `apps/web/src/infrastructure/api/task/`
