# @dailyuse/contracts 包文档

> **生成时间**: 2025-10-28  
> **包版本**: 0.0.1  
> **文档类型**: TypeScript 类型契约层文档

---

## 📋 包概述

**@dailyuse/contracts** 是 DailyUse 项目的**类型契约层**核心包，定义了整个应用的 TypeScript 类型系统。该包作为前后端之间的"契约"，确保类型一致性，避免运行时类型错误。

### 核心职责

- 📝 **DTO 定义**: 数据传输对象类型
- 🔗 **API 契约**: 请求/响应类型定义
- 🏗️ **领域模型接口**: 业务实体类型
- 🎯 **枚举和常量**: 业务状态、类型枚举
- ✅ **Zod 验证**: 运行时类型验证
- 🔄 **跨应用共享**: 确保类型一致性

---

## 🏗️ 架构设计

### 类型系统分层

```
@dailyuse/contracts/
├── dto/                # 数据传输对象 (Data Transfer Objects)
│   ├── request/       # API 请求 DTO
│   └── response/      # API 响应 DTO
├── entities/          # 实体类型接口
├── aggregates/        # 聚合根类型接口
├── value-objects/     # 值对象类型
├── enums/             # 枚举定义
└── validators/        # Zod 验证器
```

### 设计原则

1. **契约优先**: 类型定义即 API 契约
2. **不可变性**: 使用 `Readonly` 确保数据不可变
3. **严格类型**: 避免 `any`，使用精确类型
4. **运行时验证**: Zod schema 提供运行时保障
5. **向后兼容**: 新增字段使用可选类型

---

## 📦 技术栈

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **zod** | ^3.23.8 | 运行时类型验证 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | ^5.8.3 | 类型系统 |
| **tsup** | ^8.3.5 | 构建工具 |
| **rimraf** | ^6.0.1 | 清理工具 |

---

## 🎯 模块结构

DailyUse 包含 **10 个核心业务模块**的类型定义，共 **239 个 TypeScript 文件**：

### 模块列表

1. **Account** - 账户相关类型
2. **Authentication** - 认证授权类型
3. **Goal** - 目标管理类型
4. **Task** - 任务管理类型
5. **Schedule** - 日程调度类型
6. **Reminder** - 提醒系统类型
7. **Notification** - 通知系统类型
8. **Repository** - 文档仓库类型
9. **Editor** - 编辑器工作空间类型
10. **Setting** - 用户设置类型

---

## 📊 类型分类详解

### 1. DTO (Data Transfer Objects)

#### Request DTO - API 请求类型

```typescript
// CreateGoalDto - 创建目标请求
export interface CreateGoalDto {
  title: string;
  description?: string;
  startDate: string;      // ISO 8601
  endDate: string;
  targetValue?: number;
  parentGoalId?: string;
  tags?: string[];
}

// UpdateGoalDto - 更新目标请求
export interface UpdateGoalDto {
  title?: string;
  description?: string;
  status?: GoalStatus;
  progress?: number;
  endDate?: string;
}

// QueryGoalsDto - 查询目标请求
export interface QueryGoalsDto {
  status?: GoalStatus[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'endDate' | 'progress';
  sortOrder?: 'asc' | 'desc';
}
```

#### Response DTO - API 响应类型

```typescript
// GoalResponseDto - 目标响应
export interface GoalResponseDto {
  uuid: string;
  accountUuid: string;
  title: string;
  description: string;
  status: GoalStatus;
  progress: number;
  startDate: string;
  endDate: string;
  keyResults: KeyResultResponseDto[];
  createdAt: string;
  updatedAt: string;
}

// PaginatedResponseDto - 分页响应
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ApiErrorDto - 错误响应
export interface ApiErrorDto {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

---

### 2. Entity Interfaces - 实体类型

```typescript
// Goal 实体接口
export interface Goal {
  readonly uuid: string;
  readonly accountUuid: string;
  title: string;
  description: string;
  status: GoalStatus;
  progress: number;
  startDate: Date;
  endDate: Date;
  parentGoalUuid?: string;
  keyResults: KeyResult[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

// Task 实体接口
export interface Task {
  readonly uuid: string;
  readonly accountUuid: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Account 实体接口
export interface Account {
  readonly uuid: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

---

### 3. Aggregate Interfaces - 聚合根类型

```typescript
// EditorWorkspace 聚合根
export interface EditorWorkspace {
  readonly uuid: string;
  readonly accountUuid: string;
  name: string;
  description: string;
  sessions: EditorSession[];
  activeSessionUuid?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Schedule 聚合根
export interface Schedule {
  readonly uuid: string;
  readonly accountUuid: string;
  title: string;
  events: ScheduleEvent[];
  recurrenceRules: RecurrenceRule[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

---

### 4. Value Objects - 值对象类型

```typescript
// DateRange 值对象
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

// Priority 值对象
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// NotificationChannel 值对象
export interface NotificationChannel {
  readonly type: 'EMAIL' | 'PUSH' | 'IN_APP' | 'SMS';
  readonly enabled: boolean;
  readonly config?: Record<string, unknown>;
}

// TimeRange 值对象
export interface TimeRange {
  readonly startTime: string;  // HH:mm format
  readonly endTime: string;
}
```

---

### 5. Enums - 枚举定义

```typescript
// GoalStatus 枚举
export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  ARCHIVED = 'ARCHIVED',
}

// TaskStatus 枚举
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// AccountStatus 枚举
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

// NotificationPriority 枚举
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
```

---

### 6. Zod Validators - 运行时验证

```typescript
import { z } from 'zod';

// CreateGoalDto Zod Schema
export const CreateGoalDtoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetValue: z.number().positive().optional(),
  parentGoalId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

// 类型推导
export type CreateGoalDto = z.infer<typeof CreateGoalDtoSchema>;

// 运行时验证
const validateCreateGoal = (data: unknown): CreateGoalDto => {
  return CreateGoalDtoSchema.parse(data);
};
```

---

## 🔧 使用示例

### 前端使用（Vue 3 / React）

```typescript
import type { 
  Goal, 
  CreateGoalDto, 
  GoalResponseDto 
} from '@dailyuse/contracts';

// 类型安全的 API 调用
async function createGoal(dto: CreateGoalDto): Promise<GoalResponseDto> {
  const response = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  
  return response.json() as Promise<GoalResponseDto>;
}

// 组件中使用
const goal: Goal = {
  uuid: '123',
  accountUuid: '456',
  title: '学习 TypeScript',
  // TypeScript 会确保所有必填字段都存在
};
```

### 后端使用（Express API）

```typescript
import { 
  CreateGoalDto, 
  CreateGoalDtoSchema, 
  GoalResponseDto 
} from '@dailyuse/contracts';
import { Request, Response } from 'express';

// Express 路由处理器
app.post('/api/goals', async (req: Request, res: Response) => {
  try {
    // Zod 运行时验证
    const dto: CreateGoalDto = CreateGoalDtoSchema.parse(req.body);
    
    // 业务逻辑
    const goal = await goalService.create(dto);
    
    // 类型安全的响应
    const response: GoalResponseDto = {
      uuid: goal.uuid,
      accountUuid: goal.accountUuid,
      title: goal.title,
      // ...
    };
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    }
  }
});
```

### 类型守卫（Type Guards）

```typescript
// 类型守卫函数
export function isGoalCompleted(goal: Goal): goal is Goal & { completedAt: Date } {
  return goal.status === GoalStatus.COMPLETED;
}

// 使用
if (isGoalCompleted(goal)) {
  console.log(`Goal completed at: ${goal.completedAt}`);
}
```

---

## 📁 目录结构

```
packages/contracts/
├── src/
│   ├── modules/                   # 按模块组织
│   │   ├── account/
│   │   │   ├── entities/         # Account, Profile
│   │   │   ├── aggregates/       # AccountAggregate
│   │   │   ├── value-objects/    # Email, PhoneNumber
│   │   │   ├── dto/
│   │   │   │   ├── request/      # CreateAccountDto
│   │   │   │   └── response/     # AccountResponseDto
│   │   │   └── validators/       # Zod schemas
│   │   ├── goal/
│   │   │   ├── entities/         # Goal, KeyResult
│   │   │   ├── aggregates/
│   │   │   ├── value-objects/    # DateRange, Progress
│   │   │   ├── dto/
│   │   │   └── validators/
│   │   ├── task/
│   │   ├── schedule/
│   │   ├── reminder/
│   │   ├── notification/
│   │   ├── repository/
│   │   ├── editor/
│   │   └── setting/
│   ├── shared/                    # 共享类型
│   │   ├── enums/                # 全局枚举
│   │   ├── types/                # 通用类型
│   │   └── validators/           # 通用验证器
│   └── index.ts                  # 导出入口
├── dist/                          # 构建输出
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## 🚀 构建和开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 类型检查 + 构建监听
pnpm dev

# 仅类型检查
pnpm typecheck
```

### 构建

```bash
# 清理 + 构建
pnpm clean && pnpm build
```

---

## 📊 统计信息

- **总文件数**: 239 个 TypeScript 文件
- **模块数量**: 10 个核心业务模块
- **DTO 数量**: ~100+ 个
- **实体接口**: ~50+ 个
- **枚举定义**: ~30+ 个
- **Zod 验证器**: ~80+ 个

---

## 🔗 相关文档

- [项目概览](./project-overview.md)
- [@dailyuse/domain-client 包文档](./packages-domain-client.md)
- [@dailyuse/domain-server 包文档](./packages-domain-server.md)
- [@dailyuse/utils 包文档](./packages-utils.md)
- [API 架构文档](./architecture-api.md)

---

## 📝 最佳实践

### 1. 使用 Readonly 保证不可变性

```typescript
export interface Goal {
  readonly uuid: string;        // 不可修改
  readonly accountUuid: string;
  title: string;               // 可修改
  status: GoalStatus;
  readonly createdAt: Date;    // 不可修改
}
```

### 2. 使用可选类型处理向后兼容

```typescript
export interface UpdateGoalDto {
  title?: string;      // 可选字段
  description?: string;
  status?: GoalStatus;
  // 新增字段始终使用可选类型
  newField?: string;
}
```

### 3. 使用 Zod 进行运行时验证

```typescript
// 定义 Schema
export const EmailSchema = z.string().email();

// 验证函数
export function validateEmail(email: unknown): string {
  return EmailSchema.parse(email);
}

// 安全验证
export function safeValidateEmail(email: unknown): z.SafeParseReturnType<unknown, string> {
  return EmailSchema.safeParse(email);
}
```

### 4. 使用类型别名提高可读性

```typescript
export type GoalId = string;
export type AccountId = string;
export type Timestamp = string;  // ISO 8601

export interface Goal {
  uuid: GoalId;
  accountUuid: AccountId;
  createdAt: Timestamp;
}
```

### 5. 使用泛型提高复用性

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 使用
type GoalsResponse = PaginatedResponse<GoalResponseDto>;
type TasksResponse = PaginatedResponse<TaskResponseDto>;
```

---

## 🎯 设计模式

### 1. DTO Pattern（数据传输对象模式）

```typescript
// Request DTO
export interface CreateGoalDto {
  title: string;
  description: string;
}

// Response DTO
export interface GoalResponseDto {
  uuid: string;
  title: string;
  description: string;
  createdAt: string;
}

// Domain Entity
export interface Goal {
  uuid: string;
  title: string;
  description: string;
  createdAt: Date;  // 注意：日期类型不同
}
```

### 2. Builder Pattern（构建器模式）

```typescript
export interface GoalBuilder {
  setTitle(title: string): GoalBuilder;
  setDescription(description: string): GoalBuilder;
  setDateRange(start: Date, end: Date): GoalBuilder;
  build(): Goal;
}
```

### 3. Factory Pattern（工厂模式）

```typescript
export interface GoalFactory {
  createFromDto(dto: CreateGoalDto): Goal;
  createDraft(): Goal;
  createFromTemplate(template: GoalTemplate): Goal;
}
```

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 16:50:00
