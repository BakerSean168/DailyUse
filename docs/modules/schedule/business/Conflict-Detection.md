---
tags:
  - business-flow
  - conflict-detection
  - calendar
description: 冲突检测业务流程 - 日程时间冲突检测和解决
created: 2025-01-01
updated: 2025-01-01
---

# 冲突检测

> ⚠️ 日程时间冲突的检测与解决

## 概述

冲突检测是日程管理的核心功能，确保用户不会在同一时间安排多个事项。本文档描述冲突检测的完整流程。

## 检测流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      冲突检测流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                                              │
│   │ 用户创建/   │                                              │
│   │ 更新日程    │                                              │
│   └──────┬──────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────────┐                  │
│   │           获取时间范围内日程             │                  │
│   │  getSchedulesByTimeRange(start, end)    │                  │
│   └─────────────────────┬───────────────────┘                  │
│                         │                                       │
│                         ▼                                       │
│   ┌─────────────────────────────────────────┐                  │
│   │           检测时间重叠                   │                  │
│   │  for each schedule:                     │                  │
│   │    if overlap(new, existing) → conflict │                  │
│   └─────────────────────┬───────────────────┘                  │
│                         │                                       │
│           ┌─────────────┴─────────────┐                        │
│           ▼                           ▼                        │
│   ┌───────────────┐           ┌───────────────┐                │
│   │   无冲突      │           │   有冲突      │                │
│   │   → 保存      │           │   → 分析严重度│                │
│   └───────────────┘           └───────┬───────┘                │
│                                       │                        │
│                                       ▼                        │
│                               ┌───────────────┐                │
│                               │  生成建议     │                │
│                               │  - 改时间     │                │
│                               │  - 缩短时长   │                │
│                               │  - 取消       │                │
│                               └───────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 冲突检测 API

### detectConflicts

```typescript
scheduleConflictApplicationService.detectConflicts(params: DetectConflictsParams): Promise<ConflictDetectionResult>
```

### 参数

```typescript
interface DetectConflictsParams {
  userId: string;
  startTime: number;     // 检查范围开始
  endTime: number;       // 检查范围结束
  excludeUuid?: string;  // 排除的日程 UUID（更新时使用）
}
```

### 返回值

详见 [[../value-objects/ConflictDetectionResult|ConflictDetectionResult]]

```typescript
interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
  suggestions: ConflictSuggestion[];
}
```

## 重叠检测算法

### 基本原理

两个时间段 A 和 B 重叠的条件：

```
A.start < B.end AND A.end > B.start
```

### 代码实现

```typescript
function hasOverlap(a: Schedule, b: Schedule): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

function calculateOverlap(a: Schedule, b: Schedule): {
  start: number;
  end: number;
  duration: number;
} {
  const overlapStart = Math.max(a.startTime, b.startTime);
  const overlapEnd = Math.min(a.endTime, b.endTime);
  const duration = (overlapEnd - overlapStart) / 60000;  // 分钟
  
  return { start: overlapStart, end: overlapEnd, duration };
}
```

### 可视化示例

```
场景 1: 部分重叠
A:  |─────────|
B:       |─────────|
重叠:    |───|

场景 2: 完全包含
A:  |─────────────────|
B:       |─────|
重叠:    |─────|

场景 3: 无重叠
A:  |─────|
B:            |─────|
重叠: 无
```

## 严重程度判定

详见 [[../enums/Enums#ConflictSeverity|ConflictSeverity]]

```typescript
function getSeverity(overlap: OverlapInfo, a: Schedule, b: Schedule): ConflictSeverity {
  // 完全包含 → 严重
  if (a.startTime <= b.startTime && a.endTime >= b.endTime) {
    return ConflictSeverity.SEVERE;
  }
  if (b.startTime <= a.startTime && b.endTime >= a.endTime) {
    return ConflictSeverity.SEVERE;
  }
  
  // 按重叠时长判定
  if (overlap.duration > 60) {
    return ConflictSeverity.SEVERE;     // > 1 小时
  }
  if (overlap.duration >= 15) {
    return ConflictSeverity.MODERATE;   // 15-60 分钟
  }
  return ConflictSeverity.MINOR;        // < 15 分钟
}
```

## 解决建议生成

### 建议类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `reschedule` | 改期 | 有可用时间段 |
| `shorten` | 缩短时长 | 时间弹性 |
| `cancel` | 取消 | 优先级较低 |

### 建议生成逻辑

```typescript
function generateSuggestions(
  newSchedule: Schedule,
  conflicts: ConflictDetail[]
): ConflictSuggestion[] {
  const suggestions: ConflictSuggestion[] = [];
  
  // 1. 尝试找到空闲时间段
  const freeSlots = findFreeSlots(conflicts, newSchedule.duration);
  if (freeSlots.length > 0) {
    suggestions.push({
      type: 'reschedule',
      description: `建议改期到 ${formatTime(freeSlots[0].start)}`,
      suggestedStartTime: freeSlots[0].start,
      suggestedEndTime: freeSlots[0].end,
    });
  }
  
  // 2. 尝试缩短时长
  const minDuration = 30;  // 最小 30 分钟
  if (newSchedule.duration > minDuration) {
    const shortenedEnd = newSchedule.startTime + minDuration * 60000;
    if (!hasConflict(newSchedule.startTime, shortenedEnd, conflicts)) {
      suggestions.push({
        type: 'shorten',
        description: `缩短到 ${minDuration} 分钟`,
        suggestedEndTime: shortenedEnd,
      });
    }
  }
  
  // 3. 取消建议（总是可用）
  suggestions.push({
    type: 'cancel',
    description: '取消本次安排',
  });
  
  return suggestions;
}
```

## 应用解决方案

### resolveConflict API

```typescript
scheduleConflictApplicationService.resolveConflict(
  scheduleUuid: string,
  request: ResolveConflictRequest
): Promise<ResolveConflictResult>
```

### 请求参数

```typescript
interface ResolveConflictRequest {
  strategy: 'reschedule' | 'shorten' | 'cancel' | 'force';
  newStartTime?: number;
  newEndTime?: number;
}
```

### 返回结果

```typescript
interface ResolveConflictResult {
  schedule: ScheduleClientDTO;
  conflicts: ConflictDetectionResult;  // 更新后的冲突状态
  applied: {
    strategy: string;
    previousStartTime?: number;
    previousEndTime?: number;
    changes: string[];
  };
}
```

## UI 集成

### 冲突警告组件

```typescript
// ConflictAlert.tsx
const ConflictAlert: FC<{ conflicts: ConflictDetectionResult }> = ({ conflicts }) => {
  if (!conflicts.hasConflict) return null;
  
  return (
    <Alert severity="warning">
      <AlertTitle>时间冲突</AlertTitle>
      {conflicts.conflicts.map(conflict => (
        <ConflictItem key={conflict.scheduleUuid} conflict={conflict} />
      ))}
      <SuggestionList suggestions={conflicts.suggestions} />
    </Alert>
  );
};
```

### 创建日程时检测

```typescript
const handleCreate = async (data: CreateScheduleRequest) => {
  // 先检测冲突
  const conflicts = await detectConflicts({
    userId: currentUser.uuid,
    startTime: data.startTime,
    endTime: data.endTime,
  });
  
  if (conflicts.hasConflict) {
    // 显示冲突对话框
    const action = await showConflictDialog(conflicts);
    
    if (action === 'cancel') return;
    if (action === 'apply-suggestion') {
      // 应用建议
      data.startTime = conflicts.suggestions[0].suggestedStartTime!;
      data.endTime = conflicts.suggestions[0].suggestedEndTime!;
    }
    // action === 'force' 继续创建
  }
  
  // 创建日程
  const schedule = await createSchedule(data);
};
```

## 相关链接

- [[../aggregates/Schedule|日程事件 Schedule]] - 冲突检测的目标
- [[../value-objects/ConflictDetectionResult|ConflictDetectionResult]] - 检测结果
- [[../enums/Enums#ConflictSeverity|ConflictSeverity]] - 严重程度枚举
- [[ScheduleEvent-Management|日程事件管理]] - 完整CRUD流程

## 代码位置

| 文件 | 路径 |
|------|------|
| ApplicationService | `packages/application-client/src/schedule/services/ScheduleConflictApplicationService.ts` |
| Component | `apps/desktop/src/renderer/modules/schedule/presentation/components/ConflictAlert.tsx` |
