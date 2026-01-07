---
tags:
  - business-flow
  - schedule-task
  - lifecycle
description: 调度任务生命周期 - 创建、暂停、恢复、完成
created: 2025-01-01
updated: 2025-01-01
---

# 调度任务生命周期

> ⏰ 调度任务的完整生命周期管理

## 概述

本文档描述调度任务 ([[../aggregates/ScheduleTask|ScheduleTask]]) 的生命周期，包括创建、状态转换、执行和统计。

## 生命周期状态图

```
                              ┌─────────────────────────────┐
                              │     ScheduleTask            │
                              │     生命周期                │
                              └─────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────────┐
                              │         ACTIVE              │
                              │         (活跃)              │
                              │                             │
                              │  • 正常调度执行             │
                              │  • 按 Cron 表达式触发       │
                              └─────────────────────────────┘
                                     │           │
                        pause()      │           │      complete()
                                     ▼           ▼
              ┌──────────────────────┐           ┌──────────────────────┐
              │      PAUSED          │           │     COMPLETED        │
              │      (暂停)          │           │     (完成)           │
              │                      │           │                      │
              │  • 暂停执行          │           │  • 正常结束          │
              │  • 保留配置和历史    │           │  • 达到最大执行次数  │
              │  • 可恢复            │           │  • 达到结束日期      │
              └──────────────────────┘           └──────────────────────┘
                        │
                        │ resume()
                        ▼
              ┌──────────────────────┐           ┌──────────────────────┐
              │      ACTIVE          │           │     CANCELLED        │
              │      (恢复)          │           │     (取消)           │
              └──────────────────────┘           │                      │
                                                 │  • 用户主动取消      │
                                                 │  • 系统取消          │
                                                 └──────────────────────┘
                                                          ▲
                                                          │ cancel()
                                                 ─────────┘
                              
              ┌──────────────────────┐
              │      FAILED          │
              │      (失败)          │
              │                      │
              │  • 连续失败超过阈值  │
              │  • 需要人工干预      │
              └──────────────────────┘
```

## 创建任务

### API

```typescript
scheduleTaskApplicationService.createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO>
```

### 请求参数

```typescript
interface CreateScheduleTaskRequest {
  // 基础信息
  name: string;
  description?: string;
  
  // 来源关联
  sourceModule: SourceModule;     // 来源模块
  sourceEntityId: string;         // 来源实体 ID
  
  // 调度配置
  schedule: {
    cronExpression: string;       // Cron 表达式
    timezone: Timezone;           // 时区
    startDate?: number;           // 开始日期
    endDate?: number;             // 结束日期
    maxExecutions?: number;       // 最大执行次数
  };
  
  // 重试策略
  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  };
  
  // 元数据
  metadata?: {
    payload: Record<string, any>;
    tags: string[];
    priority: TaskPriority;
    timeout?: number;
  };
}
```

### 使用场景

| 来源模块 | 场景 | Cron 示例 |
|----------|------|-----------|
| Reminder | 创建提醒时 | `0 9 * * *` (每天9点) |
| Task | 任务截止提醒 | `0 8 15 * *` (每月15日) |
| Goal | 周回顾提醒 | `0 20 * * 0` (每周日20点) |

### 代码示例

```typescript
// Reminder 模块创建调度任务
const createReminderSchedule = async (reminder: Reminder) => {
  const task = await scheduleTaskApplicationService.createTask({
    name: `提醒: ${reminder.title}`,
    sourceModule: SourceModule.REMINDER,
    sourceEntityId: reminder.uuid,
    schedule: {
      cronExpression: reminder.cronExpression,
      timezone: Timezone.SHANGHAI,
    },
    metadata: {
      payload: {
        reminderUuid: reminder.uuid,
        message: reminder.message,
      },
      priority: TaskPriority.NORMAL,
      tags: ['reminder'],
    },
  });
  
  return task;
};
```

## 状态转换

### 暂停任务

```typescript
scheduleTaskApplicationService.pauseTask(taskUuid: string): Promise<void>
```

**效果**:
- 状态变为 `PAUSED`
- 停止触发执行
- 保留所有配置和历史

### 恢复任务

```typescript
scheduleTaskApplicationService.resumeTask(taskUuid: string): Promise<void>
```

**效果**:
- 状态变为 `ACTIVE`
- 重新计算下次执行时间
- 恢复正常调度

### 完成任务

```typescript
scheduleTaskApplicationService.completeTask(taskUuid: string, reason?: string): Promise<void>
```

**自动完成条件**:
- 达到 `maxExecutions` 次数
- 超过 `endDate` 日期

### 取消任务

```typescript
scheduleTaskApplicationService.cancelTask(taskUuid: string, reason?: string): Promise<void>
```

**使用场景**:
- 用户删除来源实体（如删除 Reminder）
- 业务需求变更

## 任务执行

### 执行流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  触发时间   │ ──► │  执行任务   │ ──► │  记录结果   │
│  到达       │     │  (调用回调) │     │  (Execution)│
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  更新统计   │
                    │  - ExecutionInfo │
                    │  - Statistics    │
                    └─────────────┘
```

### 执行结果

| 状态 | 处理 |
|------|------|
| SUCCESS | 更新统计，计算下次执行 |
| FAILED | 判断是否重试 |
| TIMEOUT | 记录超时，可能重试 |
| SKIPPED | 任务暂停时跳过 |

### 重试逻辑

详见 [[../value-objects/RetryPolicy|RetryPolicy]]

```typescript
if (executionFailed) {
  if (retryPolicy.shouldRetry(currentRetries)) {
    const delay = retryPolicy.calculateNextRetryDelay(currentRetries);
    scheduleRetry(task, delay);
  } else {
    // 重试次数用尽
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      markTaskFailed(task);
    }
  }
}
```

## 任务查询

### 获取所有任务

```typescript
scheduleTaskApplicationService.getTasks(): Promise<ScheduleTaskClientDTO[]>
```

### 获取到期任务

```typescript
scheduleTaskApplicationService.getDueTasks(params?: {
  beforeTime?: string;
  limit?: number;
}): Promise<ScheduleTaskClientDTO[]>
```

### 根据来源查询

```typescript
scheduleTaskApplicationService.getTaskBySource(
  sourceModule: SourceModule,
  sourceEntityId: string
): Promise<ScheduleTaskClientDTO[]>
```

## 统计更新

每次执行后更新:

- [[../value-objects/ExecutionInfo|ExecutionInfo]] - 任务级执行信息
- [[../aggregates/ScheduleStatistics|ScheduleStatistics]] - 账户级统计
- [[../value-objects/ModuleStatistics|ModuleStatistics]] - 模块级统计

## 健康监控

### 健康状态判断

```typescript
healthStatus = 
  consecutiveFailures === 0 ? 'healthy' :
  consecutiveFailures < 3 ? 'warning' :
  'critical';
```

### 告警条件

| 条件 | 告警级别 |
|------|----------|
| 连续失败 3 次 | Warning |
| 连续失败 5 次 | Critical |
| 成功率 < 80% | Warning |
| 成功率 < 50% | Critical |

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 实体定义
- [[../entities/ScheduleExecution|执行记录 ScheduleExecution]] - 执行历史
- [[../value-objects/ScheduleConfig|ScheduleConfig]] - 调度配置
- [[../value-objects/RetryPolicy|RetryPolicy]] - 重试策略

## 代码位置

| 文件 | 路径 |
|------|------|
| ApplicationService | `packages/application-client/src/schedule/services/ScheduleTaskApplicationService.ts` |
| Entity | `packages/domain-client/src/schedule/aggregates/ScheduleTask.ts` |
