---
tags:
  - entity
  - aggregate
  - schedule-task
  - scheduler
description: 调度任务聚合根 - 系统级定时任务调度
created: 2025-01-01
updated: 2025-01-01
---

# ScheduleTask (调度任务)

> ⏰ 系统级定时任务，为 Reminder、Task、Goal 等模块提供调度服务

## 概述

`ScheduleTask` 是调度模块的核心聚合根，负责管理系统级的定时任务。它为其他模块（如 Reminder、Task、Goal）提供统一的调度基础设施，支持 Cron 表达式、重试策略和执行统计。

## 类型定义

### ScheduleTaskClientDTO

```typescript
export interface ScheduleTaskClientDTO {
  // === 基础标识 ===
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;

  // === 来源关联 ===
  sourceModule: SourceModule;     // 来源模块
  sourceEntityId: string;         // 来源实体 ID

  // === 状态 ===
  status: ScheduleTaskStatus;     // 任务状态
  enabled: boolean;               // 是否启用

  // === 值对象 ===
  schedule: ScheduleConfigClientDTO;    // 调度配置
  execution: ExecutionInfoClientDTO;    // 执行信息
  retryPolicy: RetryPolicyClientDTO;    // 重试策略
  metadata: TaskMetadataClientDTO;      // 任务元数据

  // === 时间戳 ===
  createdAt: number;
  updatedAt: number;

  // === UI 辅助属性 ===
  statusDisplay: string;          // "活跃" | "暂停" | "完成" | "取消" | "失败"
  statusColor: string;            // "green" | "gray" | "blue" | "red" | "orange"
  sourceModuleDisplay: string;    // "提醒模块" | "任务模块"
  enabledDisplay: string;         // "启用" | "禁用"
  nextRunAtFormatted: string;     // "2025-10-12 14:30:00"
  lastRunAtFormatted: string;     // "2025-10-11 14:30:00"
  executionSummary: string;       // "已执行 10 次，成功 8 次"
  healthStatus: string;           // "healthy" | "warning" | "critical"
  isOverdue: boolean;             // 是否过期

  // === 子实体 ===
  executions?: ScheduleExecutionClientDTO[] | null;
}
```

### ScheduleTaskClient (Entity 接口)

```typescript
export interface ScheduleTaskClient {
  // 基础属性 (同 DTO)
  uuid: string;
  accountUuid: string;
  name: string;
  // ...

  // === 业务方法 ===
  isActive(): boolean;
  isPaused(): boolean;
  isCompleted(): boolean;
  isCancelled(): boolean;
  isFailed(): boolean;
  isExpired(): boolean;

  getRecentExecutions(limit: number): ScheduleExecutionClient[];
  getFailedExecutions(): ScheduleExecutionClient[];

  // === 转换方法 ===
  toServerDTO(): ScheduleTaskServerDTO;
  toClientDTO(): ScheduleTaskClientDTO;
  clone(): ScheduleTaskClient;
}
```

## 状态机

```
┌──────────────────────────────────────────────────────┐
│                    ScheduleTask                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│   ┌─────────┐   pause()   ┌─────────┐               │
│   │ ACTIVE  │ ──────────► │ PAUSED  │               │
│   │ (活跃)  │ ◄────────── │ (暂停)  │               │
│   └────┬────┘   resume()  └────┬────┘               │
│        │                       │                     │
│        │ complete()            │ cancel()            │
│        ▼                       ▼                     │
│   ┌─────────┐            ┌─────────┐                │
│   │COMPLETED│            │CANCELLED│                │
│   │ (完成)  │            │ (取消)  │                │
│   └─────────┘            └─────────┘                │
│                                                      │
│   ┌─────────┐                                       │
│   │ FAILED  │  ← 连续失败超过阈值                    │
│   │ (失败)  │                                       │
│   └─────────┘                                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 属性说明

### 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| uuid | string | 唯一标识符 |
| accountUuid | string | 所属账户 |
| name | string | 任务名称 |
| description | string? | 任务描述 |
| sourceModule | [[../enums/Enums#SourceModule\|SourceModule]] | 来源模块 |
| sourceEntityId | string | 来源实体 ID |
| status | [[../enums/Enums#ScheduleTaskStatus\|ScheduleTaskStatus]] | 任务状态 |
| enabled | boolean | 是否启用 |

### 值对象属性

| 属性 | 类型 | 说明 |
|------|------|------|
| schedule | [[../value-objects/ScheduleConfig\|ScheduleConfig]] | 调度配置 (Cron, 时区等) |
| execution | [[../value-objects/ExecutionInfo\|ExecutionInfo]] | 执行信息 |
| retryPolicy | [[../value-objects/RetryPolicy\|RetryPolicy]] | 重试策略 |
| metadata | [[../value-objects/TaskMetadata\|TaskMetadata]] | 任务元数据 |

## Entity 实现

✅ **已实现** - `packages/domain-client/src/schedule/aggregates/ScheduleTask.ts`

```typescript
import { AggregateRoot } from '@dailyuse/utils';

export class ScheduleTask extends AggregateRoot implements ScheduleTaskClient {
  // 私有字段
  private _status: ScheduleTaskStatus;
  private _schedule: ScheduleConfig;
  private _execution: ExecutionInfo;
  // ...

  // 工厂方法
  static fromClientDTO(dto: ScheduleTaskClientDTO): ScheduleTask;
  static fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTask;

  // 业务方法
  isActive(): boolean { return this._status === ScheduleTaskStatus.ACTIVE; }
  isPaused(): boolean { return this._status === ScheduleTaskStatus.PAUSED; }
  // ...

  // 转换方法
  toClientDTO(): ScheduleTaskClientDTO { /* ... */ }
  toServerDTO(): ScheduleTaskServerDTO { /* ... */ }
}
```

## API 操作

### 创建任务

```typescript
interface CreateScheduleTaskRequest {
  name: string;
  description?: string;
  sourceModule: SourceModule;
  sourceEntityId: string;
  schedule: {
    cronExpression: string;    // e.g., "0 9 * * *"
    timezone: Timezone;        // e.g., "Asia/Shanghai"
    startDate?: number;
    endDate?: number;
    maxExecutions?: number;
  };
  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxRetryDelay: number;
  };
  metadata?: {
    payload: Record<string, any>;
    tags: string[];
    priority: TaskPriority;
    timeout?: number;
  };
}
```

### 状态操作

| 方法 | 说明 |
|------|------|
| `pauseTask(uuid)` | 暂停任务 |
| `resumeTask(uuid)` | 恢复任务 |
| `completeTask(uuid, reason?)` | 完成任务 |
| `cancelTask(uuid, reason?)` | 取消任务 |

## 业务规则

### 来源模块绑定
- 每个 ScheduleTask 关联到一个来源模块和实体
- 例如：Reminder 创建一个调度任务来触发提醒

### 健康状态
```typescript
healthStatus = 
  consecutiveFailures === 0 ? 'healthy' :
  consecutiveFailures < 3 ? 'warning' :
  'critical';
```

### 执行统计
- `executionCount`: 总执行次数
- `consecutiveFailures`: 连续失败次数
- `lastExecutionStatus`: 上次执行状态

## 相关链接

- [[Schedule|日程事件 Schedule]] - 用户日历事件
- [[ScheduleStatistics|统计 ScheduleStatistics]] - 调度统计
- [[../entities/ScheduleExecution|执行记录 ScheduleExecution]] - 执行历史
- [[../business/ScheduleTask-Lifecycle|调度任务生命周期]] - 完整业务流程

## 代码位置

| 文件 | 路径 |
|------|------|
| Client DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleTaskClient.ts` |
| Server DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleTaskServer.ts` |
| Entity | `packages/domain-client/src/schedule/aggregates/ScheduleTask.ts` |
| ApplicationService | `packages/application-client/src/schedule/services/ScheduleTaskApplicationService.ts` |
