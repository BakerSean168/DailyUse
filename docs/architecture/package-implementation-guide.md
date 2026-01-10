# Package Implementation Guide - 优雅的容器组装模式

> 本指南说明 DailyUse 中每个 package 应如何结构化，以便在不同容器（Desktop/API/Web）间优雅地组装和重用代码。

## 目录

1. [概述](#概述)
2. [五层架构设计](#五层架构设计)
3. [每层 Package 实现细节](#每层-package-实现细节)
4. [容器组装最佳实践](#容器组装最佳实践)
5. [案例研究：Schedule 模块](#案例研究schedule-模块)

---

## 概述

DailyUse 采用 **五层积木塔** 架构，借助 Nx monorepo 实现优雅的代码组装。每个应用容器（Desktop/API/Web）通过选择性导入上层的 packages，在保持业务逻辑统一的同时，适应不同的技术栈。

### 核心理念

```
L5: Apps                  (Desktop App, API Server, Web App)
    ↓ depends on ↓
L4: Application           (Business Orchestration + Generic Patterns)
    ↓ depends on ↓
L3: Infrastructure        (Repository Implementations, External Adapters)
    ↓ depends on ↓
L2: Domain                (Business Rules, Aggregates, Value Objects)
    ↓ depends on ↓
L1: Contracts             (DTOs, Enums, Interfaces - Zero Logic)
```

**关键原则：**

- ✅ 上层只依赖下层
- ✅ 同层 packages 间可以依赖，但避免循环依赖
- ✅ 每层有明确的职责和导出契约
- ✅ Generic patterns（通用框架）集中在 L4 `@dailyuse/patterns`
- ✅ Business-specific 代码分散在各模块 domain 层

---

## 五层架构设计

### L1: Contracts - 数据契约层

**职责：** 定义所有数据结构、枚举、接口（零业务逻辑）

**Package:** `@dailyuse/contracts`

```
packages/contracts/
├── src/
│   ├── auth/
│   │   ├── LoginRequestDTO.ts      # 登录请求 DTO
│   │   ├── AuthTokenDTO.ts         # Token 响应 DTO
│   │   └── index.ts
│   ├── schedule/
│   │   ├── CreateScheduleDTO.ts    # 创建日程 DTO
│   │   ├── ScheduleStatus.enum.ts  # 日程状态枚举
│   │   ├── TaskPriority.enum.ts    # 优先级枚举
│   │   └── index.ts
│   ├── shared/
│   │   ├── ResponseDTO.ts          # 通用响应包装
│   │   ├── PaginationDTO.ts        # 分页信息
│   │   └── index.ts
│   └── index.ts
└── package.json
```

**实现规范：**

```typescript
// ✅ Good: Pure data structure
export interface CreateScheduleDTO {
  title: string;
  description?: string;
  startTime: ISO8601DateTime;
  endTime: ISO8601DateTime;
  priority: TaskPriority;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// ❌ Bad: Contains logic or business rules
export interface CreateScheduleDTO {
  // ❌ Don't calculate priority here
  priority: () => number;
  // ❌ Don't add validation methods
  validate(): boolean;
}
```

**导出策略：** 暴露所有 DTOs 和 enums，无条件地被所有 packages 使用。

---

### L2: Domain - 业务规则层

**职责：** 封装业务逻辑、聚合根、值对象、领域错误

**Packages:**
- `@dailyuse/domain-server` - 后端业务规则（Schedule, Goal, Routine）
- `@dailyuse/domain-client` - 前端业务状态管理（客户端模型）

#### L2.1 Domain-Server 结构

```
packages/domain-server/
├── src/
│   ├── schedule/
│   │   ├── aggregates/
│   │   │   ├── Schedule.ts         # Schedule 聚合根
│   │   │   ├── ScheduleTimeRange.ts# 值对象
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── ScheduleCreatedEvent.ts
│   │   │   ├── ScheduleCompletedEvent.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── ScheduleNotFoundError.ts
│   │   │   ├── InvalidScheduleError.ts
│   │   │   └── index.ts
│   │   ├── queries/
│   │   │   ├── FindScheduleByIdQuery.ts
│   │   │   ├── FindActiveSchedulesQuery.ts
│   │   │   └── index.ts
│   │   ├── calculators/              # 业务计算 - 从 utils 移来
│   │   │   ├── priority-calculator.ts
│   │   │   ├── recurrence-calculator.ts
│   │   │   └── index.ts
│   │   ├── repositories/
│   │   │   ├── IScheduleRepository.ts # 仓储接口（契约）
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── goal/
│   │   ├── aggregates/
│   │   │   └── Goal.ts
│   │   ├── ...
│   │   └── index.ts
│   ├── shared/
│   │   ├── AggregateRoot.ts         # 从 utils/domain 导出
│   │   ├── Entity.ts
│   │   ├── ValueObject.ts
│   │   ├── DomainError.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

**实现规范：**

```typescript
// ✅ Aggregate Root 示例
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleCreatedEvent } from './events/ScheduleCreatedEvent';

export class Schedule extends AggregateRoot<ScheduleId> {
  private title: string;
  private timeRange: ScheduleTimeRange;
  private priority: TaskPriority;

  // 工厂方法 - 创建 + 发送领域事件
  public static create(
    title: string,
    timeRange: ScheduleTimeRange,
    priority: TaskPriority,
  ): Schedule {
    const schedule = new Schedule(
      ScheduleId.generate(),
      title,
      timeRange,
      priority,
    );
    
    schedule.addDomainEvent(
      new ScheduleCreatedEvent(schedule.getId(), title),
    );
    
    return schedule;
  }

  // 业务操作
  public markComplete(): void {
    if (this.isExpired()) {
      throw new InvalidScheduleError('Cannot complete expired schedule');
    }
    // ...
  }

  // 值对象创建
  public updateTimeRange(start: Date, end: Date): void {
    this.timeRange = ScheduleTimeRange.create(start, end);
  }
}

// ✅ 业务计算 - 从 utils 移来（Schedule 特定）
export const calculateSchedulePriority = (
  baseScore: number,
  urgencyFactor: number,
): number => {
  return baseScore * urgencyFactor;
};
```

**导出策略：** 只导出：
- Aggregate Roots（聚合根）
- Value Objects（值对象）
- Domain Events（领域事件）
- Query Objects（查询对象）
- Repository Interfaces（仓储接口）
- 相关的 Errors

❌ **不导出** 内部实现细节如 private methods 或 calculators。

#### L2.2 Domain-Client 结构

```
packages/domain-client/
├── src/
│   ├── schedule/
│   │   ├── state/
│   │   │   ├── ScheduleState.ts    # 客户端状态模型
│   │   │   ├── ScheduleStore.ts    # 状态容器
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── ScheduleSyncService.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

---

### L3: Infrastructure - 基础设施层

**职责：** 实现 L2 Domain 定义的仓储接口、外部服务适配器

**Packages:**
- `@dailyuse/infrastructure-server` - 后端基础设施（数据库、外部 API）
- `@dailyuse/infrastructure-client` - 前端基础设施（本地存储、IPC 通信）

#### L3.1 Infrastructure-Server 结构

```
packages/infrastructure-server/
├── src/
│   ├── schedule/
│   │   ├── repositories/
│   │   │   ├── PrismaScheduleRepository.ts  # 依赖 Prisma + Domain
│   │   │   └── index.ts
│   │   ├── datasources/
│   │   │   ├── ScheduleAPI.ts             # 外部 API 集成
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── shared/
│   │   ├── EventBus.ts                    # 从 utils 导出
│   │   ├── Logger.ts                      # 从 utils 导出
│   │   └── index.ts
│   └── index.ts
└── package.json
```

**实现规范：**

```typescript
// ✅ Repository Implementation
import { IScheduleRepository } from '@dailyuse/domain-server';
import { Schedule } from '@dailyuse/domain-server';

export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  async save(schedule: Schedule): Promise<void> {
    const data = this.toPersistence(schedule);
    await this.prisma.schedule.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
    
    // 发布领域事件
    await this.publishEvents(schedule.getDomainEvents());
  }

  async findById(id: ScheduleId): Promise<Schedule | null> {
    const raw = await this.prisma.schedule.findUnique({
      where: { id: id.getValue() },
    });
    return raw ? this.toDomain(raw) : null;
  }

  private toPersistence(schedule: Schedule): ScheduleRaw { /* ... */ }
  private toDomain(raw: ScheduleRaw): Schedule { /* ... */ }
  private publishEvents(events: DomainEvent[]): Promise<void> { /* ... */ }
}
```

**导出策略：** 只导出实现类（具体的 Repository 和 Adapter），不导出内部转换逻辑。

#### L3.2 Infrastructure-Client 结构

```
packages/infrastructure-client/
├── src/
│   ├── schedule/
│   │   ├── repositories/
│   │   │   ├── IndexedDBScheduleRepository.ts
│   │   │   └── index.ts
│   │   ├── ipc/
│   │   │   ├── ScheduleIPCClient.ts      # 与 Desktop/API 通信
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

---

### L4: Application - 应用编排层 + 通用模式层

**职责：** 业务用例编排、事务管理、通用框架（TaskQueue、Repository 基类等）

**Packages:**
- `@dailyuse/application-server` - 后端业务编排
- `@dailyuse/application-client` - 前端业务编排
- `@dailyuse/patterns` - 通用模式（**新**）

#### L4.1 Application-Server 结构

```
packages/application-server/
├── src/
│   ├── schedule/
│   │   ├── usecases/
│   │   │   ├── CreateScheduleUseCase.ts
│   │   │   ├── CompleteScheduleUseCase.ts
│   │   │   ├── GetScheduleDetailUseCase.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── ScheduleApplicationService.ts  # 编排业务逻辑
│   │   │   ├── ScheduleEventHandler.ts        # 事件处理
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── shared/
│   │   ├── container.ts                       # 依赖注入容器
│   │   ├── UseCase.ts                         # 基类
│   │   └── index.ts
│   └── index.ts
└── package.json
```

**实现规范：**

```typescript
// ✅ Use Case 示例
import { CreateScheduleDTO } from '@dailyuse/contracts';
import { Schedule } from '@dailyuse/domain-server';
import { IScheduleRepository } from '@dailyuse/domain-server';

export class CreateScheduleUseCase {
  constructor(private scheduleRepository: IScheduleRepository) {}

  async execute(dto: CreateScheduleDTO): Promise<ScheduleId> {
    const timeRange = ScheduleTimeRange.create(dto.startTime, dto.endTime);
    const schedule = Schedule.create(
      dto.title,
      timeRange,
      dto.priority,
    );

    await this.scheduleRepository.save(schedule);
    return schedule.getId();
  }
}

// ✅ Application Service - 编排多个 Use Cases
export class ScheduleApplicationService {
  constructor(
    private createScheduleUseCase: CreateScheduleUseCase,
    private completeScheduleUseCase: CompleteScheduleUseCase,
    private scheduleRepository: IScheduleRepository,
  ) {}

  async createAndNotify(dto: CreateScheduleDTO): Promise<void> {
    const scheduleId = await this.createScheduleUseCase.execute(dto);
    // 额外业务编排：发送通知等
    await this.notifySubscribers(scheduleId);
  }
}
```

**依赖注入容器：**

```typescript
// container.ts - 在此集中管理依赖注入
import { ScheduleApplicationService } from './schedule/services/ScheduleApplicationService';
import { PrismaScheduleRepository } from '@dailyuse/infrastructure-server';

export interface ApplicationContainer {
  scheduleService: ScheduleApplicationService;
  scheduleRepository: IScheduleRepository;
}

export function createApplicationContainer(
  prisma: PrismaClient,
): ApplicationContainer {
  const scheduleRepository = new PrismaScheduleRepository(prisma);
  const createScheduleUseCase = new CreateScheduleUseCase(
    scheduleRepository,
  );

  return {
    scheduleService: new ScheduleApplicationService(
      createScheduleUseCase,
      // ...其他 use cases
      scheduleRepository,
    ),
    scheduleRepository,
  };
}
```

#### L4.2 Patterns Package 结构（新）

```
packages/patterns/
├── src/
│   ├── scheduler/
│   │   ├── BaseTaskQueue.ts         # 通用任务队列基类
│   │   ├── IScheduleTimer.ts        # 调度接口
│   │   ├── IScheduleMonitor.ts      # 监控接口
│   │   ├── priority-queue/
│   │   │   ├── MinHeap.ts           # 优先级队列数据结构
│   │   │   ├── HeapNode.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── repository/
│   │   ├── BaseRepository.ts        # 通用仓储基类
│   │   ├── QueryObject.ts           # 查询对象基类
│   │   └── index.ts
│   ├── cache/
│   │   ├── LRUCache.ts              # LRU 缓存实现
│   │   ├── TTLCache.ts              # TTL 缓存实现
│   │   └── index.ts
│   ├── events/
│   │   ├── BaseEventHandler.ts
│   │   ├── EventDispatcher.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

**实现规范：**

```typescript
// ✅ Generic Base Task Queue - 零业务逻辑
export abstract class BaseTaskQueue<T> {
  protected queue: PriorityQueue<T>;

  abstract compare(a: T, b: T): number;

  public enqueue(item: T, priority: number): void {
    this.queue.push({ item, priority });
  }

  public dequeue(): T | null {
    return this.queue.pop()?.item || null;
  }

  public isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  // 让子类实现具体的执行逻辑
  abstract execute(item: T): Promise<void>;
}

// ✅ Business-Specific Implementation - 在 application-server
import { BaseTaskQueue } from '@dailyuse/patterns';

export class ScheduleTaskQueue extends BaseTaskQueue<ScheduleTask> {
  compare(a: ScheduleTask, b: ScheduleTask): number {
    return b.priority - a.priority;  // 优先级越高越先执行
  }

  async execute(task: ScheduleTask): Promise<void> {
    // Schedule 特定的执行逻辑
    const schedule = await this.scheduleRepository.findById(task.scheduleId);
    await schedule.execute();
  }
}
```

**导出策略：** 导出所有 Generic Patterns（基类、接口、通用数据结构），这些应该零业务逻辑，纯算法/框架。

#### L4.3 Application-Client 结构

```
packages/application-client/
├── src/
│   ├── schedule/
│   │   ├── stores/
│   │   │   ├── ScheduleStore.ts     # 编排 domain-client 状态
│   │   │   └── index.ts
│   │   ├── commands/
│   │   │   ├── CreateScheduleCommand.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── package.json
```

---

### L5: Apps - 应用层

**职责：** 技术框架集成（Express、Electron、React）、路由和页面

**Apps:**
- `apps/api` - Express 服务器
- `apps/desktop` - Electron 应用
- `apps/web` - React 单页应用

#### L5.1 Apps 依赖容器组装

```
apps/desktop/src/
├── main/
│   ├── ipc/
│   │   ├── handlers/
│   │   │   ├── schedule.handler.ts      # IPC 事件处理
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── container.ts                     # Desktop 容器
│   └── index.ts
├── renderer/
│   ├── modules/
│   │   ├── schedule/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

**Desktop 容器示例：**

```typescript
// apps/desktop/src/main/container.ts
import { createApplicationContainer } from '@dailyuse/application-server';
import { DesktopScheduler } from './modules/schedule/DesktopScheduler';
import { ElectronIPCBridge } from './ipc/ElectronIPCBridge';

export interface DesktopContainer {
  scheduleService: ScheduleApplicationService;
  scheduler: DesktopScheduler;
  ipcBridge: ElectronIPCBridge;
}

export function createDesktopContainer(): DesktopContainer {
  const appContainer = createApplicationContainer(
    // Desktop 使用本地数据库
    createPrismaClient({ DATABASE_URL: 'file:./data.db' }),
  );

  return {
    scheduleService: appContainer.scheduleService,
    scheduler: new DesktopScheduler(
      appContainer.scheduleRepository,
      new ElectronTimer(),  // Electron 特定的计时器
    ),
    ipcBridge: new ElectronIPCBridge(appContainer),
  };
}
```

**API 容器示例：**

```typescript
// apps/api/src/container.ts
import { createApplicationContainer } from '@dailyuse/application-server';
import { createDatabaseConnection } from './database';

export interface APIContainer {
  scheduleService: ScheduleApplicationService;
  // 其他服务...
}

export function createAPIContainer(): APIContainer {
  const appContainer = createApplicationContainer(
    createDatabaseConnection(),  // 服务器数据库连接
  );

  return {
    scheduleService: appContainer.scheduleService,
    // ...
  };
}
```

**Web 容器示例（React）：**

```typescript
// apps/web/src/container.ts
import { DomainClientStore } from '@dailyuse/domain-client';
import { IPCInfrastructureClient } from '@dailyuse/infrastructure-client';

export interface WebContainer {
  scheduleStore: DomainClientStore;
  ipcClient: IPCInfrastructureClient;
}

export function createWebContainer(): WebContainer {
  const ipcClient = new IPCInfrastructureClient();
  
  return {
    scheduleStore: new DomainClientStore(ipcClient),
    ipcClient,
  };
}
```

---

## 容器组装最佳实践

### 原则 1：选择性导入

每个应用只导入所需的 packages，遵循依赖关系。

```json
{
  "apps/desktop/package.json": {
    "dependencies": {
      "@dailyuse/contracts": "*",
      "@dailyuse/domain-server": "*",
      "@dailyuse/domain-client": "*",
      "@dailyuse/infrastructure-server": "*",
      "@dailyuse/infrastructure-client": "*",
      "@dailyuse/application-server": "*",
      "@dailyuse/application-client": "*",
      "@dailyuse/patterns": "*",
      "@dailyuse/utils": "*"
    }
  },
  "apps/api/package.json": {
    "dependencies": {
      "@dailyuse/contracts": "*",
      "@dailyuse/domain-server": "*",
      "@dailyuse/infrastructure-server": "*",
      "@dailyuse/application-server": "*",
      "@dailyuse/patterns": "*",
      "@dailyuse/utils": "*"
    }
  },
  "apps/web/package.json": {
    "dependencies": {
      "@dailyuse/contracts": "*",
      "@dailyuse/domain-client": "*",
      "@dailyuse/infrastructure-client": "*",
      "@dailyuse/application-client": "*",
      "@dailyuse/utils": "*"
    }
  }
}
```

### 原则 2：统一的容器接口

每个应用都有一个 `container.ts` 文件，统一管理依赖注入，便于测试和替换。

### 原则 3：IPC 和同步通信

Desktop 应用通过 IPC 与其他容器通信，Web 应用通过 HTTP 与 API 通信。

```typescript
// Desktop IPC Handler
ipcMain.on('schedule:create', async (event, dto: CreateScheduleDTO) => {
  const result = await container.scheduleService.createAndNotify(dto);
  event.reply('schedule:created', result);
});

// Web IPC Client
const result = await ipcRenderer.invoke('schedule:create', dto);
```

### 原则 4：清晰的导出边界

每个 package 的 `index.ts` 明确导出公开 API，隐藏内部实现。

```typescript
// packages/domain-server/src/index.ts
export * from './schedule/aggregates';
export * from './schedule/events';
export * from './schedule/errors';
export * from './schedule/queries';
export * from './schedule/repositories';
export * from './shared';

// ❌ 不导出内部实现
// export * from './schedule/calculators';
// export * from './schedule/internal-utils';
```

---

## 案例研究：Schedule 模块

### 完整的依赖链

```
Desktop App (Electron + React)
  ├─ renderer/pages/SchedulePage.tsx
  │   └─ useScheduleStore (from @dailyuse/application-client)
  │       └─ ScheduleStore (domain-client 状态)
  │           └─ IPCInfrastructureClient (infrastructure-client)
  │               └─ IPC 消息 → Desktop Main Process
  │
  └─ main/ipc/schedule.handler.ts
      └─ container.scheduleService (ScheduleApplicationService)
          ├─ CreateScheduleUseCase
          │   └─ IScheduleRepository (interface from domain-server)
          │       └─ PrismaScheduleRepository (infrastructure-server)
          │           └─ Prisma + SQLite (local.db)
          ├─ CompleteScheduleUseCase
          │   └─ IScheduleRepository
          └─ ScheduleEventHandler
              └─ publish domain events

API Server (Express)
  ├─ routes/schedule.ts
  │   └─ container.scheduleService (ScheduleApplicationService)
  │       ├─ CreateScheduleUseCase
  │       │   └─ IScheduleRepository
  │       │       └─ PrismaScheduleRepository
  │       │           └─ Prisma + PostgreSQL (prod database)
  │       └─ ... other use cases
  │
  └─ Request → JSON → CreateScheduleDTO (contracts)
```

### 关键文件分布

| 文件 | 包 | 层 | 职责 |
|------|----|----|------|
| `CreateScheduleDTO.ts` | contracts | L1 | 请求数据结构 |
| `Schedule.ts` | domain-server | L2 | 聚合根 + 业务逻辑 |
| `IScheduleRepository.ts` | domain-server | L2 | 仓储接口 |
| `PrismaScheduleRepository.ts` | infrastructure-server | L3 | Prisma 实现 |
| `CreateScheduleUseCase.ts` | application-server | L4 | 业务用例编排 |
| `ScheduleApplicationService.ts` | application-server | L4 | 服务编排 |
| `BaseTaskQueue.ts` | patterns | L4 | 通用模式（可复用） |
| `ScheduleTaskQueue.ts` | application-server | L4 | 具体实现 |
| `SchedulePage.tsx` | apps/desktop | L5 | 页面组件 |

### 移动代码后的优化

**Before（代码混杂）:**
```
utils/shared/priority-calculator.ts  ← 业务逻辑，应在 domain-server
application-server/scheduler/MinHeap.ts  ← 通用模式，应在 patterns
```

**After（清晰职责）:**
```
domain-server/schedule/calculators/priority-calculator.ts  ← 业务逻辑
patterns/scheduler/priority-queue/MinHeap.ts  ← 通用模式
application-server/schedule/scheduler/ScheduleTaskQueue.ts  ← 具体实现
```

**好处：**
- ✅ 通用模式可被其他模块重用（如 `GoalTaskQueue`、`ReminderTaskQueue`）
- ✅ 业务逻辑与框架解耦
- ✅ 容器组装时依赖关系明确
- ✅ 测试更容易（通用模式无依赖）

---

## 总结

| 层 | 特点 | 导出什么 | 不导出什么 |
|----|------|--------|-----------|
| **L1 Contracts** | 零逻辑 | 所有 DTOs、Enums | 方法、实现 |
| **L2 Domain** | 业务核心 | Aggregates、Events、Errors、Interfaces | Calculators、内部工具 |
| **L3 Infrastructure** | 实现契约 | 具体 Repository 类 | 转换逻辑、ORM 细节 |
| **L4 Application** | 编排 + 模式 | Use Cases、Services、**Generic Patterns** | 内部依赖注入细节 |
| **L5 Apps** | 框架集成 | 路由、页面、IPC 处理器 | 业务逻辑 |

按照本指南结构化 packages，就能在 Desktop、API、Web 三个容器间优雅地组装和重用代码，同时保持每个层的职责清晰。

