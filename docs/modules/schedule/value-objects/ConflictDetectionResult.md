---
tags:
  - value-object
  - conflict-detection
  - calendar
description: 冲突检测结果 - 日程时间冲突分析
created: 2025-01-01
updated: 2025-01-01
---

# ConflictDetectionResult (冲突检测结果)

> ⚠️ 日程时间冲突检测和解决建议

## 概述

`ConflictDetectionResult` 封装了日程冲突检测的结果，包括冲突详情和解决建议。

## 类型定义

```typescript
/**
 * 冲突检测结果
 */
export interface ConflictDetectionResult {
  readonly hasConflict: boolean;                  // 是否有冲突
  readonly conflicts: readonly ConflictDetail[];  // 冲突详情列表
  readonly suggestions: readonly ConflictSuggestion[];  // 解决建议
}

/**
 * 单个冲突详情
 */
export interface ConflictDetail {
  readonly scheduleUuid: string;      // 冲突日程 UUID
  readonly scheduleTitle: string;     // 冲突日程标题
  readonly overlapStart: number;      // 重叠开始时间 (ms)
  readonly overlapEnd: number;        // 重叠结束时间 (ms)
  readonly overlapDuration: number;   // 重叠时长 (分钟)
  readonly severity: ConflictSeverity; // 冲突严重程度
}

/**
 * 解决建议
 */
export interface ConflictSuggestion {
  readonly type: 'reschedule' | 'shorten' | 'cancel';
  readonly description: string;
  readonly suggestedStartTime?: number;
  readonly suggestedEndTime?: number;
}
```

## 冲突严重程度

详见 [[../enums/Enums#ConflictSeverity|ConflictSeverity]]

| 级别 | 值 | 条件 | 颜色 |
|------|------|------|------|
| 轻微 | `minor` | 重叠 < 15 分钟 | 🟡 |
| 中度 | `moderate` | 重叠 15-60 分钟 | 🟠 |
| 严重 | `severe` | 重叠 > 60 分钟或完全重叠 | 🔴 |

## 使用场景

### 创建日程时检测

```typescript
const conflicts = await detectConflicts({
  userId: currentUser.uuid,
  startTime: newSchedule.startTime,
  endTime: newSchedule.endTime,
});

if (conflicts.hasConflict) {
  // 显示冲突警告
  showConflictWarning(conflicts);
}
```

### 更新日程时检测

```typescript
const conflicts = await detectConflicts({
  userId: currentUser.uuid,
  startTime: updatedStartTime,
  endTime: updatedEndTime,
  excludeUuid: currentSchedule.uuid,  // 排除当前日程
});
```

### 处理冲突建议

```typescript
if (conflicts.suggestions.length > 0) {
  const suggestion = conflicts.suggestions[0];
  
  if (suggestion.type === 'reschedule') {
    // 提供建议的新时间
    confirmReschedule(suggestion.suggestedStartTime, suggestion.suggestedEndTime);
  }
}
```

## 冲突计算

### 重叠检测算法

```typescript
function hasOverlap(a: Schedule, b: Schedule): boolean {
  // A 和 B 重叠的条件：A 的开始 < B 的结束 且 A 的结束 > B 的开始
  return a.startTime < b.endTime && a.endTime > b.startTime;
}
```

### 重叠时长计算

```typescript
function calculateOverlap(a: Schedule, b: Schedule): number {
  const overlapStart = Math.max(a.startTime, b.startTime);
  const overlapEnd = Math.min(a.endTime, b.endTime);
  return (overlapEnd - overlapStart) / 60000;  // 转换为分钟
}
```

### 严重程度判断

```typescript
function getSeverity(overlapMinutes: number, a: Schedule, b: Schedule): ConflictSeverity {
  // 完全重叠
  if (a.startTime <= b.startTime && a.endTime >= b.endTime) {
    return ConflictSeverity.SEVERE;
  }
  if (b.startTime <= a.startTime && b.endTime >= a.endTime) {
    return ConflictSeverity.SEVERE;
  }
  
  // 按重叠时长判断
  if (overlapMinutes > 60) return ConflictSeverity.SEVERE;
  if (overlapMinutes >= 15) return ConflictSeverity.MODERATE;
  return ConflictSeverity.MINOR;
}
```

## API 操作

| 方法 | 说明 |
|------|------|
| `detectConflicts(params)` | 检测时间范围内的冲突 |
| `getScheduleConflicts(uuid)` | 获取指定日程的冲突 |
| `createScheduleWithConflictDetection(request)` | 创建日程并返回冲突 |
| `resolveConflict(uuid, request)` | 应用解决策略 |

## 相关链接

- [[../aggregates/Schedule|日程事件 Schedule]] - 冲突检测的目标
- [[../business/Conflict-Detection|冲突检测]] - 完整业务流程
- [[../enums/Enums#ConflictSeverity|ConflictSeverity]] - 严重程度枚举

## 代码位置

| 文件 | 路径 |
|------|------|
| 类型定义 | `packages/contracts/src/modules/schedule/value-objects/ConflictDetectionResult.ts` |
