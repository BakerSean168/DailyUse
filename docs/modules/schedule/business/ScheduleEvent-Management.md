---
tags:
  - business-flow
  - schedule-event
  - crud
description: 日程事件管理业务流程 - CRUD和时间范围查询
created: 2025-01-01
updated: 2025-01-01
---

# 日程事件管理

> 📅 用户日历事件的完整管理流程

## 概述

本文档描述日程事件 ([[../aggregates/Schedule|Schedule]]) 的完整业务流程，包括创建、查询、更新和删除操作。

## 业务流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    日程事件管理流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐   createSchedule   ┌─────────────┐           │
│   │ 用户    │ ─────────────────► │ 创建日程    │           │
│   │         │                    │             │           │
│   └────┬────┘                    └──────┬──────┘           │
│        │                                │                   │
│        │ getSchedules                   ▼                   │
│        │                         ┌─────────────┐           │
│        └────────────────────────►│ 冲突检测    │           │
│                                  │             │           │
│                                  └──────┬──────┘           │
│                                         │                   │
│                          ┌──────────────┼──────────────┐   │
│                          ▼              ▼              ▼   │
│                   ┌──────────┐   ┌──────────┐   ┌────────┐ │
│                   │ 无冲突   │   │ 有冲突   │   │ 取消   │ │
│                   │ → 保存   │   │ → 提示   │   │        │ │
│                   └──────────┘   └──────────┘   └────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 创建日程

### API

```typescript
scheduleApplicationService.createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO>
```

### 请求参数

```typescript
interface CreateScheduleRequest {
  title: string;              // 必填，日程标题
  description?: string;       // 可选，详细描述
  startTime: number;          // 必填，开始时间戳 (ms)
  endTime: number;            // 必填，结束时间戳 (ms)
  priority?: number;          // 可选，优先级 1-5
  location?: string;          // 可选，地点
  attendees?: string[];       // 可选，参与者
}
```

### 业务规则

1. **时间验证**
   - `endTime` 必须大于 `startTime`
   - 持续时间自动计算：`duration = (endTime - startTime) / 60000`

2. **冲突检测**
   - 创建时自动检测时间冲突
   - 如有冲突，返回冲突信息但仍创建成功
   - 用户可选择修改或保留

### 代码示例

```typescript
// Desktop Store
const createSchedule = async (dto: CreateScheduleRequest) => {
  const schedule = await scheduleApplicationService.createSchedule(dto);
  
  // 检查冲突
  if (schedule.hasConflict) {
    showConflictWarning(schedule.conflictingSchedules);
  }
  
  // 更新 Store
  addSchedule(schedule);
  return schedule;
};
```

## 查询日程

### 按时间范围查询

```typescript
scheduleApplicationService.getSchedulesByTimeRange({
  startTime: number,  // 范围开始
  endTime: number,    // 范围结束
}): Promise<ScheduleClientDTO[]>
```

### 使用场景

| 视图 | 时间范围 | 说明 |
|------|----------|------|
| 日视图 | 当天 00:00 - 23:59 | 显示当天日程 |
| 周视图 | 周一 00:00 - 周日 23:59 | 显示本周日程 |
| 月视图 | 月初 - 月末 | 显示本月日程 |

### 代码示例

```typescript
// 获取本周日程
const fetchWeekSchedules = async (weekStart: Date) => {
  const startTime = weekStart.getTime();
  const endTime = addDays(weekStart, 7).getTime();
  
  const schedules = await scheduleApplicationService.getSchedulesByTimeRange({
    startTime,
    endTime,
  });
  
  setSchedules(schedules);
};
```

### 单个查询

```typescript
scheduleApplicationService.getSchedule(uuid: string): Promise<ScheduleClientDTO>
```

### 按账户查询

```typescript
scheduleApplicationService.getSchedulesByAccount(): Promise<ScheduleClientDTO[]>
```

## 更新日程

### API

```typescript
scheduleApplicationService.updateSchedule(
  uuid: string,
  data: UpdateScheduleRequest
): Promise<ScheduleClientDTO>
```

### 请求参数

```typescript
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

### 业务规则

1. **部分更新** - 只更新提供的字段
2. **时间验证** - 如果更新时间，需重新验证
3. **冲突重算** - 时间变更时重新检测冲突

### 代码示例

```typescript
// 修改日程时间
const reschedule = async (uuid: string, newStart: number, newEnd: number) => {
  const updated = await scheduleApplicationService.updateSchedule(uuid, {
    startTime: newStart,
    endTime: newEnd,
  });
  
  updateSchedule(uuid, updated);
  
  if (updated.hasConflict) {
    showConflictWarning(updated.conflictingSchedules);
  }
};
```

## 删除日程

### API

```typescript
scheduleApplicationService.deleteSchedule(uuid: string): Promise<void>
```

### 业务规则

1. **软删除** - 保留历史记录
2. **关联处理** - 更新相关统计

### 代码示例

```typescript
const deleteSchedule = async (uuid: string) => {
  await scheduleApplicationService.deleteSchedule(uuid);
  removeSchedule(uuid);
};
```

## Store 管理

### 状态结构

```typescript
interface ScheduleState {
  schedules: ScheduleClientDTO[];
  schedulesById: Record<string, ScheduleClientDTO>;
  isLoading: boolean;
  error: string | null;
  selectedScheduleId: string | null;
  viewDate: Date;
  viewMode: 'day' | 'week' | 'month';
}
```

### Selectors

```typescript
// 获取指定日期的日程
getSchedulesForDate(date: Date): ScheduleClientDTO[]

// 获取指定周的日程
getSchedulesForWeek(weekStart: Date): ScheduleClientDTO[]

// 按 UUID 获取
getScheduleById(uuid: string): ScheduleClientDTO | undefined
```

## Desktop 组件

| 组件 | 路径 | 说明 |
|------|------|------|
| ScheduleView | `views/ScheduleView.tsx` | 主视图 |
| ScheduleWeekView | `views/ScheduleWeekView.tsx` | 周视图 |
| ScheduleCalendarView | `components/ScheduleCalendarView.tsx` | 日历组件 |
| ScheduleCreateDialog | `components/ScheduleCreateDialog.tsx` | 创建对话框 |
| ScheduleEditDialog | `components/ScheduleEditDialog.tsx` | 编辑对话框 |
| ScheduleEventList | `components/ScheduleEventList.tsx` | 事件列表 |

## 相关链接

- [[../aggregates/Schedule|日程事件 Schedule]] - 实体定义
- [[Conflict-Detection|冲突检测]] - 冲突检测流程
- [[../value-objects/ConflictDetectionResult|ConflictDetectionResult]] - 冲突结果

## 代码位置

| 文件 | 路径 |
|------|------|
| ApplicationService | `packages/application-client/src/schedule/services/ScheduleEventApplicationService.ts` |
| Desktop Store | `apps/desktop/src/renderer/modules/schedule/presentation/stores/scheduleStore.ts` |
| Desktop Hook | `apps/desktop/src/renderer/modules/schedule/presentation/hooks/useSchedule.ts` |
