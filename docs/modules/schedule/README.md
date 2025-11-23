---
tags:
  - module
  - schedule
  - calendar
  - business-logic
description: 日程调度模块 - 统一日程事件系统的完整实现文档
created: 2025-11-23T16:50:00
updated: 2025-11-23T16:50:00
---

# 📅 Schedule Module - 日程调度模块

> 统一的日程事件管理系统，支持日历视图、循环事件和冲突检测

## 📋 目录

- [模块概述](#模块概述)
- [核心概念](#核心概念)
- [领域模型](#领域模型)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [循环规则](#循环规则)
- [冲突检测](#冲突检测)

---

## 🎯 模块概述

### 功能简介

日程调度模块提供统一的事件管理系统：

- 📅 日历事件创建与管理
- 🔄 循环事件（日/周/月/年）
- ⏰ 事件提醒与通知
- 🔍 时间冲突检测
- 📊 日/周/月视图
- 🎯 关联目标与任务
- 📍 地点与会议链接

### 统一事件模型

```
ScheduleEvent (统一日程事件)
    ├── One-time Event (单次事件)
    ├── Recurring Event (循环事件)
    ├── Goal-linked Event (目标关联事件)
    └── Task-linked Event (任务关联事件)
```

---

## 💡 核心概念

### 事件类型

```typescript
enum ScheduleEventType {
  MEETING = 'meeting',       // 会议
  REMINDER = 'reminder',     // 提醒
  TASK_DEADLINE = 'task_deadline', // 任务截止
  GOAL_MILESTONE = 'goal_milestone', // 目标里程碑
  PERSONAL = 'personal',     // 个人事件
  OTHER = 'other',          // 其他
}
```

### 循环模式

```typescript
enum RecurrencePattern {
  DAILY = 'daily',         // 每天
  WEEKLY = 'weekly',       // 每周
  MONTHLY = 'monthly',     // 每月
  YEARLY = 'yearly',       // 每年
  CUSTOM = 'custom',       // 自定义
}
```

### 时间视图

```typescript
enum CalendarView {
  DAY = 'day',       // 日视图
  WEEK = 'week',     // 周视图
  MONTH = 'month',   // 月视图
  AGENDA = 'agenda', // 议程视图
}
```

---

## 🏗 领域模型

### 聚合根: ScheduleEventAggregate

```typescript
// apps/api/src/schedule/domain/aggregates/schedule-event.aggregate.ts
export class ScheduleEventAggregate {
  private constructor(
    public readonly id: string,
    private _title: EventTitle,
    private _description: string,
    private _type: ScheduleEventType,
    private _startTime: Date,
    private _endTime: Date,
    private _location: string | null,
    private _meetingUrl: string | null,
    private _isAllDay: boolean,
    private _recurrence: RecurrenceRule | null,
    private _linkedGoalId: string | null,
    private _linkedTaskId: string | null,
    public readonly userId: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private readonly events: DomainEvent[] = []
  ) {}

  static create(props: CreateScheduleEventProps): ScheduleEventAggregate {
    // 验证时间
    if (props.endTime <= props.startTime) {
      throw new Error('End time must be after start time');
    }

    const event = new ScheduleEventAggregate(
      uuidv4(),
      EventTitle.create(props.title),
      props.description ?? '',
      props.type,
      props.startTime,
      props.endTime,
      props.location ?? null,
      props.meetingUrl ?? null,
      props.isAllDay ?? false,
      props.recurrence ?? null,
      props.linkedGoalId ?? null,
      props.linkedTaskId ?? null,
      props.userId,
      new Date(),
      new Date()
    );

    event.addEvent(new ScheduleEventCreatedEvent(event.toPlainObject()));
    return event;
  }

  // Getters
  get title(): EventTitle { return this._title; }
  get startTime(): Date { return this._startTime; }
  get endTime(): Date { return this._endTime; }
  get duration(): number {
    return this._endTime.getTime() - this._startTime.getTime();
  }
  get isRecurring(): boolean {
    return this._recurrence !== null;
  }

  // 业务方法
  updateTime(startTime: Date, endTime: Date): void {
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
    
    this._startTime = startTime;
    this._endTime = endTime;
    this._updatedAt = new Date();
    this.addEvent(new ScheduleEventTimeChangedEvent(this.toPlainObject()));
  }

  setRecurrence(rule: RecurrenceRule): void {
    this._recurrence = rule;
    this._updatedAt = new Date();
    this.addEvent(new ScheduleEventRecurrenceSetEvent({
      eventId: this.id,
      rule,
    }));
  }

  clearRecurrence(): void {
    this._recurrence = null;
    this._updatedAt = new Date();
    this.addEvent(new ScheduleEventRecurrenceClearedEvent({
      eventId: this.id,
    }));
  }

  linkToGoal(goalId: string): void {
    this._linkedGoalId = goalId;
    this._updatedAt = new Date();
    this.addEvent(new ScheduleEventLinkedToGoalEvent({
      eventId: this.id,
      goalId,
    }));
  }

  linkToTask(taskId: string): void {
    this._linkedTaskId = taskId;
    this._updatedAt = new Date();
    this.addEvent(new ScheduleEventLinkedToTaskEvent({
      eventId: this.id,
      taskId,
    }));
  }

  // 检查是否与另一个事件冲突
  conflictsWith(other: ScheduleEventAggregate): boolean {
    if (this._isAllDay || other._isAllDay) {
      return this.isSameDay(this._startTime, other._startTime);
    }
    
    return (
      this._startTime < other._endTime &&
      this._endTime > other._startTime
    );
  }

  // 生成循环事件实例
  generateOccurrences(start: Date, end: Date): ScheduleEventOccurrence[] {
    if (!this._recurrence) {
      return [{
        eventId: this.id,
        startTime: this._startTime,
        endTime: this._endTime,
        isOriginal: true,
      }];
    }

    return this._recurrence.generateOccurrences(
      this._startTime,
      this._endTime,
      start,
      end
    );
  }
}
```

### 值对象: RecurrenceRule

```typescript
// apps/api/src/schedule/domain/value-objects/recurrence-rule.vo.ts
export class RecurrenceRule {
  constructor(
    public readonly pattern: RecurrencePattern,
    public readonly interval: number,      // 间隔（如：每2天）
    public readonly daysOfWeek?: number[], // 周几（0-6，0是周日）
    public readonly dayOfMonth?: number,   // 每月第几天
    public readonly endDate?: Date,        // 结束日期
    public readonly occurrences?: number   // 重复次数
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (this.pattern === RecurrencePattern.WEEKLY && !this.daysOfWeek?.length) {
      throw new Error('Weekly recurrence requires days of week');
    }

    if (this.pattern === RecurrencePattern.MONTHLY && !this.dayOfMonth) {
      throw new Error('Monthly recurrence requires day of month');
    }
  }

  generateOccurrences(
    originalStart: Date,
    originalEnd: Date,
    rangeStart: Date,
    rangeEnd: Date
  ): ScheduleEventOccurrence[] {
    const occurrences: ScheduleEventOccurrence[] = [];
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    let currentDate = new Date(originalStart);
    let count = 0;

    while (
      currentDate < rangeEnd &&
      (!this.endDate || currentDate <= this.endDate) &&
      (!this.occurrences || count < this.occurrences)
    ) {
      if (currentDate >= rangeStart) {
        occurrences.push({
          eventId: '', // 由聚合根填充
          startTime: new Date(currentDate),
          endTime: new Date(currentDate.getTime() + duration),
          isOriginal: count === 0,
        });
      }

      currentDate = this.getNextOccurrence(currentDate);
      count++;
    }

    return occurrences;
  }

  private getNextOccurrence(current: Date): Date {
    const next = new Date(current);

    switch (this.pattern) {
      case RecurrencePattern.DAILY:
        next.setDate(next.getDate() + this.interval);
        break;

      case RecurrencePattern.WEEKLY:
        // 找到下一个匹配的星期几
        let daysToAdd = 1;
        while (daysToAdd <= 7 * this.interval) {
          next.setDate(next.getDate() + 1);
          if (this.daysOfWeek?.includes(next.getDay())) {
            break;
          }
          daysToAdd++;
        }
        break;

      case RecurrencePattern.MONTHLY:
        next.setMonth(next.getMonth() + this.interval);
        if (this.dayOfMonth) {
          next.setDate(this.dayOfMonth);
        }
        break;

      case RecurrencePattern.YEARLY:
        next.setFullYear(next.getFullYear() + this.interval);
        break;
    }

    return next;
  }
}
```

---

## 🔌 API接口

### 基础路径

```
/api/schedule/events
```

### 端点列表

#### 1. 创建日程事件

```http
POST /api/schedule/events
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "团队周会",
  "description": "讨论本周工作进展",
  "type": "meeting",
  "startTime": "2025-11-25T10:00:00Z",
  "endTime": "2025-11-25T11:00:00Z",
  "location": "会议室A",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "isAllDay": false,
  "recurrence": {
    "pattern": "weekly",
    "interval": 1,
    "daysOfWeek": [1],
    "endDate": "2025-12-31T23:59:59Z"
  }
}
```

**响应** (201 Created):

```json
{
  "id": "event-123",
  "title": "团队周会",
  "type": "meeting",
  "startTime": "2025-11-25T10:00:00.000Z",
  "endTime": "2025-11-25T11:00:00.000Z",
  "location": "会议室A",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "isAllDay": false,
  "isRecurring": true,
  "recurrence": {
    "pattern": "weekly",
    "interval": 1,
    "daysOfWeek": [1]
  },
  "createdAt": "2025-11-23T16:50:00.000Z"
}
```

#### 2. 获取日程列表（日历视图）

```http
GET /api/schedule/events?start=2025-11-01&end=2025-11-30&view=month
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| `start` | string | 开始日期 (ISO 8601) |
| `end` | string | 结束日期 (ISO 8601) |
| `view` | string | 视图类型 (day/week/month/agenda) |
| `type` | string | 事件类型过滤 |

**响应** (200 OK):

```json
{
  "events": [
    {
      "id": "event-123",
      "title": "团队周会",
      "type": "meeting",
      "startTime": "2025-11-25T10:00:00.000Z",
      "endTime": "2025-11-25T11:00:00.000Z",
      "isAllDay": false,
      "isRecurring": true
    }
  ],
  "occurrences": [
    {
      "eventId": "event-123",
      "startTime": "2025-11-25T10:00:00.000Z",
      "endTime": "2025-11-25T11:00:00.000Z"
    },
    {
      "eventId": "event-123",
      "startTime": "2025-12-02T10:00:00.000Z",
      "endTime": "2025-12-02T11:00:00.000Z"
    }
  ]
}
```

#### 3. 检查时间冲突

```http
POST /api/schedule/events/check-conflict
Content-Type: application/json
Authorization: Bearer {token}

{
  "startTime": "2025-11-25T10:30:00Z",
  "endTime": "2025-11-25T11:30:00Z",
  "excludeEventId": "event-456"
}
```

**响应** (200 OK):

```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "eventId": "event-123",
      "title": "团队周会",
      "startTime": "2025-11-25T10:00:00.000Z",
      "endTime": "2025-11-25T11:00:00.000Z"
    }
  ]
}
```

#### 4. 更新循环事件

```http
PATCH /api/schedule/events/{eventId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "updateMode": "this",
  "title": "更新后的标题",
  "startTime": "2025-11-25T11:00:00Z",
  "endTime": "2025-11-25T12:00:00Z"
}
```

**updateMode**:
- `this` - 只更新此次
- `future` - 更新此次及以后
- `all` - 更新所有实例

---

## 💻 使用示例

### 前端 - Vue 3

**日历视图组件**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useScheduleStore } from '@/stores/schedule.store';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const scheduleStore = useScheduleStore();

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: computed(() => scheduleStore.calendarEvents),
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
});

async function handleDateSelect(selectInfo: any) {
  const title = prompt('请输入事件标题:');
  if (title) {
    await scheduleStore.createEvent({
      title,
      startTime: selectInfo.start,
      endTime: selectInfo.end,
      type: 'personal',
    });
  }
  selectInfo.view.calendar.unselect();
}

async function handleEventClick(clickInfo: any) {
  const event = clickInfo.event;
  // 打开事件详情对话框
  scheduleStore.openEventDialog(event.id);
}

async function handleEventDrop(dropInfo: any) {
  const event = dropInfo.event;
  await scheduleStore.updateEvent(event.id, {
    startTime: event.start,
    endTime: event.end,
  });
}

onMounted(() => {
  const start = new Date();
  start.setDate(1); // 月初
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1); // 月末
  
  scheduleStore.fetchEvents(start, end);
});
</script>

<template>
  <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style scoped>
.calendar-container {
  padding: 1rem;
  height: calc(100vh - 64px);
}
</style>
```

**循环事件创建**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { RecurrencePattern } from '@dailyuse/contracts';

const form = ref({
  title: '',
  startTime: null as Date | null,
  endTime: null as Date | null,
  isRecurring: false,
  recurrence: {
    pattern: 'daily' as RecurrencePattern,
    interval: 1,
    daysOfWeek: [] as number[],
    endDate: null as Date | null,
  },
});

const weekDays = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
];
</script>

<template>
  <v-form>
    <v-text-field
      v-model="form.title"
      label="事件标题"
    />
    
    <v-row>
      <v-col cols="6">
        <v-date-time-picker
          v-model="form.startTime"
          label="开始时间"
        />
      </v-col>
      <v-col cols="6">
        <v-date-time-picker
          v-model="form.endTime"
          label="结束时间"
        />
      </v-col>
    </v-row>
    
    <v-switch
      v-model="form.isRecurring"
      label="循环事件"
    />
    
    <v-expand-transition>
      <div v-if="form.isRecurring">
        <v-select
          v-model="form.recurrence.pattern"
          :items="['daily', 'weekly', 'monthly', 'yearly']"
          label="循环模式"
        />
        
        <v-text-field
          v-model.number="form.recurrence.interval"
          type="number"
          label="间隔"
          :hint="`每${form.recurrence.interval}${getPatternUnit()}`"
        />
        
        <v-chip-group
          v-if="form.recurrence.pattern === 'weekly'"
          v-model="form.recurrence.daysOfWeek"
          multiple
          column
        >
          <v-chip
            v-for="day in weekDays"
            :key="day.value"
            :value="day.value"
            filter
          >
            {{ day.label }}
          </v-chip>
        </v-chip-group>
        
        <v-date-picker
          v-model="form.recurrence.endDate"
          label="结束日期"
        />
      </div>
    </v-expand-transition>
  </v-form>
</template>
```

---

## 🔄 循环规则

### 每日循环

```typescript
{
  pattern: 'daily',
  interval: 1, // 每天
}
```

### 每周循环

```typescript
{
  pattern: 'weekly',
  interval: 1,
  daysOfWeek: [1, 3, 5], // 周一、三、五
}
```

### 每月循环

```typescript
{
  pattern: 'monthly',
  interval: 1,
  dayOfMonth: 15, // 每月15号
}
```

### 自定义循环

```typescript
{
  pattern: 'daily',
  interval: 2, // 每2天
  occurrences: 10, // 重复10次
}
```

---

## ⚠️ 冲突检测

### 检测算法

```typescript
function detectConflict(
  event1: ScheduleEvent,
  event2: ScheduleEvent
): boolean {
  // 全天事件：检查是否同一天
  if (event1.isAllDay || event2.isAllDay) {
    return isSameDay(event1.startTime, event2.startTime);
  }
  
  // 时间段事件：检查是否重叠
  return (
    event1.startTime < event2.endTime &&
    event1.endTime > event2.startTime
  );
}
```

### 自动建议

系统会在冲突时提供建议：

1. **调整时间** - 推荐最近的可用时段
2. **缩短时长** - 建议减少事件时长
3. **移动到其他日期** - 推荐空闲日期

---

## 📚 相关文档

- [[concepts/schedule/UNIFIED_SCHEDULE_EVENT_SYSTEM|统一日程事件系统]]
- [[modules/reminder/README|提醒模块]] - 事件提醒集成
- [[modules/goal/README|目标管理]] - 关联目标里程碑
- [[modules/task/README|任务管理]] - 关联任务截止日期

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
