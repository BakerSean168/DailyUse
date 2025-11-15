# Task 模块提醒架构重构完成 ✅

## 📋 重构目标

解决原架构的核心问题：
- ❌ 原方案：TaskTemplate → 生成 100 个 TaskInstance → 为每个 Instance 创建 ReminderTemplate → **创建 100 个 Reminder（资源浪费！）**
- ✅ 新方案：TaskTemplate → 生成 100 个 TaskInstance（用于展示）+ 创建 1 个循环 ScheduleTask（用于提醒）→ **只有 1 个调度任务**

## 🎯 实施方案（方案 C - 混合方案）

### 核心策略

```
TaskTemplate 创建时
    ↓
1. 生成 100 天的 TaskInstance（用于前端展示和允许用户修改）
    ↓
2. 创建 1 个循环 ScheduleTask（使用 cron 表达式）
    ↓
ScheduleTask 每天触发
    ↓
3. 检查当天的 TaskInstance
    ↓
4. 使用 Instance 的实际时间（可能被用户修改）
    ↓
5. 发送提醒通知（不创建独立的 ReminderTemplate）
```

### 优势

1. **用户体验好**：
   - ✅ 可以提前看到未来 100 天的任务
   - ✅ 可以灵活调整某天的时间
   - ✅ 不影响其他天的任务

2. **性能合理**：
   - ✅ 只有 1 个 ScheduleTask（不是 100 个 Reminder）
   - ✅ 提醒系统压力小
   - ✅ 数据库资源消耗少

3. **架构清晰**：
   - ✅ TaskInstance：展示和数据管理
   - ✅ ScheduleTask：循环提醒
   - ✅ 职责分明

## 📊 资源对比

| 方案 | TaskInstance | ReminderTemplate | ScheduleTask | 总计 |
|------|-------------|-----------------|-------------|-----|
| **方案 A（原方案）** | 100 | 100 | 100 | 300 |
| **方案 B（完全动态）** | 1/天（动态） | 0 | 1 | 2 |
| **方案 C（混合方案）** | 100 | 0 | 1 | 101 |

**方案 C 的优势：**
- 相比方案 A：减少 199 个记录（66% 减少）
- 相比方案 B：增加 99 个记录，但获得灵活性

## 🔧 代码修改清单

### 1. TaskTemplateApplicationService（已修改）
**文件**：`apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts`

**修改内容**：
```typescript
private async generateInitialInstances(template: TaskTemplate): Promise<void> {
  // 1. 生成 100 天的 TaskInstance（用于展示和修改）
  const instances = await this.generationService.generateInstancesForTemplate(template);
  
  // 2. 🔥 如果配置了提醒，创建循环 ScheduleTask（只创建1个）
  if (template.reminderConfig?.enabled) {
    await this.createScheduleTaskForTemplate(template);
  }
}

private async createScheduleTaskForTemplate(template: TaskTemplate): Promise<void> {
  // 使用 ScheduleTaskFactory + TaskScheduleStrategy 创建 ScheduleTask
  const factory = new ScheduleTaskFactory();
  const scheduleTask = factory.createFromSourceEntity({
    accountUuid: template.accountUuid,
    sourceModule: SourceModule.TASK,
    sourceEntityId: template.uuid,
    sourceEntity: templateDTO,
  });
  
  // 保存到仓储
  await repository.save(scheduleTask);
}
```

**作用**：
- 创建 TaskTemplate 时自动创建 ScheduleTask
- 使用 `TaskScheduleStrategy` 生成 cron 表达式
- 只创建 1 个 ScheduleTask（不是 100 个）

### 2. TaskReminderScheduleHandler（新建）
**文件**：`apps/api/src/modules/task/application/event-handlers/TaskReminderScheduleHandler.ts`

**功能**：
```typescript
export class TaskReminderScheduleHandler {
  async handle(event: DomainEvent<ScheduleTaskTriggeredPayload>): Promise<void> {
    // 1. 检查是否是 TASK 模块的事件
    if (event.payload.sourceModule !== 'TASK') return;
    
    // 2. 获取今天的 TaskInstance
    const today = new Date().setHours(0, 0, 0, 0);
    const instance = await instanceRepository.findByTemplateAndDate(templateUuid, today);
    
    // 3. 发送提醒通知（不创建 ReminderTemplate）
    await this.sendReminderNotification(instance, triggers);
  }
}
```

**作用**：
- 监听 `ScheduleTaskTriggered` 事件
- 检查当天的 TaskInstance
- 使用 Instance 的实际时间（可能被用户修改）
- 直接发送通知，不创建 Reminder

### 3. registerTaskEventListeners（已修改）
**文件**：`apps/api/src/modules/task/application/event-handlers/registerTaskEventListeners.ts`

**修改内容**：
```typescript
export function registerTaskEventListeners(): void {
  // 监听 ScheduleTaskTriggered 事件（不是 task.instance.created）
  eventBus.subscribe('ScheduleTaskTriggered', async (event: any) => {
    // 只处理 TASK 模块的事件
    if (event.payload?.sourceModule !== 'TASK') return;
    
    const handler = new TaskReminderScheduleHandler();
    await handler.handle(event);
  });
}
```

**作用**：
- 从监听 `task.instance.created` 改为 `ScheduleTaskTriggered`
- 使用新的 `TaskReminderScheduleHandler`

### 4. TaskInstance（已修改）
**文件**：`packages/domain-server/src/task/aggregates/TaskInstance.ts`

**修改内容**：
```typescript
public static create(params: {
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfig;
  // ❌ 删除：title, reminderConfig
}): TaskInstance {
  const instance = new TaskInstance({...});
  
  // ❌ 删除：不再发布 task.instance.created 事件
  // instance.addDomainEvent({...});
  
  return instance;
}
```

**作用**：
- 简化 `TaskInstance.create()` 参数
- 不再发布领域事件
- TaskInstance 只负责数据管理

### 5. TaskTemplate（已修改）
**文件**：`packages/domain-server/src/task/aggregates/TaskTemplate.ts`

**修改内容**：
```typescript
public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
  // ...
  const instance = TaskInstance.create({
    templateUuid: this.uuid,
    accountUuid: this._accountUuid,
    instanceDate: currentDate,
    timeConfig: this._timeConfig,
    // ❌ 删除：title, reminderConfig
  });
  // ...
}
```

**作用**：
- 不再传递 title 和 reminderConfig
- 简化实例生成逻辑

### 6. TaskInstanceCreatedHandler（已删除）
**文件**：`apps/api/src/modules/task/application/event-handlers/TaskInstanceCreatedHandler.ts`

**原功能**（已废弃）：
- ❌ 为每个 TaskInstance 创建 ReminderTemplate
- ❌ 导致创建 100 个 Reminder

**删除原因**：
- 架构错误：资源浪费
- 改为使用 ScheduleTask 统一管理

## 🚀 使用 TaskScheduleStrategy

### ScheduleTaskFactory 创建流程

```typescript
// 1. 创建工厂
const factory = new ScheduleTaskFactory();

// 2. 使用策略创建 ScheduleTask
const scheduleTask = factory.createFromSourceEntity({
  accountUuid: template.accountUuid,
  sourceModule: SourceModule.TASK,
  sourceEntityId: template.uuid,
  sourceEntity: templateDTO,
});

// 3. 策略内部流程
TaskScheduleStrategy.shouldCreateSchedule(templateDTO)
  ↓
TaskScheduleStrategy.createSchedule({...})
  ↓
生成 cron 表达式（根据 recurrenceRule + reminderConfig）
  ↓
创建 ScheduleConfig + TaskMetadata
  ↓
ScheduleTask.create({...})
```

### TaskScheduleStrategy 生成的 cron 表达式

**示例**：
- **每日任务（9:00 提醒）**：`0 0 9 * * *`
- **每周任务（周一、周三、周五 9:00）**：`0 0 9 * * 1,3,5`
- **每月任务（每月 1 号 9:00）**：`0 0 9 1 * *`

**提醒时间计算**：
```typescript
// 如果有 RELATIVE 触发器（相对时间）
const offsetMinutes = trigger.relativeValue * 60; // 例如：提前 30 分钟
const reminderTime = taskStartTime - offsetMinutes;

// 如果有 ABSOLUTE 触发器（绝对时间）
const reminderTime = trigger.absoluteTime; // 使用指定时间
```

## 📝 事件流程

### 创建 TaskTemplate 时

```
1. TaskTemplateApplicationService.createTaskTemplate()
    ↓
2. TaskTemplate.create()
    ↓
3. templateRepository.save(template)
    ↓
4. generateInitialInstances()
    ├─ TaskInstanceGenerationService.generateInstancesForTemplate()
    │   └─ 生成 100 个 TaskInstance（保存到数据库）
    └─ createScheduleTaskForTemplate()
        └─ ScheduleTaskFactory.createFromSourceEntity()
            └─ 创建 1 个 ScheduleTask（保存到数据库）
```

### ScheduleTask 触发时

```
1. ScheduleExecutionEngine 定时检查
    ↓
2. 发布 ScheduleTaskTriggered 事件
    ↓
3. TaskReminderScheduleHandler 监听
    ↓
4. 获取今天的 TaskInstance
    ↓
5. 检查 reminderConfig
    ↓
6. 发送提醒通知
```

## ✅ 验证清单

### 功能验证

- [ ] 创建 TaskTemplate 时自动创建 ScheduleTask
- [ ] ScheduleTask 使用正确的 cron 表达式
- [ ] ScheduleTask 触发时正确查找当天的 TaskInstance
- [ ] 提醒通知正确发送
- [ ] 用户修改 TaskInstance 时间后，提醒使用修改后的时间

### 数据验证

- [ ] 每个 TaskTemplate 只对应 1 个 ScheduleTask
- [ ] TaskInstance 表中有 100 条记录（未来 100 天）
- [ ] ScheduleTask 表中只有 1 条记录
- [ ] ReminderTemplate 表中没有多余的记录

### 性能验证

- [ ] 创建 TaskTemplate 耗时 < 1 秒
- [ ] 数据库查询优化（使用索引）
- [ ] 提醒触发延迟 < 1 秒

## 🔮 后续优化

### 优先级 1：激活暂停的模板时

```typescript
async activateTaskTemplate(uuid: string): Promise<void> {
  template.activate();
  await this.templateRepository.save(template);

  // ✅ 激活后生成实例
  await this.generateInitialInstances(template);
}
```

### 优先级 2：更新 RecurrenceRule 时

```typescript
async updateTaskTemplate(uuid: string, params: {...}): Promise<void> {
  // 检查是否修改了影响实例生成的字段
  const needsRegeneration = 
    params.recurrenceRule !== undefined || 
    params.timeConfig !== undefined;

  if (needsRegeneration && template.status === 'ACTIVE') {
    // 删除未完成的实例
    await this.instanceRepository.deleteByTemplateAndStatus(uuid, 'PENDING');
    
    // 删除旧的 ScheduleTask
    await this.deleteScheduleTaskForTemplate(template);
    
    // 重新生成
    await this.generateInitialInstances(template);
  }
}
```

### 优先级 3：定时补充实例

```typescript
// 每天凌晨 3 点检查并补充实例
cron.schedule('0 3 * * *', async () => {
  const generationService = TaskContainer.getInstance().resolve('TaskInstanceGenerationService');
  await generationService.checkAndGenerateInstances();
});
```

## 📚 相关文档

- `TASK_REMINDER_STRATEGY_DECISION.md` - 详细的方案对比和决策过程
- `TASK_INSTANCE_AND_REMINDER_FLOW.md` - 之前的流程分析（已过时）
- `TaskScheduleStrategy.ts` - 调度策略实现
- `ScheduleTaskFactory.ts` - 调度任务工厂

## 🎉 总结

**架构重构成功！**

- ✅ 从"为每个 Instance 创建 Reminder"改为"使用 ScheduleTask 统一管理"
- ✅ 资源消耗减少 66%（从 300 个记录 → 101 个记录）
- ✅ 保留用户灵活性（可修改单个 Instance 的时间）
- ✅ 性能合理（只有 1 个调度任务）
- ✅ 架构清晰（职责分明）

**关键设计决策**：
> "是否让用户能直接修改 instance 的时间配置？"
> 
> **答案：是的，应该允许**
> 
> 因此我们选择了方案 C（混合方案），既保留了灵活性，又控制了资源消耗。
