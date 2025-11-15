# Task 模块实例生成策略设计

## 📋 当前问题分析

### 问题1：创建 TaskTemplate 后没有自动生成 Instance
**现状**：
- TaskTemplate 创建后状态为 `ACTIVE`
- 但没有自动触发实例生成
- 用户创建后看不到任何任务

**期望行为**：
- 创建 TaskTemplate 后立即生成初始实例
- ONE_TIME 任务：生成 1 个实例
- RECURRING 任务：根据 `generateAheadDays` 生成未来 N 天的实例

### 问题2：没有创建对应的提醒（Reminder）
**现状**：
- TaskTemplate 有 `reminderConfig` 配置
- 但没有创建对应的 Reminder 实体
- 用户不会收到任务提醒

**期望行为**：
- 如果 TaskTemplate 配置了 `reminderConfig.enabled = true`
- 应该为每个生成的 TaskInstance 创建对应的 Reminder

### 问题3：实例生成数量控制不明确
**现状**：
- `generateAheadDays` 默认 30 天
- 但不清楚是否合理，也不知道如何在 UI 中展示

**疑问**：
1. 一次生成多少实例合适？
2. 如何在 UI 中限制查看范围？
3. 个人软件的最佳实践是什么？

---

## 🎯 解决方案设计

### 方案1：创建时自动生成初始实例

#### 1.1 修改 `TaskTemplateApplicationService.createTaskTemplate()`

**目标**：创建 TaskTemplate 后立即生成实例

**实现方案**：
```typescript
// apps/api/src/modules/task/application/services/TaskTemplateApplicationService.ts

async createTaskTemplate(params: {
  accountUuid: string;
  title: string;
  // ... 其他参数
}): Promise<TaskContracts.TaskTemplateServerDTO> {
  // 1. 创建 TaskTemplate
  const template = TaskTemplate.create({
    accountUuid: params.accountUuid,
    title: params.title,
    // ...
  });

  // 2. 保存模板
  await this.templateRepository.save(template);

  // 3. 如果状态是 ACTIVE，立即生成初始实例
  if (template.status === TaskTemplateStatus.ACTIVE) {
    await this.generateInitialInstances(template);
  }

  return template.toClientDTO();
}

/**
 * 生成初始实例
 */
private async generateInitialInstances(template: TaskTemplate): Promise<void> {
  const generationService = new TaskInstanceGenerationService(
    this.templateRepository,
    this.instanceRepository,
  );

  // 根据任务类型决定生成策略
  if (template.taskType === TaskType.ONE_TIME) {
    // ONE_TIME: 只生成 1 个实例（立即可执行）
    const fromDate = Date.now();
    const toDate = Date.now() + 86400000; // 24小时内
    await generationService.generateInstancesForTemplate(template, toDate);
  } else {
    // RECURRING: 生成 generateAheadDays 天数的实例
    const generateAheadDays = template.generateAheadDays ?? 7; // 默认7天
    const toDate = Date.now() + generateAheadDays * 86400000;
    await generationService.generateInstancesForTemplate(template, toDate);
  }
}
```

#### 1.2 后台定时任务补充生成

**目标**：定期检查并生成未来的实例，保持提前量

**实现方案**：
```typescript
// apps/api/src/modules/task/application/services/TaskInstanceGenerationScheduler.ts

export class TaskInstanceGenerationScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {}

  /**
   * 启动定时任务（每天凌晨3点执行）
   */
  start(): void {
    // 使用 node-cron 或类似库
    cron.schedule('0 3 * * *', async () => {
      console.log('🔄 [TaskInstanceGenerationScheduler] 开始检查并生成任务实例');
      await this.checkAndGenerateInstances();
    });
  }

  /**
   * 检查并生成实例
   */
  private async checkAndGenerateInstances(): Promise<void> {
    const generationService = new TaskInstanceGenerationService(
      this.templateRepository,
      this.instanceRepository,
    );

    // 查找需要生成实例的模板（提前量不足的）
    const templates = await this.templateRepository.findNeedGenerateInstances(
      Date.now() + 7 * 86400000, // 提前7天
    );

    for (const template of templates) {
      try {
        await generationService.generateInstancesForTemplate(
          template,
          Date.now() + (template.generateAheadDays ?? 7) * 86400000,
        );
        console.log(`✅ 为模板 ${template.title} 生成实例成功`);
      } catch (error) {
        console.error(`❌ 为模板 ${template.title} 生成实例失败:`, error);
      }
    }
  }
}
```

---

### 方案2：创建任务提醒（Reminder）

#### 2.1 设计思路

**问题**：Task 和 Reminder 是两个独立的模块，如何关联？

**方案 A：在 Task 模块内部创建 Reminder（耦合）**
```typescript
// ❌ 不推荐：Task 模块直接依赖 Reminder 模块
import { ReminderService } from '@/modules/reminder';

async generateInitialInstances(template: TaskTemplate): Promise<void> {
  const instances = await generationService.generateInstancesForTemplate(...);
  
  // 为每个实例创建提醒
  for (const instance of instances) {
    if (template.reminderConfig?.enabled) {
      await reminderService.createReminder({
        sourceType: 'TASK',
        sourceUuid: instance.uuid,
        // ...
      });
    }
  }
}
```

**方案 B：通过领域事件解耦（推荐）**
```typescript
// ✅ 推荐：Task 模块发布事件，Reminder 模块订阅
class TaskInstance extends AggregateRoot {
  static create(...): TaskInstance {
    const instance = new TaskInstance(...);
    
    // 发布领域事件
    instance.addDomainEvent({
      eventType: 'TaskInstanceCreated',
      aggregateId: instance.uuid,
      payload: {
        instanceUuid: instance.uuid,
        templateUuid: instance.templateUuid,
        scheduledDate: instance.scheduledDate,
        reminderConfig: template.reminderConfig,
      },
    });
    
    return instance;
  }
}

// Reminder 模块订阅事件
class TaskInstanceCreatedHandler {
  async handle(event: TaskInstanceCreatedEvent): Promise<void> {
    if (event.payload.reminderConfig?.enabled) {
      await this.reminderService.createReminder({
        sourceType: 'TASK',
        sourceUuid: event.payload.instanceUuid,
        triggerTime: this.calculateTriggerTime(
          event.payload.scheduledDate,
          event.payload.reminderConfig,
        ),
        // ...
      });
    }
  }
}
```

#### 2.2 实现步骤

**Step 1：在 TaskInstance 中添加领域事件**
```typescript
// packages/domain-server/src/task/aggregates/TaskInstance.ts

static create(params: {
  templateUuid: string;
  scheduledDate: number;
  // ...
}): TaskInstance {
  const instance = new TaskInstance({
    uuid: crypto.randomUUID(),
    // ...
  });

  // 发布创建事件
  instance.addDomainEvent({
    eventType: 'task.instance.created',
    aggregateId: instance.uuid,
    payload: {
      instanceUuid: instance.uuid,
      templateUuid: params.templateUuid,
      scheduledDate: params.scheduledDate,
      accountUuid: params.accountUuid,
      // 传递提醒配置
      reminderConfig: params.reminderConfig,
    },
  });

  return instance;
}
```

**Step 2：创建事件处理器**
```typescript
// apps/api/src/modules/task/application/event-handlers/TaskInstanceCreatedHandler.ts

import { ReminderTemplateApplicationService } from '@/modules/reminder/application/services';

export class TaskInstanceCreatedHandler {
  constructor(
    private readonly reminderService: ReminderTemplateApplicationService,
  ) {}

  async handle(event: TaskInstanceCreatedEvent): Promise<void> {
    const { instanceUuid, scheduledDate, reminderConfig, accountUuid } = event.payload;

    // 如果配置了提醒
    if (reminderConfig?.enabled) {
      // 计算提醒触发时间
      const triggerTime = this.calculateTriggerTime(scheduledDate, reminderConfig);

      // 创建提醒
      await this.reminderService.createReminderTemplate({
        accountUuid,
        title: `任务提醒: ${event.payload.title}`,
        sourceType: 'TASK',
        sourceUuid: instanceUuid,
        triggerTime,
        notificationChannels: [reminderConfig.channel],
        // ...
      });

      console.log(`✅ 为任务实例 ${instanceUuid} 创建提醒成功`);
    }
  }

  private calculateTriggerTime(
    scheduledDate: number,
    reminderConfig: TaskReminderConfig,
  ): number {
    // 根据 timeOffsetMinutes 计算提前提醒时间
    const offsetMs = reminderConfig.timeOffsetMinutes * 60 * 1000;
    return scheduledDate - offsetMs;
  }
}
```

**Step 3：注册事件处理器**
```typescript
// apps/api/src/modules/task/infrastructure/events/setupTaskEventHandlers.ts

export function setupTaskEventHandlers(
  eventBus: EventBus,
  reminderService: ReminderTemplateApplicationService,
): void {
  const handler = new TaskInstanceCreatedHandler(reminderService);

  eventBus.subscribe('task.instance.created', (event) => {
    handler.handle(event).catch((error) => {
      console.error('❌ TaskInstanceCreatedHandler 处理失败:', error);
    });
  });
}
```

---

### 方案3：实例生成数量控制策略

#### 3.1 推荐的生成数量

**个人软件的最佳实践**：

| 任务类型 | 初始生成 | 提前量 | 总数上限 | 理由 |
|---------|---------|--------|---------|------|
| **ONE_TIME** | 1个 | N/A | 1个 | 一次性任务只有一个实例 |
| **每天** | 7天 | 7天 | 30个 | 看到本周 + 下周，月度规划 |
| **每周** | 4周 | 4周 | 12个 | 看到本月 + 下3个月 |
| **每月** | 3个月 | 2个月 | 12个 | 看到本季度 + 下季度 |

**原因**：
1. **性能考虑**：个人软件不需要生成太多实例，避免数据库膨胀
2. **用户体验**：用户通常只关心近期任务，太远的任务意义不大
3. **灵活性**：如果任务模板修改，减少需要重新生成的实例数量

#### 3.2 配置化的生成策略

```typescript
// packages/contracts/src/modules/task/config.ts

export const TASK_INSTANCE_GENERATION_CONFIG = {
  // 默认提前生成天数（按任务类型）
  DEFAULT_GENERATE_AHEAD_DAYS: {
    ONE_TIME: 1,     // 一次性任务：立即
    DAILY: 7,        // 每天：提前7天
    WEEKLY: 28,      // 每周：提前4周
    MONTHLY: 90,     // 每月：提前3个月
    YEARLY: 180,     // 每年：提前半年
  },

  // 最大生成数量限制
  MAX_INSTANCES: {
    ONE_TIME: 1,
    DAILY: 30,
    WEEKLY: 12,
    MONTHLY: 12,
    YEARLY: 3,
  },

  // 后台补充生成的阈值（当剩余实例少于N天时触发）
  REFILL_THRESHOLD_DAYS: {
    DAILY: 3,      // 剩余不足3天时补充
    WEEKLY: 7,     // 剩余不足1周时补充
    MONTHLY: 14,   // 剩余不足2周时补充
  },
};
```

#### 3.3 在 UI 中限制查看范围

**方案 A：日期范围选择器（推荐）**
```vue
<!-- TaskInstanceManagement.vue -->
<template>
  <div>
    <!-- 日期范围选择 -->
    <v-date-picker
      v-model="dateRange"
      range
      :max-range="90"
      label="查看任务实例"
    />
    
    <!-- 实例列表 -->
    <TaskInstanceList
      :instances="filteredInstances"
      :date-range="dateRange"
    />
  </div>
</template>

<script setup lang="ts">
const dateRange = ref({
  start: Date.now(),
  end: Date.now() + 30 * 86400000, // 默认显示未来30天
});

// 限制最大查看范围为90天
const MAX_DATE_RANGE = 90 * 86400000;

const filteredInstances = computed(() => {
  return taskStore.getAllTaskInstances.filter((instance) => {
    return (
      instance.scheduledDate >= dateRange.value.start &&
      instance.scheduledDate <= dateRange.value.end
    );
  });
});
</script>
```

**方案 B：虚拟滚动 + 按需加载**
```vue
<!-- 使用虚拟滚动，只渲染可见区域 -->
<v-virtual-scroll
  :items="instances"
  :item-height="80"
  height="600"
>
  <template v-slot:default="{ item }">
    <TaskInstanceCard :instance="item" />
  </template>
</v-virtual-scroll>
```

**方案 C：分页 + 日期筛选**
```vue
<template>
  <div>
    <!-- 快捷筛选 -->
    <v-chip-group v-model="quickFilter">
      <v-chip value="today">今天</v-chip>
      <v-chip value="week">本周</v-chip>
      <v-chip value="month">本月</v-chip>
      <v-chip value="custom">自定义</v-chip>
    </v-chip-group>

    <!-- 分页 -->
    <v-pagination
      v-model="page"
      :length="totalPages"
      :total-visible="7"
    />
  </div>
</template>
```

---

## 🚀 实施计划

### Phase 1：基础功能（高优先级）✅

**目标**：确保创建 TaskTemplate 后立即可用

- [ ] **1.1 修改 `createTaskTemplate`**
  - 创建后自动生成初始实例
  - ONE_TIME: 生成 1 个
  - RECURRING: 生成 7 天

- [ ] **1.2 添加实例生成配置**
  - 在 contracts 中定义配置常量
  - 根据任务频率设置 `generateAheadDays`

- [ ] **1.3 前端显示实例**
  - 创建后刷新 Store
  - 在 TaskInstanceManagement 中显示

**验证**：
```bash
# 测试步骤
1. 创建一个每天重复的任务模板
2. 检查数据库：应该有 7 个 TaskInstance
3. 前端界面：应该显示这 7 个实例
```

### Phase 2：任务提醒集成（中优先级）📅

**目标**：为任务实例创建对应的提醒

- [ ] **2.1 实现领域事件**
  - TaskInstance 发布 `task.instance.created` 事件
  - 传递 reminderConfig 信息

- [ ] **2.2 创建事件处理器**
  - `TaskInstanceCreatedHandler`
  - 调用 Reminder 模块创建提醒

- [ ] **2.3 计算提醒时间**
  - 根据 `timeOffsetMinutes` 计算
  - 支持多种提醒单位

**验证**：
```bash
# 测试步骤
1. 创建任务模板，启用提醒（提前30分钟）
2. 检查数据库：reminder_templates 表应该有对应记录
3. 等待提醒时间到达，验证是否收到通知
```

### Phase 3：后台定时生成（低优先级）📅

**目标**：自动维护实例提前量

- [ ] **3.1 实现定时任务**
  - 使用 node-cron
  - 每天凌晨3点执行

- [ ] **3.2 检查并补充实例**
  - 查找提前量不足的模板
  - 自动生成新实例

- [ ] **3.3 清理过期实例**
  - 删除或归档过去的已完成实例
  - 保留最近 N 天的历史记录

**验证**：
```bash
# 测试步骤
1. 手动触发定时任务
2. 检查日志：应该显示生成了哪些实例
3. 检查数据库：实例数量应该符合预期
```

### Phase 4：UI 优化（低优先级）📅

**目标**：提升用户体验

- [ ] **4.1 日期范围选择**
  - 添加日期范围选择器
  - 限制最大查看范围（90天）

- [ ] **4.2 快捷筛选**
  - 今天、本周、本月
  - 自定义日期范围

- [ ] **4.3 虚拟滚动**
  - 大量实例时的性能优化
  - 按需加载

---

## 💡 最佳实践建议

### 1. 生成数量控制

**原则**：适度生成，按需补充

```typescript
// ✅ 推荐
const generateAheadDays = {
  DAILY: 7,      // 每天：生成7天
  WEEKLY: 28,    // 每周：生成4周
  MONTHLY: 90,   // 每月：生成3个月
};

// ❌ 不推荐
const generateAheadDays = 365; // 一次生成一年，数据库膨胀
```

### 2. 提醒时间计算

**原则**：考虑任务的时间类型

```typescript
function calculateReminderTime(instance: TaskInstance): number {
  if (instance.timeType === 'ALL_DAY') {
    // 全天任务：提醒时间设在早上9点
    return startOfDay(instance.scheduledDate) + 9 * 3600 * 1000;
  } else if (instance.timeType === 'TIME_POINT') {
    // 时间点任务：提前N分钟提醒
    return instance.timePoint - instance.reminderConfig.timeOffsetMinutes * 60 * 1000;
  } else {
    // 时间段任务：在开始时间提前N分钟提醒
    return instance.timeRange.start - instance.reminderConfig.timeOffsetMinutes * 60 * 1000;
  }
}
```

### 3. 实例查看范围

**原则**：默认显示近期，支持扩展

```typescript
// ✅ 推荐：默认30天，最大90天
const DEFAULT_VIEW_RANGE = 30;
const MAX_VIEW_RANGE = 90;

// ❌ 不推荐：一次加载所有实例
const instances = await instanceRepository.findAll();
```

### 4. 性能优化

**原则**：分批生成，异步处理

```typescript
// ✅ 推荐：使用事务和批量操作
async generateInstancesForTemplate(template: TaskTemplate): Promise<void> {
  const instances = template.generateInstances(fromDate, toDate);
  
  // 分批保存（每批50个）
  const batchSize = 50;
  for (let i = 0; i < instances.length; i += batchSize) {
    const batch = instances.slice(i, i + batchSize);
    await this.instanceRepository.saveMany(batch);
  }
}

// ❌ 不推荐：逐个保存
for (const instance of instances) {
  await this.instanceRepository.save(instance); // N次数据库操作
}
```

---

## 📊 对比其他应用的策略

### Google Calendar
- **生成策略**：按需生成（只显示当前视图范围）
- **提前量**：查看哪个月就生成哪个月
- **优点**：节省存储
- **缺点**：复杂查询（跨月统计困难）

### Todoist
- **生成策略**：提前生成未来30天
- **提前量**：固定30天
- **优点**：性能好，查询简单
- **缺点**：修改重复规则需要重新生成

### Microsoft To Do
- **生成策略**：混合策略（近期实例化，远期虚拟）
- **提前量**：7天实例 + 虚拟显示
- **优点**：兼顾性能和体验
- **缺点**：实现复杂

### 推荐策略（适合个人软件）
```
采用 Todoist 策略的简化版：
- 每日任务：提前7天
- 每周任务：提前4周
- 每月任务：提前3个月
- 后台每天补充，保持提前量
```

---

## 🔍 FAQ

### Q1: 如果用户修改了 TaskTemplate，已生成的实例怎么办？
**A1**: 有两种策略：
- **策略A（推荐）**：只影响未来的实例，已生成的不变
- **策略B**：删除未完成的实例，重新生成

```typescript
async updateTaskTemplate(uuid: string, updates: Partial<TaskTemplate>): Promise<void> {
  // 更新模板
  await this.templateRepository.save(updatedTemplate);

  // 策略A：不处理已有实例

  // 策略B：重新生成未来实例
  if (updates.recurrenceRule || updates.timeConfig) {
    await this.instanceRepository.deleteByTemplateAndStatus(uuid, 'PENDING');
    await this.generateInstancesForTemplate(updatedTemplate, toDate);
  }
}
```

### Q2: 用户可以手动触发实例生成吗？
**A2**: 可以提供手动生成按钮：

```vue
<v-btn @click="regenerateInstances">
  重新生成未来实例
</v-btn>
```

```typescript
async regenerateInstances(templateUuid: string): Promise<void> {
  // 删除所有未完成的实例
  await instanceRepository.deleteByTemplateAndStatus(templateUuid, 'PENDING');
  
  // 重新生成
  await generationService.generateInstancesForTemplate(template, toDate);
  
  // 刷新界面
  await fetchInstances();
}
```

### Q3: 如何处理跨时区问题？
**A3**: 统一使用 UTC 时间戳存储：

```typescript
// 后端存储：UTC 时间戳
const scheduledDate = Date.now(); // 1763203746250

// 前端显示：转换为用户时区
const displayDate = new Date(scheduledDate).toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
});
```

---

## 📝 总结

### 立即实施（Phase 1）
1. ✅ 修改 `createTaskTemplate` 自动生成初始实例
2. ✅ 配置化生成数量（7天 for DAILY，4周 for WEEKLY）
3. ✅ 前端显示实例列表

### 短期优化（Phase 2）
1. 📅 实现领域事件集成 Reminder
2. 📅 添加提醒时间计算逻辑
3. 📅 测试提醒功能

### 长期规划（Phase 3-4）
1. 📅 后台定时任务补充实例
2. 📅 UI 日期范围选择器
3. 📅 性能优化（虚拟滚动、分页）

**个人软件推荐配置**：
- 每日任务：生成 **7天**（看到本周+下周）
- 每周任务：生成 **4周**（看到本月）
- 每月任务：生成 **3个月**（看到本季度）
- 最大查看范围：**90天**（3个月）

这样既保证用户体验，又不会造成数据库膨胀。
