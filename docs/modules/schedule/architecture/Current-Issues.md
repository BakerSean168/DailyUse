---
tags:
  - architecture
  - issues
  - tech-debt
description: Schedule 模块当前问题和待优化项
created: 2025-01-01
updated: 2025-01-01
---

# 当前问题

> ⚠️ Schedule 模块的已知问题和待改进项

## 概述

本文档记录 Schedule 模块当前存在的架构问题和技术债务，供后续优化参考。

---

## 🔴 严重问题

### 1. 缺少 Schedule Entity

**问题描述**

`domain-client` 层只有 `ScheduleTask` Entity，**缺少 `Schedule` Entity**（日程事件）。

**当前状态**

| 数据模型 | contracts DTO | domain-client Entity | Store |
|----------|---------------|---------------------|-------|
| Schedule Event | ✅ ScheduleClientDTO | ❌ **缺失** | 使用 DTO |
| Schedule Task | ✅ ScheduleTaskClientDTO | ✅ ScheduleTask | 可用 Entity |

**影响**

1. Desktop Store 无法使用 Entity 类型
2. 无法在客户端封装日程事件的业务逻辑
3. 与其他模块架构不一致

**解决方案**

创建 `packages/domain-client/src/schedule/aggregates/Schedule.ts`:

```typescript
export class Schedule extends AggregateRoot implements ScheduleClient {
  // 工厂方法
  static fromClientDTO(dto: ScheduleClientDTO): Schedule;
  static fromServerDTO(dto: ScheduleServerDTO): Schedule;
  
  // 业务方法
  hasTimeConflict(other: Schedule): boolean;
  overlaps(startTime: number, endTime: number): boolean;
  getDuration(): number;
  
  // 转换方法
  toClientDTO(): ScheduleClientDTO;
  toServerDTO(): ScheduleServerDTO;
}
```

**优先级**: 🔴 高

---

## 🟡 中等问题

### 2. Desktop Store 使用 DTO 而非 Entity

**问题描述**

`scheduleStore.ts` 直接使用 `ScheduleClientDTO` 类型，而不是 Entity。

**当前代码**

```typescript
// scheduleStore.ts
interface ScheduleState {
  schedules: ScheduleClientDTO[];  // 应该用 Entity
  // ...
}
```

**影响**

1. 无法利用 Entity 的业务方法
2. 与 Task、Goal、Reminder 等模块架构不一致

**解决方案**

待 Schedule Entity 创建后，升级 Store:

```typescript
interface ScheduleState {
  schedules: Schedule[];  // Entity 类型
  // ...
}

// 加载时转换
const loadSchedules = async () => {
  const dtos = await service.getSchedulesByTimeRange(params);
  const entities = dtos.map(dto => Schedule.fromClientDTO(dto));
  setSchedules(entities);
};
```

**优先级**: 🟡 中

**依赖**: 问题 #1 解决后

---

### 3. ScheduleExecution Entity 未实现

**问题描述**

`domain-client/schedule/entities/` 目录为空，`ScheduleExecution` Entity 未实现。

**当前状态**

- contracts 有 `ScheduleExecutionClientDTO` 定义
- domain-client 无对应 Entity

**影响**

1. 无法在客户端处理执行记录业务逻辑
2. ScheduleTask 的 `executions` 属性返回 DTO 而非 Entity

**解决方案**

创建 `packages/domain-client/src/schedule/entities/ScheduleExecution.ts`

**优先级**: 🟡 中

---

### 4. ApplicationService 未返回 Entity

**问题描述**

`ScheduleEventApplicationService` 直接返回 DTO，没有转换为 Entity。

**当前代码**

```typescript
async getSchedulesByTimeRange(params): Promise<ScheduleClientDTO[]> {
  return this.apiClient.getSchedulesByTimeRange(params);
  // 应该转换为 Entity
}
```

**解决方案**

待 Entity 创建后，更新 ApplicationService:

```typescript
async getSchedulesByTimeRange(params): Promise<Schedule[]> {
  const dtos = await this.apiClient.getSchedulesByTimeRange(params);
  return dtos.map(dto => Schedule.fromClientDTO(dto));
}
```

**优先级**: 🟡 中

**依赖**: 问题 #1 解决后

---

## 🟢 低优先级

### 5. 统计 Entity 缺失

**问题描述**

`ScheduleStatistics` 和 `ModuleStatistics` 只有 DTO，没有 Entity 实现。

**影响**

统计数据无法封装业务逻辑（如成功率计算）。

**优先级**: 🟢 低

---

### 6. 值对象实现不完整

**问题描述**

部分值对象的某些方法可能未完整实现：
- `ScheduleConfig.calculateNextRun()` - Cron 解析
- `ExecutionInfo.updateAfterExecution()` - 状态更新

**优先级**: 🟢 低

---

## 改进计划

### Phase 1: 核心 Entity 补全

1. ✅ 评估影响范围
2. ⏳ 创建 Schedule Entity
3. ⏳ 创建 ScheduleExecution Entity
4. ⏳ 更新 ApplicationService 返回 Entity

### Phase 2: Store 升级

1. ⏳ 更新 scheduleStore 使用 Entity
2. ⏳ 更新相关 Hook 和 Component

### Phase 3: 统计和值对象

1. ⏳ 完善 ScheduleStatistics Entity
2. ⏳ 完善值对象方法

---

## 相关 EPIC

| EPIC | 描述 | 状态 |
|------|------|------|
| EPIC-015 | Desktop 架构对齐 | 进行中 |
| EPIC-SCHEDULE-001 | Schedule 模块初始实现 | 已完成 |

## 相关链接

- [[Architecture|模块架构]] - 整体架构设计
- [[../aggregates/Schedule|Schedule]] - 日程事件实体
- [[../aggregates/ScheduleTask|ScheduleTask]] - 调度任务实体

## 更新记录

| 日期 | 更新 |
|------|------|
| 2025-01-01 | 初始文档创建 |
