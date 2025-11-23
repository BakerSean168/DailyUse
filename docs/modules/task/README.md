---
tags:
  - module
  - task
  - gtd
  - business-logic
description: 任务管理模块 - GTD任务系统的完整实现文档
created: 2025-11-23T16:40:00
updated: 2025-11-23T16:40:00
---

# ✅ Task Module - 任务管理模块

> 基于GTD (Getting Things Done) 方法论的任务管理系统

## 📋 目录

- [模块概述](#模块概述)
- [核心概念](#核心概念)
- [领域模型](#领域模型)
- [API接口](#api接口)
- [使用示例](#使用示例)
- [业务规则](#业务规则)
- [事件系统](#事件系统)

---

## 🎯 模块概述

### 功能简介

任务管理模块实现GTD方法论，提供完整的任务生命周期管理：

- ✅ 任务创建、更新、删除
- 📋 任务列表与分组
- 🏷️ 标签与分类管理
- 📅 到期日期与提醒
- ✔️ 任务状态流转
- 🔗 子任务与依赖关系
- 📊 任务统计与分析

### 技术特性

- **DDD架构**: 领域驱动设计，聚合根管理
- **事件驱动**: 任务状态变更发布领域事件
- **乐观锁**: 防止并发更新冲突
- **软删除**: 支持任务归档与恢复
- **全文搜索**: 基于Prisma的任务搜索

---

## 💡 核心概念

### GTD方法论

```
收集 → 处理 → 组织 → 回顾 → 执行
```

| 阶段 | 描述 | 对应功能 |
|------|------|---------|
| **收集** | 捕获所有待办事项 | 快速创建任务 |
| **处理** | 判断是否可执行 | 任务分类、设置上下文 |
| **组织** | 归类到合适的列表 | 项目、标签、优先级 |
| **回顾** | 定期检查任务 | 任务列表、过滤 |
| **执行** | 完成任务 | 状态更新、完成标记 |

### 任务状态

```typescript
enum TaskStatus {
  TODO = 'todo',           // 待办
  IN_PROGRESS = 'in_progress', // 进行中
  BLOCKED = 'blocked',     // 阻塞
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}
```

### 任务优先级

```typescript
enum TaskPriority {
  LOW = 'low',       // 低优先级
  MEDIUM = 'medium', // 中优先级
  HIGH = 'high',     // 高优先级
  URGENT = 'urgent', // 紧急
}
```

---

## 🏗 领域模型

### 聚合根: TaskAggregate

**职责**: 管理任务的完整生命周期和业务规则

```typescript
// apps/api/src/task/domain/aggregates/task.aggregate.ts
export class TaskAggregate {
  private constructor(
    public readonly id: string,
    private _title: TaskTitle,
    private _description: string,
    private _status: TaskStatus,
    private _priority: TaskPriority,
    private _dueDate: Date | null,
    private _tags: string[],
    private _parentId: string | null,
    public readonly userId: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _completedAt: Date | null,
    private readonly events: DomainEvent[] = []
  ) {}

  static create(props: CreateTaskProps): TaskAggregate {
    const task = new TaskAggregate(
      uuidv4(),
      TaskTitle.create(props.title),
      props.description ?? '',
      TaskStatus.TODO,
      props.priority ?? TaskPriority.MEDIUM,
      props.dueDate ?? null,
      props.tags ?? [],
      props.parentId ?? null,
      props.userId,
      new Date(),
      new Date(),
      null
    );

    task.addEvent(new TaskCreatedEvent(task.toPlainObject()));
    return task;
  }

  // Getters
  get title(): TaskTitle { return this._title; }
  get status(): TaskStatus { return this._status; }
  get priority(): TaskPriority { return this._priority; }
  get dueDate(): Date | null { return this._dueDate; }
  get isOverdue(): boolean {
    if (!this._dueDate || this._status === TaskStatus.COMPLETED) {
      return false;
    }
    return new Date() > this._dueDate;
  }

  // 业务方法
  updateTitle(title: TaskTitle): void {
    this._title = title;
    this._updatedAt = new Date();
    this.addEvent(new TaskUpdatedEvent(this.toPlainObject()));
  }

  start(): void {
    if (this._status !== TaskStatus.TODO) {
      throw new Error('Only TODO tasks can be started');
    }
    this._status = TaskStatus.IN_PROGRESS;
    this._updatedAt = new Date();
    this.addEvent(new TaskStartedEvent(this.toPlainObject()));
  }

  complete(): void {
    if (this._status === TaskStatus.COMPLETED) {
      throw new Error('Task is already completed');
    }
    this._status = TaskStatus.COMPLETED;
    this._completedAt = new Date();
    this._updatedAt = new Date();
    this.addEvent(new TaskCompletedEvent(this.toPlainObject()));
  }

  block(reason: string): void {
    this._status = TaskStatus.BLOCKED;
    this._updatedAt = new Date();
    this.addEvent(new TaskBlockedEvent({
      ...this.toPlainObject(),
      reason,
    }));
  }

  setPriority(priority: TaskPriority): void {
    this._priority = priority;
    this._updatedAt = new Date();
    this.addEvent(new TaskPriorityChangedEvent({
      taskId: this.id,
      oldPriority: this._priority,
      newPriority: priority,
    }));
  }

  setDueDate(dueDate: Date | null): void {
    this._dueDate = dueDate;
    this._updatedAt = new Date();
    this.addEvent(new TaskDueDateChangedEvent(this.toPlainObject()));
  }

  addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._updatedAt = new Date();
      this.addEvent(new TaskTagAddedEvent({ taskId: this.id, tag }));
    }
  }

  removeTag(tag: string): void {
    this._tags = this._tags.filter(t => t !== tag);
    this._updatedAt = new Date();
    this.addEvent(new TaskTagRemovedEvent({ taskId: this.id, tag }));
  }
}
```

### 值对象: TaskTitle

```typescript
// apps/api/src/task/domain/value-objects/task-title.vo.ts
export class TaskTitle {
  private static readonly MAX_LENGTH = 200;
  
  private constructor(public readonly value: string) {}

  static create(title: string): TaskTitle {
    const trimmed = title.trim();
    
    if (!trimmed) {
      throw new Error('Task title cannot be empty');
    }
    
    if (trimmed.length > TaskTitle.MAX_LENGTH) {
      throw new Error(`Task title cannot exceed ${TaskTitle.MAX_LENGTH} characters`);
    }
    
    return new TaskTitle(trimmed);
  }

  equals(other: TaskTitle): boolean {
    return this.value === other.value;
  }
}
```

### 仓储接口

```typescript
// apps/api/src/task/domain/repositories/task.repository.ts
export interface TaskRepository {
  findById(id: string): Promise<TaskAggregate | null>;
  findByUserId(userId: string, options?: FindOptions): Promise<TaskAggregate[]>;
  findByStatus(userId: string, status: TaskStatus): Promise<TaskAggregate[]>;
  findOverdue(userId: string): Promise<TaskAggregate[]>;
  findByTag(userId: string, tag: string): Promise<TaskAggregate[]>;
  findSubtasks(parentId: string): Promise<TaskAggregate[]>;
  save(task: TaskAggregate): Promise<void>;
  delete(id: string): Promise<void>;
  count(userId: string): Promise<number>;
}
```

---

## 🔌 API接口

### 基础路径

```
/api/tasks
```

### 端点列表

#### 1. 创建任务

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "完成项目文档",
  "description": "编写API文档和使用指南",
  "priority": "high",
  "dueDate": "2025-11-30T23:59:59Z",
  "tags": ["documentation", "urgent"],
  "parentId": null
}
```

**响应** (201 Created):

```json
{
  "id": "task-123",
  "title": "完成项目文档",
  "description": "编写API文档和使用指南",
  "status": "todo",
  "priority": "high",
  "dueDate": "2025-11-30T23:59:59.000Z",
  "tags": ["documentation", "urgent"],
  "parentId": null,
  "userId": "user-123",
  "isOverdue": false,
  "createdAt": "2025-11-23T16:40:00.000Z",
  "updatedAt": "2025-11-23T16:40:00.000Z",
  "completedAt": null
}
```

#### 2. 获取任务列表

```http
GET /api/tasks?status=todo&priority=high&tag=urgent&page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 描述 |
|------|------|------|
| `status` | string | 任务状态过滤 |
| `priority` | string | 优先级过滤 |
| `tag` | string | 标签过滤 |
| `overdue` | boolean | 只显示过期任务 |
| `page` | number | 页码（默认1） |
| `limit` | number | 每页数量（默认20） |

**响应** (200 OK):

```json
{
  "items": [
    {
      "id": "task-123",
      "title": "完成项目文档",
      "status": "todo",
      "priority": "high",
      "dueDate": "2025-11-30T23:59:59.000Z",
      "tags": ["documentation", "urgent"],
      "isOverdue": false,
      "createdAt": "2025-11-23T16:40:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 3. 获取任务详情

```http
GET /api/tasks/{taskId}
Authorization: Bearer {token}
```

**响应** (200 OK): 完整的任务对象

#### 4. 更新任务

```http
PATCH /api/tasks/{taskId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "priority": "urgent",
  "dueDate": "2025-12-01T23:59:59Z"
}
```

#### 5. 开始任务

```http
POST /api/tasks/{taskId}/start
Authorization: Bearer {token}
```

**响应** (200 OK): 状态变更为 `in_progress`

#### 6. 完成任务

```http
POST /api/tasks/{taskId}/complete
Authorization: Bearer {token}
```

**响应** (200 OK): 状态变更为 `completed`，设置 `completedAt`

#### 7. 阻塞任务

```http
POST /api/tasks/{taskId}/block
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "等待其他任务完成"
}
```

#### 8. 删除任务

```http
DELETE /api/tasks/{taskId}
Authorization: Bearer {token}
```

**响应** (204 No Content)

#### 9. 批量操作

```http
POST /api/tasks/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "action": "complete",
  "taskIds": ["task-1", "task-2", "task-3"]
}
```

---

## 💻 使用示例

### 前端 - Vue 3

**创建任务组件**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTaskStore } from '@/stores/task.store';
import type { CreateTaskDto } from '@dailyuse/contracts';

const taskStore = useTaskStore();
const form = ref<CreateTaskDto>({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: null,
  tags: [],
});

const isLoading = ref(false);

async function createTask() {
  isLoading.value = true;
  try {
    await taskStore.createTask(form.value);
    // 重置表单
    form.value = {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: null,
      tags: [],
    };
  } catch (error) {
    console.error('Failed to create task:', error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <v-form @submit.prevent="createTask">
    <v-text-field
      v-model="form.title"
      label="任务标题"
      :rules="[v => !!v || '标题不能为空']"
      required
    />
    
    <v-textarea
      v-model="form.description"
      label="任务描述"
      rows="3"
    />
    
    <v-select
      v-model="form.priority"
      :items="['low', 'medium', 'high', 'urgent']"
      label="优先级"
    />
    
    <v-date-picker
      v-model="form.dueDate"
      label="到期日期"
    />
    
    <v-combobox
      v-model="form.tags"
      label="标签"
      multiple
      chips
      closable-chips
    />
    
    <v-btn
      type="submit"
      color="primary"
      :loading="isLoading"
      block
    >
      创建任务
    </v-btn>
  </v-form>
</template>
```

**任务列表组件**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTaskStore } from '@/stores/task.store';
import type { Task } from '@dailyuse/contracts';

const taskStore = useTaskStore();
const tasks = computed(() => taskStore.tasks);

onMounted(() => {
  taskStore.fetchTasks({ status: 'todo' });
});

async function completeTask(taskId: string) {
  await taskStore.completeTask(taskId);
}

async function deleteTask(taskId: string) {
  if (confirm('确定要删除这个任务吗？')) {
    await taskStore.deleteTask(taskId);
  }
}
</script>

<template>
  <v-list>
    <v-list-item
      v-for="task in tasks"
      :key="task.id"
      :class="{ 'overdue': task.isOverdue }"
    >
      <template #prepend>
        <v-checkbox
          :model-value="task.status === 'completed'"
          @update:model-value="completeTask(task.id)"
        />
      </template>
      
      <v-list-item-title>{{ task.title }}</v-list-item-title>
      <v-list-item-subtitle>
        <v-chip
          :color="getPriorityColor(task.priority)"
          size="small"
        >
          {{ task.priority }}
        </v-chip>
        
        <span v-if="task.dueDate" class="ml-2">
          📅 {{ formatDate(task.dueDate) }}
        </span>
      </v-list-item-subtitle>
      
      <template #append>
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          @click="deleteTask(task.id)"
        />
      </template>
    </v-list-item>
  </v-list>
</template>
```

### Pinia Store

```typescript
// apps/web/src/stores/task.store.ts
import { defineStore } from 'pinia';
import type { Task, CreateTaskDto } from '@dailyuse/contracts';
import { taskApi } from '@/api/task.api';

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [] as Task[],
    currentTask: null as Task | null,
    isLoading: false,
  }),

  getters: {
    todoTasks: (state) => state.tasks.filter(t => t.status === 'todo'),
    inProgressTasks: (state) => state.tasks.filter(t => t.status === 'in_progress'),
    completedTasks: (state) => state.tasks.filter(t => t.status === 'completed'),
    overdueTasks: (state) => state.tasks.filter(t => t.isOverdue),
  },

  actions: {
    async fetchTasks(filters?: TaskFilters) {
      this.isLoading = true;
      try {
        const response = await taskApi.getTasks(filters);
        this.tasks = response.items;
      } finally {
        this.isLoading = false;
      }
    },

    async createTask(dto: CreateTaskDto) {
      const task = await taskApi.createTask(dto);
      this.tasks.unshift(task);
      return task;
    },

    async updateTask(id: string, dto: UpdateTaskDto) {
      const task = await taskApi.updateTask(id, dto);
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = task;
      }
      return task;
    },

    async completeTask(id: string) {
      const task = await taskApi.completeTask(id);
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = task;
      }
    },

    async deleteTask(id: string) {
      await taskApi.deleteTask(id);
      this.tasks = this.tasks.filter(t => t.id !== id);
    },
  },
});
```

---

## 📋 业务规则

### 任务状态流转规则

```
┌─────┐     ┌────────────┐     ┌───────────┐
│TODO │────▶│IN_PROGRESS │────▶│COMPLETED  │
└─────┘     └────────────┘     └───────────┘
   │              │                    
   │              ▼                    
   │         ┌─────────┐               
   └────────▶│BLOCKED  │               
             └─────────┘               
                  │                    
                  ▼                    
             ┌──────────┐              
             │CANCELLED │              
             └──────────┘              
```

**允许的状态转换**:

| 当前状态 | 允许转换到 |
|---------|-----------|
| TODO | IN_PROGRESS, BLOCKED, CANCELLED |
| IN_PROGRESS | COMPLETED, BLOCKED, CANCELLED |
| BLOCKED | TODO, IN_PROGRESS, CANCELLED |
| COMPLETED | - (终态) |
| CANCELLED | - (终态) |

### 子任务规则

1. 父任务只有在所有子任务完成后才能完成
2. 删除父任务会级联删除所有子任务
3. 子任务的优先级不能低于父任务
4. 子任务层级最多3层

### 过期规则

1. 任务过期后自动标记为 `isOverdue`
2. 过期任务完成后不再显示过期标记
3. 系统每天凌晨检查并发送过期提醒

---

## 📡 事件系统

### 领域事件

```typescript
// 任务创建
export class TaskCreatedEvent extends DomainEvent {
  eventType = 'task.created';
}

// 任务更新
export class TaskUpdatedEvent extends DomainEvent {
  eventType = 'task.updated';
}

// 任务开始
export class TaskStartedEvent extends DomainEvent {
  eventType = 'task.started';
}

// 任务完成
export class TaskCompletedEvent extends DomainEvent {
  eventType = 'task.completed';
}

// 任务阻塞
export class TaskBlockedEvent extends DomainEvent {
  eventType = 'task.blocked';
}

// 优先级变更
export class TaskPriorityChangedEvent extends DomainEvent {
  eventType = 'task.priority_changed';
}

// 到期日期变更
export class TaskDueDateChangedEvent extends DomainEvent {
  eventType = 'task.due_date_changed';
}
```

### 事件处理器

```typescript
// 任务完成后触发提醒
@EventsHandler(TaskCompletedEvent)
export class TaskCompletedHandler implements IEventHandler<TaskCompletedEvent> {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly notificationService: NotificationService
  ) {}

  async handle(event: TaskCompletedEvent) {
    // 取消相关提醒
    await this.reminderService.cancelByTaskId(event.payload.id);
    
    // 发送完成通知
    await this.notificationService.send({
      userId: event.payload.userId,
      type: 'task_completed',
      title: '任务已完成',
      message: `任务"${event.payload.title}"已完成`,
    });
  }
}
```

---

## 📚 相关文档

- [[architecture/ddd-patterns|DDD模式指南]]
- [[concepts/event-driven|事件驱动架构]]
- [[modules/goal/README|目标管理模块]] - 任务可关联目标
- [[modules/reminder/README|提醒模块]] - 任务到期提醒
- [[guides/development/testing|测试指南]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0
