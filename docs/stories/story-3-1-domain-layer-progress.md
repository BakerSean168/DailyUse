# Story 3-1 Domain Layer 实现进度

**日期**: 2025-10-30  
**状态**: 进行中 🚧  

---

## ✅ 已完成

### 1. TaskTemplate 聚合根扩展

**文件**: `packages/domain-server/src/task/aggregates/TaskTemplate.ts`

**完成的工作**:
- ✅ 添加一次性任务私有字段：
  - `_startDate`, `_dueDate`, `_completedAt`
  - `_estimatedMinutes`, `_actualMinutes`
  - `_note`
  
- ✅ 添加通用字段：
  - `_goalUuid`, `_keyResultUuid` (Goal/KR 关联)
  - `_parentTaskUuid` (子任务支持)
  - `_dependencyStatus`, `_isBlocked`, `_blockingReason` (依赖关系)

- ✅ 更新 `TaskTemplateProps` 接口

- ✅ 更新构造函数以初始化新字段

- ✅ 添加新字段的 Getter 方法

---

## 🚧 待完成

### 2. 添加一次性任务业务方法

需要添加的方法：

```typescript
// === 一次性任务状态管理 ===
public startTask(): void // TODO → IN_PROGRESS
public completeTask(actualMinutes?: number, note?: string): void // → COMPLETED
public blockTask(reason: string): void // → BLOCKED
public unblockTask(): void // BLOCKED → TODO
public cancelTask(reason: string): void // → CANCELLED

// === 时间管理 ===
public updateDueDate(newDueDate: number): void
public updateEstimatedTime(minutes: number): void
public isOverdue(): boolean
public getDaysUntilDue(): number | null

// === 子任务管理 ===
public addSubtask(subtask: TaskTemplate): void
public removeSubtask(subtaskUuid: string): void
public getSubtasks(): TaskTemplate[]
public isSubtask(): boolean

// === 优先级计算 ===
public getPriority(): PriorityCalculationResult
public getPriorityScore(): number
public getPriorityLevel(): 'HIGH' | 'MEDIUM' | 'LOW'

// === Goal/KR 关联 ===
public linkToGoal(goalUuid: string, keyResultUuid?: string): void
public unlinkFromGoal(): void
public isLinkedToGoal(): boolean

// === 依赖关系 ===
public markAsBlocked(reason: string): void
public markAsReady(): void
public updateDependencyStatus(status: string): void
```

### 3. 更新现有方法

需要更新的方法：

```typescript
// 工厂方法
public static create() // 支持创建一次性任务

public static createOneTimeTask(params: {
  accountUuid: string;
  title: string;
  description?: string;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  startDate?: number;
  dueDate?: number;
  estimatedMinutes?: number;
  tags?: string[];
  color?: string;
  note?: string;
}): TaskTemplate

public static createRecurringTask() // 保持现有的创建循环任务逻辑

// DTO 转换
public toServerDTO() // 添加新字段
public toClientDTO() // 添加新字段和计算属性
public toPersistenceDTO() // 添加新字段

public static fromServerDTO() // 支持恢复一次性任务
public static fromPersistenceDTO() // 支持从数据库恢复
```

### 4. 集成优先级计算工具

```typescript
import { calculatePriority, type PriorityCalculationResult } from '@dailyuse/utils';

public getPriority(): PriorityCalculationResult {
  return calculatePriority({
    importance: this._importance,
    urgency: this._urgency,
    dueDate: this._dueDate,
  });
}
```

---

## 📝 实现策略

### 一次性任务 vs 循环任务

**ONE_TIME 任务流程**:
```
创建 → TODO → IN_PROGRESS → COMPLETED
                 ↓
              BLOCKED ← → TODO
                 ↓
              CANCELLED
```

**RECURRING 任务流程**:
```
创建 → ACTIVE → 生成 TaskInstance
       ↓
    PAUSED → 停止生成
       ↓
    ARCHIVED
```

### 字段使用规则

| taskType | 使用的字段 | 忽略的字段 |
|----------|-----------|-----------|
| ONE_TIME | startDate, dueDate, completedAt, estimatedMinutes, actualMinutes, note, goalUuid, keyResultUuid, parentTaskUuid | recurrenceRule, instances, timeConfig, reminderConfig, goalBinding |
| RECURRING | recurrenceRule, timeConfig, reminderConfig, goalBinding, lastGeneratedDate, generateAheadDays | startDate, dueDate, completedAt, estimatedMinutes, actualMinutes, note |

---

## 🎯 下一步行动

1. **添加一次性任务业务方法** (优先)
2. **更新工厂方法** (`create`, `createOneTimeTask`, `createRecurringTask`)
3. **更新 DTO 转换方法** (`toServerDTO`, `toClientDTO`, `toPersistenceDTO`)
4. **集成优先级计算**
5. **添加单元测试**

---

## 📊 完成度

- [x] 字段定义 (100%)
- [x] 构造函数 (100%)
- [x] Getter 方法 (100%)
- [ ] 业务方法 (0%)
- [ ] 工厂方法 (0%)
- [ ] DTO 转换 (0%)
- [ ] 单元测试 (0%)

**总体进度**: 30%

---

## 🔗 相关文件

- Contracts: `packages/contracts/src/modules/task/aggregates/TaskTemplateServer.ts`
- Domain: `packages/domain-server/src/task/aggregates/TaskTemplate.ts`
- Utils: `packages/utils/src/priority-calculator.ts`
- Story: `docs/stories/story-3-1-task-crud-refactored.md`
