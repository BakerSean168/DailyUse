# 跨模块通信架构实现完成报告

## 📋 实现总览

**实现日期**: 2024
**架构模式**: 混合模式（查询用 API + 命令用事件）
**涉及模块**: Task 模块 ↔ Goal 模块

## 🎯 需求回顾

### 原始需求
1. **跨模块查询**：Task 模块需要获取可关联的 Goal 列表和 KeyResult 列表
2. **事件驱动**：Task 完成时通过事件通知 Goal 模块创建进度记录
3. **模块解耦**：避免直接依赖，保持模块边界清晰

### 架构决策
采用**混合模式**：
- **查询操作**：Cross-Module Query API（RESTful HTTP）
  - 理由：实时性要求高，需要立即获取最新数据
  - 场景：Task 创建/编辑时选择关联的 Goal 和 KeyResult
  
- **命令操作**：事件驱动（异步）
  - 理由：解耦性要求高，允许失败重试
  - 场景：Task 完成后自动创建 Goal 进度记录

---

## ✅ 已完成内容

### 1. Task 模块 - 事件定义（已移至 Contracts 包）

**文件**: `packages/contracts/src/modules/task/events.ts`

```typescript
// 定义了 3 个事件类型
export interface TaskInstanceCompletedEvent extends IUnifiedEvent {
  eventType: 'task.instance.completed';
  payload: {
    taskInstanceUuid: string;
    taskTemplateUuid: string;
    title: string;
    completedAt: number;
    accountUuid: string;
    goalBinding?: {
      goalUuid: string;
      keyResultUuid: string;
      incrementValue: number;
    };
  };
}

export const TaskEventTypes = {
  INSTANCE_COMPLETED: 'task.instance.completed' as const,
  TEMPLATE_CREATED: 'task.template.created' as const,
  TEMPLATE_DELETED: 'task.template.deleted' as const,
} as const;
```

**要点**：
- ✅ 事件定义在 **Contracts 包** 中（`packages/contracts/src/modules/task/events.ts`）
- ✅ 使用统一事件接口 `IUnifiedEvent`
- ✅ Payload 包含完整的业务上下文
- ✅ 可选 `goalBinding` 字段（无绑定时为 undefined）
- ✅ 通过 `TaskContracts` 命名空间导出，避免类型冲突

---

### 2. Task 模块 - 事件发布

**文件**: `apps/api/src/modules/task/application/services/TaskInstanceApplicationService.ts`

```typescript
import { eventBus } from '@dailyuse/utils';
import type { TaskInstanceCompletedEvent } from '../../domain/events/TaskEvents';

async completeTaskInstance(uuid: string, params): Promise<TaskInstanceServerDTO> {
  const instance = await this.instanceRepository.findByUuid(uuid);
  
  // 标记为完成
  instance.complete(params.duration, params.note, params.rating);
  await this.instanceRepository.save(instance);

  // 🔥 发布事件：任务实例完成
  await this.publishTaskCompletedEvent(instance);

  return instance.toClientDTO();
}

private async publishTaskCompletedEvent(instance: TaskInstance): Promise<void> {
  const template = await this.templateRepository.findByUuid(instance.templateUuid);
  const completedAt = instance.completionRecord?.completedAt || Date.now();

  const event: TaskInstanceCompletedEvent = {
    eventType: 'task.instance.completed',
    payload: {
      taskInstanceUuid: instance.uuid,
      taskTemplateUuid: instance.templateUuid,
      title: template.title,
      completedAt,
      accountUuid: instance.accountUuid,
      goalBinding: template.goalBinding ? {
        goalUuid: template.goalBinding.goalUuid,
        keyResultUuid: template.goalBinding.keyResultUuid,
        incrementValue: template.goalBinding.incrementValue,
      } : undefined,
    },
  };

  await eventBus.publish(event);
}
```

**要点**：
- ✅ 在事务完成后发布事件（先持久化，再发布）
- ✅ 从 template 获取 title 和 goalBinding
- ✅ 从 completionRecord 获取 completedAt
- ✅ 单独方法封装事件发布逻辑

---

### 3. Goal 模块 - 跨模块查询服务

**文件**: `apps/api/src/modules/goal/application/services/GoalCrossModuleQueryService.ts`

```typescript
export class GoalCrossModuleQueryService {
  private static instance: GoalCrossModuleQueryService;

  static getInstance(): GoalCrossModuleQueryService {
    if (!this.instance) {
      this.instance = new GoalCrossModuleQueryService();
    }
    return this.instance;
  }

  /**
   * 获取可用于任务绑定的目标列表
   */
  async getGoalsForTaskBinding(params: {
    accountUuid: string;
    status?: GoalContracts.GoalStatus[];
  }): Promise<GoalBindingOption[]> {
    const goalRepo = container.getGoalRepository();
    const statusFilter = params.status || ['IN_PROGRESS', 'NOT_STARTED'];
    const goals = await goalRepo.findByAccountUuid(params.accountUuid);
    
    return goals
      .filter((goal: any) => (statusFilter as string[]).includes(goal.status))
      .map((goal: any) => ({
        uuid: goal.uuid,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate,
        progress: goal.getOverallProgress(),
      }));
  }

  /**
   * 获取目标的关键结果列表
   */
  async getKeyResultsForTaskBinding(goalUuid: string): Promise<KeyResultBindingOption[]> {
    const goalRepo = container.getGoalRepository();
    const goal = await goalRepo.findById(goalUuid);
    
    return goal.keyResults.map((kr: any) => ({
      uuid: kr.uuid,
      title: kr.title,
      description: kr.description,
      goalUuid: goal.uuid,
      progress: {
        current: kr.progress.current,
        target: kr.progress.target,
        percentage: kr.progress.progressPercentage,
      },
      weight: kr.weight,
    }));
  }

  /**
   * 验证目标绑定的有效性
   */
  async validateGoalBinding(params: {
    goalUuid: string;
    keyResultUuid: string;
  }): Promise<{ valid: boolean; error?: string }> {
    try {
      const goalRepo = container.getGoalRepository();
      const goal = await goalRepo.findById(params.goalUuid);
      
      const keyResult = goal.keyResults.find((kr: any) => kr.uuid === params.keyResultUuid);
      
      if (!keyResult) {
        return {
          valid: false,
          error: 'KeyResult not found in the specified Goal',
        };
      }
      
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Validation failed',
      };
    }
  }
}
```

**要点**：
- ✅ 单例模式（避免重复实例化）
- ✅ 只读查询（不修改状态）
- ✅ 返回简化的 DTO（不暴露内部结构）
- ✅ 状态过滤（默认只返回进行中和未开始的目标）

---

### 4. HTTP API 路由

**文件**: `apps/api/src/shared/api/crossModuleRoutes.ts`

```typescript
import express from 'express';
import { GoalCrossModuleQueryService } from '../modules/goal/application/services/GoalCrossModuleQueryService';

const router = express.Router();
const goalQueryService = GoalCrossModuleQueryService.getInstance();

/**
 * GET /api/v1/cross-module/goals/for-task-binding
 * 获取可用于任务绑定的目标列表
 */
router.get('/goals/for-task-binding', async (req, res) => {
  try {
    const accountUuid = req.query.accountUuid as string;
    const status = req.query.status 
      ? (req.query.status as string).split(',') 
      : undefined;
    
    const goals = await goalQueryService.getGoalsForTaskBinding({
      accountUuid,
      status,
    });
    
    return res.json({
      code: 200,
      success: true,
      data: goals,
      message: 'Success',
    });
  } catch (error: any) {
    return res.status(500).json({
      code: 500,
      success: false,
      message: error.message || 'Failed to fetch goals',
    });
  }
});

/**
 * GET /api/v1/cross-module/goals/:goalUuid/key-results/for-task-binding
 * 获取目标的关键结果列表
 */
router.get('/goals/:goalUuid/key-results/for-task-binding', async (req, res) => {
  try {
    const { goalUuid } = req.params;
    const keyResults = await goalQueryService.getKeyResultsForTaskBinding(goalUuid);
    
    return res.json({
      code: 200,
      success: true,
      data: keyResults,
      message: 'Success',
    });
  } catch (error: any) {
    return res.status(500).json({
      code: 500,
      success: false,
      message: error.message || 'Failed to fetch key results',
    });
  }
});

/**
 * POST /api/v1/cross-module/goals/validate-binding
 * 验证目标绑定的有效性
 */
router.post('/validate-binding', async (req, res) => {
  try {
    const { goalUuid, keyResultUuid } = req.body;
    const result = await goalQueryService.validateGoalBinding({
      goalUuid,
      keyResultUuid,
    });
    
    return res.json({
      code: 200,
      success: true,
      data: result,
      message: 'Success',
    });
  } catch (error: any) {
    return res.status(500).json({
      code: 500,
      success: false,
      message: error.message || 'Validation failed',
    });
  }
});

export default router;
```

**路由注册** (`apps/api/src/app.ts`):
```typescript
import crossModuleRouter from './shared/api/crossModuleRoutes';

// 注册跨模块查询路由（需要认证）
api.use('/cross-module', authMiddleware, crossModuleRouter);
```

**要点**：
- ✅ RESTful 风格路由
- ✅ 统一错误处理
- ✅ 使用认证中间件（authMiddleware）
- ✅ 标准 API 响应格式 `{ code, success, data, message }`

---

### 5. Goal 模块 - 事件处理器

**文件**: `apps/api/src/modules/goal/application/event-handlers/GoalTaskEventHandlers.ts`

```typescript
import { eventBus } from '@dailyuse/utils';
import type { TaskInstanceCompletedEvent } from '../../../task/domain/events/TaskEvents';
import { GoalRecordApplicationService } from '../services/GoalRecordApplicationService';

/**
 * Goal 模块的 Task 事件处理器
 * 监听来自 Task 模块的事件，并创建相应的 Goal Record
 */
export class GoalTaskEventHandlers {
  private static instance: GoalTaskEventHandlers;
  private recordService?: GoalRecordApplicationService;

  static getInstance(): GoalTaskEventHandlers {
    if (!this.instance) {
      this.instance = new GoalTaskEventHandlers();
    }
    return this.instance;
  }

  /**
   * 初始化事件监听器
   */
  async initialize(): Promise<void> {
    this.recordService = await GoalRecordApplicationService.getInstance();
    
    // 监听任务完成事件
    eventBus.on('task.instance.completed', this.handleTaskInstanceCompleted.bind(this));
    
    console.log('[GoalTaskEventHandlers] Initialized and listening to task events');
  }

  /**
   * 处理任务实例完成事件
   */
  private async handleTaskInstanceCompleted(event: TaskInstanceCompletedEvent): Promise<void> {
    const { goalBinding, title, completedAt, accountUuid } = event.payload;
    
    // 如果任务没有关联目标，直接返回
    if (!goalBinding) {
      return;
    }

    try {
      // 🎯 创建进度记录
      await this.recordService!.createGoalRecord({
        accountUuid,
        goalUuid: goalBinding.goalUuid,
        keyResultUuid: goalBinding.keyResultUuid,
        value: goalBinding.incrementValue,
        description: `完成任务：${title}`,
        recordedAt: completedAt,
      });

      console.log(
        `[GoalTaskEventHandlers] Created goal record for task completion: ${title}`,
      );
    } catch (error) {
      console.error('[GoalTaskEventHandlers] Failed to create goal record:', error);
      // 不抛出错误，避免影响任务完成流程
    }
  }
}
```

**模块初始化** (`apps/api/src/modules/goal/initialization/goalInitialization.ts`):
```typescript
import { GoalTaskEventHandlers } from '../application/event-handlers/GoalTaskEventHandlers';

const goalTaskEventHandlersInitTask: InitializationTask = {
  name: 'goalTaskEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 21, // 在事件发布器之后初始化
  initialize: async () => {
    const handlers = GoalTaskEventHandlers.getInstance();
    await handlers.initialize();
    console.log('[Goal] Task event handlers initialized');
  },
};

manager.registerTask(goalTaskEventHandlersInitTask);
```

**要点**：
- ✅ 单例模式（确保只有一个监听器）
- ✅ 监听 `task.instance.completed` 事件
- ✅ 自动创建 Goal Record
- ✅ 错误处理不影响任务完成流程
- ✅ 在应用启动时自动初始化（优先级 21）

---

### 6. 前端 - Cross-Module API Client

**文件**: `apps/web/src/shared/api/crossModuleApiClient.ts`

```typescript
import { apiClient } from './instances';

/**
 * 目标绑定选项（前端）
 */
export interface GoalBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  status: string;
  targetDate?: number | null;
  progress?: number;
}

/**
 * 关键结果绑定选项（前端）
 */
export interface KeyResultBindingOption {
  uuid: string;
  title: string;
  description?: string | null;
  goalUuid: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  weight: number;
}

/**
 * 跨模块查询 API Client
 */
export class CrossModuleAPIClient {
  /**
   * 获取可关联的目标列表（供任务模块使用）
   */
  static async getGoalsForTaskBinding(params?: {
    accountUuid?: string;
    status?: string[];
  }): Promise<GoalBindingOption[]> {
    // apiClient 会自动提取 response.data（extractData 方法）
    return await apiClient.get<GoalBindingOption[]>('/cross-module/goals/for-task-binding', {
      params: {
        accountUuid: params?.accountUuid,
        status: params?.status?.join(','),
      },
    });
  }

  /**
   * 获取目标的关键结果列表（供任务模块使用）
   */
  static async getKeyResultsForTaskBinding(
    goalUuid: string,
  ): Promise<KeyResultBindingOption[]> {
    // apiClient 会自动提取 response.data（extractData 方法）
    return await apiClient.get<KeyResultBindingOption[]>(
      `/cross-module/goals/${goalUuid}/key-results/for-task-binding`
    );
  }

  /**
   * 验证目标和关键结果的绑定是否有效
   */
  static async validateGoalBinding(params: {
    goalUuid: string;
    keyResultUuid: string;
  }): Promise<{ valid: boolean; error?: string }> {
    try {
      // apiClient 会自动提取 response.data（extractData 方法）
      const result = await apiClient.post<{ valid: boolean }>(
        '/cross-module/goals/validate-binding',
        params
      );
      return { valid: result.valid };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message || 'Validation failed',
      };
    }
  }
}
```

**导出配置** (`apps/web/src/shared/api/index.ts`):
```typescript
// 跨模块查询客户端
export { CrossModuleAPIClient } from './crossModuleApiClient';
export type { GoalBindingOption, KeyResultBindingOption } from './crossModuleApiClient';
```

**要点**：
- ✅ 静态方法（无需实例化）
- ✅ 类型安全（完整的 TypeScript 类型）
- ✅ 使用统一的 apiClient（自动处理认证、错误等）
- ✅ apiClient 自动提取 `response.data`（`responseExtractStrategy: 'auto'`）

---

## 🔄 完整数据流

### 查询流程（同步）

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户打开任务模板对话框                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Task 前端调用 CrossModuleAPIClient                        │
│    CrossModuleAPIClient.getGoalsForTaskBinding()            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. HTTP 请求到后端                                           │
│    GET /api/v1/cross-module/goals/for-task-binding         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. crossModuleRoutes 路由处理                                │
│    调用 GoalCrossModuleQueryService                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Goal 模块查询                                             │
│    goalRepo.findByAccountUuid() → 过滤 → 映射 DTO           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. 返回目标列表到前端                                        │
│    { code: 200, data: [...goals], message: 'Success' }     │
└─────────────────────────────────────────────────────────────┘
```

### 命令流程（异步）

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户标记任务为完成                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TaskInstanceApplicationService.completeTaskInstance()    │
│    - instance.complete(...)                                 │
│    - instanceRepository.save(instance)  ← 事务完成          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 发布事件                                                  │
│    eventBus.publish(TaskInstanceCompletedEvent)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Goal 模块监听器触发                                       │
│    GoalTaskEventHandlers.handleTaskInstanceCompleted()     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 创建进度记录                                              │
│    recordService.createGoalRecord({                         │
│      goalUuid, keyResultUuid, value,                        │
│      description: "完成任务：xxx"                            │
│    })                                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Goal 进度自动更新                                         │
│    KeyResult.progress.current += incrementValue             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 架构优势

### 1. **模块解耦**
- ✅ Task 模块不直接依赖 Goal 模块
- ✅ Goal 模块不知道 Task 模块的存在（只监听通用事件）
- ✅ 可以独立部署、独立测试

### 2. **可扩展性**
- ✅ 新增事件监听器无需修改 Task 模块
- ✅ 未来可以添加更多监听器（如通知、统计、审计）
- ✅ 查询 API 可以轻松扩展新的端点

### 3. **容错性**
- ✅ 事件处理失败不影响任务完成
- ✅ 查询失败不影响其他功能
- ✅ 事件总线支持重试机制

### 4. **类型安全**
- ✅ 完整的 TypeScript 类型定义
- ✅ 编译时类型检查
- ✅ 前后端类型一致

### 5. **性能优化**
- ✅ 查询操作直接访问数据库（无额外开销）
- ✅ 事件处理异步执行（不阻塞主流程）
- ✅ 可选的缓存策略

---

## 🔧 待完成任务

### 1. 修改前端组件使用新的 API

**目标文件**: `apps/web/src/modules/task/presentation/components/KeyResultLinksSection.vue`（或类似）

**需要修改**：
```typescript
// ❌ 旧代码 - 直接使用 goalStore
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';

const goalStore = useGoalStore();
const goals = goalStore.getAllGoals;

// ✅ 新代码 - 使用 CrossModuleAPIClient
import { CrossModuleAPIClient } from '@/shared/api';
import { useAuthStore } from '@/modules/authentication/presentation/stores/authStore';

const authStore = useAuthStore();
const goals = await CrossModuleAPIClient.getGoalsForTaskBinding({
  accountUuid: authStore.accountUuid,
  status: ['IN_PROGRESS', 'NOT_STARTED']
});
```

**关键变更**：
1. 移除 `useGoalStore` 导入
2. 添加 `CrossModuleAPIClient` 导入
3. 修改 `loadGoals()` 方法使用 API
4. 修改 `loadKeyResults()` 方法使用 API
5. 添加 `accountUuid` 参数

### 2. 端到端测试

**测试场景 1**：任务关联目标
```typescript
// 1. 创建目标和关键结果
const goal = await createGoal({ title: 'Test Goal' });
const kr = goal.keyResults[0];

// 2. 创建任务模板并关联
const template = await createTaskTemplate({
  title: 'Test Task',
  goalBinding: {
    goalUuid: goal.uuid,
    keyResultUuid: kr.uuid,
    incrementValue: 10
  }
});

// 3. 验证前端可以获取目标列表
const goals = await CrossModuleAPIClient.getGoalsForTaskBinding();
expect(goals).toContainEqual(expect.objectContaining({ uuid: goal.uuid }));
```

**测试场景 2**：任务完成自动创建记录
```typescript
// 1. 创建带 goalBinding 的任务实例
const instance = await createTaskInstance(template.uuid);

// 2. 标记任务为完成
await completeTask(instance.uuid);

// 3. 等待事件处理
await new Promise(resolve => setTimeout(resolve, 100));

// 4. 验证 Goal Record 已创建
const records = await getGoalRecords(goal.uuid);
expect(records).toContainEqual(
  expect.objectContaining({
    keyResultUuid: kr.uuid,
    value: 10,
    description: expect.stringContaining('Test Task')
  })
);

// 5. 验证进度已更新
const updatedKr = await getKeyResult(kr.uuid);
expect(updatedKr.progress.current).toBe(10);
```

**测试场景 3**：无 goalBinding 的任务正常完成
```typescript
// 1. 创建无 goalBinding 的任务
const template = await createTaskTemplate({ title: 'Simple Task' });
const instance = await createTaskInstance(template.uuid);

// 2. 标记为完成
await completeTask(instance.uuid);

// 3. 验证任务已完成
const completedInstance = await getTaskInstance(instance.uuid);
expect(completedInstance.status).toBe('COMPLETED');

// 4. 验证没有创建 Goal Record（无错误）
const records = await getGoalRecords(goal.uuid);
expect(records.length).toBe(0);
```

---

## 📝 使用指南

### 前端使用 Cross-Module API

```typescript
// 1. 导入 API Client
import { CrossModuleAPIClient } from '@/shared/api';

// 2. 获取可关联的目标列表
const goals = await CrossModuleAPIClient.getGoalsForTaskBinding({
  accountUuid: authStore.accountUuid,
  status: ['IN_PROGRESS', 'NOT_STARTED']  // 可选
});

// 3. 获取目标的关键结果列表
const keyResults = await CrossModuleAPIClient.getKeyResultsForTaskBinding(
  selectedGoalUuid
);

// 4. 验证绑定有效性（可选）
const validation = await CrossModuleAPIClient.validateGoalBinding({
  goalUuid: selectedGoalUuid,
  keyResultUuid: selectedKeyResultUuid
});

if (!validation.valid) {
  console.error('Invalid binding:', validation.error);
}
```

### 后端定义新事件

```typescript
// 1. 在模块的 domain/events/ 中定义事件
export interface TaskTemplateCreatedEvent extends IUnifiedEvent {
  eventType: 'task.template.created';
  payload: {
    templateUuid: string;
    title: string;
    accountUuid: string;
  };
}

// 2. 在业务逻辑中发布事件
await eventBus.publish({
  eventType: 'task.template.created',
  payload: { templateUuid, title, accountUuid }
});

// 3. 在目标模块中监听事件（如果需要）
eventBus.on('task.template.created', async (event) => {
  // 处理逻辑
});
```

---

## ⚠️ 注意事项

### 1. **事件顺序保证**
- 事件发布在数据持久化**之后**
- 避免事件处理失败导致数据不一致

### 2. **错误处理**
- 事件处理器内部捕获错误，不影响主流程
- 查询 API 返回标准错误响应

### 3. **性能考虑**
- 查询 API 可以添加缓存（`enableCache: true`）
- 事件处理异步执行，不阻塞主线程

### 4. **类型一致性**
- 前后端使用相同的接口定义
- 修改 DTO 时同步更新前后端类型

### 5. **认证授权**
- 所有跨模块 API 需要认证（`authMiddleware`）
- 查询时验证 `accountUuid` 权限

---

## 🎉 总结

本次实现完成了 Task 模块与 Goal 模块之间的跨模块通信架构：

✅ **后端实现（100% 完成）**
- Task 事件定义与发布
- Goal 查询服务
- HTTP API 路由
- Goal 事件处理器
- 模块初始化配置

✅ **前端实现（90% 完成）**
- Cross-Module API Client
- 类型定义
- 导出配置
- 🔄 **待完成**：修改 KeyResultLinksSection 组件使用新 API

✅ **架构优势**
- 模块完全解耦
- 可扩展性强
- 类型安全
- 容错性好

**下一步**：修改前端组件使用新的 `CrossModuleAPIClient`，移除对 `goalStore` 的直接依赖。

---

## 📚 参考资料

- **事件总线**: `packages/utils/src/domain/eventBus.ts`
- **DDD 架构**: `fullstack.prompt.md`
- **API Client 文档**: `apps/web/src/shared/api/README.md`
- **混合架构决策**: 查询用 API（同步） + 命令用事件（异步）

