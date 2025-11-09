---
mode: agent
---

# DailyUse - 架构设计

## 架构设计

### 架构总结 (基于 Goal 模块)
方案 A 架构：

关键点：

```bash
packages/
  contracts/                 # 共享契约（定义接口和 DTO）
    src/modules/goal/
      aggregates/
        GoalServer.ts        # GoalServer 接口 + GoalServerDTO + GoalPersistenceDTO
        GoalClient.ts        # GoalClient 接口 + GoalClientDTO
      entities/
        KeyResultServer.ts   # KeyResultServer 接口 + DTO
        KeyResultClient.ts   # KeyResultClient 接口 + DTO
      value-objects/         # 值对象接口
      
  domain-server/             # 服务端领域模型（实现）
    src/goal/
      aggregates/
        Goal.ts              # 实现 GoalServer 接口
      entities/
        KeyResult.ts         # 实现 KeyResultServer 接口
        
  domain-client/             # 客户端领域模型（实现）
    src/goal/
      aggregates/
        Goal.ts              # 实现 GoalClient 接口
        
  apps/api/infrastructure/   # Prisma 仓储（不使用 TypeORM Entity）
    repositories/
      PrismaGoalRepository.ts  # 使用 toPersistenceDTO() 直接存储
```

PersistenceDTO: 扁平化结构，直接映射数据库字段（snake_case 在 Prisma schema，camelCase 在代码）
ServerDTO vs ClientDTO:
ServerDTO: 后端使用，包含子实体数组
ClientDTO: 前端使用，额外包含 UI 计算字段（overallProgress, isDeleted, statusText 等）
不需要 TypeORM Entity: Prisma 直接使用 PersistenceDTO

### Contracts-First 架构

#### packages/contracts - 核心契约包

**统一的类型定义与接口契约**

- **核心模块**: Account, Authentication, SessionManagement
- **业务模块**: Goal, Task, Reminder, Repository, Editor, Notification
- **应用模块**: App, Setting, Theme
- 每个模块包含: `types.ts`, `dtos.ts`, `events.ts`, `index.ts`
- 作为整个项目的"单一真实来源"

**模块结构示例**:

```typescript
// packages/contracts/src/modules/account/
├── types.ts      // 核心接口和枚举
├── dtos.ts       // 数据传输对象
├── events.ts     // 领域事件
└── index.ts      // 统一导出
```

#### packages/domain-core

**核心领域模型**

- 业务实体 (Entities)
- 聚合根 (Aggregate Roots)
- 值对象 (Value Objects)
- 领域事件 (Domain Events)
- 基于 contracts 包的类型定义
- 提供 `toDTO()` / `fromDTO()` 转换方法

#### packages/domain-server

**服务端领域扩展**

- 扩展核心领域模型，添加服务端特有功能
- 仓储接口定义
- 服务端领域服务
- 数据库相关的领域逻辑

#### packages/domain-client

**客户端领域扩展**

- 扩展核心领域模型，添加客户端特有功能
- 客户端领域服务
- 本地存储相关逻辑
- 客户端状态管理支持

#### packages/ui

**共享UI组件库**

- Vue3 组件库
- 跨应用复用的UI组件
- 主题系统和样式规范

#### packages/utils

**通用工具库**

- 工具函数集合
- **事件总线系统**: 实现发布订阅模式
  - `send()` / `publish()`: 发布事件
  - `on()` / `subscribe()`: 订阅事件
  - `handle()` / `invoke()`: 请求响应模式
- 日期、字符串、数组等常用工具

### DDD 分层架构

项目严格遵循领域驱动设计的四层架构模式：

#### 1. Domain Layer (领域层)

- **职责**: 核心业务逻辑和业务规则
- **内容**: 实体、聚合根、值对象、仓储接口、领域事件
- **位置**: `domain/` 文件夹

#### 2. Application Layer (应用层)

- **职责**: 编排业务流程，协调领域对象
- **内容**: 应用服务、事件处理器、用例实现
- **位置**: `application/` 文件夹

#### 3. Infrastructure Layer (基础设施层)

- **职责**: 技术实现细节和外部系统集成
- **内容**: 数据库实现、缓存、消息队列、依赖注入容器
- **位置**: `infrastructure/` 文件夹

#### 4. Presentation Layer (表示层)

- **职责**: 用户界面和用户交互
- **内容**: Vue组件、Composables、状态管理、路由
- **位置**: `presentation/` 文件夹 (Web) 或 `interface/` 文件夹 (API)

### 模块标准结构

```bash
ModuleName/
├── index.ts                     # 模块导出
├── domain/                      # 领域层
│   ├── entities/               # 实体
│   ├── aggregates/             # 聚合根
│   ├── valueObjects/           # 值对象
│   ├── repositories/           # 仓储接口
│   └── events/                 # 领域事件
├── application/                 # 应用层
│   ├── services/               # 应用服务
│   └── eventHandlers/          # 事件处理器
├── infrastructure/              # 基础设施层
│   ├── repositories/           # 仓储实现
│   └── di/                     # 依赖注入
└── initialization/              # 模块初始化
    └── moduleInitialization.ts
```

### 领域事件系统

**架构特色**: 基于事件驱动的模块间通信机制

#### 事件总线 (EventBus)

- **位置**: `packages/utils`
- **模式**: 发布订阅模式，类似 Electron IPC
- **核心方法**:
  - `send()` / `publish()`: 单向事件发布
  - `on()` / `subscribe()`: 事件订阅
  - `handle()` / `invoke()`: 请求响应模式

#### 事件组织结构

每个模块的事件文件统一放置在 `application/events/` 下：

```bash
application/events/
├── eventHandler.ts          # 事件处理函数 (on, handle)
├── eventRequester.ts        # 请求响应函数 (invoke)
└── domainEvents.ts          # 领域事件定义 (单向事件)
```

### DDD聚合根控制模式

**核心思想**: 在DDD中，聚合根（Aggregate Root）是唯一对外暴露的实体，负责控制聚合内所有子实体的生命周期和业务规则。其他实体只能通过聚合根进行操作。

#### 聚合根控制原则

1. **封装性** - 外部无法直接修改子实体
2. **一致性** - 所有变更都通过聚合根验证
3. **完整性** - 业务规则在聚合根层面统一执行
4. **事件驱动** - 发布领域事件通知其他模块

#### 实现层次架构

```bash
领域层 (Domain Client)
├── Goal.ts (聚合根)
│   ├── createKeyResult()     # 创建关键结果
│   ├── updateKeyResult()     # 更新关键结果
│   ├── removeKeyResult()     # 删除关键结果
│   ├── createRecord()        # 创建目标记录
│   └── createReview()        # 创建目标复盘
│
应用层 (API Application)
├── GoalAggregateService.ts   # 聚合根服务
├── GoalApplicationService.ts # 集成聚合根控制
│
接口层 (API Interface)
├── GoalAggregateController.ts # 聚合根控制器
├── goalAggregateRoutes.ts     # 聚合根路由
│
基础设施层 (Domain Server)
└── iGoalRepository.ts         # 扩展聚合根方法
```

#### 领域层实现示例

```typescript
// packages/domain-client/src/goal/aggregates/Goal.ts
export class Goal extends GoalCore {
  /**
   * 创建并添加关键结果
   * 聚合根控制：确保关键结果属于当前目标，维护权重总和不超过100%
   */
  createKeyResult(keyResultData: {
    name: string;
    weight: number;
    // ... 其他属性
  }): string {
    // 业务规则验证
    if (!keyResultData.name.trim()) {
      throw new Error('关键结果名称不能为空');
    }

    // 检查权重限制
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight + keyResultData.weight > 100) {
      throw new Error(`关键结果权重总和不能超过100%，当前总和: ${totalWeight}%`);
    }

    // 创建关键结果并发布领域事件
    const keyResultUuid = this.generateUUID();
    const newKeyResult = {
      /* ... */
    };
    this.addKeyResult(newKeyResult);
    this.publishDomainEvent('KeyResultCreated', {
      /* ... */
    });

    return keyResultUuid;
  }

  /**
   * 删除关键结果
   * 聚合根控制：确保数据一致性，级联删除相关记录
   */
  removeKeyResult(keyResultUuid: string): void {
    // 级联删除相关记录
    const relatedRecords = this.records.filter((record) => record.keyResultUuid === keyResultUuid);
    this.records = this.records.filter((record) => record.keyResultUuid !== keyResultUuid);

    // 从聚合中移除
    const keyResultIndex = this.keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    this.keyResults.splice(keyResultIndex, 1);

    // 发布领域事件
    this.publishDomainEvent('KeyResultRemoved', {
      goalUuid: this.uuid,
      keyResultUuid,
      cascadeDeletedRecordsCount: relatedRecords.length,
    });
  }
}
```

#### API层路由设计

```typescript
// 体现聚合根控制的路由设计

// ❌ 传统设计 - 直接操作子实体
POST /api/v1/key-results
PUT /api/v1/key-results/:id
DELETE /api/v1/key-results/:id

// ✅ DDD设计 - 通过聚合根操作
POST /api/v1/goals/:goalId/key-results
PUT /api/v1/goals/:goalId/key-results/:keyResultId
DELETE /api/v1/goals/:goalId/key-results/:keyResultId

// ✅ 聚合根完整视图
GET /api/v1/goals/:goalId/aggregate

// ✅ 聚合根批量操作
PUT /api/v1/goals/:goalId/key-results/batch-weight
POST /api/v1/goals/:goalId/clone
```

#### 应用服务协调

```typescript
// apps/api/src/modules/goal/application/services/goalAggregateService.ts
export class GoalAggregateService {
  /**
   * 通过聚合根创建关键结果
   * 体现DDD原则：只能通过Goal聚合根创建KeyResult
   */
  async createKeyResultForGoal(
    accountUuid: string,
    goalUuid: string,
    request: {
      /* ... */
    },
  ): Promise<KeyResultResponse> {
    // 1. 获取聚合根
    const goalDTO = await this.goalRepository.getGoalByUuid(accountUuid, goalUuid);

    // 2. 转换为领域实体（聚合根）
    const goal = Goal.fromDTO(goalDTO);

    // 3. 通过聚合根创建关键结果（业务规则验证在这里）
    const keyResultUuid = goal.createKeyResult(request);

    // 4. 持久化更改
    const savedKeyResult = await this.goalRepository.createKeyResult(/* ... */);

    // 5. 更新Goal的版本号
    await this.goalRepository.updateGoal(accountUuid, goalUuid, {
      version: goal.version,
      lifecycle: { updatedAt: Date.now() },
    });

    return /* 响应数据 */;
  }
}
```

#### 仓储层扩展

```typescript
// packages/domain-server/src/goal/repositories/iGoalRepository.ts
export interface IGoalRepository {
  // 传统CRUD方法...

  // ===== DDD聚合根控制方法 =====

  /**
   * 加载完整的Goal聚合根
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  loadGoalAggregate(
    accountUuid: string,
    goalUuid: string,
  ): Promise<{
    goal: GoalDTO;
    keyResults: KeyResultDTO[];
    records: GoalRecordDTO[];
    reviews: GoalReviewDTO[];
  } | null>;

  /**
   * 原子性更新Goal聚合根
   * 在一个事务中更新目标及其所有子实体
   */
  updateGoalAggregate(
    accountUuid: string,
    aggregateData: {
      /* ... */
    },
  ): Promise<{
    /* ... */
  }>;

  /**
   * 验证聚合根业务规则
   */
  validateGoalAggregateRules(
    accountUuid: string,
    goalUuid: string,
    proposedChanges: {
      /* ... */
    },
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      /* ... */
    }>;
  }>;
}
```

#### 业务规则保护

1. **权重控制** - 关键结果权重总和不超过100%
2. **数据一致性** - 删除关键结果时级联删除相关记录
3. **版本控制** - 乐观锁机制防止并发冲突
4. **原子操作** - 批量更新保证一致性

#### 与传统CRUD的对比

| 方面           | 传统CRUD               | DDD聚合根控制                        |
| -------------- | ---------------------- | ------------------------------------ |
| **数据操作**   | 直接操作子实体         | 通过聚合根操作                       |
| **业务规则**   | 分散在各处             | 集中在聚合根                         |
| **数据一致性** | 依赖数据库约束         | 领域层保证                           |
| **路由设计**   | `PUT /key-results/:id` | `PUT /goals/:goalId/key-results/:id` |
| **错误处理**   | 技术性错误             | 业务性错误                           |
| **测试复杂度** | 需要数据库集成测试     | 可以纯领域逻辑测试                   |

#### 实现优势

- **业务规则集中化** - 所有关于Goal聚合的业务规则都在Goal实体中
- **数据一致性保证** - 通过聚合根确保所有子实体的数据一致性
- **更好的封装性** - 外部代码无法绕过业务规则直接修改子实体
- **领域事件驱动** - 所有重要的业务变更都会发布领域事件
- **可维护性提升** - 业务逻辑变更只需要修改聚合根
- **更符合现实业务** - 反映真实世界中的业务关系
