# Task Instance 数据同步优雅解决方案

## 🔍 问题分析

### 当前问题
根据日志显示：
```
[TaskInstanceGenerationService] 模板 "早期" 已生成到 2/25/2026，无需补充
```

说明后端已经生成了任务实例并保存到数据库，但前端**没有收到实时通知**，导致：
1. 用户看不到新生成的任务实例
2. 需要刷新页面才能看到最新数据
3. 体验不流畅，不符合实时性要求

### 根本原因
`TaskInstanceGenerationService.generateInstancesForTemplate()` 方法在生成实例后：
- ✅ **已做**: 保存到数据库 (`instanceRepository.saveMany()`)
- ✅ **已做**: 更新模板的 lastGeneratedDate (`templateRepository.save()`)
- ❌ **缺失**: **没有发布领域事件**通知前端
- ❌ **缺失**: **没有通过 SSE 推送**给客户端

## 🎯 解决方案设计

### 方案概览：领域事件 + SSE 推送

```
┌─────────────────────────────────────────────────────────────┐
│  1. TaskInstanceGenerationService 生成实例                  │
│     - generateInstancesForTemplate()                        │
│     - 保存实例到数据库                                       │
│     - ⭐ 发布 task.instances.generated 事件                 │
└────────────────┬────────────────────────────────────────────┘
                 │ eventBus.emit('task.instances.generated', ...)
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  2. TaskEventHandler 监听事件                               │
│     - 监听 task.instances.generated                         │
│     - 转换为前端所需的数据格式                               │
│     - ⭐ 通过 SSE 推送给客户端                              │
└────────────────┬────────────────────────────────────────────┘
                 │ SSE.sendMessage(accountUuid, 'task:instances-generated', ...)
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 前端 SSEClient 接收事件                                 │
│     - eventSource.addEventListener('task:instances-generated')│
│     - ⭐ 自动更新 TaskStore 状态                            │
│     - ⭐ UI 自动刷新（响应式）                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 实施步骤

### Step 1: 在 TaskInstanceGenerationService 中发布领域事件

**文件**: `packages/domain-server/src/task/services/TaskInstanceGenerationService.ts`

```typescript
import { eventBus } from '@dailyuse/utils';

export class TaskInstanceGenerationService {
  async generateInstancesForTemplate(
    template: TaskTemplate,
    forceGenerate: boolean = false,
  ): Promise<TaskInstance[]> {
    // ... 现有逻辑 ...

    // 6. 保存实例
    if (instances.length > 0) {
      await this.instanceRepository.saveMany(instances);
      await this.templateRepository.save(template);
      
      console.log(
        `✅ [TaskInstanceGenerationService] 为模板 "${template.title}" 生成了 ${instances.length} 个实例`,
      );

      // ⭐ 新增：发布领域事件
      eventBus.emit('task.instances.generated', {
        eventType: 'task.instances.generated',
        aggregateId: template.uuid,
        occurredOn: new Date(),
        accountUuid: template.accountUuid,
        payload: {
          templateUuid: template.uuid,
          templateTitle: template.title,
          instanceCount: instances.length,
          instances: instances.map(inst => inst.toServerDTO()),
          dateRange: {
            from: fromDate,
            to: toDate,
          },
        },
      });
    }

    return instances;
  }
}
```

### Step 2: 创建 TaskEventHandler 监听并推送

**文件**: `apps/api/src/modules/task/application/services/TaskEventHandler.ts` (新建)

```typescript
import { eventBus, type DomainEvent } from '@dailyuse/utils';
import { logger } from '@dailyuse/utils';

/**
 * Task 模块事件处理器
 * 负责：
 * 1. 监听 Task 模块的领域事件
 * 2. 通过 SSE 推送给前端
 */
export class TaskEventHandler {
  private static isInitialized = false;

  /**
   * 初始化事件监听器（在应用启动时调用一次）
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [TaskEventHandler] Already initialized, skipping');
      return;
    }

    console.log('🎧 [TaskEventHandler] Initializing event listeners...');

    /**
     * 监听 Task 实例生成事件
     */
    eventBus.on('task.instances.generated', async (event: DomainEvent) => {
      try {
        await this.handleTaskInstancesGenerated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instances.generated:', error);
      }
    });

    /**
     * 监听 Task 模板创建事件（可选）
     */
    eventBus.on('task.template.created', async (event: DomainEvent) => {
      try {
        await this.handleTaskTemplateCreated(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.template.created:', error);
      }
    });

    /**
     * 监听 Task 实例完成事件（可选）
     */
    eventBus.on('task.instance.completed', async (event: DomainEvent) => {
      try {
        await this.handleTaskInstanceCompleted(event);
      } catch (error) {
        logger.error('[TaskEventHandler] Error handling task.instance.completed:', error);
      }
    });

    this.isInitialized = true;
    console.log('✅ [TaskEventHandler] Event listeners initialized');
  }

  /**
   * 处理任务实例生成事件
   */
  private static async handleTaskInstancesGenerated(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event;
    
    if (!accountUuid) {
      logger.error('[TaskEventHandler] Missing accountUuid in task.instances.generated event');
      return;
    }

    const { templateUuid, templateTitle, instanceCount, instances, dateRange } = payload;

    logger.info('📦 [TaskEventHandler] Task instances generated', {
      accountUuid,
      templateUuid,
      templateTitle,
      instanceCount,
    });

    // 通过 SSE 推送给前端
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/http/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      const sent = sseManager.sendMessage(accountUuid, 'task:instances-generated', {
        templateUuid,
        templateTitle,
        instanceCount,
        instances, // 包含完整的实例数据
        dateRange,
        timestamp: new Date().toISOString(),
      });

      if (sent) {
        logger.info('📤 [SSE推送] task:instances-generated 事件已发送', {
          accountUuid,
          templateUuid,
          instanceCount,
        });
      } else {
        logger.warn('⚠️ [SSE推送] task:instances-generated 事件发送失败（用户可能未连接）', {
          accountUuid,
          templateUuid,
        });
      }
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 处理任务模板创建事件
   */
  private static async handleTaskTemplateCreated(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event;
    
    if (!accountUuid) {
      return;
    }

    logger.info('📝 [TaskEventHandler] Task template created', {
      accountUuid,
      templateUuid: payload.templateUuid,
    });

    // 推送给前端（可选）
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/http/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(accountUuid, 'task:template-created', {
        template: payload.template,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 处理任务实例完成事件
   */
  private static async handleTaskInstanceCompleted(event: DomainEvent): Promise<void> {
    const { accountUuid, payload } = event;
    
    if (!accountUuid) {
      return;
    }

    logger.info('✅ [TaskEventHandler] Task instance completed', {
      accountUuid,
      instanceUuid: payload.instanceUuid,
    });

    // 推送给前端（可选）
    try {
      const { SSEConnectionManager } = await import('../../../notification/interface/http/sseRoutes');
      const sseManager = SSEConnectionManager.getInstance();
      
      sseManager.sendMessage(accountUuid, 'task:instance-completed', {
        instance: payload.instance,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('[TaskEventHandler] Failed to send SSE message:', error);
    }
  }

  /**
   * 重置事件监听器（主要用于测试）
   */
  static reset(): void {
    if (!this.isInitialized) {
      return;
    }

    eventBus.off('task.instances.generated');
    eventBus.off('task.template.created');
    eventBus.off('task.instance.completed');

    this.isInitialized = false;
    console.log('🔄 [TaskEventHandler] Event listeners reset');
  }
}
```

### Step 3: 在应用启动时初始化 TaskEventHandler

**文件**: `apps/api/src/server.ts` (或 `app.ts`)

```typescript
import { TaskEventHandler } from './modules/task/application/services/TaskEventHandler';

// 在应用启动后初始化事件处理器
async function initializeEventHandlers() {
  await TaskEventHandler.initialize();
  // ... 其他模块的事件处理器
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // ⭐ 初始化事件处理器
  await initializeEventHandlers();
});
```

### Step 4: 前端 SSEClient 监听事件

**文件**: `apps/web/src/modules/notification/infrastructure/sse/SSEClient.ts`

```typescript
export class SSEClient {
  private connectInBackground(): void {
    // ... 现有代码 ...

    // ⭐ 新增：监听 Task 实例生成事件
    this.eventSource.addEventListener('task:instances-generated', (event) => {
      console.log('[SSE Client] 📦 任务实例生成事件:', event.data);
      this.handleTaskEvent('instances-generated', event.data);
    });

    // ⭐ 新增：监听 Task 模板创建事件
    this.eventSource.addEventListener('task:template-created', (event) => {
      console.log('[SSE Client] 📝 任务模板创建事件:', event.data);
      this.handleTaskEvent('template-created', event.data);
    });

    // ⭐ 新增：监听 Task 实例完成事件
    this.eventSource.addEventListener('task:instance-completed', (event) => {
      console.log('[SSE Client] ✅ 任务实例完成事件:', event.data);
      this.handleTaskEvent('instance-completed', event.data);
    });
  }

  /**
   * 处理 Task 事件
   */
  private handleTaskEvent(eventType: string, data: string): void {
    try {
      const parsedData = JSON.parse(data);
      console.log(`[SSE Client] 处理 Task 事件 ${eventType}:`, parsedData);

      // 转发到前端事件总线
      switch (eventType) {
        case 'instances-generated':
          eventBus.emit('task:instances-generated', parsedData);
          break;

        case 'template-created':
          eventBus.emit('task:template-created', parsedData);
          break;

        case 'instance-completed':
          eventBus.emit('task:instance-completed', parsedData);
          break;

        default:
          console.warn('[SSE Client] 未知 Task 事件类型:', eventType);
      }

      // 同时发送通用的 SSE 事件
      eventBus.emit(`sse:task:${eventType}`, parsedData);
    } catch (error) {
      console.error('[SSE Client] 处理 Task 事件失败:', error, data);
    }
  }
}
```

### Step 5: 前端 TaskStore 监听事件并更新状态

**文件**: `apps/web/src/modules/task/store/taskStore.ts` (Pinia Store)

```typescript
import { defineStore } from 'pinia';
import { eventBus } from '@dailyuse/utils';

export const useTaskStore = defineStore('task', () => {
  const taskInstances = ref<TaskInstance[]>([]);

  // 监听 SSE 事件
  onMounted(() => {
    // 监听任务实例生成事件
    eventBus.on('task:instances-generated', handleInstancesGenerated);
    
    // 监听任务实例完成事件
    eventBus.on('task:instance-completed', handleInstanceCompleted);
  });

  onUnmounted(() => {
    eventBus.off('task:instances-generated', handleInstancesGenerated);
    eventBus.off('task:instance-completed', handleInstanceCompleted);
  });

  /**
   * 处理任务实例生成事件
   */
  function handleInstancesGenerated(data: any) {
    console.log('📦 [TaskStore] 收到任务实例生成事件:', data);
    
    const { instances, templateUuid, instanceCount } = data;
    
    // 批量添加新实例到状态
    if (instances && Array.isArray(instances)) {
      instances.forEach((instance: TaskInstance) => {
        // 检查是否已存在（避免重复）
        const exists = taskInstances.value.some(i => i.uuid === instance.uuid);
        if (!exists) {
          taskInstances.value.push(instance);
        }
      });

      console.log(`✅ [TaskStore] 已添加 ${instances.length} 个新任务实例`);
      
      // 按日期排序
      taskInstances.value.sort((a, b) => a.instanceDate - b.instanceDate);
    }
  }

  /**
   * 处理任务实例完成事件
   */
  function handleInstanceCompleted(data: any) {
    console.log('✅ [TaskStore] 收到任务实例完成事件:', data);
    
    const { instance } = data;
    
    // 更新状态
    const index = taskInstances.value.findIndex(i => i.uuid === instance.uuid);
    if (index !== -1) {
      taskInstances.value[index] = instance;
      console.log(`✅ [TaskStore] 已更新任务实例: ${instance.uuid}`);
    }
  }

  return {
    taskInstances,
    handleInstancesGenerated,
    handleInstanceCompleted,
  };
});
```

## 🎨 优势总结

### 1. **解耦性** ✅
- TaskInstanceGenerationService 只负责生成逻辑
- TaskEventHandler 负责通知分发
- 前端组件只需监听事件

### 2. **实时性** ✅
- 后端生成实例后立即推送
- 前端无需轮询或刷新
- 用户体验流畅

### 3. **可扩展性** ✅
- 新增事件类型只需添加监听器
- 不影响现有代码
- 支持多端同步（Web + Desktop）

### 4. **可测试性** ✅
- 事件监听器可独立测试
- Mock eventBus 即可测试
- 支持 reset() 清理测试环境

### 5. **性能优化** ✅
- 只推送给相关用户（通过 accountUuid）
- 批量生成只发送一次事件
- SSE 连接复用（不创建新连接）

## 📊 完整流程示例

### 场景：用户创建循环任务模板

```typescript
// 1. 用户在前端创建任务模板
const template = await taskService.createTaskTemplate({
  title: "早期",
  taskType: "RECURRING",
  recurrenceRule: { frequency: "DAILY" },
});

// 2. 后端自动生成 100 天的实例
// TaskTemplateApplicationService.createTaskTemplate()
//   ↓
// TaskInstanceGenerationService.generateInstancesForTemplate()
//   ↓
// 保存实例到数据库 ✅
//   ↓
// eventBus.emit('task.instances.generated', { instances: [...], instanceCount: 100 })

// 3. TaskEventHandler 监听到事件
// TaskEventHandler.handleTaskInstancesGenerated()
//   ↓
// SSEConnectionManager.sendMessage(accountUuid, 'task:instances-generated', data)

// 4. 前端 SSEClient 收到事件
// SSEClient.handleTaskEvent('instances-generated', data)
//   ↓
// eventBus.emit('task:instances-generated', parsedData)

// 5. TaskStore 更新状态
// TaskStore.handleInstancesGenerated(data)
//   ↓
// taskInstances.value.push(...instances) ✅

// 6. UI 自动刷新（Vue 响应式）
// Calendar 组件自动显示新任务 ✅
```

## 🔧 后续优化建议

### 1. 增量同步（只推送新增实例）
```typescript
// 前端可以缓存已有实例的日期范围
// 后端只推送超出范围的新实例
eventBus.emit('task.instances.generated', {
  instances: newInstances, // 只包含新增的
  incrementalUpdate: true,
});
```

### 2. 离线同步（重连后补全）
```typescript
// 用户离线后重新连接，补全缺失的实例
SSEClient.onReconnect(async () => {
  const lastSyncTime = localStorage.getItem('lastTaskSyncTime');
  await taskService.syncInstances({ since: lastSyncTime });
});
```

### 3. 压缩大数据（减少传输量）
```typescript
// 如果实例数量很大，可以只推送摘要
eventBus.emit('task.instances.generated', {
  templateUuid,
  instanceCount,
  dateRange,
  // 不包含完整实例数据，前端主动拉取
});
```

## 📝 实施检查清单

- [ ] 在 `TaskInstanceGenerationService` 中添加 `eventBus.emit()`
- [ ] 创建 `TaskEventHandler.ts` 文件
- [ ] 在应用启动时调用 `TaskEventHandler.initialize()`
- [ ] 在 `SSEClient` 中添加 `task:*` 事件监听器
- [ ] 在 `TaskStore` 中添加事件处理函数
- [ ] 测试完整流程：创建模板 → 生成实例 → 前端自动更新
- [ ] 测试离线场景：断线重连后是否同步
- [ ] 添加日志记录（方便调试）
- [ ] 编写单元测试（`TaskEventHandler.spec.ts`）

---

**最后更新**：2025-11-16
