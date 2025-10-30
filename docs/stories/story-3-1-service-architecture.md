# Story 3.1 - ONE_TIME 任务服务架构重构

## 概述

按照 DDD 应用服务层最佳实践，将原本的 `OneTimeTaskApplicationService`（500+ 行，25 个方法）拆分为 4 个细粒度的、职责单一的服务。

## 重构原则

### 1. 按业务能力划分，而非按聚合根划分

**❌ 错误做法** - God Service (God Object 反模式):
```typescript
// 单一的巨大服务，包含所有功能
class OneTimeTaskApplicationService {
  // 创建相关（2 个方法）
  createOneTimeTask()
  createSubtask()
  
  // 状态管理（5 个方法）
  startTask()
  completeTask()
  blockTask()
  unblockTask()
  cancelTask()
  
  // 查询相关（12 个方法）
  getOneTimeTasks()
  getTodayTasks()
  getOverdueTasks()
  // ... 更多查询方法
  
  // 目标关联（2 个方法）
  linkToGoal()
  unlinkFromGoal()
  
  // 批量操作（2 个方法）
  batchUpdatePriority()
  batchCancelTasks()
}
```

**✅ 正确做法** - 细粒度服务:
```typescript
// 按业务能力拆分为多个专注的服务

// 1. 生命周期管理
class OneTimeTaskLifecycleService {
  createOneTimeTask()
  createSubtask()
  startTask()
  completeTask()
  blockTask()
  unblockTask()
  cancelTask()
}

// 2. 查询服务
class OneTimeTaskQueryService {
  getOneTimeTasks()
  getTodayTasks()
  getOverdueTasks()
  getUpcomingTasks()
  getTasksByPriority()
  getTaskDashboard()
  // ... 其他查询
}

// 3. 目标关联服务
class OneTimeTaskGoalLinkService {
  linkToGoal()
  unlinkFromGoal()
}

// 4. 批量操作服务
class OneTimeTaskBatchOperationService {
  batchUpdatePriority()
  batchCancelTasks()
}
```

### 2. 单一职责原则 (SRP)

每个服务只负责一个业务领域：
- **Lifecycle Service**: 任务的创建和状态转换
- **Query Service**: 各种查询场景
- **Goal Link Service**: 与 OKR 模块的集成
- **Batch Operation Service**: 批量操作

### 3. 高内聚、低耦合

- **高内聚**: 同一个服务内的方法紧密相关
- **低耦合**: 服务之间互不依赖，可独立演化

### 4. 易于测试和维护

- 每个服务文件更小（100-200 行）
- 测试更容易（只需 mock 相关依赖）
- 修改一个功能不会影响其他功能

## 服务划分详情

### 1. OneTimeTaskLifecycleService (生命周期管理)

**文件**: `OneTimeTaskLifecycleService.ts`

**职责**:
- 任务创建
- 任务状态转换
- 子任务管理

**方法列表** (7 个):
```typescript
// 创建
createOneTimeTask(request: CreateOneTimeTaskRequest): Promise<TaskTemplate>
createSubtask(parentUuid: string, request: CreateOneTimeTaskRequest): Promise<TaskTemplate>

// 状态转换
startTask(uuid: string): Promise<TaskTemplate>
completeTask(uuid: string): Promise<TaskTemplate>
blockTask(uuid: string, reason?: string): Promise<TaskTemplate>
unblockTask(uuid: string): Promise<TaskTemplate>
cancelTask(uuid: string, reason?: string): Promise<TaskTemplate>
```

**业务场景**:
- 用户创建新任务
- 用户开始执行任务
- 用户完成任务
- 任务被阻塞或取消

**示例**:
```typescript
import { oneTimeTaskLifecycleService } from '@/modules/task';

// 创建任务
const task = await oneTimeTaskLifecycleService.createOneTimeTask({
  accountUuid: user.uuid,
  title: '完成季度报告',
  startDate: Date.now(),
  dueDate: Date.now() + 7 * 86400000,
  importance: 4,
  urgency: 3,
});

// 开始任务
await oneTimeTaskLifecycleService.startTask(task.uuid);

// 完成任务
await oneTimeTaskLifecycleService.completeTask(task.uuid);
```

---

### 2. OneTimeTaskQueryService (查询服务)

**文件**: `OneTimeTaskQueryService.ts`

**职责**:
- 列表查询（带过滤）
- 场景化查询（今日、逾期、即将到期等）
- 仪表板数据
- 按维度查询（标签、目标、日期范围等）

**方法列表** (12 个):
```typescript
// 基础查询
getOneTimeTasks(filters?: TaskFiltersRequest): Promise<TaskTemplate[]>

// 场景化查询
getTodayTasks(): Promise<TaskTemplate[]>
getOverdueTasks(): Promise<TaskTemplate[]>
getUpcomingTasks(days?: number): Promise<TaskTemplate[]>
getTasksByPriority(limit?: number): Promise<TaskTemplate[]>
getBlockedTasks(): Promise<TaskTemplate[]>

// 仪表板
getTaskDashboard(): Promise<TaskDashboardResponse>

// 按维度查询
getTasksByDateRange(startDate: number, endDate: number): Promise<TaskTemplate[]>
getTasksByTags(tags: string[]): Promise<TaskTemplate[]>
getTasksByGoal(goalUuid: string): Promise<TaskTemplate[]>
getTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]>
getSubtasks(parentUuid: string): Promise<TaskTemplate[]>
```

**业务场景**:
- 任务列表页面
- 任务仪表板
- 今日任务视图
- 逾期任务提醒
- 按标签分类查看

**示例**:
```typescript
import { oneTimeTaskQueryService } from '@/modules/task';

// 获取今日任务
const todayTasks = await oneTimeTaskQueryService.getTodayTasks();

// 获取逾期任务（用于提醒）
const overdueTasks = await oneTimeTaskQueryService.getOverdueTasks();

// 获取仪表板数据
const dashboard = await oneTimeTaskQueryService.getTaskDashboard();
console.log(`今日: ${dashboard.todayTasks.length}`);
console.log(`逾期: ${dashboard.overdueTasks.length}`);
console.log(`完成率: ${dashboard.summary.completionRate}%`);

// 高级过滤查询
const highPriorityTasks = await oneTimeTaskQueryService.getOneTimeTasks({
  status: 'PENDING',
  minImportance: 4,
  priorityLevels: ['HIGH'],
  tags: ['urgent'],
});
```

---

### 3. OneTimeTaskGoalLinkService (目标关联服务)

**文件**: `OneTimeTaskGoalLinkService.ts`

**职责**:
- 任务与 OKR 目标的关联
- 任务与关键结果的关联
- 解除关联

**方法列表** (2 个):
```typescript
linkToGoal(uuid: string, goalUuid: string, keyResultUuid?: string): Promise<TaskTemplate>
unlinkFromGoal(uuid: string): Promise<TaskTemplate>
```

**业务场景**:
- 将任务关联到 OKR 目标
- 从 OKR 视图创建任务
- 查看目标相关的所有任务

**示例**:
```typescript
import { oneTimeTaskGoalLinkService } from '@/modules/task';

// 关联任务到目标
await oneTimeTaskGoalLinkService.linkToGoal(
  task.uuid,
  goal.uuid,
  keyResult.uuid  // 可选
);

// 解除关联
await oneTimeTaskGoalLinkService.unlinkFromGoal(task.uuid);
```

---

### 4. OneTimeTaskBatchOperationService (批量操作服务)

**文件**: `OneTimeTaskBatchOperationService.ts`

**职责**:
- 批量更新优先级
- 批量取消任务
- 其他批量操作（未来扩展）

**方法列表** (2 个):
```typescript
batchUpdatePriority(
  taskUuids: string[], 
  importance?: number, 
  urgency?: number
): Promise<TaskTemplate[]>

batchCancelTasks(
  taskUuids: string[], 
  reason?: string
): Promise<TaskTemplate[]>
```

**业务场景**:
- 批量调整任务优先级
- 项目取消时批量取消关联任务
- 批量操作提高效率

**示例**:
```typescript
import { oneTimeTaskBatchOperationService } from '@/modules/task';

// 批量更新优先级
const updatedTasks = await oneTimeTaskBatchOperationService.batchUpdatePriority(
  ['uuid1', 'uuid2', 'uuid3'],
  4,  // importance
  3   // urgency
);

// 批量取消任务
const canceledTasks = await oneTimeTaskBatchOperationService.batchCancelTasks(
  ['uuid1', 'uuid2'],
  '项目已取消'
);
```

---

## 服务依赖关系

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│   (Composables, Components, Pages)                  │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
           │          │          │          │
┌──────────▼──────────▼──────────▼──────────▼─────────┐
│              Application Services                    │
├──────────────────────────────────────────────────────┤
│  OneTimeTaskLifecycleService                         │
│  OneTimeTaskQueryService                             │
│  OneTimeTaskGoalLinkService                          │
│  OneTimeTaskBatchOperationService                    │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
           └──────────┴──────────┴──────────┘
                      │
           ┌──────────▼──────────┐
           │   Infrastructure    │
           │  OneTimeTaskApiClient│
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │    Backend API      │
           │   (25 endpoints)    │
           └─────────────────────┘
```

**特点**:
- 所有服务都依赖同一个 `OneTimeTaskApiClient`
- 服务之间**互不依赖**（松耦合）
- Presentation Layer 可以组合使用多个服务

## 对比总结

| 维度 | 旧架构 (God Service) | 新架构 (细粒度服务) |
|------|----------------------|---------------------|
| **文件数量** | 1 个大文件 | 4 个小文件 |
| **代码行数** | 500+ 行 | 100-200 行/文件 |
| **职责** | 混杂所有功能 | 单一职责 |
| **可测试性** | 困难（需 mock 很多） | 容易（职责单一） |
| **可维护性** | 低（修改影响大） | 高（独立修改） |
| **可扩展性** | 低（文件越来越大） | 高（新增独立服务） |
| **团队协作** | 容易冲突 | 并行开发 |

## 使用指南

### 1. 如何选择合适的服务？

根据业务场景选择：

| 场景 | 使用的服务 |
|------|------------|
| 创建任务 | `oneTimeTaskLifecycleService` |
| 修改任务状态 | `oneTimeTaskLifecycleService` |
| 查询任务列表 | `oneTimeTaskQueryService` |
| 任务仪表板 | `oneTimeTaskQueryService` |
| 关联 OKR | `oneTimeTaskGoalLinkService` |
| 批量操作 | `oneTimeTaskBatchOperationService` |

### 2. 导入方式

```typescript
// 方式 1: 按需导入
import { 
  oneTimeTaskLifecycleService,
  oneTimeTaskQueryService 
} from '@/modules/task';

// 方式 2: 全部导入（不推荐）
import * as TaskServices from '@/modules/task';
```

### 3. 在 Composables 中使用

```typescript
// useOneTimeTask.ts
import { 
  oneTimeTaskLifecycleService,
  oneTimeTaskQueryService 
} from '@/modules/task';

export function useOneTimeTask() {
  const tasks = ref<TaskTemplate[]>([]);
  const isLoading = ref(false);
  
  async function createTask(request: CreateOneTimeTaskRequest) {
    isLoading.value = true;
    try {
      // 使用 Lifecycle Service 创建
      const task = await oneTimeTaskLifecycleService.createOneTimeTask(request);
      tasks.value.push(task);
      return task;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function loadTodayTasks() {
    isLoading.value = true;
    try {
      // 使用 Query Service 查询
      tasks.value = await oneTimeTaskQueryService.getTodayTasks();
    } finally {
      isLoading.value = false;
    }
  }
  
  return {
    tasks: readonly(tasks),
    isLoading: readonly(isLoading),
    createTask,
    loadTodayTasks,
  };
}
```

### 4. 在组件中使用

```vue
<script setup lang="ts">
import { oneTimeTaskLifecycleService } from '@/modules/task';

async function handleComplete(taskUuid: string) {
  await oneTimeTaskLifecycleService.completeTask(taskUuid);
  // UI 会自动更新（Store 已同步）
}
</script>
```

## 未来扩展

新架构易于扩展，例如：

### 新增服务示例

```typescript
// OneTimeTaskPriorityCalculationService.ts
export class OneTimeTaskPriorityCalculationService {
  // 优先级智能计算
  async calculatePriority(task: TaskTemplate): Promise<PriorityLevel> {
    // AI 计算逻辑
  }
  
  // 优先级推荐
  async recommendPriority(task: TaskTemplate): Promise<number> {
    // 推荐算法
  }
}

// OneTimeTaskReminderService.ts
export class OneTimeTaskReminderService {
  // 设置提醒
  async setReminder(taskUuid: string, reminderTime: number): Promise<void> {
    // 提醒逻辑
  }
  
  // 取消提醒
  async cancelReminder(taskUuid: string): Promise<void> {
    // 取消逻辑
  }
}
```

## 总结

按照 DDD 最佳实践重构后的服务架构具有以下优势：

1. ✅ **职责清晰**: 每个服务专注一个业务能力
2. ✅ **易于测试**: 小而专注的服务易于编写单元测试
3. ✅ **易于维护**: 修改某个功能不会影响其他功能
4. ✅ **易于扩展**: 新增功能只需添加新服务
5. ✅ **团队友好**: 多人可并行开发不同服务
6. ✅ **符合 SOLID 原则**: 单一职责、开闭原则

这种架构是企业级应用的标准实践，特别适合复杂业务场景和大型团队协作。

---

**文档版本**: v1.0  
**最后更新**: 2025-10-30  
**维护者**: DailyUse Team
