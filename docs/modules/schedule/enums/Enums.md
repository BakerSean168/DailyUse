---
tags:
  - enum
  - schedule
  - types
description: Schedule 模块所有枚举类型定义
created: 2025-01-01
updated: 2025-01-01
---

# Schedule 模块枚举

> 📋 Schedule 模块的所有枚举类型

## 概述

本文档列出 Schedule 模块使用的所有枚举类型，定义于 `@dailyuse/contracts/schedule/enums`。

---

## ScheduleTaskStatus

调度任务的生命周期状态。

```typescript
export enum ScheduleTaskStatus {
  ACTIVE = 'active',       // 活跃 - 任务正常运行中
  PAUSED = 'paused',       // 暂停 - 任务已暂停，不会触发执行
  COMPLETED = 'completed', // 完成 - 任务已完成所有计划执行
  CANCELLED = 'cancelled', // 取消 - 任务被用户或系统取消
  FAILED = 'failed',       // 失败 - 任务因错误而失败
}
```

### 状态说明

| 状态 | 值 | 显示 | 颜色 | 说明 |
|------|------|------|------|------|
| 活跃 | `active` | "活跃" | 🟢 green | 正常运行中 |
| 暂停 | `paused` | "已暂停" | ⚪ gray | 用户主动暂停 |
| 完成 | `completed` | "已完成" | 🔵 blue | 达到最大执行次数或结束日期 |
| 取消 | `cancelled` | "已取消" | 🟠 orange | 用户或系统取消 |
| 失败 | `failed` | "失败" | 🔴 red | 连续失败超过阈值 |

### 状态转换

详见 [[../aggregates/ScheduleTask#状态机|ScheduleTask 状态机]]

---

## ExecutionStatus

单次任务执行的状态。

```typescript
export enum ExecutionStatus {
  SUCCESS = 'success',     // 成功 - 执行成功完成
  FAILED = 'failed',       // 失败 - 执行失败
  SKIPPED = 'skipped',     // 跳过 - 执行被跳过（如任务已暂停）
  TIMEOUT = 'timeout',     // 超时 - 执行超时
  RETRYING = 'retrying',   // 重试中 - 正在重试执行
}
```

### 状态说明

| 状态 | 值 | 显示 | 颜色 | 说明 |
|------|------|------|------|------|
| 成功 | `success` | "成功" | 🟢 green | 正常完成 |
| 失败 | `failed` | "失败" | 🔴 red | 执行出错 |
| 跳过 | `skipped` | "跳过" | ⚪ gray | 被跳过 |
| 超时 | `timeout` | "超时" | 🟠 orange | 超过超时时间 |
| 重试中 | `retrying` | "重试中" | 🔵 blue | 正在等待重试 |

---

## TaskPriority

任务的执行优先级。

```typescript
export enum TaskPriority {
  LOW = 'low',         // 低优先级
  NORMAL = 'normal',   // 普通优先级（默认）
  HIGH = 'high',       // 高优先级
  URGENT = 'urgent',   // 紧急优先级
}
```

### 优先级说明

| 优先级 | 值 | 显示 | 颜色 | 说明 |
|--------|------|------|------|------|
| 低 | `low` | "低" | ⚪ gray | 可延后执行 |
| 普通 | `normal` | "普通" | 🔵 blue | 默认优先级 |
| 高 | `high` | "高" | 🟠 orange | 优先执行 |
| 紧急 | `urgent` | "紧急" | 🔴 red | 立即执行 |

---

## SourceModule

调度任务的来源模块。

```typescript
export enum SourceModule {
  REMINDER = 'reminder',       // Reminder 模块
  TASK = 'task',               // Task 模块
  GOAL = 'goal',               // Goal 模块
  NOTIFICATION = 'notification', // Notification 模块
  SYSTEM = 'system',           // System 系统任务
  CUSTOM = 'custom',           // Custom 自定义模块
}
```

### 模块说明

| 模块 | 值 | 显示 | 说明 |
|------|------|------|------|
| 提醒 | `reminder` | "提醒模块" | 定时提醒 |
| 任务 | `task` | "任务模块" | 任务截止提醒 |
| 目标 | `goal` | "目标模块" | 目标检查/回顾 |
| 通知 | `notification` | "通知模块" | 系统通知 |
| 系统 | `system` | "系统模块" | 内部系统任务 |
| 自定义 | `custom` | "自定义模块" | 用户自定义 |

---

## Timezone

常用时区枚举。

```typescript
export enum Timezone {
  UTC = 'UTC',                    // UTC 时区
  SHANGHAI = 'Asia/Shanghai',     // 上海时区（东八区）
  TOKYO = 'Asia/Tokyo',           // 东京时区
  NEW_YORK = 'America/New_York',  // 纽约时区
  LONDON = 'Europe/London',       // 伦敦时区
}
```

### 时区说明

| 时区 | 值 | 显示 | UTC 偏移 |
|------|------|------|----------|
| UTC | `UTC` | "UTC" | +0 |
| 上海 | `Asia/Shanghai` | "上海 (UTC+8)" | +8 |
| 东京 | `Asia/Tokyo` | "东京 (UTC+9)" | +9 |
| 纽约 | `America/New_York` | "纽约 (UTC-5/-4)" | -5/-4 |
| 伦敦 | `Europe/London` | "伦敦 (UTC+0/+1)" | +0/+1 |

---

## ConflictSeverity

日程冲突的严重程度。

```typescript
export enum ConflictSeverity {
  MINOR = 'minor',       // 轻微冲突 - 重叠时长 < 15 分钟
  MODERATE = 'moderate', // 中度冲突 - 重叠时长 15-60 分钟
  SEVERE = 'severe',     // 严重冲突 - 重叠时长 > 60 分钟或完全重叠
}
```

### 严重程度说明

| 级别 | 值 | 显示 | 颜色 | 条件 |
|------|------|------|------|------|
| 轻微 | `minor` | "轻微" | 🟡 yellow | 重叠 < 15 分钟 |
| 中度 | `moderate` | "中度" | 🟠 orange | 重叠 15-60 分钟 |
| 严重 | `severe` | "严重" | 🔴 red | 重叠 > 60 分钟 |

详见 [[../value-objects/ConflictDetectionResult|ConflictDetectionResult]]

---

## 代码位置

| 文件 | 路径 |
|------|------|
| 枚举定义 | `packages/contracts/src/modules/schedule/enums.ts` |
