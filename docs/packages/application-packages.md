# 📦 packages/application-server & application-client

> 应用服务层实现

## 概述

应用层包提供用例 (Use Case) 的实现，协调领域层和基础设施层。

- `@dailyuse/application-server`: 服务端应用服务
- `@dailyuse/application-client`: 客户端应用服务

## 架构位置

```
┌─────────────────────────────────────────────────────────┐
│                      应用层位置                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Interface Layer (接口层)                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  HTTP Controllers / IPC Handlers / GraphQL      │   │
│  └───────────────────────┬─────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  Application Layer (应用层) ◄── 当前位置                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Application Services / Use Cases / Commands    │   │
│  └───────────────────────┬─────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  Domain Layer (领域层)                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Entities / Aggregates / Domain Services        │   │
│  └───────────────────────┬─────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  Infrastructure Layer (基础设施层)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Repositories / External Services               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## @dailyuse/application-server

### 概述

服务端应用服务层，用于 API 服务器和 Desktop 主进程。

### 主要服务

| 服务 | 描述 |
|------|------|
| `GoalApplicationService` | 目标管理用例 |
| `TaskApplicationService` | 任务管理用例 |
| `ScheduleApplicationService` | 日程管理用例 |
| `ReminderApplicationService` | 提醒管理用例 |
| `NotificationApplicationService` | 通知管理用例 |
| `SettingApplicationService` | 设置管理用例 |
| `AccountApplicationService` | 账户管理用例 |
| `AIApplicationService` | AI 功能用例 |

### 目录结构

```
packages/application-server/
├── src/
│   ├── index.ts
│   ├── goal/
│   │   ├── GoalApplicationService.ts
│   │   ├── commands/
│   │   │   ├── CreateGoalCommand.ts
│   │   │   └── UpdateGoalCommand.ts
│   │   └── queries/
│   │       ├── GetActiveGoalsQuery.ts
│   │       └── GetGoalStatisticsQuery.ts
│   ├── task/
│   │   ├── TaskApplicationService.ts
│   │   └── ...
│   └── ...
├── package.json
└── tsconfig.json
```

### 使用示例

```typescript
import { GoalApplicationService } from '@dailyuse/application-server';

class GoalApplicationService {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly statisticsRepository: IGoalStatisticsRepository,
  ) {}

  async createGoal(command: CreateGoalCommand): Promise<GoalClientDTO> {
    // 验证
    const validatedData = CreateGoalSchema.parse(command);
    
    // 创建领域实体
    const goal = Goal.create({
      accountUuid: validatedData.accountUuid,
      title: validatedData.title,
      type: validatedData.type,
      targetDate: validatedData.targetDate,
    });
    
    // 持久化
    await this.goalRepository.save(goal);
    
    // 返回 DTO
    return goal.toClientDTO();
  }

  async getActiveGoals(accountUuid: string): Promise<GoalClientDTO[]> {
    const goals = await this.goalRepository.findActiveByAccount(accountUuid);
    return goals.map(goal => goal.toClientDTO());
  }
}
```

---

## @dailyuse/application-client

### 概述

客户端应用服务层，用于 Web 和 Desktop 渲染进程。

### 主要服务

| 服务 | 描述 |
|------|------|
| `GoalClientService` | 目标管理客户端服务 |
| `TaskClientService` | 任务管理客户端服务 |
| `ScheduleClientService` | 日程管理客户端服务 |
| `UIStateService` | UI 状态管理 |
| `CacheService` | 缓存管理 |

### 目录结构

```
packages/application-client/
├── src/
│   ├── index.ts
│   ├── goal/
│   │   ├── GoalClientService.ts
│   │   └── GoalCacheService.ts
│   ├── task/
│   │   ├── TaskClientService.ts
│   │   └── TaskCacheService.ts
│   ├── cache/
│   │   └── CacheManager.ts
│   └── state/
│       └── UIStateService.ts
├── package.json
└── tsconfig.json
```

### 使用示例

```typescript
import { GoalClientService } from '@dailyuse/application-client';

class GoalClientService {
  constructor(
    private readonly api: IGoalApiPort,
    private readonly cache: GoalCacheService,
  ) {}

  async getActiveGoals(accountUuid: string): Promise<GoalClientDTO[]> {
    // 检查缓存
    const cached = this.cache.get(accountUuid);
    if (cached) return cached;
    
    // 从 API 获取
    const goals = await this.api.getActive(accountUuid);
    
    // 缓存结果
    this.cache.set(accountUuid, goals);
    
    return goals;
  }

  async createGoal(data: CreateGoalDTO): Promise<GoalClientDTO> {
    const goal = await this.api.create(data);
    
    // 更新缓存
    this.cache.invalidate(data.accountUuid);
    
    return goal;
  }
}
```

---

## 依赖关系

```
应用层依赖图

@dailyuse/application-server
├── @dailyuse/contracts
├── @dailyuse/utils  
└── @dailyuse/domain-server

@dailyuse/application-client
├── @dailyuse/contracts
├── @dailyuse/utils
└── @dailyuse/domain-client
```

---

## 相关文档

- [系统架构概览](../architecture/system-overview.md)
- [DDD 模式](../architecture/adr/002-ddd-pattern.md)
- [Domain Server 包](./domain-server.md)
- [Domain Client 包](./domain-client.md)
