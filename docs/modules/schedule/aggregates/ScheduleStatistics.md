---
tags:
  - entity
  - aggregate
  - schedule-statistics
  - analytics
description: 调度统计聚合根 - 任务执行统计和性能指标
created: 2025-01-01
updated: 2025-01-01
---

# ScheduleStatistics (调度统计)

> 📊 调度系统的统计数据和性能指标

## 概述

`ScheduleStatistics` 聚合根管理账户级别的调度统计数据，包括任务统计、执行统计和性能指标。

## 类型定义

### ScheduleStatisticsClientDTO

```typescript
export interface ScheduleStatisticsClientDTO {
  // === 基础标识 ===
  uuid: string;              // 使用 accountUuid 作为 uuid
  accountUuid: string;

  // === 任务统计 ===
  totalTasks: number;        // 总任务数
  activeTasks: number;       // 活跃任务数
  pausedTasks: number;       // 暂停任务数
  completedTasks: number;    // 完成任务数
  cancelledTasks: number;    // 取消任务数
  failedTasks: number;       // 失败任务数

  // === 执行统计 ===
  totalExecutions: number;      // 总执行次数
  successfulExecutions: number; // 成功执行次数
  failedExecutions: number;     // 失败执行次数
  skippedExecutions: number;    // 跳过执行次数
  timeoutExecutions: number;    // 超时执行次数

  // === 性能统计 ===
  avgExecutionDuration: number;  // 平均执行时长 (ms)
  minExecutionDuration: number;  // 最短执行时长 (ms)
  maxExecutionDuration: number;  // 最长执行时长 (ms)

  // === 模块统计 ===
  moduleStatistics: Record<string, ModuleStatisticsClientDTO>;

  // === 时间戳 ===
  lastUpdatedAt: number;
  createdAt: number;

  // === UI 辅助属性 ===
  totalTasksDisplay: string;     // "共 100 个任务"
  activeTasksDisplay: string;    // "80 个活跃"
  successRateDisplay: string;    // "98.5%"
  avgDurationDisplay: string;    // "1.2 秒"
  healthStatus: string;          // "healthy" | "warning" | "critical"
}
```

## 统计指标

### 任务统计

| 指标 | 说明 | 计算方式 |
|------|------|----------|
| totalTasks | 总任务数 | COUNT(*) |
| activeTasks | 活跃任务数 | status = 'active' |
| pausedTasks | 暂停任务数 | status = 'paused' |
| completedTasks | 完成任务数 | status = 'completed' |
| cancelledTasks | 取消任务数 | status = 'cancelled' |
| failedTasks | 失败任务数 | status = 'failed' |

### 执行统计

| 指标 | 说明 | 计算方式 |
|------|------|----------|
| totalExecutions | 总执行次数 | COUNT(executions) |
| successfulExecutions | 成功次数 | status = 'success' |
| failedExecutions | 失败次数 | status = 'failed' |
| skippedExecutions | 跳过次数 | status = 'skipped' |
| timeoutExecutions | 超时次数 | status = 'timeout' |

### 成功率计算

```typescript
successRate = totalExecutions > 0 
  ? (successfulExecutions / totalExecutions * 100).toFixed(1) + '%'
  : '0%';
```

### 健康状态判断

```typescript
healthStatus = 
  successRate >= 95 ? 'healthy' :
  successRate >= 80 ? 'warning' :
  'critical';
```

## 模块统计

按来源模块分组的统计数据，详见 [[../value-objects/ModuleStatistics|ModuleStatistics]]。

```typescript
moduleStatistics: {
  reminder: ModuleStatisticsClientDTO,
  task: ModuleStatisticsClientDTO,
  goal: ModuleStatisticsClientDTO,
  // ...
}
```

## 业务方法

### ScheduleStatisticsClient 接口

```typescript
export interface ScheduleStatisticsClient {
  // 统计属性
  totalTasks: number;
  // ...

  // 业务方法
  getModuleStats(moduleName: string): ModuleStatisticsClientDTO | null;
  getSuccessRate(): number;  // 0-100
  isHealthy(): boolean;

  // 转换方法
  toServerDTO(): ScheduleStatisticsServerDTO;
  toClientDTO(): ScheduleStatisticsClientDTO;
}
```

## API 操作

| 方法 | 说明 |
|------|------|
| `getStatistics()` | 获取账户统计 |
| `getModuleStatistics(module)` | 获取模块统计 |
| `getAllModuleStatistics()` | 获取所有模块统计 |
| `recalculateStatistics()` | 重新计算统计 |
| `resetStatistics()` | 重置统计数据 |

## 相关链接

- [[ScheduleTask|调度任务 ScheduleTask]] - 任务数据来源
- [[../entities/ScheduleExecution|执行记录 ScheduleExecution]] - 执行数据来源
- [[../value-objects/ModuleStatistics|模块统计 ModuleStatistics]] - 模块级统计

## 代码位置

| 文件 | 路径 |
|------|------|
| Client DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleStatisticsClient.ts` |
| Server DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleStatisticsServer.ts` |
