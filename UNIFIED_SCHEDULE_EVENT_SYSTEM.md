# 统一的提醒调度事件系统

## 📋 概述

本文档描述了 DailyUse 应用中通用的提醒调度事件系统，该系统允许不同模块（Task、Goal、Reminder 等）通过统一的事件接口管理提醒调度的生命周期。

## 🎯 设计目标

### 1. 统一性
- **事件命名统一**：`{module}.{entity}.{lifecycle_action}`
- **Payload 结构统一**：所有事件共享相同的基础字段
- **处理逻辑统一**：Schedule 模块使用统一的事件处理器

### 2. 解耦性
- 各模块不直接调用 Schedule 模块的服务
- 通过事件总线进行异步通信
- 降低模块间耦合，提高可维护性

### 3. 扩展性
- 新增模块只需发布标准事件
- 无需修改 Schedule 模块代码
- 支持未来更多实体类型

## 📦 架构设计

### 事件流程

```
┌─────────────────┐
│  业务模块       │
│ (Task/Goal/     │
│  Reminder)      │
└────────┬────────┘
         │ 1. 发布生命周期事件
         ▼
┌─────────────────┐
│   事件总线       │
│  (EventBus)     │
└────────┬────────┘
         │ 2. 分发事件
         ▼
┌─────────────────┐
│ ScheduleEvent   │
│   Publisher     │
└────────┬────────┘
         │ 3. 处理事件
         ▼
┌─────────────────┐
│  Schedule 模块   │
│ (创建/暂停/删除  │
│  ScheduleTask)  │
└─────────────────┘
```

### 生命周期事件

| 事件动作 | 事件名称 | 触发场景 | Schedule 模块操作 |
|---------|---------|---------|------------------|
| `created` | `{module}.created` | 实体创建 | 创建调度任务 |
| `paused` | `{module}.paused` | 实体暂停 | 删除调度任务 |
| `resumed` | `{module}.resumed` | 实体恢复 | 重新创建调度任务 |
| `deleted` | `{module}.deleted` | 实体删除 | 删除调度任务 |
| `schedule_changed` | `{module}.schedule_changed` | 调度配置变更 | 重新创建调度任务 |

## 📝 实现细节

### 1. 通用事件定义

**文件位置**：`packages/contracts/src/modules/common/schedule-lifecycle-events.ts`

```typescript
/**
 * 实体调度生命周期事件的通用 Payload
 */
export interface EntityScheduleLifecyclePayload {
  /** 实体 UUID */
  entityUuid: string;
  
  /** 实体类型（来自 SourceModule） */
  entityType: SourceModule;
  
  /** 实体标题/名称 */
  entityTitle?: string;
  
  /** 账户 UUID */
  accountUuid: string;
  
  /** 操作时间戳 */
  operatedAt: number;
  
  /** 实体完整数据（用于创建/更新调度） */
  entityData?: any;
  
  /** 操作原因/备注 */
  reason?: string;
}
```

**辅助函数**：
- `buildScheduleEventType(module, action)`: 构建事件类型名称
- `createScheduleLifecycleEvent(...)`: 创建事件对象
- `isScheduleLifecycleEvent(eventType)`: 判断是否为生命周期事件
- `parseScheduleEventType(eventType)`: 解析事件类型

### 2. Task 模块事件实现

**文件位置**：`packages/contracts/src/modules/task/events.ts`

新增事件类型：
- `TaskTemplatePausedEvent`: 模板暂停事件
- `TaskTemplateResumedEvent`: 模板恢复事件
- `TaskTemplateScheduleChangedEvent`: 调度配置变更事件

**事件发布示例**（TaskTemplateApplicationService）：

```typescript
// 暂停模板
async pauseTaskTemplate(uuid: string) {
  template.pause();
  await this.templateRepository.save(template);
  await this.handleInstancesOnPause(uuid);

  // 🔥 发布暂停事件
  await eventBus.publish({
    eventType: 'task.template.paused',
    payload: {
      taskTemplateUuid: template.uuid,
      accountUuid: template.accountUuid,
      pausedAt: Date.now(),
      reason: '用户手动暂停',
    },
    timestamp: Date.now(),
  });
}

// 激活模板
async activateTaskTemplate(uuid: string) {
  template.activate();
  await this.templateRepository.save(template);
  await this.generateInitialInstances(template);

  // 🔥 发布恢复事件
  await eventBus.publish({
    eventType: 'task.template.resumed',
    payload: {
      taskTemplateUuid: template.uuid,
      taskTemplateTitle: template.title,
      accountUuid: template.accountUuid,
      resumedAt: Date.now(),
      taskTemplateData: template.toServerDTO(),
    },
    timestamp: Date.now(),
  });
}
```

### 3. Schedule 模块事件监听

**文件位置**：`apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts`

新增事件监听器：

```typescript
// 监听 TaskTemplate 暂停事件
eventBus.on('task.template.paused', async (event: DomainEvent) => {
  const { taskTemplateUuid } = event.payload;
  console.log(`⏸️  [ScheduleEventPublisher] 处理任务模板暂停: ${taskTemplateUuid}`);
  await this.deleteTasksBySource(
    event.accountUuid, 
    SourceModule.TASK, 
    taskTemplateUuid
  );
});

// 监听 TaskTemplate 恢复事件
eventBus.on('task.template.resumed', async (event: DomainEvent) => {
  const { taskTemplateData } = event.payload;
  console.log(`▶️  [ScheduleEventPublisher] 处理任务模板恢复: ${taskTemplateData.uuid}`);
  await this.handleTaskCreated(event.accountUuid, taskTemplateData);
});
```

## 🔄 完整业务流程

### 场景 1：用户暂停任务模板

```
1. 用户点击"暂停"按钮
   ↓
2. TaskTemplateController 调用 pauseTaskTemplate()
   ↓
3. TaskTemplateApplicationService 执行业务逻辑：
   - 修改模板状态为 PAUSED
   - 处理未完成的任务实例（标记为 SKIPPED）
   - 发布 task.template.paused 事件
   ↓
4. ScheduleEventPublisher 接收事件：
   - 查找该模板的所有 ScheduleTask
   - 批量删除调度任务
   ↓
5. 调度引擎（Bree）停止触发提醒
   ↓
6. 完成 ✅
```

### 场景 2：用户激活任务模板

```
1. 用户点击"激活"按钮
   ↓
2. TaskTemplateController 调用 activateTaskTemplate()
   ↓
3. TaskTemplateApplicationService 执行业务逻辑：
   - 修改模板状态为 ACTIVE
   - 生成未来 100 天的任务实例
   - 发布 task.template.resumed 事件
   ↓
4. ScheduleEventPublisher 接收事件：
   - 使用 TaskScheduleStrategy 创建 ScheduleTask
   - 保存到数据库
   - 注册到调度引擎
   ↓
5. 调度引擎（Bree）开始按照配置触发提醒
   ↓
6. 完成 ✅
```

## 🧩 模块适配指南

### 如何让新模块使用统一事件系统

**步骤 1：定义模块事件**

在 `packages/contracts/src/modules/{module}/events.ts` 中定义事件：

```typescript
export interface {Module}PausedEvent extends IUnifiedEvent {
  eventType: '{module}.paused';
  payload: {
    {module}Uuid: string;
    accountUuid: string;
    pausedAt: number;
    reason?: string;
  };
}

export interface {Module}ResumedEvent extends IUnifiedEvent {
  eventType: '{module}.resumed';
  payload: {
    {module}Uuid: string;
    {module}Title: string;
    accountUuid: string;
    resumedAt: number;
    {module}Data?: any;
  };
}
```

**步骤 2：在业务服务中发布事件**

```typescript
// 在 {Module}ApplicationService 中
import { eventBus } from '@dailyuse/utils';

async pause{Module}(uuid: string) {
  // 业务逻辑...
  
  await eventBus.publish({
    eventType: '{module}.paused',
    payload: {
      {module}Uuid: entity.uuid,
      accountUuid: entity.accountUuid,
      pausedAt: Date.now(),
      reason: '用户手动暂停',
    },
    timestamp: Date.now(),
  });
}
```

**步骤 3：在 ScheduleEventPublisher 中添加监听器**

```typescript
// 在 ScheduleEventPublisher.initialize() 中
eventBus.on('{module}.paused', async (event: DomainEvent) => {
  const { {module}Uuid } = event.payload;
  await this.deleteTasksBySource(
    event.accountUuid,
    SourceModule.{MODULE},
    {module}Uuid
  );
});

eventBus.on('{module}.resumed', async (event: DomainEvent) => {
  const { {module}Data } = event.payload;
  await this.handle{Module}Created(event.accountUuid, {module}Data);
});
```

**步骤 4：实现 ScheduleStrategy（如果需要）**

如果是新的实体类型，需要在 `packages/domain-server/src/modules/schedule/domain/strategies/` 中创建对应的策略。

## 📊 已适配模块

| 模块 | 实体 | 暂停事件 | 恢复事件 | 删除事件 | 状态 |
|------|------|---------|---------|---------|------|
| Task | TaskTemplate | `task.template.paused` | `task.template.resumed` | `task.template.deleted` | ✅ 已实现 |
| Goal | Goal | `goal.paused` | `goal.resumed` | `goal.deleted` | ⏳ 待实现 |
| Reminder | ReminderTemplate | `reminder.template.paused` | `reminder.template.enabled` | `reminder.template.deleted` | ✅ 已实现 |

## 🧪 测试建议

### 1. 单元测试

测试事件发布和监听：

```typescript
describe('TaskTemplate Schedule Events', () => {
  it('should publish paused event when template is paused', async () => {
    const eventSpy = vi.spyOn(eventBus, 'publish');
    
    await service.pauseTaskTemplate(templateUuid);
    
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'task.template.paused',
        payload: expect.objectContaining({
          taskTemplateUuid: templateUuid,
        }),
      })
    );
  });
});
```

### 2. 集成测试

测试完整流程：

```typescript
describe('TaskTemplate Pause/Resume Integration', () => {
  it('should delete schedule tasks when template is paused', async () => {
    // 1. 创建模板和调度任务
    const template = await createTaskTemplate();
    const scheduleTasks = await getScheduleTasks(template.uuid);
    expect(scheduleTasks.length).toBeGreaterThan(0);
    
    // 2. 暂停模板
    await pauseTaskTemplate(template.uuid);
    
    // 3. 等待事件处理
    await sleep(100);
    
    // 4. 验证调度任务已删除
    const afterPause = await getScheduleTasks(template.uuid);
    expect(afterPause.length).toBe(0);
  });
  
  it('should recreate schedule tasks when template is resumed', async () => {
    // 1. 暂停的模板
    const template = await createPausedTemplate();
    
    // 2. 激活模板
    await activateTaskTemplate(template.uuid);
    
    // 3. 等待事件处理
    await sleep(100);
    
    // 4. 验证调度任务已创建
    const scheduleTasks = await getScheduleTasks(template.uuid);
    expect(scheduleTasks.length).toBeGreaterThan(0);
  });
});
```

## 🔍 故障排查

### 问题 1：事件发布了但调度任务未更新

**排查步骤**：
1. 检查事件是否成功发布（查看日志：`📤 [TaskTemplateApplicationService] 已发布 xxx 事件`）
2. 检查 ScheduleEventPublisher 是否已初始化（查看日志：`✅ [ScheduleEventPublisher] All event listeners registered`）
3. 检查监听器是否触发（查看日志：`⏸️ [ScheduleEventPublisher] 处理任务模板暂停`）
4. 检查数据库中的 ScheduleTask 是否已删除/创建

### 问题 2：多次触发导致重复操作

**解决方案**：
- 在 ScheduleEventPublisher 中添加幂等性检查
- 在删除调度任务前先检查是否存在
- 在创建调度任务前先删除旧的调度任务

### 问题 3：事件顺序混乱

**解决方案**：
- 事件总线使用 `await eventBus.publish()`（同步等待发布完成）
- 避免并发发布相关事件
- 在关键操作后添加适当的延迟

## 📚 参考文档

- [事件总线实现](packages/utils/src/domain/eventBus.ts)
- [调度生命周期事件定义](packages/contracts/src/modules/common/schedule-lifecycle-events.ts)
- [Task 模块事件](packages/contracts/src/modules/task/events.ts)
- [Schedule 事件发布器](apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts)
- [任务模板应用服务](apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts)

## 🎯 下一步

### 待实现功能

1. **Goal 模块适配**：
   - 添加 `goal.paused` 和 `goal.resumed` 事件
   - 在 GoalApplicationService 中发布事件
   - 测试暂停/恢复功能

2. **事件日志记录**：
   - 记录所有调度事件到数据库
   - 提供事件审计功能
   - 用于故障排查和数据分析

3. **事件重试机制**：
   - 事件发布失败时自动重试
   - 记录失败的事件到死信队列
   - 提供手动重新处理功能

4. **性能优化**：
   - 批量处理事件（避免逐个操作数据库）
   - 异步化事件处理（不阻塞主业务流程）
   - 缓存调度任务查询结果

---

**版本**：v1.0  
**最后更新**：2025-11-16  
**维护者**：Backend Team
