# Story 13.8: Task Store 重构 & UI 集成

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.8 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | High |
| 预估工时 | 6h |
| 状态 | Backlog |

## 目标

重构 Task Store 从 ApiClient 模式切换到 IPC Client 模式，并确保 UI 组件正常工作。

## 背景

当前 Task Store 使用 `@dailyuse/application-client` 的 HTTP ApiClient，需要重构为使用 IPC Client。

## 任务列表

- [ ] 1. 分析当前 Task Store 结构
  - [ ] 列出所有 action
  - [ ] 列出所有 state
  - [ ] 列出所有 getter
- [ ] 2. 重构 Store Actions
  - [ ] `createTask()` → 使用 `TaskTemplateIPCClient`
  - [ ] `fetchTask()` → 使用 `TaskTemplateIPCClient`
  - [ ] `fetchTasks()` → 使用 `TaskTemplateIPCClient`
  - [ ] `updateTask()` → 使用 `TaskTemplateIPCClient`
  - [ ] `deleteTask()` → 使用 `TaskTemplateIPCClient`
  - [ ] `archiveTask()` → 使用 `TaskTemplateIPCClient`
  - [ ] `completeTaskInstance()` → 使用 `TaskInstanceIPCClient`
- [ ] 3. 添加错误处理
  - [ ] IPC 错误捕获
  - [ ] 用户友好错误提示
- [ ] 4. 添加加载状态管理
- [ ] 5. 验证 UI 组件兼容性
- [ ] 6. 添加集成测试

## 技术设计

### 当前 Store 结构 (预估)

```typescript
// 当前可能的结构
const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [] as TaskTemplateClientDTO[],
    currentTask: null as TaskTemplateClientDTO | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchTasks() {
      this.loading = true;
      // 当前: 使用 HTTP ApiClient
      const result = await taskTemplateApiClient.list();
      // ...
    },
  },
});
```

### 重构后 Store 结构

```typescript
// renderer/modules/task/store/task.store.ts
import { defineStore } from 'pinia';
import { container } from '@/shared/infrastructure/di';
import { TASK_TOKENS } from '../di/tokens';
import type { 
  TaskTemplateClientDTO,
  CreateTaskTemplateInput,
} from '@dailyuse/contracts/task';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [] as TaskTemplateClientDTO[],
    currentTask: null as TaskTemplateClientDTO | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeTasks: (state) => state.tasks.filter(t => !t.isArchived),
    archivedTasks: (state) => state.tasks.filter(t => t.isArchived),
    taskCount: (state) => state.tasks.length,
  },

  actions: {
    // 获取 IPC Client
    getTemplateClient() {
      return container.resolve<TaskTemplateIPCClient>(
        TASK_TOKENS.TEMPLATE_IPC_CLIENT
      );
    },

    getInstanceClient() {
      return container.resolve<TaskInstanceIPCClient>(
        TASK_TOKENS.INSTANCE_IPC_CLIENT
      );
    },

    // CRUD Actions
    async fetchTasks(filter?: ListTaskTemplatesFilter) {
      this.loading = true;
      this.error = null;
      try {
        const client = this.getTemplateClient();
        this.tasks = await client.list(filter);
      } catch (e) {
        this.error = this.formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async createTask(input: CreateTaskTemplateInput) {
      this.loading = true;
      try {
        const client = this.getTemplateClient();
        const task = await client.create(input);
        this.tasks.push(task);
        return task;
      } catch (e) {
        this.error = this.formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async updateTask(uuid: string, input: UpdateTaskTemplateInput) {
      this.loading = true;
      try {
        const client = this.getTemplateClient();
        const updated = await client.update(uuid, input);
        const index = this.tasks.findIndex(t => t.uuid === uuid);
        if (index !== -1) {
          this.tasks[index] = updated;
        }
        if (this.currentTask?.uuid === uuid) {
          this.currentTask = updated;
        }
        return updated;
      } catch (e) {
        this.error = this.formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async deleteTask(uuid: string) {
      this.loading = true;
      try {
        const client = this.getTemplateClient();
        await client.delete(uuid);
        this.tasks = this.tasks.filter(t => t.uuid !== uuid);
        if (this.currentTask?.uuid === uuid) {
          this.currentTask = null;
        }
      } catch (e) {
        this.error = this.formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async completeTaskInstance(instanceUuid: string) {
      try {
        const client = this.getInstanceClient();
        await client.complete(instanceUuid);
        // 可能需要刷新相关数据
      } catch (e) {
        this.error = this.formatError(e);
        throw e;
      }
    },

    // 错误格式化
    formatError(e: unknown): string {
      if (e instanceof Error) {
        return e.message;
      }
      return 'Unknown error occurred';
    },
  },
});
```

### 错误处理策略

```typescript
// IPC 错误类型
interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}

// 错误处理 composable
export function useTaskError() {
  const toast = useToast();
  
  const handleError = (error: unknown) => {
    if (isIPCError(error)) {
      toast.error(translateIPCError(error.code));
    } else {
      toast.error('操作失败，请重试');
    }
  };
  
  return { handleError };
}
```

## 验收标准

- [ ] 所有 Store Actions 使用 IPC Client
- [ ] 移除对 `@dailyuse/application-client` 的依赖
- [ ] 错误处理完整
- [ ] 加载状态正确
- [ ] UI 组件功能正常
- [ ] 集成测试通过

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/task/store/task.store.ts` | 修改 | 重构为 IPC Client |
| `renderer/modules/task/store/task-instance.store.ts` | 修改 | 重构为 IPC Client |
| `renderer/modules/task/composables/useTaskError.ts` | 新建 | 错误处理 |
| `renderer/modules/task/store/__tests__/task.store.spec.ts` | 新建 | 集成测试 |

## 依赖关系

- **前置依赖**: Story 13.7 (Task DI Container)
- **后续依赖**: 无

## 测试要点

1. **单元测试**: Mock IPC Client，测试 Store Actions
2. **集成测试**: 使用 Mock IPC Handler，测试完整流程
3. **UI 测试**: 验证组件渲染和交互

## 风险点

- Store 状态管理可能有复杂的依赖关系
- UI 组件可能有隐式依赖需要处理
- 需要确保所有异步操作正确取消
