---
tags:
  - value-object
  - module-statistics
  - analytics
description: 模块统计值对象 - 按模块分组的执行统计
created: 2025-01-01
updated: 2025-01-01
---

# ModuleStatistics (模块统计)

> 📊 按来源模块分组的调度任务统计

## 概述

`ModuleStatistics` 值对象封装了按来源模块分组的统计数据，用于分析各模块的调度任务执行情况。

## 类型定义

### Server 接口

```typescript
export interface IModuleStatisticsServer {
  moduleName: string;           // 模块名称
  totalTasks: number;           // 总任务数
  activeTasks: number;          // 活跃任务数
  totalExecutions: number;      // 总执行次数
  successfulExecutions: number; // 成功次数
  failedExecutions: number;     // 失败次数
  avgDuration: number;          // 平均执行时长 (ms)

  // 值对象方法
  equals(other: IModuleStatisticsServer): boolean;
  with(updates: Partial<...>): IModuleStatisticsServer;
  update(tasksDelta: number, executionsDelta: number, ...): IModuleStatisticsServer;
  calculateSuccessRate(): number;

  // DTO 转换
  toServerDTO(): ModuleStatisticsServerDTO;
  toClientDTO(): ModuleStatisticsClientDTO;
}
```

### Client 接口

```typescript
export interface IModuleStatisticsClient {
  moduleName: string;
  totalTasks: number;
  activeTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDuration: number;

  // UI 辅助属性
  moduleNameDisplay: string;      // "提醒模块" | "任务模块"
  successRateDisplay: string;     // "98.5%"
  avgDurationDisplay: string;     // "1.2 秒"
  healthStatus: 'healthy' | 'warning' | 'critical';

  // 方法
  equals(other: IModuleStatisticsClient): boolean;
  toServerDTO(): ModuleStatisticsServerDTO;
}
```

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| moduleName | string | 模块标识 (reminder/task/goal/...) |
| totalTasks | number | 该模块的总任务数 |
| activeTasks | number | 活跃任务数 |
| totalExecutions | number | 总执行次数 |
| successfulExecutions | number | 成功执行次数 |
| failedExecutions | number | 失败执行次数 |
| avgDuration | number | 平均执行时长 (毫秒) |

## 模块名称映射

| 模块 | 标识 | 显示名称 |
|------|------|----------|
| Reminder | `reminder` | 提醒模块 |
| Task | `task` | 任务模块 |
| Goal | `goal` | 目标模块 |
| Notification | `notification` | 通知模块 |
| System | `system` | 系统模块 |
| Custom | `custom` | 自定义模块 |

## 计算方法

### 成功率

```typescript
calculateSuccessRate(): number {
  if (this.totalExecutions === 0) return 100;
  return (this.successfulExecutions / this.totalExecutions) * 100;
}
```

### 健康状态

```typescript
healthStatus = 
  successRate >= 95 ? 'healthy' :
  successRate >= 80 ? 'warning' :
  'critical';
```

## 使用场景

### 获取模块统计

```typescript
const stats = await scheduleStatistics.getModuleStatistics('reminder');

console.log(`提醒模块: ${stats.totalTasks} 个任务`);
console.log(`成功率: ${stats.successRateDisplay}`);
console.log(`平均耗时: ${stats.avgDurationDisplay}`);
```

### 统计面板展示

```typescript
// 在 ScheduleStatistics 中
const moduleStats = statistics.moduleStatistics;

Object.entries(moduleStats).forEach(([module, stats]) => {
  renderModuleCard({
    name: stats.moduleNameDisplay,
    tasks: stats.totalTasks,
    successRate: stats.successRateDisplay,
    health: stats.healthStatus
  });
});
```

### 比较模块性能

```typescript
const modules = Object.values(statistics.moduleStatistics);
const sorted = modules.sort((a, b) => 
  a.calculateSuccessRate() - b.calculateSuccessRate()
);

// 找出性能最差的模块
const worst = sorted[0];
if (worst.healthStatus === 'critical') {
  alertAdmin(`${worst.moduleNameDisplay} 需要关注!`);
}
```

## 相关链接

- [[../aggregates/ScheduleStatistics|调度统计 ScheduleStatistics]] - 使用此值对象
- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 按模块分组
- [[../enums/Enums#SourceModule|SourceModule]] - 模块枚举

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/ModuleStatistics.ts` |
