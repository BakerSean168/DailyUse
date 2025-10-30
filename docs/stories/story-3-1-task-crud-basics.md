# Story 3-1: Task CRUD Basics (任务基础 CRUD)

> **Story ID**: STORY-3-1  
> **Epic**: Epic 3 - Task Module  
> **优先级**: P0 (Must Have)  
> **预估工作量**: 3-5 天  
> **状态**: drafted  
> **创建时间**: 2025-10-30

---

## 📋 Story 概述

实现任务模块的核心 CRUD 功能，包括创建、查询、更新、删除任务，支持优先级、状态、标签、截止日期等基础字段管理。

## 🎯 业务价值

- 用户可以创建和管理日常待办任务
- 支持任务优先级和状态跟踪
- 提供灵活的筛选和排序功能
- 为后续高级功能（子任务、依赖）打下基础

---

## 📐 技术设计

### 1. Domain Layer (领域层)

#### 1.1 聚合根: Task

**文件位置**: `packages/domain-server/src/task/aggregates/Task.ts`

**核心字段**:
```typescript
class Task {
  uuid: string;              // UUID
  accountUuid: string;        // 所属用户
  title: string;              // 任务标题 (1-200字符)
  description?: string;       // 任务描述 (Markdown)
  status: TaskStatus;         // 状态
  priority: TaskPriority;     // 优先级
  dueDate?: Date;             // 截止日期
  completedAt?: Date;         // 完成时间
  tags: string[];             // 标签数组
  goalUuid?: string;          // 关联目标 (可选)
  krUuid?: string;            // 关联 KR (可选)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // 软删除
}

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
```

**领域方法**:
- `create()` - 创建任务
- `updateBasicInfo()` - 更新基本信息
- `changeStatus()` - 修改状态
- `complete()` - 标记完成
- `cancel()` - 取消任务
- `softDelete()` - 软删除

#### 1.2 Repository Interface

**文件位置**: `packages/domain-server/src/task/repositories/ITaskRepository.ts`

```typescript
interface ITaskRepository {
  save(task: Task): Promise<Task>;
  findByUuid(uuid: string): Promise<Task | null>;
  findByAccountUuid(accountUuid: string, filters: TaskFilters): Promise<Task[]>;
  update(task: Task): Promise<Task>;
  delete(uuid: string): Promise<void>;
  batchUpdateStatus(uuids: string[], status: TaskStatus): Promise<void>;
}

interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  dueDateRange?: { start: Date; end: Date };
  search?: string;
  sortBy?: 'priority' | 'dueDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

#### 1.3 Domain Service

**文件位置**: `packages/domain-server/src/task/services/TaskDomainService.ts`

```typescript
class TaskDomainService {
  validateTaskCreation(data: CreateTaskData): void;
  validateStatusTransition(currentStatus: TaskStatus, newStatus: TaskStatus): void;
  validateDueDate(dueDate: Date): void;
}
```

---

### 2. Application Layer (应用层)

#### 2.1 Application Service

**文件位置**: `apps/api/src/modules/task/application/services/TaskApplicationService.ts`

**核心方法**:
```typescript
class TaskApplicationService {
  async createTask(accountUuid: string, data: CreateTaskDTO): Promise<TaskDTO>;
  async getTask(uuid: string, accountUuid: string): Promise<TaskDTO>;
  async getUserTasks(accountUuid: string, filters: TaskFilters): Promise<TaskDTO[]>;
  async updateTask(uuid: string, accountUuid: string, data: UpdateTaskDTO): Promise<TaskDTO>;
  async deleteTask(uuid: string, accountUuid: string): Promise<void>;
  async batchUpdateStatus(uuids: string[], status: TaskStatus, accountUuid: string): Promise<void>;
}
```

---

### 3. Infrastructure Layer (基础设施层)

#### 3.1 Prisma Schema

**文件位置**: `apps/api/prisma/schema.prisma`

```prisma
model Task {
  uuid         String    @id @default(uuid())
  accountUuid  String    @map("account_uuid")
  title        String    @db.VarChar(200)
  description  String?   @db.Text
  status       TaskStatus @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime? @map("due_date")
  completedAt  DateTime? @map("completed_at")
  tags         String[]  @default([])
  goalUuid     String?   @map("goal_uuid")
  krUuid       String?   @map("kr_uuid")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  account      Account   @relation(fields: [accountUuid], references: [uuid])
  goal         Goal?     @relation(fields: [goalUuid], references: [uuid])
  keyResult    KeyResult? @relation(fields: [krUuid], references: [uuid])

  @@index([accountUuid])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([deletedAt])
  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

#### 3.2 Repository Implementation

**文件位置**: `apps/api/src/modules/task/infrastructure/repositories/TaskRepository.ts`

---

### 4. Interface Layer (接口层)

#### 4.1 HTTP Controller

**文件位置**: `apps/api/src/modules/task/interface/http/TaskController.ts`

**API Endpoints**:
```
POST   /tasks                    - 创建任务
GET    /tasks/:uuid              - 获取任务详情
GET    /tasks                    - 获取用户任务列表
PATCH  /tasks/:uuid              - 更新任务
DELETE /tasks/:uuid              - 删除任务
POST   /tasks/batch/status       - 批量更新状态
```

---

### 5. Contracts (契约层)

**文件位置**: `packages/contracts/src/modules/task/taskContracts.ts`

```typescript
export namespace TaskContracts {
  export interface CreateTaskRequestDTO {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    tags?: string[];
    goalUuid?: string;
    krUuid?: string;
  }

  export interface UpdateTaskRequestDTO {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    tags?: string[];
  }

  export interface TaskClientDTO {
    uuid: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    completedAt?: string;
    tags: string[];
    goalUuid?: string;
    krUuid?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 6. Frontend (Web)

#### 6.1 API Client

**文件位置**: `apps/web/src/modules/task/api/taskApiClient.ts`

#### 6.2 Composable

**文件位置**: `apps/web/src/modules/task/composables/useTask.ts`

#### 6.3 Components

**文件位置**: `apps/web/src/modules/task/components/`
- `TaskForm.vue` - 任务表单（创建/编辑）
- `TaskList.vue` - 任务列表
- `TaskCard.vue` - 任务卡片
- `TaskFilters.vue` - 筛选器

#### 6.4 Views

**文件位置**: `apps/web/src/modules/task/views/`
- `TaskListView.vue` - 任务列表页面

#### 6.5 Routes

**文件位置**: `apps/web/src/router/modules/taskRoutes.ts`

```typescript
{
  path: '/tasks',
  name: 'Tasks',
  component: () => import('@/modules/task/views/TaskListView.vue'),
}
```

---

## ✅ 验收标准 (Acceptance Criteria)

### Backend

```gherkin
Feature: Task CRUD Operations

Scenario: 创建任务成功
  Given 用户已登录
  When 用户提交创建任务请求
    | title       | 完成项目文档     |
    | priority    | HIGH            |
    | dueDate     | 2025-11-30      |
  Then 任务创建成功
  And 返回任务详情包含 uuid

Scenario: 获取任务列表并筛选
  Given 用户已创建多个任务
  When 用户请求任务列表
    | status   | TODO,IN_PROGRESS |
    | priority | HIGH,URGENT      |
  Then 返回符合条件的任务列表
  And 任务按优先级排序

Scenario: 更新任务状态
  Given 任务状态为 TODO
  When 用户将任务状态更新为 COMPLETED
  Then 任务状态更新成功
  And completedAt 字段被设置

Scenario: 软删除任务
  Given 任务存在
  When 用户删除任务
  Then 任务被标记为已删除
  And deletedAt 字段被设置
```

### Frontend

```gherkin
Feature: Task Management UI

Scenario: 创建任务表单验证
  Given 用户打开创建任务表单
  When 用户未填写标题
  And 点击提交
  Then 显示 "标题不能为空" 错误提示

Scenario: 任务列表展示
  Given 用户有 5 个任务
  When 用户打开任务列表页面
  Then 显示所有任务
  And 每个任务卡片显示标题、状态、优先级

Scenario: 筛选器功能
  Given 用户在任务列表页面
  When 用户选择状态筛选 "进行中"
  Then 列表只显示状态为 IN_PROGRESS 的任务
```

---

## 🧪 测试策略

### Backend Tests

1. **单元测试** (Vitest)
   - `Task.test.ts` - 聚合根业务逻辑
   - `TaskDomainService.test.ts` - 领域服务验证逻辑
   - `TaskApplicationService.test.ts` - 应用服务编排逻辑

2. **集成测试** (Vitest + Supertest)
   - `TaskController.integration.test.ts` - HTTP API 端到端测试
   - `TaskRepository.integration.test.ts` - 数据库操作测试

### Frontend Tests

1. **组件测试** (Vitest + Testing Library)
   - `TaskForm.test.ts`
   - `TaskList.test.ts`
   - `TaskCard.test.ts`

2. **E2E 测试** (Playwright)
   - `task-crud.e2e.ts` - 完整流程测试

---

## 📦 实施步骤

### Phase 1: Backend Implementation (2 天)

1. ✅ Prisma Schema 定义
2. ✅ Domain Layer 实现 (聚合根 + 仓储接口 + 领域服务)
3. ✅ Infrastructure Layer (仓储实现)
4. ✅ Application Layer (应用服务)
5. ✅ Interface Layer (HTTP Controller + Routes)
6. ✅ Contracts (DTO 定义)
7. ✅ 单元测试 + 集成测试

### Phase 2: Frontend Implementation (2 天)

1. ✅ API Client 封装
2. ✅ Composable 实现
3. ✅ 组件开发 (表单、列表、卡片、筛选器)
4. ✅ 视图页面
5. ✅ 路由配置
6. ✅ 组件测试

### Phase 3: E2E Testing & Polish (1 天)

1. ✅ Playwright E2E 测试
2. ✅ 手动测试验证
3. ✅ Bug 修复
4. ✅ 代码审查

---

## 🔗 依赖关系

- ✅ Epic 1 (Account & Authentication) - 用户认证
- ✅ Goal Module (可选) - 任务关联目标/KR

---

## 📝 注意事项

1. **软删除**: 所有删除操作使用软删除，保留 30 天
2. **权限控制**: 用户只能操作自己的任务
3. **状态转换**: 完成/取消任务时记录时间戳
4. **标签管理**: 标签存储为数组，支持多选
5. **关联字段**: goalUuid 和 krUuid 为可选，后续 Story 补充逻辑

---

## 🚀 后续 Story

- Story 3-2: Subtask Management (子任务管理)
- Story 3-3: Task Dependencies (任务依赖)
- Story 3-4: Task Dependency Graph Visualization (依赖图可视化)
- Story 3-5: Task Priority Matrix (优先级矩阵)

---

**Story Owner**: Backend Team + Frontend Team  
**Created**: 2025-10-30  
**Status**: drafted
