# 领域事件命名规范

## 📋 命名格式

**统一格式：`模块.聚合根.操作`**

```
reminder.template.created
reminder.template.updated
reminder.template.enabled
reminder.template.paused
reminder.template.deleted
```

---

## 🎯 各模块事件清单

### 1️⃣ **Reminder 模块**

#### ReminderTemplate 聚合根事件

| 事件名 | 触发时机 | Payload | 调度系统响应 |
|--------|---------|---------|-------------|
| `reminder.template.created` | 创建提醒模板 | `{ templateUuid, title, type, reminder: ServerDTO }` | ✅ 创建调度任务 |
| `reminder.template.updated` | 更新提醒模板 | `{ templateUuid, updates: string[], reminder: ServerDTO }` | ✅ 删除旧调度，创建新调度 |
| `reminder.template.enabled` | 启用提醒模板 | `{ templateUuid, reminder: ServerDTO }` | ✅ 创建调度任务 |
| `reminder.template.paused` | 禁用提醒模板 | `{ templateUuid, reminder: ServerDTO }` | ✅ 删除调度任务 |
| `reminder.template.deleted` | 删除提醒模板 | `{ templateUuid, templateTitle, reminder: ServerDTO }` | ✅ 删除调度任务 |
| `reminder.template.triggered` | 触发提醒 | `{ templateUuid, triggeredAt, nextTriggerAt }` | - |

#### ReminderGroup 聚合根事件

| 事件名 | 触发时机 | Payload |
|--------|---------|---------|
| `reminder.group.created` | 创建提醒分组 | `{ groupUuid, name }` |
| `reminder.group.control_mode_switched` | 切换控制模式 | `{ groupUuid, mode }` |
| `reminder.group.enabled` | 启用分组 | `{ groupUuid }` |
| `reminder.group.paused` | 禁用分组 | `{ groupUuid }` |
| `reminder.group.deleted` | 删除分组 | `{ groupUuid, name }` |

#### ReminderStatistics 聚合根事件

| 事件名 | 触发时机 | Payload |
|--------|---------|---------|
| `reminder.statistics.updated` | 统计数据更新 | `{ accountUuid, stats }` |

---

### 2️⃣ **Goal 模块**

| 事件名 | 触发时机 | Payload | 调度系统响应 |
|--------|---------|---------|-------------|
| `goal.created` | 创建目标 | `{ goal: GoalServerDTO }` | ✅ 创建调度任务（如有提醒配置） |
| `goal.deleted` | 删除目标 | `{ goalUuid }` | ✅ 删除调度任务 |
| `goal.schedule_time_changed` | 计划时间变更 | `{ goal: GoalServerDTO }` | ✅ 删除旧调度，创建新调度 |
| `goal.reminder_config_changed` | 提醒配置变更 | `{ goal: GoalServerDTO }` | ✅ 删除旧调度，创建新调度 |

---

### 3️⃣ **Task 模块**

#### Task 聚合根事件

| 事件名 | 触发时机 | Payload | 调度系统响应 |
|--------|---------|---------|-------------|
| `task.created` | 创建任务 | `{ task: TaskServerDTO }` | ✅ 创建调度任务（如有提醒配置） |
| `task.deleted` | 删除任务 | `{ taskUuid }` | ✅ 删除调度任务 |

#### TaskTemplate 聚合根事件

| 事件名 | 触发时机 | Payload | 调度系统响应 |
|--------|---------|---------|-------------|
| `task_template.schedule_time_changed` | 计划时间变更 | `{ taskTemplate: TaskTemplateServerDTO }` | ✅ 删除旧调度，创建新调度 |
| `task_template.recurrence_changed` | 重复配置变更 | `{ taskTemplate: TaskTemplateServerDTO }` | ✅ 删除旧调度，创建新调度 |

---

### 4️⃣ **Schedule 模块**

| 事件名 | 触发时机 | Payload |
|--------|---------|---------|
| `schedule.task.created` | 调度任务创建 | `{ taskUuid }` |
| `schedule.task.execution_succeeded` | 调度任务执行成功 | `{ taskUuid, executedAt }` |
| `schedule.task.execution_failed` | 调度任务执行失败 | `{ taskUuid, error }` |
| `schedule.task.completed` | 调度任务完成 | `{ taskUuid }` |

---

## 🔧 实现指南

### 1. **领域模型层 - 添加事件**

```typescript
// packages/domain-server/src/reminder/aggregates/ReminderTemplate.ts

public enable(): void {
  this._selfEnabled = true;
  this._status = ReminderStatus.ACTIVE;
  
  // ✅ 添加领域事件
  this.addDomainEvent({
    eventType: 'reminder.template.enabled',  // 📌 统一格式：模块.聚合根.操作
    aggregateId: this.uuid,
    occurredOn: new Date(),
    accountUuid: this._accountUuid,
    payload: {
      templateUuid: this.uuid,
    },
  });
}
```

### 2. **应用服务层 - 发布事件**

```typescript
// apps/api/src/modules/reminder/application/services/ReminderApplicationService.ts

async toggleReminderTemplateStatus(uuid: string) {
  const template = await this.domainService.getTemplate(uuid);
  
  // 执行业务逻辑
  if (template.selfEnabled) {
    template.pause();
  } else {
    template.enable();
  }
  
  await this.reminderTemplateRepository.save(template);
  
  // ✅ 发布领域事件到事件总线
  const events = template.getDomainEvents();
  for (const event of events) {
    const enhancedEvent = {
      ...event,
      payload: {
        ...(typeof event.payload === 'object' && event.payload !== null ? event.payload : {}),
        reminder: template.toServerDTO(), // 📌 包含完整的 ServerDTO
      },
    };
    await eventBus.publish(enhancedEvent);
  }
  template.clearDomainEvents();
  
  logger.info('Events published', { uuid, eventsCount: events.length });
  
  return template.toClientDTO();
}
```

### 3. **事件监听层 - 处理事件**

```typescript
// apps/api/src/modules/schedule/application/services/ScheduleEventPublisher.ts

static async initialize() {
  // ✅ 监听统一格式的事件
  eventBus.on('reminder.template.created', async (event: DomainEvent) => {
    const { reminder } = event.payload;
    await this.handleReminderCreated(event.accountUuid, reminder);
  });

  eventBus.on('reminder.template.enabled', async (event: DomainEvent) => {
    await this.handleReminderUpdated(event.accountUuid, event.aggregateId);
  });

  eventBus.on('reminder.template.paused', async (event: DomainEvent) => {
    await this.handleReminderDeleted(event.accountUuid, event.aggregateId);
  });

  eventBus.on('reminder.template.deleted', async (event: DomainEvent) => {
    await this.handleReminderDeleted(event.accountUuid, event.aggregateId);
  });
}
```

---

## ✅ 事件发布检查清单

在实现新的聚合根或业务逻辑时，确保：

- [ ] **领域模型层**：在关键业务方法中添加 `addDomainEvent()`
- [ ] **应用服务层**：调用 `getDomainEvents()` → `eventBus.publish()` → `clearDomainEvents()`
- [ ] **事件命名**：遵循 `模块.聚合根.操作` 格式
- [ ] **Payload 完整性**：包含必要的字段，调度系统需要完整的 ServerDTO
- [ ] **事件监听**：在 `ScheduleEventPublisher` 中添加对应的监听器
- [ ] **日志记录**：添加适当的日志输出，便于调试
- [ ] **错误处理**：监听器中要有 try-catch，避免事件处理失败影响主流程

---

## 🎯 调度系统事件响应矩阵

| 事件类型 | 调度系统操作 | 说明 |
|---------|------------|------|
| `*.created` | 创建调度任务 | 如果源实体需要调度（如启用的提醒、有提醒的目标） |
| `*.updated` | 删除旧调度 + 创建新调度 | 触发器/时间配置变更时 |
| `*.enabled` | 创建调度任务 | 启用时创建调度 |
| `*.paused` / `*.disabled` | 删除调度任务 | 禁用时删除调度 |
| `*.deleted` | 删除调度任务 | 源实体删除时清理调度 |

---

## 📚 相关文档

- [领域事件设计模式](https://martinfowler.com/eaaDev/DomainEvent.html)
- [事件驱动架构最佳实践](/docs/EVENT_DRIVEN_ARCHITECTURE.md)
- [调度系统集成指南](/docs/SCHEDULE_INTEGRATION_GUIDE.md)

---

## 🔄 迁移指南

### 旧事件名 → 新事件名

| 旧名称 (PascalCase) | 新名称 (dot.case) |
|-------------------|------------------|
| `ReminderTemplateCreated` | `reminder.template.created` |
| `ReminderTemplateUpdated` | `reminder.template.updated` |
| `ReminderTemplateEnabled` | `reminder.template.enabled` |
| `ReminderTemplatePaused` | `reminder.template.paused` |
| `ReminderTemplateDeleted` | `reminder.template.deleted` |
| `ReminderTemplateTriggered` | `reminder.template.triggered` |
| `ReminderGroupCreated` | `reminder.group.created` |

### 迁移步骤

1. ✅ 更新领域模型中的 `eventType` 字段
2. ✅ 更新事件监听器中的事件名
3. ✅ 更新 `reset()` 方法中的事件列表
4. ✅ 重新构建 domain-server 和 api 包
5. ✅ 测试所有事件流程

---

**最后更新**: 2025-11-07
**维护者**: DailyUse 开发团队
