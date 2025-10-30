# Story 3-1: Task CRUD Basics - 重构版本

**Epic**: Epic 3 - Task Module  
**状态**: 架构重构完成 ✅  
**重构日期**: 2025-10-30  

---

## 🔄 重大架构调整

### 原计划 vs 重构后

| 维度 | 原计划 | 重构后 |
|------|--------|--------|
| **模型设计** | Task (独立) + TaskTemplate (循环) | **统一的 TaskTemplate**（通过 taskType 区分） |
| **任务类型** | 两个独立模型 | 一个模型，支持 ONE_TIME 和 RECURRING |
| **代码复用** | 大量重复代码 | 高度复用，统一接口 |
| **功能支持** | 需要两套实现 | 一套实现支持所有功能 |

---

## ✅ 完成的工作

### 1. **Prisma Schema 更新**

**位置**: `apps/api/prisma/schema.prisma`

**变更**:
- ✅ 删除独立的 `task` 模型
- ✅ 扩展 `taskTemplate` 模型：
  - 添加 `taskType` 字段 ('ONE_TIME' | 'RECURRING')
  - 添加 `importance` 和 `urgency` (Int 类型，0-4)
  - 添加 Goal/KR 关联字段：`goalUuid`, `keyResultUuid`
  - 添加子任务支持：`parentTaskUuid`
  - 添加一次性任务字段：
    - `startDate`, `dueDate`, `completedAt` (BigInt)
    - `estimatedMinutes`, `actualMinutes`
    - `note`
  - 添加依赖关系状态：`dependencyStatus`, `isBlocked`, `blockingReason`
  - 添加子任务关系：`parentTask`, `subtasks`
  - 添加 Goal/KR 关系：`goal`, `keyResult`

**关键改进**:
```prisma
model taskTemplate {
  // ... 现有字段
  
  taskType String @map("task_type") // 'ONE_TIME' | 'RECURRING'
  
  // 通用字段
  importance Int
  urgency Int
  goalUuid String?
  keyResultUuid String?
  parentTaskUuid String?
  
  // 一次性任务专用
  startDate BigInt?
  dueDate BigInt?
  completedAt BigInt?
  estimatedMinutes Int?
  actualMinutes Int?
  note String?
  
  // 关系
  goal goal?
  keyResult keyResult?
  parentTask taskTemplate? @relation("TaskSubtasks")
  subtasks taskTemplate[] @relation("TaskSubtasks")
}
```

### 2. **Contracts 更新**

**位置**: `packages/contracts/src/modules/task/`

**变更**:
- ✅ 更新 `TaskTemplateServerDTO` 接口
- ✅ 更新 `TaskTemplatePersistenceDTO` 接口
- ✅ 添加一次性任务相关字段
- ✅ 添加 Goal/KR 关联字段
- ✅ 添加子任务字段
- ✅ 添加依赖关系字段

**分类说明**:
```typescript
// 循环任务专用
timeConfig?: TaskTimeConfigServerDTO | null;
recurrenceRule?: RecurrenceRuleServerDTO | null;
lastGeneratedDate?: number | null;
generateAheadDays?: number | null;

// 一次性任务专用
startDate?: number | null;
dueDate?: number | null;
completedAt?: number | null;
estimatedMinutes?: number | null;
actualMinutes?: number | null;
note?: string | null;

// 通用属性（适用于所有任务）
importance: ImportanceLevel;
urgency: UrgencyLevel;
goalUuid?: string | null;
keyResultUuid?: string | null;
parentTaskUuid?: string | null;
dependencyStatus?: string;
isBlocked?: boolean;
```

### 3. **优先级计算工具**

**位置**: `packages/utils/src/priority-calculator.ts`

**功能**: 通用优先级计算，基于 ImportanceLevel + UrgencyLevel + 时间因素

**用途**: Goal 和 Task 共用

```typescript
calculatePriority({
  importance: 'important',
  urgency: 'high',
  dueDate: Date.now() + 86400000, // 明天
});
// 返回: { level: 'HIGH', score: 86, ... }
```

### 4. **枚举定义**

**位置**: `packages/contracts/src/modules/task/enums.ts`

**新增**:
```typescript
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

---

## 🎯 架构优势

### 1. **单一模型，双重用途**
```
TaskTemplate {
  taskType: 'ONE_TIME' | 'RECURRING'
}

ONE_TIME 任务:
- 使用 startDate, dueDate, completedAt
- 不生成 TaskInstance
- 直接完成

RECURRING 任务:
- 使用 recurrenceRule
- 生成 TaskInstance
- 持续执行
```

### 2. **统一功能**
| 功能 | ONE_TIME | RECURRING |
|------|----------|-----------|
| Goal/KR 关联 | ✅ | ✅ |
| 子任务 | ✅ | ✅ |
| 依赖关系 | ✅ | ✅ |
| 优先级计算 | ✅ | ✅ |
| 标签 | ✅ | ✅ |

### 3. **代码复用**
- 一套 Domain 层实现
- 一套 Repository 实现
- 一套 Application Service
- 一套 HTTP Controller

---

## 📊 数据模型关系

```
┌──────────────────────────────────────────────────────┐
│                  TaskTemplate                        │
│  (统一的任务模型)                                      │
├──────────────────────────────────────────────────────┤
│  taskType: 'ONE_TIME' | 'RECURRING'                  │
│                                                      │
│  === 通用属性 ===                                     │
│  - importance, urgency                               │
│  - goalUuid, keyResultUuid                          │
│  - parentTaskUuid (子任务支持)                        │
│  - dependencyStatus (依赖关系)                       │
│                                                      │
│  === ONE_TIME 专用 ===                               │
│  - startDate, dueDate, completedAt                  │
│  - estimatedMinutes, actualMinutes                  │
│  - note                                              │
│                                                      │
│  === RECURRING 专用 ===                              │
│  - recurrenceRule                                    │
│  - lastGeneratedDate                                 │
│  - generateAheadDays                                 │
│  - instances: TaskInstance[]                        │
└──────────────────────────────────────────────────────┘
           │                    │
           │                    └─────> TaskInstance
           │                            (循环任务的实例)
           │
           ├─────> Goal (可选)
           ├─────> KeyResult (可选)
           ├─────> ParentTask (子任务)
           └─────> TaskDependency (依赖)
```

---

## 🚀 下一步计划

### Phase 1: Domain Layer (下一步)
- [ ] 更新 `TaskTemplate` domain-server 实现
- [ ] 添加一次性任务相关方法
- [ ] 添加子任务管理方法
- [ ] 集成 `calculatePriority` 工具

### Phase 2: Repository Layer
- [ ] 更新 `ITaskTemplateRepository` 接口
- [ ] 更新 `PrismaTaskTemplateRepository` 实现
- [ ] 添加子任务查询方法
- [ ] 添加依赖关系查询方法

### Phase 3: Application Layer
- [ ] 更新 `TaskApplicationService`
- [ ] 添加一次性任务 CRUD 方法
- [ ] 添加子任务管理方法
- [ ] 添加依赖关系管理方法

### Phase 4: HTTP Layer
- [ ] 更新 `TaskController`
- [ ] 添加一次性任务路由
- [ ] 添加子任务路由

### Phase 5: Frontend
- [ ] 更新 API Client
- [ ] 更新 Composable
- [ ] 创建一次性任务组件
- [ ] 创建子任务组件

---

## 📝 注意事项

### 1. **数据迁移**
现有的 `taskTemplate` 记录需要：
- 设置 `taskType = 'RECURRING'`
- 保持现有字段不变
- 新字段默认为 NULL

### 2. **字段使用规则**
| taskType | 必填字段 | 可选字段 | 忽略字段 |
|----------|----------|----------|----------|
| ONE_TIME | title, importance, urgency | startDate, dueDate, goalUuid, parentTaskUuid | recurrenceRule, instances |
| RECURRING | title, importance, urgency, recurrenceRule | goalBinding, reminderConfig | startDate, dueDate, completedAt |

### 3. **状态管理**
- **ONE_TIME**: 使用 `TaskStatus` (TODO, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED)
- **RECURRING**: 使用 `TaskTemplateStatus` (ACTIVE, PAUSED, ARCHIVED, DELETED)
- TaskInstance 使用 `TaskInstanceStatus` (PENDING, IN_PROGRESS, COMPLETED, SKIPPED, EXPIRED)

---

## ✨ 总结

这次重构将 Task 和 TaskTemplate 统一为一个模型，大大简化了架构：
- ✅ **减少代码重复**
- ✅ **统一功能接口**
- ✅ **更灵活的扩展性**
- ✅ **更清晰的领域模型**

通过 `taskType` 字段区分一次性任务和循环任务，保持了模型的简洁性和灵活性。
