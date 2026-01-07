---
tags:
  - value-object
  - task-metadata
  - payload
description: 任务元数据值对象 - 业务数据、标签、优先级
created: 2025-01-01
updated: 2025-01-01
---

# TaskMetadata (任务元数据)

> 📋 调度任务的业务数据和标签

## 概述

`TaskMetadata` 值对象封装了调度任务的业务相关数据，包括自定义载荷、标签、优先级和超时配置。

## 类型定义

### Server 接口

```typescript
export interface ITaskMetadataServer {
  payload: Record<string, any>;   // 业务数据 (JSON)
  tags: string[];                 // 标签列表
  priority: TaskPriority;         // 优先级
  timeout: number | null;         // 超时时间 (ms)

  // 值对象方法
  equals(other: ITaskMetadataServer): boolean;
  with(updates: Partial<...>): ITaskMetadataServer;
  validate(): { isValid: boolean; errors: string[] };

  // DTO 转换
  toServerDTO(): TaskMetadataServerDTO;
  toClientDTO(): TaskMetadataClientDTO;
}
```

### Client 接口

```typescript
export interface ITaskMetadataClient {
  payload: Record<string, any>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;

  // UI 辅助属性
  priorityDisplay: string;      // "低" | "普通" | "高" | "紧急"
  priorityColor: string;        // "gray" | "blue" | "orange" | "red"
  tagsDisplay: string;          // "tag1, tag2, tag3"
  timeoutFormatted: string;     // "30 秒" | "无限制"
  payloadSummary: string;       // "3 个字段"

  // 方法
  equals(other: ITaskMetadataClient): boolean;
  toServerDTO(): TaskMetadataServerDTO;
}
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| payload | object | 自定义业务数据 (JSON 格式) |
| tags | string[] | 标签列表，用于分类和筛选 |
| priority | [[../enums/Enums#TaskPriority\|TaskPriority]] | 任务优先级 |
| timeout | number? | 执行超时时间 (毫秒)，null 表示不超时 |

## 优先级

详见 [[../enums/Enums#TaskPriority|TaskPriority]]

| 优先级 | 值 | 显示 | 颜色 |
|--------|------|------|------|
| 低 | `low` | "低" | ⚪ gray |
| 普通 | `normal` | "普通" | 🔵 blue |
| 高 | `high` | "高" | 🟠 orange |
| 紧急 | `urgent` | "紧急" | 🔴 red |

## Payload 使用

### 典型结构

```typescript
// Reminder 模块的载荷
payload = {
  reminderUuid: 'reminder-123',
  reminderTitle: '喝水提醒',
  notificationType: 'push',
  message: '该喝水啦！'
}

// Task 模块的载荷
payload = {
  taskUuid: 'task-456',
  taskTitle: '提交报告',
  dueDate: 1704067200000
}

// Goal 模块的载荷
payload = {
  goalUuid: 'goal-789',
  checkType: 'weekly-review'
}
```

### 验证规则

```typescript
validate(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // payload 不能为 null
  if (!this.payload) {
    errors.push('payload 不能为空');
  }
  
  // tags 必须是数组
  if (!Array.isArray(this.tags)) {
    errors.push('tags 必须是数组');
  }
  
  // timeout 如果存在必须为正数
  if (this.timeout !== null && this.timeout <= 0) {
    errors.push('timeout 必须为正数');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## UI 格式化

### tagsDisplay

```typescript
tagsDisplay = tags.length > 0 ? tags.join(', ') : '无标签';
```

### timeoutFormatted

```typescript
timeoutFormatted = 
  timeout === null ? '无限制' :
  timeout < 1000 ? `${timeout} 毫秒` :
  timeout < 60000 ? `${timeout / 1000} 秒` :
  `${timeout / 60000} 分钟`;
```

### payloadSummary

```typescript
const keyCount = Object.keys(payload).length;
payloadSummary = keyCount === 0 ? '空' : `${keyCount} 个字段`;
```

## 使用场景

### 创建任务时设置

```typescript
const task = await createTask({
  name: '每日提醒',
  // ...
  metadata: {
    payload: { reminderUuid: 'xxx', message: '喝水!' },
    tags: ['健康', '日常'],
    priority: TaskPriority.NORMAL,
    timeout: 30000  // 30秒超时
  }
});
```

### 更新元数据

```typescript
await updateTaskMetadata(taskUuid, {
  priority: TaskPriority.HIGH,
  tags: [...existingTags, '重要']
});
```

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 使用此元数据
- [[../enums/Enums#TaskPriority|TaskPriority]] - 优先级枚举

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/TaskMetadata.ts` |
| 实现 | `packages/domain-client/src/schedule/value-objects/TaskMetadata.ts` |
