---
tags:
  - entity
  - schedule-execution
  - execution-log
description: 执行记录实体 - 记录调度任务的每次执行
created: 2025-01-01
updated: 2025-01-01
---

# ScheduleExecution (执行记录)

> 📝 调度任务的单次执行记录

## 概述

`ScheduleExecution` 是 [[../aggregates/ScheduleTask|ScheduleTask]] 的子实体，记录每次任务执行的详细信息，包括执行时间、状态、结果和错误信息。

## 类型定义

### ScheduleExecutionClientDTO

```typescript
export interface ScheduleExecutionClientDTO {
  // === 基础标识 ===
  uuid: string;              // 执行记录 ID
  taskUuid: string;          // 所属任务 UUID

  // === 执行信息 ===
  executionTime: number;     // 执行时间 (Unix timestamp ms)
  status: ExecutionStatus;   // 执行状态
  duration: number | null;   // 执行时长 (ms)
  result: Record<string, any> | null;  // 执行结果
  error: string | null;      // 错误信息
  retryCount: number;        // 重试次数

  // === 时间戳 ===
  createdAt: number;

  // === UI 辅助属性 ===
  executionTimeFormatted: string;  // "2025-10-12 14:30:00"
  statusDisplay: string;           // "成功" | "失败" | "跳过" | "超时" | "重试中"
  statusColor: string;             // "green" | "red" | "gray" | "orange" | "blue"
  durationFormatted: string;       // "1.2 秒" | "500 毫秒" | "-"
  hasError: boolean;
  hasResult: boolean;
  resultSummary: string;           // "3 个字段" | "空"
}
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| uuid | string | 执行记录唯一标识 |
| taskUuid | string | 所属调度任务 UUID |
| executionTime | number | 实际执行时间戳 |
| status | [[../enums/Enums#ExecutionStatus\|ExecutionStatus]] | 执行状态 |
| duration | number? | 执行耗时 (毫秒) |
| result | object? | 执行结果 (JSON) |
| error | string? | 错误信息 |
| retryCount | number | 当前重试次数 |

## 执行状态

详见 [[../enums/Enums#ExecutionStatus|ExecutionStatus]]

| 状态 | 值 | 颜色 | 说明 |
|------|------|------|------|
| 成功 | `success` | 🟢 green | 执行成功完成 |
| 失败 | `failed` | 🔴 red | 执行失败 |
| 跳过 | `skipped` | ⚪ gray | 执行被跳过 |
| 超时 | `timeout` | 🟠 orange | 执行超时 |
| 重试中 | `retrying` | 🔵 blue | 正在重试 |

## 业务方法

### ScheduleExecutionClient 接口

```typescript
export interface ScheduleExecutionClient {
  // 属性
  uuid: string;
  taskUuid: string;
  executionTime: number;
  status: ExecutionStatus;
  // ...

  // 状态检查方法
  isSuccess(): boolean;
  isFailed(): boolean;
  isTimeout(): boolean;
  isSkipped(): boolean;
  isRetrying(): boolean;

  // 转换方法
  toServerDTO(): ScheduleExecutionServerDTO;
  toClientDTO(): ScheduleExecutionClientDTO;
}
```

## UI 辅助属性

### statusDisplay 映射

```typescript
const statusLabels: Record<ExecutionStatus, string> = {
  success: '成功',
  failed: '失败',
  skipped: '跳过',
  timeout: '超时',
  retrying: '重试中',
};
```

### durationFormatted 格式化

```typescript
durationFormatted = 
  duration === null ? '-' :
  duration < 1000 ? `${duration} 毫秒` :
  `${(duration / 1000).toFixed(1)} 秒`;
```

## 使用场景

### 获取最近执行记录

```typescript
// 在 ScheduleTask 中
const recentExecutions = task.getRecentExecutions(10);
```

### 获取失败记录

```typescript
const failedExecutions = task.getFailedExecutions();
```

### 分析执行趋势

```typescript
// 计算成功率
const successRate = executions.filter(e => e.isSuccess()).length / executions.length;

// 计算平均耗时
const avgDuration = executions
  .filter(e => e.duration !== null)
  .reduce((sum, e) => sum + e.duration!, 0) / executions.length;
```

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 父聚合根
- [[../value-objects/ExecutionInfo|执行信息 ExecutionInfo]] - 聚合执行统计
- [[../enums/Enums#ExecutionStatus|ExecutionStatus]] - 执行状态枚举

## 代码位置

| 文件 | 路径 |
|------|------|
| Client DTO | `packages/contracts/src/modules/schedule/entities/ScheduleExecutionClient.ts` |
| Server DTO | `packages/contracts/src/modules/schedule/entities/ScheduleExecutionServer.ts` |
