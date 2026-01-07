---
tags:
  - entity
  - aggregate
  - schedule-event
  - calendar
description: 日程事件聚合根 - 用户日历中的会议、约会等事件
created: 2025-01-01
updated: 2025-01-01
---

# Schedule (日程事件)

> 📅 用户日历中的会议、约会、个人事件

## 概述

`Schedule` 是日程模块的核心聚合根之一，代表用户日历中的一个事件。这可以是会议、约会、提醒或其他需要在特定时间处理的事项。

## 类型定义

### ScheduleClientDTO

客户端使用的数据传输对象，定义于 `@dailyuse/contracts/schedule`。

```typescript
export interface ScheduleClientDTO {
  // === 基础标识 ===
  readonly uuid: string;              // 唯一标识符
  readonly accountUuid: string;       // 所属账户

  // === 核心属性 ===
  readonly title: string;             // 标题 (e.g., "Team Meeting")
  readonly description?: string;      // 详细描述

  // === 时间属性 ===
  readonly startTime: number;         // 开始时间 (Unix timestamp ms)
  readonly endTime: number;           // 结束时间 (Unix timestamp ms)
  readonly duration: number;          // 时长 (分钟)

  // === 冲突检测 ===
  readonly hasConflict: boolean;              // 是否有冲突
  readonly conflictingSchedules?: string[];   // 冲突的日程 UUID 列表

  // === 附加信息 ===
  readonly priority?: number;         // 优先级 (1-5)
  readonly location?: string;         // 地点
  readonly attendees?: string[];      // 参与者列表

  // === 时间戳 ===
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

## 属性说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uuid | string | ✅ | 唯一标识符 |
| accountUuid | string | ✅ | 所属账户 UUID |
| title | string | ✅ | 日程标题 |
| description | string | ❌ | 详细描述 |
| startTime | number | ✅ | 开始时间戳 (ms) |
| endTime | number | ✅ | 结束时间戳 (ms) |
| duration | number | ✅ | 时长 (分钟，计算值) |
| hasConflict | boolean | ✅ | 是否存在时间冲突 |
| conflictingSchedules | string[] | ❌ | 冲突日程的 UUID 列表 |
| priority | number | ❌ | 优先级 1-5 (5 最高) |
| location | string | ❌ | 地点或会议链接 |
| attendees | string[] | ❌ | 参与者邮箱/UUID |
| createdAt | number | ✅ | 创建时间戳 |
| updatedAt | number | ✅ | 更新时间戳 |

## 实体状态

⚠️ **当前架构状态**

| 层级 | 状态 | 说明 |
|------|------|------|
| contracts | ✅ 完整 | ScheduleClientDTO 定义完整 |
| domain-client | ❌ **缺失** | 没有 Schedule Entity 实现 |
| Desktop Store | ⚠️ 使用 DTO | 因缺少 Entity，直接使用 DTO |

**TODO**: 创建 `Schedule` Entity 类，实现以下方法：
- `fromClientDTO(dto)` - 从 DTO 创建 Entity
- `toClientDTO()` - 转换为 DTO
- `hasTimeConflict(other)` - 检测时间冲突
- `overlaps(startTime, endTime)` - 检查时间重叠

## API 操作

### 创建日程

```typescript
// CreateScheduleRequest
interface CreateScheduleRequest {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  priority?: number;
  location?: string;
  attendees?: string[];
}
```

### 更新日程

```typescript
// UpdateScheduleRequest
interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  priority?: number;
  location?: string;
  attendees?: string[];
}
```

### 时间范围查询

```typescript
// GetSchedulesByTimeRangeRequest
interface GetSchedulesByTimeRangeRequest {
  startTime: number;  // 范围开始时间
  endTime: number;    // 范围结束时间
}
```

## 业务规则

### 时间验证
1. `endTime` 必须大于 `startTime`
2. `duration` 自动计算：`(endTime - startTime) / 60000`

### 冲突检测
- 创建或更新时自动检测冲突
- `hasConflict = true` 时，`conflictingSchedules` 包含冲突日程列表
- 详见 [[../value-objects/ConflictDetectionResult|ConflictDetectionResult]]

## 相关链接

- [[ScheduleTask|调度任务 ScheduleTask]] - 系统定时任务
- [[ScheduleStatistics|统计 ScheduleStatistics]] - 调度统计
- [[../business/ScheduleEvent-Management|日程事件管理]] - 完整业务流程
- [[../business/Conflict-Detection|冲突检测]] - 冲突检测机制

## 代码位置

| 文件 | 路径 |
|------|------|
| Client DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleClient.ts` |
| Server DTO | `packages/contracts/src/modules/schedule/aggregates/ScheduleServer.ts` |
| Entity (TODO) | `packages/domain-client/src/schedule/aggregates/Schedule.ts` |
| ApplicationService | `packages/application-client/src/schedule/services/ScheduleEventApplicationService.ts` |
