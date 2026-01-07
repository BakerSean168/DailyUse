---
tags:
  - value-object
  - retry-policy
  - fault-tolerance
description: 重试策略值对象 - 任务失败重试配置
created: 2025-01-01
updated: 2025-01-01
---

# RetryPolicy (重试策略)

> 🔄 定义任务失败后的重试行为

## 概述

`RetryPolicy` 值对象封装了调度任务失败后的重试策略，支持指数退避算法。

## 类型定义

### Server 接口

```typescript
export interface IRetryPolicyServer {
  enabled: boolean;           // 是否启用重试
  maxRetries: number;         // 最大重试次数
  retryDelay: number;         // 初始重试延迟 (ms)
  backoffMultiplier: number;  // 退避倍数
  maxRetryDelay: number;      // 最大重试延迟 (ms)

  // 值对象方法
  equals(other: IRetryPolicyServer): boolean;
  with(updates: Partial<...>): IRetryPolicyServer;
  shouldRetry(currentRetryCount: number): boolean;
  calculateNextRetryDelay(currentRetryCount: number): number;

  // DTO 转换
  toServerDTO(): RetryPolicyServerDTO;
  toClientDTO(): RetryPolicyClientDTO;
}
```

### Client 接口

```typescript
export interface IRetryPolicyClient {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;

  // UI 辅助属性
  policyDescription: string;      // "最多重试 3 次，延迟 5s ~ 60s"
  enabledDisplay: string;         // "已启用" | "已禁用"
  retryDelayFormatted: string;    // "5 秒"
  maxRetryDelayFormatted: string; // "60 秒"

  // 方法
  equals(other: IRetryPolicyClient): boolean;
  toServerDTO(): RetryPolicyServerDTO;
}
```

## 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | true | 是否启用重试 |
| maxRetries | number | 3 | 最大重试次数 |
| retryDelay | number | 5000 | 初始延迟 (5秒) |
| backoffMultiplier | number | 2 | 退避倍数 |
| maxRetryDelay | number | 60000 | 最大延迟 (60秒) |

## 指数退避算法

```typescript
calculateNextRetryDelay(currentRetryCount: number): number {
  // delay = min(retryDelay * (backoffMultiplier ^ retryCount), maxRetryDelay)
  const delay = this.retryDelay * Math.pow(this.backoffMultiplier, currentRetryCount);
  return Math.min(delay, this.maxRetryDelay);
}
```

### 示例计算

假设配置：`retryDelay=5000, backoffMultiplier=2, maxRetryDelay=60000`

| 重试次数 | 计算公式 | 延迟时间 |
|----------|----------|----------|
| 第 1 次 | 5000 × 2^0 | 5 秒 |
| 第 2 次 | 5000 × 2^1 | 10 秒 |
| 第 3 次 | 5000 × 2^2 | 20 秒 |
| 第 4 次 | 5000 × 2^3 | 40 秒 |
| 第 5 次 | 5000 × 2^4 = 80000 → min(80000, 60000) | 60 秒 (上限) |

## 业务方法

### shouldRetry

判断是否应该重试：

```typescript
shouldRetry(currentRetryCount: number): boolean {
  return this.enabled && currentRetryCount < this.maxRetries;
}
```

### 使用示例

```typescript
const policy = task.retryPolicy;

if (executionFailed && policy.shouldRetry(currentRetries)) {
  const delay = policy.calculateNextRetryDelay(currentRetries);
  setTimeout(() => retry(), delay);
}
```

## 预设策略

### 默认策略 (中等)

```typescript
{
  enabled: true,
  maxRetries: 3,
  retryDelay: 5000,
  backoffMultiplier: 2,
  maxRetryDelay: 60000
}
// 描述: "最多重试 3 次，延迟 5s ~ 60s"
```

### 激进策略

```typescript
{
  enabled: true,
  maxRetries: 5,
  retryDelay: 1000,
  backoffMultiplier: 1.5,
  maxRetryDelay: 30000
}
// 描述: "最多重试 5 次，延迟 1s ~ 30s"
```

### 保守策略

```typescript
{
  enabled: true,
  maxRetries: 2,
  retryDelay: 10000,
  backoffMultiplier: 3,
  maxRetryDelay: 300000
}
// 描述: "最多重试 2 次，延迟 10s ~ 5min"
```

### 禁用重试

```typescript
{
  enabled: false,
  maxRetries: 0,
  retryDelay: 0,
  backoffMultiplier: 1,
  maxRetryDelay: 0
}
// 描述: "已禁用"
```

## 相关链接

- [[../aggregates/ScheduleTask|调度任务 ScheduleTask]] - 使用此策略
- [[ExecutionInfo|执行信息 ExecutionInfo]] - 记录重试状态
- [[../entities/ScheduleExecution|执行记录 ScheduleExecution]] - 包含 retryCount

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/RetryPolicy.ts` |
| 实现 | `packages/domain-client/src/schedule/value-objects/RetryPolicy.ts` |
