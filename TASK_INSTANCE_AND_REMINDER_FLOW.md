# Task 模块实例生成和提醒创建流程分析

## 📋 问题 1: TaskTemplate 创建时是否默认 ACTIVE 状态？

### ✅ 答案：是的，默认就是 ACTIVE 状态

**代码位置**：`packages/domain-server/src/task/aggregates/TaskTemplate.ts`

```typescript
public static create(params: {
  accountUuid: string;
  title: string;
  // ...
}): TaskTemplate {
  const now = Date.now();
  const template = new TaskTemplate({
    accountUuid: params.accountUuid,
    title: params.title,
    // ...
    status: 'ACTIVE' as TaskTemplateStatus, // 🔥 默认 ACTIVE
    createdAt: now,
    updatedAt: now,
    generateAheadDays: params.generateAheadDays ?? 30, // 默认30天（已被我们改为100天限制）
  });

  template.addHistory('created');
  return template;
}
```

**影响**：
- ✅ 创建 TaskTemplate 后立即为 ACTIVE 状态
- ✅ 触发自动生成实例的条件已满足
- ✅ 我们在 `createTaskTemplate()` 中添加的自动生成逻辑会立即执行

**流程图**：
```
创建 TaskTemplate
    ↓
状态 = ACTIVE (默认)
    ↓
ApplicationService.createTaskTemplate() 检查状态
    ↓
if (status === ACTIVE) → 调用 generateInitialInstances()
    ↓
生成 100 天内的实例（最多 100 个）
```

---

## 📋 问题 2: 什么情况下会更新 Instance 的数量？

### 当前实现的情况

#### 1. **创建 TaskTemplate 时（已实现 ✅）**

**代码位置**：`apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts`

```typescript
async createTaskTemplate(params: {...}): Promise<TaskTemplateServerDTO> {
  // 1. 创建模板
  const template = TaskTemplate.create({...});
  
  // 2. 保存模板
  await this.templateRepository.save(template);

  // 3. 🔥 如果状态是 ACTIVE，立即生成初始实例
  if (template.status === TaskTemplateStatus.ACTIVE) {
    await this.generateInitialInstances(template);
  }

  return template.toClientDTO();
}
```

**触发条件**：
- ✅ 创建 TaskTemplate
- ✅ 状态为 ACTIVE

**生成数量**：
- 100 天内的实例
- 最多 100 个

---

#### 2. **后台定时任务补充（未实现 ⏳）**

**代码位置**：`TaskInstanceGenerationService.checkAndGenerateInstances()`

```typescript
async checkAndGenerateInstances(): Promise<void> {
  // 计算需要生成到的日期（100天）
  const toDate = Date.now() + DEFAULT_GENERATE_AHEAD_DAYS * 86400000;

  // 查找需要生成实例的模板
  const templates = await this.templateRepository.findNeedGenerateInstances(toDate);

  // 为每个模板生成实例
  for (const template of templates) {
    await this.generateInstancesForTemplate(template, toDate);
  }
}
```

**触发条件**（需要实现）：
- ⏳ 定时任务（每天凌晨3点）
- ⏳ 检查所有 ACTIVE 模板
- ⏳ 如果 `lastGeneratedDate` 距离现在不足 7 天，补充到 100 天

**实现方式**：
```typescript
// 需要添加的代码（在 apps/api 中）
import cron from 'node-cron';

// 每天凌晨 3 点执行
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 [定时任务] 开始检查并生成任务实例');
  const generationService = TaskContainer.getInstance().resolve('TaskInstanceGenerationService');
  await generationService.checkAndGenerateInstances();
});
```

---

#### 3. **激活暂停的模板时（未实现 ❌）**

**代码位置**：`TaskTemplateApplicationService.activateTaskTemplate()`

```typescript
async activateTaskTemplate(uuid: string): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  template.activate(); // 🔥 激活模板
  await this.templateRepository.save(template);

  // ❌ 问题：没有生成实例！
  
  return template.toClientDTO();
}
```

**应该修改为**：
```typescript
async activateTaskTemplate(uuid: string): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  template.activate();
  await this.templateRepository.save(template);

  // ✅ 激活后生成实例
  await this.generateInitialInstances(template);
  
  return template.toClientDTO();
}
```

---

#### 4. **更新 TaskTemplate 的重复规则时（未实现 ❌）**

**代码位置**：`TaskTemplateApplicationService.updateTaskTemplate()`

```typescript
async updateTaskTemplate(uuid: string, params: {...}): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  // ❌ 问题：
  // 1. 更新逻辑未实现（TODO 注释）
  // 2. 没有处理 recurrenceRule 变化
  // 3. 没有重新生成实例

  await this.templateRepository.save(template);
  return template.toClientDTO();
}
```

**应该修改为**：
```typescript
async updateTaskTemplate(uuid: string, params: {...}): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  // 检查是否修改了影响实例生成的字段
  const needsRegeneration = 
    params.recurrenceRule !== undefined || 
    params.timeConfig !== undefined;

  // 更新模板
  // TODO: 在 TaskTemplate 聚合根中添加 update() 方法
  
  await this.templateRepository.save(template);

  // ✅ 如果修改了重复规则或时间配置，重新生成实例
  if (needsRegeneration && template.status === TaskTemplateStatus.ACTIVE) {
    // 删除未完成的实例
    await this.instanceRepository.deleteByTemplateAndStatus(uuid, 'PENDING');
    // 重新生成
    await this.generateInitialInstances(template);
  }

  return template.toClientDTO();
}
```

---

#### 5. **手动触发重新生成（未实现 ⏳）**

**应该提供的 API**：
```typescript
async regenerateInstances(templateUuid: string): Promise<void> {
  const template = await this.templateRepository.findByUuid(templateUuid);
  if (!template) {
    throw new Error(`TaskTemplate ${templateUuid} not found`);
  }

  // 删除所有未完成的实例
  await this.instanceRepository.deleteByTemplateAndStatus(templateUuid, 'PENDING');
  
  // 重新生成
  await this.generateInitialInstances(template);
}
```

**前端调用**：
```vue
<v-btn @click="regenerateInstances(template.uuid)">
  重新生成实例
</v-btn>
```

---

### 总结：更新 Instance 数量的情况

| 场景 | 状态 | 触发时机 | 实现优先级 |
|------|------|---------|-----------|
| **创建模板** | ✅ 已实现 | 创建后立即 | - |
| **激活模板** | ❌ 未实现 | 从 PAUSED → ACTIVE | 🔴 高 |
| **更新重复规则** | ❌ 未实现 | 修改 recurrenceRule | 🟡 中 |
| **后台定时补充** | ⏳ 代码已写 | 每天凌晨 3 点 | 🟡 中 |
| **手动重新生成** | ⏳ 需要 API | 用户手动触发 | 🟢 低 |

---

## 📋 问题 3: Schedule（提醒）的创建流程

### Reminder 模块的创建流程

**代码位置**：`apps/api/src/modules/reminder/application/services/ReminderApplicationService.ts`

```typescript
async createReminderTemplate(params: {
  accountUuid: string;
  title: string;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  // ...
}): Promise<ReminderTemplateClientDTO> {
  // 1. 创建 ReminderTemplate（领域模型）
  const template = await this.domainService.createReminderTemplate(params);
  
  // 2. 🔥 发布领域事件（触发调度任务创建）
  const events = template.getDomainEvents();
  console.log('🔥 Publishing domain events:', {
    templateUuid: template.uuid,
    eventsCount: events.length,
    eventTypes: events.map(e => e.eventType),
  });
  
  for (const event of events) {
    // 增强事件 payload，包含完整的 reminder 数据
    const enhancedEvent = {
      ...event,
      payload: {
        ...event.payload,
        reminder: template.toServerDTO(), // ✅ 添加完整数据
      },
    };
    await eventBus.publish(enhancedEvent); // ✅ 发布事件
  }
  template.clearDomainEvents();
  
  return template.toClientDTO();
}
```

### 领域事件：`reminder.template.created`

**代码位置**：`packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts`

```typescript
public static create(params: {...}): ReminderTemplate {
  const template = new ReminderTemplate({...});

  // 计算下次触发时间
  template._nextTriggerAt = template.calculateNextTrigger();

  // 🔥 发布创建事件
  template.addDomainEvent({
    eventType: 'reminder.template.created', // 事件类型
    aggregateId: uuid,
    occurredOn: new Date(),
    accountUuid: params.accountUuid,
    payload: {
      templateUuid: uuid,
      title: params.title,
      type: params.type,
    },
  });

  return template;
}
```

### 事件订阅和调度任务创建（推测）

**应该有的事件处理器**（需要确认是否实现）：

```typescript
// 伪代码：应该存在的事件处理器
class ReminderScheduleHandler {
  async handle(event: ReminderTemplateCreatedEvent): Promise<void> {
    const { reminder } = event.payload;

    // 创建调度任务（可能使用 node-cron, BullMQ, 或自定义调度器）
    await scheduleService.scheduleReminder({
      reminderUuid: reminder.uuid,
      nextTriggerAt: reminder.nextTriggerAt,
      recurrence: reminder.recurrence,
      // ...
    });

    console.log(`✅ 调度任务已创建: ${reminder.uuid}`);
  }
}

// 注册事件处理器
eventBus.subscribe('reminder.template.created', (event) => {
  const handler = new ReminderScheduleHandler();
  handler.handle(event);
});
```

---

## 🔄 Task 和 Reminder 的对比

### Reminder 模块（已有的实践）

```
创建 ReminderTemplate
    ↓
发布领域事件 'reminder.template.created'
    ↓
事件总线分发事件
    ↓
调度系统订阅事件
    ↓
创建调度任务（ScheduleTask）
    ↓
定时执行提醒
```

**特点**：
- ✅ 使用领域事件解耦
- ✅ 调度系统独立
- ✅ 事件驱动架构

---

### Task 模块（当前实现）

```
创建 TaskTemplate
    ↓
直接调用 generateInitialInstances()
    ↓
生成 TaskInstance
    ↓
保存到数据库
    ↓
❌ 没有创建 Reminder
```

**问题**：
- ❌ 没有发布领域事件
- ❌ 没有创建对应的提醒
- ❌ 与 Reminder 模块没有集成

---

### Task 模块应该如何实现？

#### 方案 1：直接调用 Reminder 服务（耦合）

```typescript
// ❌ 不推荐：Task 模块直接依赖 Reminder 模块
async generateInitialInstances(template: TaskTemplate): Promise<void> {
  const instances = await this.generationService.generateInstancesForTemplate(template);
  
  // 为每个实例创建提醒
  if (template.reminderConfig?.enabled) {
    for (const instance of instances) {
      await reminderService.createReminder({
        sourceType: 'TASK',
        sourceUuid: instance.uuid,
        triggerTime: this.calculateReminderTime(instance, template.reminderConfig),
        // ...
      });
    }
  }
}
```

**问题**：
- ❌ 模块间强耦合
- ❌ Task 模块需要知道 Reminder 的实现细节
- ❌ 违反 DDD 原则

---

#### 方案 2：领域事件解耦（推荐 ✅）

**Step 1：TaskInstance 发布创建事件**

```typescript
// packages/domain-server/src/task/aggregates/TaskInstance.ts

static create(params: {
  templateUuid: string;
  instanceDate: number;
  reminderConfig?: TaskReminderConfig;
  // ...
}): TaskInstance {
  const instance = new TaskInstance({...});

  // 🔥 发布创建事件
  instance.addDomainEvent({
    eventType: 'task.instance.created',
    aggregateId: instance.uuid,
    occurredOn: new Date(),
    accountUuid: params.accountUuid,
    payload: {
      instanceUuid: instance.uuid,
      templateUuid: params.templateUuid,
      instanceDate: params.instanceDate,
      title: params.title,
      reminderConfig: params.reminderConfig, // 传递提醒配置
    },
  });

  return instance;
}
```

**Step 2：在 ApplicationService 中发布事件**

```typescript
// apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts

private async generateInitialInstances(template: TaskTemplate): Promise<void> {
  const instances = await this.generationService.generateInstancesForTemplate(template);
  
  // 🔥 发布领域事件
  for (const instance of instances) {
    const events = instance.getDomainEvents();
    for (const event of events) {
      await eventBus.publish(event);
    }
    instance.clearDomainEvents();
  }
}
```

**Step 3：创建事件处理器**

```typescript
// apps/api/src/modules/task/application/event-handlers/TaskInstanceCreatedHandler.ts

export class TaskInstanceCreatedHandler {
  constructor(
    private readonly reminderService: ReminderApplicationService,
  ) {}

  async handle(event: TaskInstanceCreatedEvent): Promise<void> {
    const { instanceUuid, instanceDate, reminderConfig, title } = event.payload;

    // 如果配置了提醒
    if (reminderConfig?.enabled) {
      // 计算提醒触发时间
      const triggerTime = instanceDate - reminderConfig.timeOffsetMinutes * 60 * 1000;

      // 创建提醒
      await this.reminderService.createReminderTemplate({
        accountUuid: event.accountUuid,
        title: `任务提醒: ${title}`,
        type: 'TIME_BASED' as ReminderType,
        trigger: {
          type: 'FIXED_TIME',
          time: triggerTime,
        },
        notificationConfig: {
          channels: [reminderConfig.channel],
          message: `任务"${title}"即将开始`,
        },
        // 关联到 TaskInstance
        metadata: {
          sourceType: 'TASK_INSTANCE',
          sourceUuid: instanceUuid,
        },
      });

      console.log(`✅ 为任务实例 ${instanceUuid} 创建提醒成功`);
    }
  }
}
```

**Step 4：注册事件处理器**

```typescript
// apps/api/src/shared/events/setupEventHandlers.ts

export function setupEventHandlers(eventBus: EventBus): void {
  // Task 事件处理器
  const taskHandler = new TaskInstanceCreatedHandler(
    ReminderContainer.getInstance().resolve('ReminderApplicationService'),
  );

  eventBus.subscribe('task.instance.created', (event) => {
    taskHandler.handle(event).catch((error) => {
      console.error('❌ TaskInstanceCreatedHandler 处理失败:', error);
    });
  });
}
```

---

## 🎯 实施建议

### 优先级 1：修复激活模板不生成实例的问题 🔴

```typescript
// 立即修改
async activateTaskTemplate(uuid: string): Promise<TaskTemplateServerDTO> {
  const template = await this.templateRepository.findByUuid(uuid);
  if (!template) {
    throw new Error(`TaskTemplate ${uuid} not found`);
  }

  template.activate();
  await this.templateRepository.save(template);

  // ✅ 激活后生成实例
  await this.generateInitialInstances(template);
  
  return template.toClientDTO();
}
```

### 优先级 2：实现领域事件集成 Reminder 🟡

1. ✅ TaskInstance 发布 `task.instance.created` 事件
2. ✅ ApplicationService 发布事件到事件总线
3. ✅ 创建 `TaskInstanceCreatedHandler`
4. ✅ 注册事件处理器

### 优先级 3：后台定时补充实例 🟢

```typescript
// apps/api/src/shared/schedulers/taskScheduler.ts
import cron from 'node-cron';

export function setupTaskScheduler(): void {
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 [定时任务] 开始检查并生成任务实例');
    const generationService = TaskContainer.getInstance().resolve('TaskInstanceGenerationService');
    await generationService.checkAndGenerateInstances();
  });
}
```

---

## 📊 流程对比总结

### 当前 Task 流程（简化版）

```
创建 TaskTemplate (status=ACTIVE)
    ↓
ApplicationService.createTaskTemplate()
    ↓
generateInitialInstances()
    ↓
生成 100 个 TaskInstance
    ↓
保存到数据库
    ↓
✅ 完成（但没有提醒）
```

### 完整 Task 流程（应该实现的）

```
创建 TaskTemplate (status=ACTIVE)
    ↓
ApplicationService.createTaskTemplate()
    ↓
generateInitialInstances()
    ↓
为每个 Instance 发布 'task.instance.created' 事件
    ↓
         ┌─────────────────────────────────┐
         │    EventBus 分发事件            │
         └─────────────────────────────────┘
                      ↓
         ┌─────────────────────────────────┐
         │  TaskInstanceCreatedHandler     │
         └─────────────────────────────────┘
                      ↓
         检查是否配置了 reminderConfig
                      ↓
         创建 ReminderTemplate（提醒模板）
                      ↓
         发布 'reminder.template.created' 事件
                      ↓
         调度系统创建定时任务
                      ↓
         ✅ 完成（Task + Reminder 都已创建）
```

---

**总结**：
1. ✅ TaskTemplate 创建时默认为 ACTIVE 状态
2. ✅ 创建时会自动生成实例（已实现）
3. ❌ 激活模板时不会生成实例（需要修复）
4. ❌ 更新重复规则时不会重新生成（需要实现）
5. ❌ 没有创建对应的 Reminder（需要实现领域事件）
