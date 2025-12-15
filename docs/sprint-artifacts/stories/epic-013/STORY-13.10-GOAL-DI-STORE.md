# Story 13.10: Goal 模块 DI Container & Store

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.10 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| 优先级 | P0 (Critical) |
| 复杂度 | Medium |
| 预估工时 | 4h |
| 状态 | Backlog |

## 目标

为 Goal 模块创建 DI 容器配置和重构 Store，为后续 Focus 功能集成做好准备。

## 背景

Goal 模块是专注模式（Focus/Pomodoro）的载体，需要确保 DI 和 Store 架构支持后续扩展。

## 任务列表

- [ ] 1. 创建 `renderer/modules/goal/di/` 目录
- [ ] 2. 定义 Goal 模块依赖 Token
  - [ ] `GoalIPCClient` Token
  - [ ] `GoalProgressIPCClient` Token
  - [ ] `GoalTaskLinkIPCClient` Token
  - [ ] 预留 Focus 相关 Token
- [ ] 3. 实现 `registerGoalModule()` 函数
- [ ] 4. 重构 Goal Store
  - [ ] 切换到 IPC Client
  - [ ] 添加 Progress 相关 actions
  - [ ] 添加 Task Link 相关 actions
- [ ] 5. 添加单元测试

## 技术设计

### Token 定义

```typescript
// renderer/modules/goal/di/tokens.ts
export const GOAL_TOKENS = {
  // IPC Clients
  GOAL_IPC_CLIENT: Symbol('GoalIPCClient'),
  PROGRESS_IPC_CLIENT: Symbol('GoalProgressIPCClient'),
  TASK_LINK_IPC_CLIENT: Symbol('GoalTaskLinkIPCClient'),
  
  // Focus 相关 (预留，Story 13.11-13.13 实现)
  FOCUS_IPC_CLIENT: Symbol('GoalFocusIPCClient'),
  FOCUS_TIMER_SERVICE: Symbol('FocusTimerService'),
  
  // Use Cases
  CREATE_GOAL_USE_CASE: Symbol('CreateGoalUseCase'),
  UPDATE_PROGRESS_USE_CASE: Symbol('UpdateProgressUseCase'),
} as const;
```

### 注册函数

```typescript
// renderer/modules/goal/di/register.ts
import { Container } from '@/shared/infrastructure/di';
import { GOAL_TOKENS } from './tokens';
import { 
  GoalIPCClient,
  GoalProgressIPCClient,
  GoalTaskLinkIPCClient,
} from '../infrastructure/ipc';

export function registerGoalModule(container: Container): void {
  // IPC Clients
  container.registerSingleton(
    GOAL_TOKENS.GOAL_IPC_CLIENT,
    () => new GoalIPCClient()
  );
  
  container.registerSingleton(
    GOAL_TOKENS.PROGRESS_IPC_CLIENT,
    () => new GoalProgressIPCClient()
  );
  
  container.registerSingleton(
    GOAL_TOKENS.TASK_LINK_IPC_CLIENT,
    () => new GoalTaskLinkIPCClient()
  );
  
  // Focus 相关在 Story 13.11 中注册
}
```

### Goal Store 重构

```typescript
// renderer/modules/goal/store/goal.store.ts
import { defineStore } from 'pinia';
import { container } from '@/shared/infrastructure/di';
import { GOAL_TOKENS } from '../di/tokens';
import type { GoalClientDTO, CreateGoalInput } from '@dailyuse/contracts/goal';

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as GoalClientDTO[],
    currentGoal: null as GoalClientDTO | null,
    progressHistory: [] as GoalProgressEntry[],
    linkedTasks: [] as TaskTemplateClientDTO[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeGoals: (state) => state.goals.filter(g => !g.isArchived && !g.isCompleted),
    completedGoals: (state) => state.goals.filter(g => g.isCompleted),
    archivedGoals: (state) => state.goals.filter(g => g.isArchived),
    currentGoalProgress: (state) => {
      if (!state.currentGoal) return null;
      return {
        current: state.currentGoal.currentValue,
        target: state.currentGoal.targetValue,
        percentage: (state.currentGoal.currentValue / state.currentGoal.targetValue) * 100,
      };
    },
  },

  actions: {
    // Client getters
    getGoalClient() {
      return container.resolve<GoalIPCClient>(GOAL_TOKENS.GOAL_IPC_CLIENT);
    },

    getProgressClient() {
      return container.resolve<GoalProgressIPCClient>(GOAL_TOKENS.PROGRESS_IPC_CLIENT);
    },

    getTaskLinkClient() {
      return container.resolve<GoalTaskLinkIPCClient>(GOAL_TOKENS.TASK_LINK_IPC_CLIENT);
    },

    // Goal CRUD
    async fetchGoals(filter?: ListGoalsFilter) {
      this.loading = true;
      try {
        this.goals = await this.getGoalClient().list(filter);
      } catch (e) {
        this.error = formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async createGoal(input: CreateGoalInput) {
      this.loading = true;
      try {
        const goal = await this.getGoalClient().create(input);
        this.goals.push(goal);
        return goal;
      } catch (e) {
        this.error = formatError(e);
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async selectGoal(uuid: string) {
      this.currentGoal = await this.getGoalClient().getWithProgress(uuid);
      await this.fetchProgressHistory(uuid);
      await this.fetchLinkedTasks(uuid);
    },

    // Progress actions
    async addProgress(value: number, note?: string) {
      if (!this.currentGoal) throw new Error('No goal selected');
      
      await this.getProgressClient().addProgress(
        this.currentGoal.uuid, 
        value, 
        note
      );
      
      // 刷新当前目标数据
      await this.selectGoal(this.currentGoal.uuid);
    },

    async fetchProgressHistory(goalUuid: string) {
      this.progressHistory = await this.getProgressClient().getHistory(goalUuid);
    },

    // Task link actions
    async linkTask(taskUuid: string) {
      if (!this.currentGoal) throw new Error('No goal selected');
      
      await this.getTaskLinkClient().linkTask(this.currentGoal.uuid, taskUuid);
      await this.fetchLinkedTasks(this.currentGoal.uuid);
    },

    async unlinkTask(taskUuid: string) {
      if (!this.currentGoal) throw new Error('No goal selected');
      
      await this.getTaskLinkClient().unlinkTask(this.currentGoal.uuid, taskUuid);
      this.linkedTasks = this.linkedTasks.filter(t => t.uuid !== taskUuid);
    },

    async fetchLinkedTasks(goalUuid: string) {
      this.linkedTasks = await this.getTaskLinkClient().getLinkedTasks(goalUuid);
    },
  },
});
```

## 验收标准

- [ ] Token 定义完整，包含 Focus 预留
- [ ] `registerGoalModule()` 正确注册所有依赖
- [ ] Store 重构完成，使用 IPC Client
- [ ] Progress 和 Task Link 功能正常
- [ ] 为 Focus 功能扩展预留接口
- [ ] 单元测试覆盖率 > 80%

## 文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `renderer/modules/goal/di/tokens.ts` | 新建 | Token 定义 |
| `renderer/modules/goal/di/register.ts` | 新建 | 注册函数 |
| `renderer/modules/goal/di/index.ts` | 新建 | 导出 |
| `renderer/modules/goal/store/goal.store.ts` | 修改 | 重构 Store |
| `renderer/shared/infrastructure/di/container.ts` | 修改 | 集成 Goal 模块 |

## 依赖关系

- **前置依赖**: Story 13.2 (DI Container), Story 13.9 (Goal IPC Client)
- **后续依赖**: Stories 13.11-13.13 (Goal Focus 功能)
