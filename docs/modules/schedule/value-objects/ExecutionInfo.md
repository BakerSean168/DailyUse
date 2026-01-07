---
tags:
  - value-object
  - execution-info
  - execution-state
description: 执行信息值对象 - 记录任务执行状态和统计
created: 2025-01-01
updated: 2025-01-01
---

# ExecutionInfo (执行信息)

> 📈 记录调度任务的执行状态和统计

## 概述

`ExecutionInfo` 值对象封装了调度任务的执行状态信息，包括下次/上次执行时间、执行计数和健康状态。

## 类型定义

### Server 接口

```typescript
export interface IExecutionInfoServer {
  nextRunAt: number | null;           // 下次执行时间
  lastRunAt: number | null;           // 上次执行时间
  executionCount: number;             // 已执行次数
  lastExecutionStatus: ExecutionStatus | null;  // 上次执行状态
  lastExecutionDuration: number | null;  // 上次执行时长 (ms)
  consecutiveFailures: number;        // 连续失败次数

  // 值对象方法
  equals(other: IExecutionInfoServer): boolean;
  with(updates: Partial<...>): IExecutionInfoServer;
  updateAfterExecution(params): IExecutionInfoServer;
  resetFailures(): IExecutionInfoServer;

  // DTO 转换
  toServerDTO(): ExecutionInfoServerDTO;
  toClientDTO(): ExecutionInfoClientDTO;
}
```

### Client 接口

```typescript
export interface IExecutionInfoClient {
  nextRunAt: Date | null;           // 注意: Date 类型
  lastRunAt: Date | null;
  executionCount: number;
  lastExecutionStatus: ExecutionStatus | null;
  consecutiveFailures: number;

  // UI 辅助属性
  nextRunAtFormatted: string | null;  // "2025-01-01 09:00" | "30 分钟后"
  lastRunAtFormatted: string | null;  // "2 小时前"
  lastExecutionDurationFormatted: string | null;  // "1.2 秒"
  executionCountFormatted: string;    // "已执行 100 次"
  healthStatus: 'healthy' | 'warning' | 'critical';

  // 方法
  equals(other: IExecutionInfoClient): boolean;
  toServerDTO(): ExecutionInfoServerDTO;
}
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| nextRunAt | Date/number | 下次计划执行时间 |
| lastRunAt | Date/number | 上次实际执行时间 |
| executionCount | number | 总执行次数 |
| lastExecutionStatus | [[../enums/Enums#ExecutionStatus\|ExecutionStatus]] | 上次执行状态 |
| lastExecutionDuration | number | 上次执行耗时 (毫秒) |
| consecutiveFailures | number | 连续失败次数 |

## 健康状态判断

```typescript
healthStatus = 
  consecutiveFailures === 0 ? 'healthy' :    // 🟢 健康
  consecutiveFailures < 3 ? 'warning' :      // 🟡 警告
  'critical';                                 // 🔴 危险
```

| 状态 | 条件 | 颜色 | 建议 |
|------|------|------|------|
| healthy | 连续失败 = 0 | 🟢 | 正常运行 |
| warning | 连续失败 1-2 次 | 🟡 | 关注中 |
| critical | 连续失败 ≥ 3 次 | 🔴 | 需要干预 |

## 业务方法

### updateAfterExecution

每次执行后更新状态：

```typescript
const newInfo = executionInfo.updateAfterExecution({
  executedAt: Date.now(),
  status: ExecutionStatus.SUCCESS,
  duration: 1500,  // 1.5 秒
  nextRunAt: calculateNextRun(),
});
```

### resetFailures

重置失败计数：

```typescript
const newInfo = executionInfo.resetFailures();
// consecutiveFailures = 0
```

## UI 格式化

### nextRunAtFormatted

```typescript
// 根据时间差显示
if (diff < 60 * 60 * 1000) {
  return `${Math.round(diff / 60000)} 分钟后`;
} else if (diff < 24 * 60 * 60 * 1000) {
  return `${Math.round(diff / 3600000)} 小时后`;
} else {
  return formatDate(nextRunAt, 'yyyy-MM-dd HH:mm');
}
```

### executionCountFormatted

```typescript
executionCountFormatted = `已执行 ${executionCount} 次`;
```

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 使用此值对象
- [[../entities/ScheduleExecution|执行记录 ScheduleExecution]] - 详细执行历史
- [[../enums/Enums#ExecutionStatus|ExecutionStatus]] - 执行状态枚举

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/ExecutionInfo.ts` |
| 实现 | `packages/domain-client/src/schedule/value-objects/ExecutionInfo.ts` |
