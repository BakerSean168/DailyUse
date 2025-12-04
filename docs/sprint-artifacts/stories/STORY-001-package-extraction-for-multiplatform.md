# STORY-001: 包提取与 Use Case 重构

**Epic**: 多平台架构支持  
**优先级**: 🔴 High  
**预估工时**: 3-4 周  
**状态**: 🚧 进行中  
**创建日期**: 2025-12-04  
**相关 ADR**: [ADR-004: Electron 桌面应用架构与包提取策略](../../architecture/adr/004-electron-desktop-architecture.md)

---

## 📋 Story 描述

### 作为
一名开发者

### 我希望
将所有业务模块从 `apps/web` 和 `apps/api` 提取到共享包中，并采用 Use Case 模式重构应用层

### 以便
- Desktop (Electron)、Web (Vue)、API (NestJS) 可以复用相同的业务逻辑
- 代码更加模块化、可测试、可维护
- 遵循 Clean Architecture / Hexagonal Architecture 最佳实践

---

## 🎯 验收标准 (Acceptance Criteria)

### AC-1: 包结构完整
- [ ] 所有 13 个业务模块都已提取到对应的共享包中
- [ ] 每个包可独立构建 (`pnpm nx run <package>:build` 成功)
- [ ] 包之间依赖关系正确，无循环依赖

### AC-2: Use Case 模式
- [ ] `application-server` 中每个模块采用 Use Case 模式 (每个操作一个类)
- [ ] `application-client` 中每个模块采用 Use Case 模式
- [ ] 每个 Use Case 类遵循单一职责原则

### AC-3: Ports & Adapters
- [ ] `infrastructure-client` 每个模块有 `ports/` 和 `adapters/` 目录
- [ ] `infrastructure-server` 每个模块有 `ports/` 和 `adapters/` 目录
- [ ] HTTP/IPC 适配器可互换 (客户端)
- [ ] Prisma/Memory 适配器可互换 (服务端)

### AC-4: 命名规范
- [ ] 文件名统一为 kebab-case
- [ ] 类名统一为 PascalCase
- [ ] 导出接口统一，支持子路径导入

### AC-5: 类型安全
- [ ] 所有包生成 `.d.ts` 类型声明
- [ ] 无 TypeScript 编译错误
- [ ] 无 `any` 类型泄漏 (明确标记的除外)

### AC-6: 向后兼容
- [ ] `apps/web` 可正常运行 (使用新包)
- [ ] `apps/api` 可正常运行 (使用新包)
- [ ] 现有功能无回归

---

## 📦 业务模块清单

| # | 模块 | 说明 | domain | application | infrastructure |
|---|------|------|--------|-------------|----------------|
| 1 | **goal** | 目标管理 | ✅ client/server | 🔄 client ✅ server | ✅ client/server |
| 2 | **task** | 任务管理 (模板/实例/依赖/统计) | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 3 | **schedule** | 日程管理 (任务/事件) | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 4 | **reminder** | 提醒管理 (模板/分组/统计) | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 5 | **account** | 账户管理 (档案/订阅) | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 6 | **authentication** | 认证授权 (登录/注册/密码/API Key) | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 7 | **notification** | 通知管理 | ✅ client/server | 🔄 client ⚠️ server | ✅ client ⚠️ server |
| 8 | **editor** | 富文本编辑器 | ✅ client/server | ❌ | ❌ |
| 9 | **ai** | AI 助手 | ✅ client/server | ❌ | ❌ |
| 10 | **dashboard** | 仪表盘/统计 | ✅ client/server | ❌ | ❌ |
| 11 | **repository** | 文件/文档仓库 | ✅ client/server | ❌ | ❌ |
| 12 | **setting** | 用户设置 | ✅ client/server | ❌ | ❌ |

**图例**: ✅ 已完成 | 🔄 进行中 | ⚠️ 骨架/待完善 | ❌ 待开始

---

## 📁 目标目录结构

### 包层次

```
packages/
├── contracts/              ← ✅ API 契约 (DTO/Request/Response)
├── utils/                  ← ✅ 通用工具 (AggregateRoot, EventBus, Logger)
│
├── domain-client/          ← ✅ 客户端领域 (实体/值对象/聚合根)
├── domain-server/          ← ✅ 服务端领域 (实体/值对象/聚合根/领域服务/仓储接口)
│
├── application-client/     ← 🔄 客户端应用层 (Use Cases)
├── application-server/     ← 🔄 服务端应用层 (Use Cases)
│
├── infrastructure-client/  ← 🔄 客户端基础设施 (HTTP/IPC 适配器)
├── infrastructure-server/  ← 🔄 服务端基础设施 (Prisma/Memory 适配器)
│
├── ui-core/                ← ✅ 框架无关 UI 逻辑
├── ui-vue/                 ← ✅ Vue composables
├── ui-vuetify/             ← ✅ Vuetify 组件
├── ui-react/               ← ✅ React hooks
└── ui-shadcn/              ← ✅ shadcn/ui 组件
```

### 模块内部结构 (以 goal 为例)

```
packages/application-server/src/goal/
├── use-cases/
│   ├── create-goal.use-case.ts
│   ├── update-goal.use-case.ts
│   ├── delete-goal.use-case.ts
│   ├── get-goal.use-case.ts
│   ├── list-goals.use-case.ts
│   ├── archive-goal.use-case.ts
│   ├── complete-goal.use-case.ts
│   ├── calculate-progress.use-case.ts
│   └── index.ts
├── event-handlers/
│   ├── on-key-result-updated.handler.ts
│   ├── on-goal-completed.handler.ts
│   └── index.ts
├── mappers/
│   └── goal.mapper.ts
└── index.ts

packages/infrastructure-server/src/goal/
├── ports/
│   └── goal-repository.port.ts      ← IGoalRepository (re-export from domain)
├── adapters/
│   ├── prisma/
│   │   └── goal-prisma.repository.ts
│   └── memory/
│   │   └── goal-memory.repository.ts
└── index.ts
```

---

## ✅ 任务分解 (Tasks)

### Phase 1: Application Server 完善 (Week 1)

#### TASK-1.1: Goal 模块 Use Case 拆分
- **状态**: 🔄 进行中
- **描述**: 将 `GoalApplicationService` 拆分为独立的 Use Case 类
- **文件**:
  - [ ] `packages/application-server/src/goal/use-cases/create-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/update-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/delete-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/get-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/list-goals.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/archive-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/complete-goal.use-case.ts`
  - [ ] `packages/application-server/src/goal/use-cases/calculate-progress.use-case.ts`
  - [ ] `packages/application-server/src/goal/mappers/goal.mapper.ts`

#### TASK-1.2: Task 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **描述**: 从 `apps/api` 提取 Task 模块到 `application-server`
- **源文件**: `apps/api/src/modules/task/application/`
- **Use Cases**:
  - [ ] `create-task-template.use-case.ts`
  - [ ] `update-task-template.use-case.ts`
  - [ ] `delete-task-template.use-case.ts`
  - [ ] `create-task-instance.use-case.ts`
  - [ ] `complete-task-instance.use-case.ts`
  - [ ] `add-task-dependency.use-case.ts`
  - [ ] `get-task-statistics.use-case.ts`

#### TASK-1.3: Schedule 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **描述**: 从 `apps/api` 提取 Schedule 模块到 `application-server`
- **Use Cases**:
  - [ ] `create-schedule-task.use-case.ts`
  - [ ] `update-schedule-task.use-case.ts`
  - [ ] `create-schedule-event.use-case.ts`
  - [ ] `check-conflicts.use-case.ts`

#### TASK-1.4: Reminder 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **Use Cases**:
  - [ ] `create-reminder.use-case.ts`
  - [ ] `send-reminder.use-case.ts`
  - [ ] `create-reminder-template.use-case.ts`
  - [ ] `create-reminder-group.use-case.ts`

#### TASK-1.5: Account 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **Use Cases**:
  - [ ] `update-profile.use-case.ts`
  - [ ] `change-subscription.use-case.ts`
  - [ ] `get-account-info.use-case.ts`

#### TASK-1.6: Authentication 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **Use Cases**:
  - [ ] `login.use-case.ts`
  - [ ] `register.use-case.ts`
  - [ ] `logout.use-case.ts`
  - [ ] `refresh-token.use-case.ts`
  - [ ] `reset-password.use-case.ts`
  - [ ] `create-api-key.use-case.ts`

#### TASK-1.7: Notification 模块提取 (Server)
- **状态**: ⚠️ 待开始
- **Use Cases**:
  - [ ] `create-notification.use-case.ts`
  - [ ] `mark-as-read.use-case.ts`
  - [ ] `get-unread-count.use-case.ts`

---

### Phase 2: Application Client 重构 (Week 2)

#### TASK-2.1: Goal 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中
- **描述**: 将 `GoalApplicationService` 拆分为 Use Case
- **Use Cases**:
  - [ ] `list-goals.use-case.ts`
  - [ ] `get-goal.use-case.ts`
  - [ ] `create-goal.use-case.ts`
  - [ ] `update-goal.use-case.ts`
  - [ ] `delete-goal.use-case.ts`
  - [ ] `create-folder.use-case.ts`

#### TASK-2.2: Task 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中
- **当前文件**: `TaskTemplateApplicationService.ts`, `TaskInstanceApplicationService.ts` 等
- **目标**: 拆分为独立 Use Case

#### TASK-2.3: Schedule 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中

#### TASK-2.4: Reminder 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中

#### TASK-2.5: Account 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中

#### TASK-2.6: Authentication 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中

#### TASK-2.7: Notification 模块 Use Case 拆分 (Client)
- **状态**: 🔄 进行中

---

### Phase 3: Infrastructure 完善 (Week 2-3)

#### TASK-3.1: Infrastructure Server - Prisma 适配器实现
- **状态**: ⚠️ 骨架已创建
- **描述**: 从 `apps/api` 迁移实际的 Prisma Repository 实现
- **模块**:
  - [ ] Goal: `goal-prisma.repository.ts` - 实现 `save()` 方法
  - [ ] Task: `task-prisma.repository.ts`
  - [ ] Schedule: `schedule-prisma.repository.ts`
  - [ ] Reminder: `reminder-prisma.repository.ts`
  - [ ] Account: `account-prisma.repository.ts`

#### TASK-3.2: Infrastructure Server - Memory 适配器完善
- **状态**: ⚠️ 骨架已创建
- **描述**: 完善 Memory 适配器用于测试

#### TASK-3.3: Infrastructure Client - 验证模块化导出
- **状态**: ✅ 完成
- **描述**: 确保所有模块正确导出

---

### Phase 4: 集成与验证 (Week 3-4)

#### TASK-4.1: apps/api 集成新包
- **状态**: ⚠️ 待开始
- **描述**: 将 `apps/api` 的 Application 层替换为使用 `application-server` 包
- **步骤**:
  - [ ] 更新 Controller 使用新 Use Case
  - [ ] 更新依赖注入配置
  - [ ] 运行集成测试

#### TASK-4.2: apps/web 集成新包
- **状态**: ⚠️ 待开始
- **描述**: 将 `apps/web` 的 Application 层替换为使用 `application-client` 包
- **步骤**:
  - [ ] 更新 Store 使用新 Use Case
  - [ ] 更新 composables
  - [ ] 运行 E2E 测试

#### TASK-4.3: 端到端测试
- **状态**: ⚠️ 待开始
- **描述**: 验证所有功能正常
- **测试场景**:
  - [ ] 目标 CRUD
  - [ ] 任务 CRUD
  - [ ] 日程 CRUD
  - [ ] 提醒 CRUD
  - [ ] 用户认证流程

#### TASK-4.4: 清理旧代码
- **状态**: ⚠️ 待开始
- **描述**: 删除 apps 中已迁移到 packages 的代码
- **注意**: 保留 Presentation 层 (Controller/Store/Components)

---

## 📐 代码规范

### Use Case 类模板

```typescript
// packages/application-server/src/goal/use-cases/create-goal.use-case.ts

import { Goal, GoalDomainService } from '@dailyuse/domain-server/goal';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { CreateGoalDTO, GoalClientDTO } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalMapper } from '../mappers/goal.mapper';

export interface CreateGoalInput {
  accountUuid: string;
  title: string;
  description?: string;
  importance: string;
  urgency: string;
  targetDate?: number;
  keyResults?: Array<{ title: string; targetValue?: number }>;
}

export interface CreateGoalOutput {
  goal: GoalClientDTO;
}

export class CreateGoalUseCase {
  private readonly domainService: GoalDomainService;

  constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  async execute(input: CreateGoalInput): Promise<CreateGoalOutput> {
    // 1. 业务验证
    this.validateInput(input);

    // 2. 创建领域对象
    const goal = this.domainService.createGoal(input);

    // 3. 添加关键结果
    if (input.keyResults) {
      for (const kr of input.keyResults) {
        this.domainService.addKeyResultToGoal(goal, kr);
      }
    }

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await this.publishEvents(goal);

    // 6. 返回 DTO
    return {
      goal: GoalMapper.toClientDTO(goal),
    };
  }

  private validateInput(input: CreateGoalInput): void {
    if (!input.title?.trim()) {
      throw new Error('Title is required');
    }
  }

  private async publishEvents(goal: Goal): Promise<void> {
    const events = goal.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}

// 工厂函数
export function createCreateGoalUseCase(
  goalRepository: IGoalRepository,
): CreateGoalUseCase {
  return new CreateGoalUseCase(goalRepository);
}
```

### Event Handler 模板

```typescript
// packages/application-server/src/goal/event-handlers/on-key-result-updated.handler.ts

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { KeyResultUpdatedEvent } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';

export class OnKeyResultUpdatedHandler {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async handle(event: KeyResultUpdatedEvent): Promise<void> {
    // 1. 获取目标
    const goal = await this.goalRepository.findById(event.goalUuid);
    if (!goal) return;

    // 2. 重新计算进度
    goal.recalculateProgress();

    // 3. 保存
    await this.goalRepository.save(goal);
  }

  register(): void {
    eventBus.on('KeyResultUpdated', (event) => this.handle(event));
  }
}
```

### Mapper 模板

```typescript
// packages/application-server/src/goal/mappers/goal.mapper.ts

import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalClientDTO, GoalPersistenceDTO } from '@dailyuse/contracts/goal';

export class GoalMapper {
  static toClientDTO(goal: Goal): GoalClientDTO {
    return goal.toClientDTO(true);
  }

  static toDomain(dto: GoalPersistenceDTO): Goal {
    return Goal.reconstitute({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      // ... 其他字段
    });
  }

  static toPersistence(goal: Goal): GoalPersistenceDTO {
    return {
      uuid: goal.uuid,
      accountUuid: goal.accountUuid,
      title: goal.title,
      // ... 其他字段
    };
  }
}
```

---

## 📊 进度追踪

### 当前状态

| 阶段 | 进度 | 备注 |
|------|------|------|
| Phase 1: Application Server | 15% | Goal 模块部分完成 |
| Phase 2: Application Client | 40% | 已有服务，待拆分 |
| Phase 3: Infrastructure | 70% | 结构已建立，适配器待完善 |
| Phase 4: 集成与验证 | 0% | 待开始 |

### 整体完成度

```
[██████████░░░░░░░░░░] 50%
```

---

## 🔗 相关链接

- [ADR-004: Electron 桌面应用架构](../../architecture/adr/004-electron-desktop-architecture.md)
- [DDD 类型架构文档](../../architecture/ddd-type-architecture.md)
- [包索引文档](../../packages-index.md)

---

## 📝 备注

1. **优先级**: 先完成 `application-server`，因为 Desktop 主进程需要它
2. **测试策略**: 每个 Use Case 应有对应的单元测试
3. **向后兼容**: 迁移过程中保持 `apps/` 可运行
4. **文件命名**: 统一使用 `*.use-case.ts`, `*.handler.ts`, `*.mapper.ts` 后缀

---

**最后更新**: 2025-12-04
