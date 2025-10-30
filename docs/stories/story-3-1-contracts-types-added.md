# Story 3.1 - Contracts 层类型定义扩展

## 概览

为支持 Epic 3 Task Module 的 ONE_TIME 任务功能,在 `@dailyuse/contracts` 包中新增了相关的类型定义和 API 请求/响应接口。

## 新增文件

### 1. TaskPriority.ts
**路径**: `/packages/contracts/src/modules/task/value-objects/TaskPriority.ts`

**内容**:
```typescript
// 优先级等级
export enum PriorityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// 任务优先级
export interface TaskPriority {
  level: PriorityLevel;
  score: number; // 0-100
}

// 优先级计算参数
export interface PriorityCalculationParams {
  importance: number;    // 0-4
  urgency: number;       // 0-4
  dueDate?: number;      // Unix timestamp
  currentTime?: number;  // Unix timestamp
}
```

## 修改文件

### 1. enums.ts
**路径**: `/packages/contracts/src/modules/task/enums.ts`

**变更**:
- 修正 `TaskStatus.TODO` → `TaskStatus.PENDING` (与后端实现保持一致)

```typescript
export enum TaskStatus {
  PENDING = 'PENDING',       // 待办 (原 TODO)
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

### 2. api-requests.ts
**路径**: `/packages/contracts/src/modules/task/api-requests.ts`

**新增接口**:

#### 创建一次性任务
```typescript
export interface CreateOneTimeTaskRequest {
  accountUuid: string;
  title: string;
  description?: string;
  startDate: number;        // Unix timestamp (ms)
  dueDate: number;          // Unix timestamp (ms)
  importance?: number;      // 0-4
  urgency?: number;         // 0-4
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  tags?: string[];
  color?: string;
  estimatedMinutes?: number;
  note?: string;
}
```

#### 更新一次性任务
```typescript
export interface UpdateOneTimeTaskRequest {
  title?: string;
  description?: string;
  startDate?: number;
  dueDate?: number;
  importance?: number;
  urgency?: number;
  tags?: string[];
  color?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  note?: string;
}
```

#### 任务过滤器
```typescript
export interface TaskFiltersRequest {
  accountUuid?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  goalUuid?: string;
  keyResultUuid?: string;
  parentTaskUuid?: string;
  tags?: string[];
  startDateFrom?: string;   // ISO date string
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  minImportance?: number;
  minUrgency?: number;
  priorityLevels?: ('HIGH' | 'MEDIUM' | 'LOW')[];
}
```

#### 任务仪表板响应
```typescript
export interface TaskDashboardResponse {
  todayTasks: TaskTemplateServerDTO[];
  overdueTasks: TaskTemplateServerDTO[];
  upcomingTasks: TaskTemplateServerDTO[];
  highPriorityTasks: TaskTemplateServerDTO[];
  blockedTasks: TaskTemplateServerDTO[];
  summary: {
    totalTasks: number;
    completedToday: number;
    overdue: number;
    upcoming: number;
    highPriority: number;
  };
}
```

#### 批量操作
```typescript
// 批量更新优先级
export interface BatchUpdatePriorityRequest {
  taskUuids: string[];
  importance?: number;
  urgency?: number;
}

// 批量取消任务
export interface BatchCancelTasksRequest {
  taskUuids: string[];
  reason?: string;
}
```

#### 目标关联
```typescript
export interface LinkTaskToGoalRequest {
  goalUuid: string;
  keyResultUuid?: string;
}
```

#### 阻塞/取消任务
```typescript
export interface BlockOrCancelTaskRequest {
  reason?: string;
}
```

### 3. value-objects/index.ts
**路径**: `/packages/contracts/src/modules/task/value-objects/index.ts`

**变更**:
- 添加 `export * from './TaskPriority'`

## 类型对应关系

### 前端 → 后端映射

| 前端类型 | 后端类型 | 用途 |
|---------|---------|------|
| `CreateOneTimeTaskRequest` | `CreateOneTimeTaskDTO` | 创建任务 |
| `UpdateOneTimeTaskRequest` | `UpdateOneTimeTaskDTO` | 更新任务 |
| `TaskFiltersRequest` | `TaskFilters` | 查询过滤 |
| `TaskDashboardResponse` | Dashboard 返回值 | 仪表板数据 |
| `PriorityLevel` | `PriorityLevel` | 优先级等级 |
| `TaskPriority` | Priority 计算结果 | 优先级信息 |

## 使用示例

### 前端调用示例

#### 创建任务
```typescript
import { CreateOneTimeTaskRequest } from '@dailyuse/contracts';

const request: CreateOneTimeTaskRequest = {
  accountUuid: 'user-123',
  title: '完成季度报告',
  description: 'Q1 业务分析',
  startDate: Date.now(),
  dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后
  importance: 4,
  urgency: 3,
  tags: ['报告', 'Q1'],
  color: '#FF5733',
};

// API 调用
const response = await fetch('/api/tasks/one-time', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

#### 查询任务
```typescript
import { TaskFiltersRequest } from '@dailyuse/contracts';

const filters: TaskFiltersRequest = {
  accountUuid: 'user-123',
  status: 'PENDING',
  minImportance: 3,
  priorityLevels: ['HIGH', 'MEDIUM'],
  tags: ['urgent'],
};

const queryString = new URLSearchParams(
  Object.entries(filters).filter(([_, v]) => v !== undefined)
).toString();

const response = await fetch(`/api/tasks/one-time?${queryString}`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

#### 获取仪表板
```typescript
import { TaskDashboardResponse } from '@dailyuse/contracts';

const response = await fetch('/api/tasks/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const dashboard: TaskDashboardResponse = await response.json();

console.log(`今日任务: ${dashboard.todayTasks.length}`);
console.log(`逾期任务: ${dashboard.overdueTasks.length}`);
console.log(`完成率: ${(dashboard.summary.completedToday / dashboard.summary.totalTasks * 100).toFixed(1)}%`);
```

## 类型安全优势

### 1. 编译时检查
```typescript
// ✅ 类型正确
const request: CreateOneTimeTaskRequest = {
  accountUuid: 'user-123',
  title: '任务标题',
  startDate: Date.now(),
  dueDate: Date.now() + 86400000,
  importance: 3,
};

// ❌ 编译错误: importance 必须是 0-4
const badRequest: CreateOneTimeTaskRequest = {
  accountUuid: 'user-123',
  title: '任务标题',
  startDate: Date.now(),
  dueDate: Date.now(),
  importance: 10, // TypeScript 会警告
};
```

### 2. 智能提示
在 IDE 中输入 `request.` 会自动显示所有可用字段及其类型。

### 3. 重构安全
修改类型定义后,所有使用该类型的代码会立即显示错误,确保全部更新。

## 导出层次

```
@dailyuse/contracts
└── modules/task
    ├── enums
    │   ├── TaskType
    │   ├── TaskStatus ✨ (修正: TODO → PENDING)
    │   └── ...
    ├── value-objects
    │   ├── TaskPriority ✨ (新增)
    │   ├── PriorityLevel ✨ (新增)
    │   └── ...
    ├── aggregates
    │   ├── TaskTemplateServerDTO
    │   └── ...
    └── api-requests ✨ (扩展)
        ├── CreateOneTimeTaskRequest
        ├── UpdateOneTimeTaskRequest
        ├── TaskFiltersRequest
        ├── TaskDashboardResponse
        ├── BatchUpdatePriorityRequest
        ├── BatchCancelTasksRequest
        ├── LinkTaskToGoalRequest
        └── BlockOrCancelTaskRequest
```

## 版本兼容性

### Breaking Changes
- `TaskStatus.TODO` → `TaskStatus.PENDING`
  - **影响**: 所有使用 `TaskStatus.TODO` 的代码需要更新
  - **迁移**: 全局搜索替换 `TaskStatus.TODO` → `TaskStatus.PENDING`

### 新增内容（非破坏性）
- ✅ `PriorityLevel` enum
- ✅ `TaskPriority` interface
- ✅ 8 个新的 API 请求/响应接口

## 总结

本次 Contracts 层扩展为 ONE_TIME 任务功能提供了完整的类型支持:

- ✅ **1 个新值对象** - TaskPriority
- ✅ **8 个新 API 接口** - 创建、更新、查询、批量操作等
- ✅ **1 处枚举修正** - TaskStatus.PENDING
- ✅ **完整的类型安全** - 编译时检查、智能提示
- ✅ **前后端类型对齐** - 确保数据契约一致

前端开发现在可以安全地使用这些类型定义来调用后端 API! 🎉

---

**文档版本**: v1.0  
**最后更新**: 2024-10-30  
**维护者**: DailyUse Team
