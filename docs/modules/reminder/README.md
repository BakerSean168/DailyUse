---
tags:
  - module
  - reminder
  - notification
  - business-logic
description: 智能提醒模块 - 多场景提醒系统的完整实现文档
created: 2025-11-23T17:00:00
updated: 2025-11-23T17:00:00
---

# ⏰ Reminder Module - 智能提醒模块

> 智能提醒系统，支持多种提醒类型、提前通知和循环提醒

## 📋 目录

- [模块概述](#模块概述)
- [核心概念](#核心概念)
- [领域模型](#领域模型)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [提醒规则](#提醒规则)
- [集成方案](#集成方案)

---

## 🎯 模块概述

### 功能简介

智能提醒模块为各类事件提供灵活的提醒功能：

- ⏰ 多种提醒类型（目标、任务、日程）
- 🔔 提前提醒（分钟、小时、天）
- 🔄 循环提醒支持
- 📱 多渠道推送（应用内、邮件、推送通知）
- 🎯 智能推荐提醒时间
- ⏸️ 暂停与恢复提醒
- 📊 提醒统计与历史

### 提醒场景

| 场景 | 描述 | 示例 |
|------|------|------|
| **目标提醒** | 目标截止日期提醒 | 目标在3天后到期 |
| **任务提醒** | 任务截止提醒 | 任务将在1小时后到期 |
| **日程提醒** | 日程事件开始提醒 | 会议将在15分钟后开始 |
| **自定义提醒** | 用户自定义提醒 | 每天早上8点提醒锻炼 |

---

## 💡 核心概念

### 提醒类型

```typescript
enum ReminderType {
  GOAL_DEADLINE = 'goal_deadline',       // 目标截止
  TASK_DEADLINE = 'task_deadline',       // 任务截止
  SCHEDULE_EVENT = 'schedule_event',     // 日程事件
  CUSTOM = 'custom',                     // 自定义提醒
}
```

### 提前时间

```typescript
enum ReminderOffset {
  AT_TIME = 0,              // 准时
  MINUTES_5 = 5,            // 5分钟前
  MINUTES_15 = 15,          // 15分钟前
  MINUTES_30 = 30,          // 30分钟前
  HOURS_1 = 60,             // 1小时前
  HOURS_2 = 120,            // 2小时前
  DAY_1 = 1440,             // 1天前
  DAYS_3 = 4320,            // 3天前
  WEEK_1 = 10080,           // 1周前
}
```

### 通知渠道

```typescript
enum NotificationChannel {
  IN_APP = 'in_app',       // 应用内
  EMAIL = 'email',         // 邮件
  PUSH = 'push',           // 推送通知
  SMS = 'sms',             // 短信（未来支持）
}
```

### 提醒状态

```typescript
enum ReminderStatus {
  PENDING = 'pending',     // 待触发
  TRIGGERED = 'triggered', // 已触发
  DISMISSED = 'dismissed', // 已忽略
  SNOOZED = 'snoozed',    // 已延迟
  CANCELLED = 'cancelled', // 已取消
}
```

---

## 🏗 领域模型

### 聚合根: ReminderAggregate

```typescript
// apps/api/src/reminder/domain/aggregates/reminder.aggregate.ts
export class ReminderAggregate {
  private constructor(
    public readonly id: string,
    private _type: ReminderType,
    private _targetId: string,        // 关联对象ID（目标/任务/日程）
    private _title: string,
    private _description: string,
    private _reminderTime: Date,
    private _originalTime: Date,      // 原始提醒时间（用于延迟后恢复）
    private _offsetMinutes: number,   // 提前分钟数
    private _channels: NotificationChannel[],
    private _status: ReminderStatus,
    private _isRecurring: boolean,
    private _recurrenceRule: RecurrenceRule | null,
    public readonly userId: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _triggeredAt: Date | null,
    private readonly events: DomainEvent[] = []
  ) {}

  static create(props: CreateReminderProps): ReminderAggregate {
    const reminderTime = this.calculateReminderTime(
      props.targetTime,
      props.offsetMinutes ?? 0
    );

    const reminder = new ReminderAggregate(
      uuidv4(),
      props.type,
      props.targetId,
      props.title,
      props.description ?? '',
      reminderTime,
      reminderTime,
      props.offsetMinutes ?? 0,
      props.channels ?? [NotificationChannel.IN_APP],
      ReminderStatus.PENDING,
      props.isRecurring ?? false,
      props.recurrenceRule ?? null,
      props.userId,
      new Date(),
      new Date(),
      null
    );

    reminder.addEvent(new ReminderCreatedEvent(reminder.toPlainObject()));
    return reminder;
  }

  private static calculateReminderTime(targetTime: Date, offsetMinutes: number): Date {
    return new Date(targetTime.getTime() - offsetMinutes * 60 * 1000);
  }

  // Getters
  get type(): ReminderType { return this._type; }
  get targetId(): string { return this._targetId; }
  get reminderTime(): Date { return this._reminderTime; }
  get status(): ReminderStatus { return this._status; }
  get isPending(): boolean { return this._status === ReminderStatus.PENDING; }
  get isTriggered(): boolean { return this._status === ReminderStatus.TRIGGERED; }
  get shouldTrigger(): boolean {
    return this.isPending && new Date() >= this._reminderTime;
  }

  // 业务方法
  trigger(): void {
    if (!this.isPending) {
      throw new Error('Only pending reminders can be triggered');
    }

    this._status = ReminderStatus.TRIGGERED;
    this._triggeredAt = new Date();
    this._updatedAt = new Date();

    this.addEvent(new ReminderTriggeredEvent({
      reminderId: this.id,
      userId: this.userId,
      type: this._type,
      title: this._title,
      description: this._description,
      targetId: this._targetId,
      channels: this._channels,
    }));
  }

  snooze(minutes: number): void {
    if (!this.isPending && !this.isTriggered) {
      throw new Error('Only pending or triggered reminders can be snoozed');
    }

    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    this._reminderTime = snoozeUntil;
    this._status = ReminderStatus.SNOOZED;
    this._updatedAt = new Date();

    this.addEvent(new ReminderSnoozedEvent({
      reminderId: this.id,
      snoozeMinutes: minutes,
      snoozeUntil,
    }));

    // 设置定时器重新激活
    setTimeout(() => {
      this._status = ReminderStatus.PENDING;
    }, minutes * 60 * 1000);
  }

  dismiss(): void {
    if (!this.isTriggered) {
      throw new Error('Only triggered reminders can be dismissed');
    }

    this._status = ReminderStatus.DISMISSED;
    this._updatedAt = new Date();

    this.addEvent(new ReminderDismissedEvent({
      reminderId: this.id,
    }));
  }

  cancel(): void {
    if (this._status === ReminderStatus.CANCELLED) {
      throw new Error('Reminder is already cancelled');
    }

    this._status = ReminderStatus.CANCELLED;
    this._updatedAt = new Date();

    this.addEvent(new ReminderCancelledEvent({
      reminderId: this.id,
    }));
  }

  updateChannels(channels: NotificationChannel[]): void {
    if (!channels.length) {
      throw new Error('At least one notification channel is required');
    }

    this._channels = channels;
    this._updatedAt = new Date();
  }

  reschedule(newTime: Date): void {
    if (!this.isPending) {
      throw new Error('Only pending reminders can be rescheduled');
    }

    this._reminderTime = newTime;
    this._updatedAt = new Date();

    this.addEvent(new ReminderRescheduledEvent({
      reminderId: this.id,
      oldTime: this._originalTime,
      newTime,
    }));
  }
}
```

### 值对象: RecurrenceRule

```typescript
// 复用Schedule模块的RecurrenceRule
import { RecurrenceRule } from '@/schedule/domain/value-objects/recurrence-rule.vo';
```

---

## 🔌 API接口

### 基础路径

```
/api/reminders
```

### 端点列表

#### 1. 创建提醒

```http
POST /api/reminders
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "task_deadline",
  "targetId": "task-123",
  "title": "完成项目文档",
  "description": "记得完成API文档编写",
  "targetTime": "2025-11-25T18:00:00Z",
  "offsetMinutes": 60,
  "channels": ["in_app", "push"],
  "isRecurring": false
}
```

**响应** (201 Created):

```json
{
  "id": "reminder-123",
  "type": "task_deadline",
  "targetId": "task-123",
  "title": "完成项目文档",
  "reminderTime": "2025-11-25T17:00:00.000Z",
  "status": "pending",
  "channels": ["in_app", "push"],
  "isRecurring": false,
  "createdAt": "2025-11-23T17:00:00.000Z"
}
```

#### 2. 获取提醒列表

```http
GET /api/reminders?status=pending&type=task_deadline
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| `status` | string | 提醒状态过滤 |
| `type` | string | 提醒类型过滤 |
| `upcoming` | boolean | 只显示即将到来的提醒 |

#### 3. 延迟提醒

```http
POST /api/reminders/{reminderId}/snooze
Content-Type: application/json
Authorization: Bearer {token}

{
  "minutes": 15
}
```

**响应** (200 OK):

```json
{
  "id": "reminder-123",
  "status": "snoozed",
  "reminderTime": "2025-11-25T17:15:00.000Z",
  "snoozeUntil": "2025-11-25T17:15:00.000Z"
}
```

#### 4. 忽略提醒

```http
POST /api/reminders/{reminderId}/dismiss
Authorization: Bearer {token}
```

#### 5. 取消提醒

```http
DELETE /api/reminders/{reminderId}
Authorization: Bearer {token}
```

#### 6. 批量创建提醒

```http
POST /api/reminders/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "reminders": [
    {
      "type": "goal_deadline",
      "targetId": "goal-123",
      "targetTime": "2025-12-01T00:00:00Z",
      "offsetMinutes": 4320
    },
    {
      "type": "goal_deadline",
      "targetId": "goal-123",
      "targetTime": "2025-12-01T00:00:00Z",
      "offsetMinutes": 1440
    }
  ]
}
```

---

## 💻 使用示例

### 前端 - Vue 3

**提醒通知组件**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useReminderStore } from '@/stores/reminder.store';
import type { Reminder } from '@dailyuse/contracts';

const reminderStore = useReminderStore();
const activeReminders = computed(() => reminderStore.activeReminders);
const currentReminder = ref<Reminder | null>(null);
const showDialog = ref(false);

// 监听新提醒
let intervalId: number;

onMounted(() => {
  reminderStore.fetchPendingReminders();
  
  // 每分钟检查一次提醒
  intervalId = setInterval(() => {
    reminderStore.checkAndTriggerReminders();
  }, 60000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

// 监听提醒触发事件
reminderStore.$onAction(({ name, after }) => {
  if (name === 'triggerReminder') {
    after((reminder) => {
      currentReminder.value = reminder;
      showDialog.value = true;
      playSound();
    });
  }
});

function playSound() {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play();
}

async function snooze(minutes: number) {
  if (currentReminder.value) {
    await reminderStore.snoozeReminder(currentReminder.value.id, minutes);
    showDialog.value = false;
  }
}

async function dismiss() {
  if (currentReminder.value) {
    await reminderStore.dismissReminder(currentReminder.value.id);
    showDialog.value = false;
  }
}

async function viewTarget() {
  if (currentReminder.value) {
    // 跳转到对应的目标/任务/日程
    const { type, targetId } = currentReminder.value;
    
    switch (type) {
      case 'goal_deadline':
        router.push(`/goals/${targetId}`);
        break;
      case 'task_deadline':
        router.push(`/tasks/${targetId}`);
        break;
      case 'schedule_event':
        router.push(`/calendar?event=${targetId}`);
        break;
    }
    
    showDialog.value = false;
  }
}
</script>

<template>
  <div class="reminder-system">
    <!-- 提醒角标 -->
    <v-badge
      :content="activeReminders.length"
      :model-value="activeReminders.length > 0"
      color="error"
    >
      <v-btn icon="mdi-bell" @click="showAllReminders" />
    </v-badge>

    <!-- 提醒弹窗 -->
    <v-dialog
      v-model="showDialog"
      max-width="500"
      persistent
    >
      <v-card v-if="currentReminder">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">
            mdi-bell-ring
          </v-icon>
          提醒
        </v-card-title>

        <v-card-text>
          <div class="text-h6 mb-2">
            {{ currentReminder.title }}
          </div>
          <div v-if="currentReminder.description" class="text-body-2 mb-3">
            {{ currentReminder.description }}
          </div>
          <v-chip :color="getTypeColor(currentReminder.type)" size="small">
            {{ getTypeLabel(currentReminder.type) }}
          </v-chip>
        </v-card-text>

        <v-card-actions>
          <v-btn variant="text" @click="dismiss">
            忽略
          </v-btn>
          
          <v-menu>
            <template #activator="{ props }">
              <v-btn variant="text" v-bind="props">
                延迟
                <v-icon end>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="snooze(5)">5分钟后</v-list-item>
              <v-list-item @click="snooze(15)">15分钟后</v-list-item>
              <v-list-item @click="snooze(30)">30分钟后</v-list-item>
              <v-list-item @click="snooze(60)">1小时后</v-list-item>
            </v-list>
          </v-menu>
          
          <v-spacer />
          
          <v-btn color="primary" @click="viewTarget">
            查看详情
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
```

**快速设置提醒**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useReminderStore } from '@/stores/reminder.store';

interface Props {
  type: 'goal' | 'task' | 'schedule';
  targetId: string;
  targetTime: Date;
  title: string;
}

const props = defineProps<Props>();
const reminderStore = useReminderStore();

const selectedOffsets = ref<number[]>([60, 1440]); // 默认1小时和1天前

const offsetOptions = [
  { label: '准时', value: 0 },
  { label: '5分钟前', value: 5 },
  { label: '15分钟前', value: 15 },
  { label: '30分钟前', value: 30 },
  { label: '1小时前', value: 60 },
  { label: '2小时前', value: 120 },
  { label: '1天前', value: 1440 },
  { label: '3天前', value: 4320 },
  { label: '1周前', value: 10080 },
];

async function saveReminders() {
  const reminders = selectedOffsets.value.map(offset => ({
    type: `${props.type}_deadline`,
    targetId: props.targetId,
    title: props.title,
    targetTime: props.targetTime,
    offsetMinutes: offset,
    channels: ['in_app', 'push'],
  }));

  await reminderStore.createBatchReminders(reminders);
}
</script>

<template>
  <v-card>
    <v-card-title>设置提醒</v-card-title>
    <v-card-text>
      <v-chip-group
        v-model="selectedOffsets"
        multiple
        column
      >
        <v-chip
          v-for="option in offsetOptions"
          :key="option.value"
          :value="option.value"
          filter
        >
          {{ option.label }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn @click="$emit('close')">取消</v-btn>
      <v-btn color="primary" @click="saveReminders">
        保存
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
```

### Pinia Store

```typescript
// apps/web/src/stores/reminder.store.ts
import { defineStore } from 'pinia';
import type { Reminder, CreateReminderDto } from '@dailyuse/contracts';
import { reminderApi } from '@/api/reminder.api';

export const useReminderStore = defineStore('reminder', {
  state: () => ({
    reminders: [] as Reminder[],
    activeReminders: [] as Reminder[],
  }),

  getters: {
    pendingReminders: (state) => 
      state.reminders.filter(r => r.status === 'pending'),
    
    triggeredReminders: (state) => 
      state.reminders.filter(r => r.status === 'triggered'),
    
    upcomingReminders: (state) => {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return state.reminders.filter(r => 
        r.status === 'pending' &&
        new Date(r.reminderTime) >= now &&
        new Date(r.reminderTime) <= next24Hours
      );
    },
  },

  actions: {
    async fetchPendingReminders() {
      const response = await reminderApi.getReminders({ status: 'pending' });
      this.reminders = response.items;
    },

    async createReminder(dto: CreateReminderDto) {
      const reminder = await reminderApi.createReminder(dto);
      this.reminders.push(reminder);
      return reminder;
    },

    async createBatchReminders(dtos: CreateReminderDto[]) {
      const reminders = await reminderApi.createBatchReminders(dtos);
      this.reminders.push(...reminders);
      return reminders;
    },

    async snoozeReminder(id: string, minutes: number) {
      const reminder = await reminderApi.snoozeReminder(id, minutes);
      this.updateReminder(reminder);
      this.removeFromActive(id);
    },

    async dismissReminder(id: string) {
      await reminderApi.dismissReminder(id);
      const index = this.reminders.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reminders[index].status = 'dismissed';
      }
      this.removeFromActive(id);
    },

    async cancelReminder(id: string) {
      await reminderApi.deleteReminder(id);
      this.reminders = this.reminders.filter(r => r.id !== id);
      this.removeFromActive(id);
    },

    checkAndTriggerReminders() {
      const now = new Date();
      const toTrigger = this.pendingReminders.filter(r => 
        new Date(r.reminderTime) <= now
      );

      toTrigger.forEach(reminder => {
        this.triggerReminder(reminder);
      });
    },

    triggerReminder(reminder: Reminder) {
      if (!this.activeReminders.find(r => r.id === reminder.id)) {
        this.activeReminders.push(reminder);
        
        // 发送系统通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(reminder.title, {
            body: reminder.description,
            icon: '/icon.png',
            tag: reminder.id,
          });
        }
      }
    },

    updateReminder(reminder: Reminder) {
      const index = this.reminders.findIndex(r => r.id === reminder.id);
      if (index !== -1) {
        this.reminders[index] = reminder;
      }
    },

    removeFromActive(id: string) {
      this.activeReminders = this.activeReminders.filter(r => r.id !== id);
    },
  },
});
```

---

## 📋 提醒规则

### 智能提醒时间建议

根据事件类型和时长，系统自动推荐合适的提醒时间：

| 事件类型 | 事件时长 | 建议提醒时间 |
|---------|---------|-------------|
| **会议** | < 30分钟 | 15分钟前 |
| **会议** | 30分钟 - 2小时 | 30分钟前、1天前 |
| **会议** | > 2小时 | 1小时前、1天前、3天前 |
| **任务截止** | 任意 | 1天前、3天前 |
| **目标截止** | 任意 | 1周前、3天前、1天前 |

### 提醒频率限制

为避免过度打扰，系统限制提醒频率：

- 同一目标/任务最多3个提醒
- 相同时间点最多5个提醒
- 每小时最多触发10个提醒
- 夜间模式（22:00-08:00）静音

---

## 🔗 集成方案

### 与目标模块集成

```typescript
// 目标创建时自动创建提醒
@EventsHandler(GoalCreatedEvent)
export class GoalCreatedReminderHandler {
  constructor(private readonly reminderService: ReminderService) {}

  async handle(event: GoalCreatedEvent) {
    if (!event.payload.dueDate) return;

    // 创建多个提醒
    await this.reminderService.createBatchReminders([
      {
        type: 'goal_deadline',
        targetId: event.payload.id,
        title: `目标即将到期: ${event.payload.title}`,
        targetTime: event.payload.dueDate,
        offsetMinutes: 10080, // 1周前
        userId: event.payload.userId,
      },
      {
        type: 'goal_deadline',
        targetId: event.payload.id,
        title: `目标即将到期: ${event.payload.title}`,
        targetTime: event.payload.dueDate,
        offsetMinutes: 4320, // 3天前
        userId: event.payload.userId,
      },
    ]);
  }
}
```

### 与任务模块集成

```typescript
// 任务到期日期变更时更新提醒
@EventsHandler(TaskDueDateChangedEvent)
export class TaskDueDateChangedReminderHandler {
  constructor(private readonly reminderService: ReminderService) {}

  async handle(event: TaskDueDateChangedEvent) {
    // 取消旧提醒
    await this.reminderService.cancelByTargetId(event.payload.id);

    // 创建新提醒
    if (event.payload.dueDate) {
      await this.reminderService.createReminder({
        type: 'task_deadline',
        targetId: event.payload.id,
        title: `任务即将到期: ${event.payload.title}`,
        targetTime: event.payload.dueDate,
        offsetMinutes: 1440, // 1天前
        userId: event.payload.userId,
      });
    }
  }
}
```

### 与日程模块集成

```typescript
// 日程事件创建时自动创建提醒
@EventsHandler(ScheduleEventCreatedEvent)
export class ScheduleEventCreatedReminderHandler {
  constructor(private readonly reminderService: ReminderService) {}

  async handle(event: ScheduleEventCreatedEvent) {
    const offsetMinutes = this.calculateOptimalOffset(
      event.payload.type,
      event.payload.duration
    );

    await this.reminderService.createReminder({
      type: 'schedule_event',
      targetId: event.payload.id,
      title: `${event.payload.title}即将开始`,
      targetTime: event.payload.startTime,
      offsetMinutes,
      userId: event.payload.userId,
    });
  }

  private calculateOptimalOffset(type: string, duration: number): number {
    if (type === 'meeting') {
      if (duration < 30) return 15;
      if (duration < 120) return 30;
      return 60;
    }
    return 15;
  }
}
```

---

## 📚 相关文档

- [[modules/notification/README|通知模块]] - 提醒通知的发送渠道
- [[modules/goal/README|目标管理]] - 目标提醒集成
- [[modules/task/README|任务管理]] - 任务提醒集成
- [[modules/schedule/README|日程调度]] - 日程提醒集成
- [[concepts/event-driven|事件驱动架构]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
