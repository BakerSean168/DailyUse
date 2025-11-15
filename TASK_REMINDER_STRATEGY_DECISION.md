# Task 实例生成和提醒策略设计决策

## 🎯 核心问题

**TaskInstance 的时间配置是否允许用户修改？**

这个问题决定了整个提醒系统的架构。

---

## 📊 方案对比

### 方案 A：提前生成 100 天 Instance + 每个 Instance 一个 Reminder

**实现方式：**
```
TaskTemplate (每日任务)
    ↓
生成 100 个 TaskInstance（未来 100 天）
    ↓
为每个 Instance 创建一个 ReminderTemplate
    ↓
总共：1 个 Template → 100 个 Instance → 100 个 Reminder
```

**优点：**
- ✅ **灵活性高**：用户可以修改单个 Instance 的时间
  - 例如：明天的任务从 9:00 改为 10:00
  - 例如：周五的任务从 9:00 改为 14:00
- ✅ **独立性强**：每个 Instance 独立，互不影响
- ✅ **取消单个任务**：可以单独跳过某天的任务

**缺点：**
- ❌ **资源消耗大**：
  - 100 个 TaskInstance 记录
  - 100 个 ReminderTemplate 记录
  - 100 个 ScheduleTask 记录（如果 Reminder 也用 Schedule）
- ❌ **数据库压力**：大量记录
- ❌ **调度压力**：大量定时任务

**适用场景：**
- 用户需要灵活调整每天的任务时间
- 任务不是严格的每天重复（可能某些天需要调整）

---

### 方案 B：只创建一个循环 ScheduleTask

**实现方式：**
```
TaskTemplate (每日任务)
    ↓
创建 1 个循环 ScheduleTask（cron: "0 9 * * *"）
    ↓
每天 9:00 触发 → 动态生成当天的 TaskInstance
    ↓
总共：1 个 Template → 1 个 ScheduleTask → 每天动态生成 Instance
```

**优点：**
- ✅ **资源消耗小**：只有 1 个 ScheduleTask
- ✅ **简洁高效**：调度系统压力小
- ✅ **易于管理**：只需要管理 Template 的循环规则

**缺点：**
- ❌ **灵活性低**：用户不能修改单个 Instance 的时间
  - 要么修改整个 Template（影响所有未来的任务）
  - 要么无法调整单天的时间
- ❌ **无法提前查看**：TaskInstance 是动态生成的，无法提前查看未来的任务

**适用场景：**
- 严格的重复任务（每天相同时间）
- 用户不需要调整单个任务的时间

---

### 方案 C：混合方案（推荐 ✅）

**实现方式：**
```
TaskTemplate (每日任务)
    ↓
1. 提前生成 100 天的 TaskInstance（用于展示和修改）
    ↓
2. 创建 1 个循环 ScheduleTask（用于提醒）
    ↓
3. ScheduleTask 触发时：
   - 检查当天的 Instance 是否被修改过时间
   - 如果修改过 → 使用 Instance 的时间触发提醒
   - 如果没修改 → 使用 Template 的时间触发提醒
```

**优点：**
- ✅ **灵活性高**：用户可以修改 Instance 的时间
- ✅ **资源适中**：只有 1 个 ScheduleTask（不是 100 个）
- ✅ **提前查看**：可以看到未来 100 天的任务
- ✅ **最佳平衡**：兼顾灵活性和性能

**缺点：**
- ⚠️ **逻辑稍复杂**：需要检查 Instance 是否被修改

**实现细节：**
```typescript
// TaskInstance 添加字段
interface TaskInstance {
  isTimeModified: boolean;  // 是否修改过时间
  originalTime: TimeConfig; // 原始时间（从 Template 继承）
  currentTime: TimeConfig;  // 当前时间（可能被修改）
}

// ScheduleTask 触发时
async function onScheduleTaskTriggered(task: ScheduleTask) {
  const template = await getTemplate(task.templateUuid);
  const instance = await getInstance(template.uuid, today);
  
  // 使用 Instance 的实际时间（可能被用户修改过）
  const reminderTime = instance.isTimeModified 
    ? instance.currentTime 
    : template.timeConfig;
    
  // 发送提醒
  await sendReminder(instance, reminderTime);
}
```

---

## 🎯 推荐方案

### 我的建议：**方案 C（混合方案）**

**理由：**

1. **用户体验好**：
   - 可以提前看到未来 100 天的任务
   - 可以灵活调整某天的时间
   - 不影响其他天的任务

2. **性能合理**：
   - 只有 1 个 ScheduleTask（不是 100 个）
   - 提醒系统压力小

3. **架构清晰**：
   - TaskInstance：展示和数据管理
   - ScheduleTask：循环提醒
   - 分工明确

---

## 🔧 实施方案（方案 C）

### Step 1：TaskTemplate 创建时

```typescript
async createTaskTemplate(params: {...}): Promise<TaskTemplateServerDTO> {
  // 1. 创建 TaskTemplate
  const template = TaskTemplate.create(params);
  await this.templateRepository.save(template);

  // 2. 生成 100 天的 TaskInstance（用于展示）
  if (template.status === 'ACTIVE') {
    await this.generateInitialInstances(template);
  }

  // 3. 🔥 创建一个循环 ScheduleTask（用于提醒）
  if (template.reminderConfig?.enabled) {
    await this.createScheduleTaskForTemplate(template);
  }

  return template.toClientDTO();
}
```

### Step 2：创建 ScheduleTask

```typescript
private async createScheduleTaskForTemplate(template: TaskTemplate): Promise<void> {
  const scheduleService = await ScheduleApplicationService.getInstance();
  
  // 根据 recurrenceRule 生成 cron 表达式
  const cronExpression = this.generateCronExpression(
    template.recurrenceRule,
    template.timeConfig,
    template.reminderConfig
  );

  // 创建 ScheduleTask
  await scheduleService.createScheduleTask({
    accountUuid: template.accountUuid,
    name: `任务提醒: ${template.title}`,
    sourceModule: 'TASK',
    sourceEntityId: template.uuid,
    cronExpression,
    payload: {
      templateUuid: template.uuid,
      reminderConfig: template.reminderConfig,
    },
  });
}
```

### Step 3：ScheduleTask 触发时

```typescript
// 事件处理器：监听 schedule.task.triggered
export class TaskReminderScheduleHandler {
  async handle(event: ScheduleTaskTriggeredEvent): Promise<void> {
    const { templateUuid } = event.payload;
    
    // 1. 获取今天的 TaskInstance
    const today = new Date().setHours(0, 0, 0, 0);
    const instance = await taskInstanceRepository.findByTemplateAndDate(
      templateUuid,
      today
    );
    
    if (!instance) {
      console.warn(`未找到今天的任务实例: ${templateUuid}`);
      return;
    }

    // 2. 检查 Instance 是否被用户修改过时间
    const reminderTime = instance.isTimeModified
      ? instance.currentTime
      : instance.timeConfig;

    // 3. 发送提醒
    await notificationService.sendReminder({
      title: `任务提醒: ${instance.title}`,
      body: `您的任务即将在 ${formatTime(reminderTime)} 开始`,
      instanceUuid: instance.uuid,
    });
  }
}
```

---

## 📊 资源对比

| 方案 | TaskInstance | ReminderTemplate | ScheduleTask | 总计 |
|------|-------------|-----------------|-------------|-----|
| **方案 A** | 100 | 100 | 100 | 300 |
| **方案 B** | 1/天（动态） | 0 | 1 | 2 |
| **方案 C** | 100 | 0 | 1 | 101 |

**方案 C 的优势：**
- 相比方案 A：减少 199 个记录（66% 减少）
- 相比方案 B：增加 99 个记录，但获得灵活性

---

## 🎯 决策建议

**问题：是否让用户能直接修改 instance 的时间配置？**

**答案：是的，应该允许**

**理由：**
1. **用户需求**：用户可能需要临时调整某天的任务时间
   - 例如：明天有会议，把晨跑从 7:00 改为 6:00
   - 例如：周五提前下班，把任务从 18:00 改为 16:00

2. **灵活性价值**：这种灵活性是任务管理系统的核心价值
   - 如果不能修改单天的时间，用户体验会很差
   - 用户会觉得系统"死板"、"不够智能"

3. **实施成本**：采用方案 C，成本可控
   - 只需要 1 个 ScheduleTask（不是 100 个）
   - 性能影响很小

---

## ✅ 最终决策

**采用方案 C：混合方案**

**核心原则：**
- **TaskInstance**：展示 + 数据管理 + 允许修改
- **ScheduleTask**：循环提醒（1 个）
- **提醒时检查**：使用 Instance 的实际时间

**实施步骤：**
1. ✅ 保留"生成 100 天 Instance"的逻辑
2. ✅ 为 TaskTemplate 创建 1 个循环 ScheduleTask
3. ✅ ScheduleTask 触发时，检查当天 Instance 的实际时间
4. ✅ 发送提醒

**收益：**
- 用户体验好（可修改单天时间）
- 性能合理（只有 1 个 ScheduleTask）
- 架构清晰（职责分明）
