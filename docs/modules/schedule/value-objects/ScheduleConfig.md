---
tags:
  - value-object
  - schedule-config
  - cron
description: 调度配置值对象 - Cron表达式、时区、执行范围
created: 2025-01-01
updated: 2025-01-01
---

# ScheduleConfig (调度配置)

> ⚙️ 定义调度任务的执行规则

## 概述

`ScheduleConfig` 值对象封装了调度任务的时间配置，包括 Cron 表达式、时区、有效期和最大执行次数。

## 类型定义

### Server 接口

```typescript
export interface IScheduleConfigServer {
  cronExpression: string;      // Cron 表达式
  timezone: Timezone;          // 时区
  startDate: number | null;    // 开始日期 (可选)
  endDate: number | null;      // 结束日期 (可选)
  maxExecutions: number | null; // 最大执行次数 (可选)

  // 值对象方法
  equals(other: IScheduleConfigServer): boolean;
  with(updates: Partial<...>): IScheduleConfigServer;
  validate(): { isValid: boolean; errors: string[] };
  calculateNextRun(currentTime: number): number | null;
  isExpired(currentTime: number): boolean;

  // DTO 转换
  toServerDTO(): ScheduleConfigServerDTO;
  toClientDTO(): ScheduleConfigClientDTO;
  toPersistenceDTO(): ScheduleConfigPersistenceDTO;
}
```

### Client 接口

```typescript
export interface IScheduleConfigClient {
  cronExpression: string;
  timezone: Timezone;
  startDate: Date | null;       // 注意: Date 类型
  endDate: Date | null;
  maxExecutions: number | null;

  // UI 辅助属性
  cronDescription: string;       // "每天 9:00"
  timezoneDisplay: string;       // "上海 (UTC+8)"
  startDateFormatted: string | null;
  endDateFormatted: string | null;
  maxExecutionsFormatted: string; // "无限" | "100 次"

  // 方法
  equals(other: IScheduleConfigClient): boolean;
  toServerDTO(): ScheduleConfigServerDTO;
}
```

## 属性说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cronExpression | string | ✅ | Cron 表达式 |
| timezone | [[Enums#Timezone\|Timezone]] | ✅ | 时区 |
| startDate | number/Date | ❌ | 生效开始日期，null 表示立即生效 |
| endDate | number/Date | ❌ | 失效日期，null 表示永不失效 |
| maxExecutions | number | ❌ | 最大执行次数，null 表示无限 |

## Cron 表达式

### 格式

```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日期 (1-31)
│ │ │ ┌───────────── 月份 (1-12)
│ │ │ │ ┌───────────── 星期 (0-6, 0=周日)
│ │ │ │ │
* * * * *
```

### 常用示例

| 表达式 | 描述 | cronDescription |
|--------|------|-----------------|
| `0 9 * * *` | 每天 09:00 | "每天 9:00" |
| `0 9 * * 1-5` | 工作日 09:00 | "周一至周五 9:00" |
| `0 */2 * * *` | 每 2 小时 | "每 2 小时" |
| `0 0 1 * *` | 每月 1 日 | "每月 1 日 0:00" |
| `0 0 * * 0` | 每周日 | "每周日 0:00" |

## 业务方法

### calculateNextRun

计算下次执行时间：

```typescript
const nextRun = config.calculateNextRun(Date.now());
if (nextRun === null) {
  console.log('任务已结束或已达到最大执行次数');
}
```

### isExpired

检查配置是否已过期：

```typescript
if (config.isExpired(Date.now())) {
  console.log('调度配置已过期');
}
```

### validate

验证配置有效性：

```typescript
const { isValid, errors } = config.validate();
if (!isValid) {
  console.error('配置无效:', errors);
}
```

## 不可变更新

```typescript
// 使用 with() 创建新实例
const newConfig = config.with({
  cronExpression: '0 10 * * *',  // 改为 10:00
  maxExecutions: 100,            // 限制执行 100 次
});
```

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 使用此配置
- [[Enums#Timezone|Timezone]] - 时区枚举
- [[ExecutionInfo|执行信息 ExecutionInfo]] - 执行状态

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/ScheduleConfig.ts` |
| 实现 | `packages/domain-client/src/schedule/value-objects/ScheduleConfig.ts` |
