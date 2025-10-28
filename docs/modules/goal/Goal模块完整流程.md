# Goal 模块完整流程文档

> **本文档是 DailyUse 项目最重要的参考文档之一**  
> 详细展示 Goal（目标）模块从前端到后端的完整实现，包括文件组织、代码规范、工具使用和数据流向

---

## 📋 概述

Goal 模块负责管理用户的目标（Goals）功能，包括：

- 创建、查询、更新、删除目标
- 目标状态管理（激活、暂停、完成、归档）
- 目标目录（GoalFolderectory）管理
- 前后端数据同步
- 乐观更新（Optimistic Updates）

### 技术栈

| 层级     | 技术                                        |
| -------- | ------------------------------------------- |
| **前端** | Vue 3 + Pinia + TypeScript                  |
| **后端** | Node.js + Express + Prisma                  |
| **架构** | DDD (Domain-Driven Design) + Contract First |
| **通信** | RESTful API + Axios                         |

---

## 📁 文件树结构

### 前端 (Web)

```
apps/web/src/modules/goal/
├── index.ts                          # 模块导出入口
├── application/
│   ├── services/
│   │   └── GoalWebApplicationService.ts    # 应用服务层（协调领域服务和API）
│   └── events/
│       └── goalEventHandlers.ts            # 事件处理器（监听用户登录等事件）
├── domain/
│   └── services/
│       └── GoalDomainService.ts            # 领域服务（业务逻辑，状态转换）
├── infrastructure/
│   └── api/
│       └── goalApiClient.ts                # API 客户端（HTTP 请求封装）
├── presentation/
│   ├── stores/
│   │   └── goalStore.ts                    # Pinia Store（状态管理）
│   ├── composables/
│   │   └── useGoal.ts                      # Vue Composable（UI 逻辑复用）
│   └── components/
│       ├── GoalList.vue                    # 目标列表组件
│       ├── GoalForm.vue                    # 目标表单组件
│       └── GoalCard.vue                    # 目标卡片组件
└── initialization/
    └── index.ts                            # 模块初始化（注册事件处理器）
```

**关键文件说明**:

1. **`GoalWebApplicationService.ts`** (183行)
   - 协调领域服务和 API 客户端
   - 处理乐观更新（先更新 UI，再调用 API）
   - 提供高层业务操作接口

2. **`GoalDomainService.ts`** (151行)
   - 纯业务逻辑（状态转换、验证）
   - 不依赖任何基础设施（数据库、API）
   - 实现目标状态机（草稿→进行中→已完成→已归档）

3. **`goalApiClient.ts`** (364行)
   - 封装所有 Goal 相关的 HTTP 请求
   - 使用 Axios 发送请求
   - 包含 `GoalApiClient` 和 `GoalFolderApiClient`

4. **`goalStore.ts`** (616行)
   - Pinia Store，管理目标状态
   - 提供 actions（createGoal, updateGoal, deleteGoal 等）
   - 支持乐观更新和回滚机制

5. **`goalEventHandlers.ts`** (80行)
   - 监听 `USER_LOGGED_IN` 事件
   - 自动加载用户目标数据

### 后端 (API)

```
apps/api/src/modules/goal/
├── index.ts                          # 模块导出入口
├── application/
│   └── services/
│       └── GoalApplicationService.ts       # 应用服务层（协调领域服务和仓储）
├── domain/
│   ├── entities/
│   │   └── Goal.ts                         # 目标实体（领域模型）
│   ├── services/
│   │   └── GoalDomainService.ts            # 领域服务（业务逻辑）
│   └── repositories/
│       └── IGoalRepository.ts              # 仓储接口（Repository Pattern）
├── infrastructure/
│   └── repositories/
│       └── prismaGoalRepository.ts         # Prisma 仓储实现
├── interface/
│   └── http/
│       ├── controllers/
│       │   └── GoalController.ts           # HTTP 控制器（路由处理）
│       └── routes/
│           └── goalRoutes.ts               # 路由定义
├── initialization/
│   └── goalModuleInitializer.ts            # 模块初始化
└── docs/
    ├── CORRECT_DDD_ARCHITECTURE.md         # DDD 架构文档
    ├── DDD_IMPLEMENTATION_SUMMARY.md       # DDD 实现总结
    └── REFACTORING_PROGRESS.md             # 重构进度
```

**关键文件说明**:

1. **`GoalController.ts`** (419行)
   - Express 路由处理器
   - 使用 [[API响应系统]] 统一响应格式
   - 使用 [[日志系统]] 记录操作日志
   - 包含 10 个主要方法（CRUD + 状态转换）

2. **`GoalApplicationService.ts`** (250行)
   - 协调领域服务和仓储
   - 处理事务和错误
   - 提供高层业务操作接口

3. **`GoalDomainService.ts`** (180行)
   - 纯业务逻辑（状态转换、验证）
   - 不依赖基础设施
   - 实现目标状态机

4. **`prismaGoalRepository.ts`** (320行)
   - 实现 `IGoalRepository` 接口
   - 使用 Prisma ORM 操作数据库
   - 包含 CRUD 和查询方法

5. **`Goal.ts`** (120行)
   - 目标实体（领域模型）
   - 包含业务逻辑方法
   - 状态验证和转换

### 类型定义 (Contracts)

```
packages/contracts/src/modules/goal/
├── index.ts                          # 导出入口
├── dtos.ts                           # 数据传输对象（DTO）
├── interfaces.ts                     # 接口定义
└── docs/
    ├── DTO_OPTIMIZATION_COMPLETE.md        # DTO 优化文档
    ├── OPTIMISTIC_UPDATES_GUIDE.md         # 乐观更新指南
    └── APPLICATION_LAYER_MIGRATION_GUIDE.md
```

**关键类型**:

```typescript
// 前后端共享的 DTO
export interface GoalClientDTO {
  uuid: string;
  name: string;
  description?: string;
  color: string;
  startTime: number;
  endTime?: number;
  status: GoalStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CreateGoalRequest {
  name: string;
  description?: string;
  color: string;
  startTime: number;
  endTime?: number;
  directoryId?: string;
}

export interface GoalListResponse {
  data: GoalClientDTO[];
  pagination?: PaginationInfo;
}
```

---

## 🔄 完整数据流

### 1. 创建目标流程

```
用户点击"创建目标"
    ↓
Vue Component (GoalForm.vue)
    ↓ 调用
useGoal() Composable
    ↓ 调用
goalStore.createGoal(data)
    ↓ 乐观更新：立即添加到 store
    ↓ 调用
GoalWebApplicationService.createGoal(data)
    ↓ 调用
goalApiClient.createGoal(data)
    ↓ HTTP POST
──────────────────────────────────────
后端 API
    ↓ HTTP POST /api/goals
GoalController.createGoal(req, res)
    ↓ 提取 accountUuid from JWT
    ↓ 记录日志
    ↓ 调用
GoalApplicationService.createGoal(accountUuid, dto)
    ↓ 调用
GoalDomainService.createGoal(accountUuid, dto)
    ↓ 调用
prismaGoalRepository.create(goal)
    ↓ Prisma ORM
数据库插入记录
    ↓ 返回
GoalEntity → DTO 转换 → GoalClientDTO
    ↓ 返回
Response.created(res, goalDTO)
──────────────────────────────────────
前端接收响应
    ↓
goalStore 更新为服务器返回的真实数据
    ↓
UI 更新完成
```

### 2. 查询目标列表流程

```
用户进入目标页面 / 用户登录成功
    ↓
组件 mounted / 事件触发
    ↓
goalStore.fetchGoals()
    ↓
GoalWebApplicationService.getGoals(params)
    ↓
goalApiClient.getGoals(params)
    ↓ HTTP GET /api/goals?page=1&limit=20
──────────────────────────────────────
后端 API
    ↓
GoalController.getGoals(req, res)
    ↓ 解析分页参数
    ↓
GoalApplicationService.getGoals(accountUuid, options)
    ↓
prismaGoalRepository.findByAccountId(accountUuid, options)
    ↓ Prisma 查询
数据库查询
    ↓ 返回
GoalEntity[] → GoalClientDTO[]
    ↓
Response.list(res, goals, pagination)
──────────────────────────────────────
前端接收响应
    ↓
goalStore.goals = response.data
goalStore.pagination = response.pagination
    ↓
组件自动响应更新
```

### 3. 更新目标状态流程（激活/暂停/完成）

```
用户点击"完成目标"
    ↓
goalStore.completeGoal(goalId)
    ↓ 乐观更新：先更新 UI
goalStore.goals.find(g => g.uuid === goalId).status = 'COMPLETED'
    ↓
GoalWebApplicationService.completeGoal(goalId)
    ↓
goalApiClient.completeGoal(goalId)
    ↓ HTTP PATCH /api/goals/:id/complete
──────────────────────────────────────
后端 API
    ↓
GoalController.completeGoal(req, res)
    ↓
GoalApplicationService.completeGoal(accountUuid, goalId)
    ↓
GoalDomainService.completeGoal(goal)
    ↓ 状态验证：只有 ACTIVE 才能完成
goal.status = 'COMPLETED'
goal.completedAt = Date.now()
    ↓
prismaGoalRepository.update(goal)
    ↓ 数据库更新
    ↓ 返回
Response.ok(res, goalDTO)
──────────────────────────────────────
前端接收响应
    ↓ 更新为服务器返回的真实数据
goalStore.goals = [...updated goals]
```

---

## 💻 代码示例

### 前端：创建目标

#### 1. Vue Component (GoalForm.vue)

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="目标名称" />
    <input v-model="form.description" placeholder="目标描述" />
    <input v-model="form.color" type="color" />
    <button type="submit" :disabled="loading">创建目标</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGoal } from '../composables/useGoal';

const { createGoal, loading } = useGoal();

const form = ref({
  name: '',
  description: '',
  color: '#4CAF50',
  startTime: Date.now(),
});

async function handleSubmit() {
  try {
    await createGoal(form.value);
    // 成功后重置表单
    form.value = { name: '', description: '', color: '#4CAF50', startTime: Date.now() };
  } catch (error) {
    console.error('创建目标失败:', error);
  }
}
</script>
```

#### 2. Composable (useGoal.ts)

```typescript
import { ref } from 'vue';
import { useGoalStore } from '../stores/goalStore';
import type { CreateGoalInput } from '@dailyuse/contracts';

export function useGoal() {
  const goalStore = useGoalStore();
  const loading = ref(false);

  const createGoal = async (input: CreateGoalInput) => {
    loading.value = true;
    try {
      // 调用 store 的 action
      await goalStore.createGoal(input);
    } finally {
      loading.value = false;
    }
  };

  return {
    goals: goalStore.goals,
    loading,
    createGoal,
  };
}
```

#### 3. Store (goalStore.ts)

```typescript
import { defineStore } from 'pinia';
import { getGoalWebService } from '@/modules/goal';
import type { GoalClientDTO, CreateGoalInput } from '@dailyuse/contracts';

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as GoalClientDTO[],
  }),

  actions: {
    async createGoal(input: CreateGoalInput) {
      const service = getGoalWebService();

      // 🚀 乐观更新：先添加临时目标到 UI
      const tempGoal: GoalClientDTO = {
        uuid: `temp-${Date.now()}`,
        ...input,
        status: 'DRAFT',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.goals.push(tempGoal);

      try {
        // 调用 API
        const result = await service.createGoal(input);

        // ✅ 用服务器返回的真实数据替换临时数据
        const index = this.goals.findIndex((g) => g.uuid === tempGoal.uuid);
        if (index !== -1) {
          this.goals[index] = result;
        }
      } catch (error) {
        // ❌ 失败：移除临时数据
        const index = this.goals.findIndex((g) => g.uuid === tempGoal.uuid);
        if (index !== -1) {
          this.goals.splice(index, 1);
        }
        throw error;
      }
    },
  },
});
```

#### 4. Application Service (GoalWebApplicationService.ts)

```typescript
import { goalApiClient } from '../infrastructure/api/goalApiClient';
import { GoalDomainService } from '../domain/services/GoalDomainService';
import type { CreateGoalInput, GoalClientDTO } from '@dailyuse/contracts';

export class GoalWebApplicationService {
  private domainService = new GoalDomainService();

  async createGoal(input: CreateGoalInput): Promise<GoalClientDTO> {
    // 可以在这里添加业务逻辑（如验证、转换）

    // 调用 API 客户端
    return await goalApiClient.createGoal(input);
  }

  async completeGoal(goalId: string): Promise<GoalClientDTO> {
    return await goalApiClient.completeGoal(goalId);
  }
}
```

#### 5. API Client (goalApiClient.ts)

```typescript
import { apiClient } from '@/shared/api';
import type { GoalClientDTO, CreateGoalInput, GoalListResponse } from '@dailyuse/contracts';

export class GoalApiClient {
  async createGoal(input: CreateGoalInput): Promise<GoalClientDTO> {
    return await apiClient.post<GoalClientDTO>('/goals', input);
  }

  async getGoals(params?: { page?: number; limit?: number }): Promise<GoalListResponse> {
    return await apiClient.get<GoalListResponse>('/goals', { params });
  }

  async completeGoal(goalId: string): Promise<GoalClientDTO> {
    return await apiClient.patch<GoalClientDTO>(`/goals/${goalId}/complete`);
  }
}

export const goalApiClient = new GoalApiClient();
```

### 后端：创建目标

#### 1. Controller (GoalController.ts)

```typescript
import type { Request, Response } from 'express';
import { GoalApplicationService } from '../../../application/services/GoalApplicationService';
import {
  type SuccessResponse,
  type ErrorResponse,
  ResponseCode,
  getHttpStatusCode,
} from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalController');

export class GoalController {
  private static goalService = new GoalApplicationService(goalRepository);

  static async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const accountUuid = GoalController.extractAccountUuid(req);
      const request = req.body;

      logger.info('Creating goal', { accountUuid, goalName: request.name });

      // 调用应用服务
      const goal = await GoalController.goalService.createGoal(accountUuid, request);

      logger.info('Goal created successfully', { goalUuid: goal.uuid, accountUuid });

      // 使用响应系统返回成功响应
      return GoalController.sendSuccess(res, goal, 'Goal created successfully', 201);
    } catch (error) {
      // 错误分类处理
      if (error instanceof Error) {
        if (error.message.includes('Invalid UUID')) {
          return GoalController.sendError(res, ResponseCode.VALIDATION_ERROR, error.message, error);
        }
        if (error.message.includes('Authentication')) {
          return GoalController.sendError(res, ResponseCode.UNAUTHORIZED, error.message, error);
        }
      }

      return GoalController.sendError(
        res,
        ResponseCode.INTERNAL_ERROR,
        'Failed to create goal',
        error,
      );
    }
  }

  private static sendSuccess<T>(
    res: Response,
    data: T,
    message: string,
    statusCode = 200,
  ): Response {
    const response: SuccessResponse<T> = {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
    };
    return res.status(statusCode).json(response);
  }

  private static sendError(
    res: Response,
    code: ResponseCode,
    message: string,
    error?: any,
  ): Response {
    const httpStatus = getHttpStatusCode(code);
    const response: ErrorResponse = {
      code,
      success: false,
      message,
      timestamp: Date.now(),
    };

    if (error) {
      logger.error(message, error);
    } else {
      logger.warn(message);
    }

    return res.status(httpStatus).json(response);
  }
}
```

#### 2. Application Service (GoalApplicationService.ts)

```typescript
import { GoalDomainService } from '../domain/services/GoalDomainService';
import type { IGoalRepository } from '../domain/repositories/IGoalRepository';
import type { CreateGoalRequest, GoalClientDTO } from '@dailyuse/contracts';
import { createLogger } from '@dailyuse/utils';

export class GoalApplicationService {
  private readonly logger = createLogger('GoalApplicationService');

  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly domainService = new GoalDomainService(),
  ) {}

  async createGoal(accountUuid: string, dto: CreateGoalRequest): Promise<GoalClientDTO> {
    this.logger.info('Creating goal in application layer', {
      accountUuid,
      goalName: dto.name,
    });

    // 调用领域服务创建目标
    const goal = await this.domainService.createGoal(accountUuid, dto);

    // 保存到数据库
    const savedGoal = await this.goalRepository.create(goal);

    this.logger.info('Goal created successfully', { goalUuid: savedGoal.uuid, accountUuid });

    // 转换为 DTO 返回
    return this.toDTO(savedGoal);
  }

  private toDTO(goal: GoalEntity): GoalClientDTO {
    return {
      uuid: goal.uuid,
      name: goal.name,
      description: goal.description,
      color: goal.color,
      startTime: goal.startTime,
      endTime: goal.endTime,
      status: goal.status,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
```

#### 3. Domain Service (GoalDomainService.ts)

```typescript
import { Goal } from '../entities/Goal';
import type { CreateGoalRequest } from '@dailyuse/contracts';
import { generateUUID } from '@dailyuse/utils';

export class GoalDomainService {
  createGoal(accountUuid: string, dto: CreateGoalRequest): Goal {
    // 业务规则验证
    if (!dto.name || dto.name.trim() === '') {
      throw new Error('Goal name cannot be empty');
    }

    if (dto.startTime && dto.endTime && dto.endTime < dto.startTime) {
      throw new Error('End time must be after start time');
    }

    // 创建目标实体
    return new Goal({
      uuid: generateUUID(),
      accountUuid,
      name: dto.name,
      description: dto.description || '',
      color: dto.color || '#4CAF50',
      startTime: dto.startTime || Date.now(),
      endTime: dto.endTime,
      status: 'DRAFT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  completeGoal(goal: Goal): Goal {
    // 业务规则：只有激活状态的目标才能完成
    if (goal.status !== 'ACTIVE') {
      throw new Error('Only active goals can be completed');
    }

    goal.status = 'COMPLETED';
    goal.completedAt = Date.now();
    goal.updatedAt = Date.now();

    return goal;
  }
}
```

#### 4. Repository (prismaGoalRepository.ts)

```typescript
import type { PrismaClient } from '@prisma/client';
import type { IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { Goal } from '../../domain/entities/Goal';

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(goal: Goal): Promise<Goal> {
    const data = await this.prisma.goal.create({
      data: {
        uuid: goal.uuid,
        accountUuid: goal.accountUuid,
        name: goal.name,
        description: goal.description,
        color: goal.color,
        startTime: new Date(goal.startTime),
        endTime: goal.endTime ? new Date(goal.endTime) : null,
        status: goal.status,
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt),
      },
    });

    return this.toDomain(data);
  }

  async findById(uuid: string): Promise<Goal | null> {
    const data = await this.prisma.goal.findUnique({
      where: { uuid },
    });

    return data ? this.toDomain(data) : null;
  }

  async update(goal: Goal): Promise<Goal> {
    const data = await this.prisma.goal.update({
      where: { uuid: goal.uuid },
      data: {
        name: goal.name,
        description: goal.description,
        color: goal.color,
        status: goal.status,
        updatedAt: new Date(goal.updatedAt),
      },
    });

    return this.toDomain(data);
  }

  private toDomain(data: any): Goal {
    return new Goal({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      description: data.description || '',
      color: data.color,
      startTime: data.startTime.getTime(),
      endTime: data.endTime?.getTime(),
      status: data.status,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    });
  }
}
```

---

## 🛠️ 使用的工具和系统

### 1. [[日志系统]]

**使用位置**:

- Controller: `const logger = createLogger('GoalController')`
- Application Service: `const logger = createLogger('GoalApplicationService')`
- Domain Service: `const logger = createLogger('GoalDomainService')`

**示例**:

```typescript
logger.info('Creating goal', { accountUuid, goalName: request.name });
logger.error('Failed to create goal', error, { dto });
```

### 2. [[API响应系统]]

**使用位置**:

- Controller 返回统一格式的响应

**示例**:

```typescript
import { ResponseCode, getHttpStatusCode } from '@dailyuse/contracts';

return GoalController.sendSuccess(res, goal, 'Goal created successfully', 201);
return GoalController.sendError(res, ResponseCode.VALIDATION_ERROR, error.message, error);
```

### 3. [[事件总线系统]]

**使用位置**:

- 前端监听用户登录事件，自动加载目标数据

**示例**:

```typescript
// goalEventHandlers.ts
eventBus.on<UserLoggedInEventPayload>(AUTH_EVENTS.USER_LOGGED_IN, async (payload) => {
  const goalStore = useGoalStore();
  await goalStore.fetchGoals();
});
```

### 4. [[校验系统]]

**使用位置**:

- 前端表单校验

**示例**:

```typescript
const validator = new FormValidator({
  fields: [
    {
      name: 'name',
      rules: [
        BuiltinValidators.required('目标名称不能为空'),
        BuiltinValidators.minLength(2, '至少2个字符'),
      ],
    },
  ],
});
```

---

## 📝 代码规范

### 1. 命名规范

| 类型     | 命名规则                 | 示例                                       |
| -------- | ------------------------ | ------------------------------------------ |
| **类**   | PascalCase + 后缀        | `GoalController`, `GoalApplicationService` |
| **接口** | PascalCase + I前缀或后缀 | `IGoalRepository`, `GoalClientDTO`         |
| **方法** | camelCase + 动词         | `createGoal()`, `findById()`               |
| **变量** | camelCase                | `accountUuid`, `goalName`                  |
| **常量** | UPPER_SNAKE_CASE         | `AUTH_EVENTS`, `GOAL_STATUS`               |
| **文件** | camelCase 或 PascalCase  | `goalStore.ts`, `GoalController.ts`        |

### 2. 导入顺序

```typescript
// 1. 第三方库
import { Request, Response } from 'express';
import { defineStore } from 'pinia';

// 2. @dailyuse packages
import { createLogger } from '@dailyuse/utils';
import type { GoalClientDTO } from '@dailyuse/contracts';

// 3. 相对路径导入（从近到远）
import { GoalDomainService } from './domain/services/GoalDomainService';
import { goalApiClient } from '../infrastructure/api/goalApiClient';
```

### 3. 错误处理

```typescript
// ✅ 推荐：分类错误，提供清晰的错误消息
try {
  await goalService.createGoal(dto);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Invalid UUID')) {
      return Response.validationError(res, error.message);
    }
    if (error.message.includes('not found')) {
      return Response.notFound(res, error.message);
    }
  }

  return Response.error(res, 'Failed to create goal');
}
```

### 4. 类型注解

```typescript
// ✅ 推荐：明确的类型注解
async createGoal(input: CreateGoalInput): Promise<GoalClientDTO> {
  // ...
}

// ✅ 推荐：使用 interface 而不是 type（如果可以）
export interface GoalClientDTO {
  uuid: string;
  name: string;
}
```

---

## 🔗 相关文档

### Goal 模块文档

- [[GOAL_CONTROLLER_REFACTOR_COMPLETE]] - GoalController 重构完成总结
- [[GOAL_DOMAIN_SERVICE_REFACTORING_COMPLETE]] - GoalDomainService 重构完成
- [[DOMAIN_CLIENT_GOAL_OPTIMIZATION_COMPLETE]] - 前端 Goal 模块优化
- `apps/api/src/modules/goal/docs/CORRECT_DDD_ARCHITECTURE.md` - DDD 架构
- `packages/contracts/src/modules/goal/OPTIMISTIC_UPDATES_GUIDE.md` - 乐观更新指南

### 系统文档

- [[日志系统]]
- [[API响应系统]]
- [[事件总线系统]]
- [[校验系统]]
- [[Initialize系统]]

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03  
**重要性**: ⭐⭐⭐⭐⭐ (最高)
