# @dailyuse/domain-client 包文档

> **包名**: `@dailyuse/domain-client`  
> **职责**: 客户端领域层（Domain Layer for Web & Desktop）  
> **依赖**: `@dailyuse/contracts`, `@dailyuse/utils`  
> **使用者**: `apps/web`, `apps/desktop`

---

## 📋 概览

### 包职责

`@dailyuse/domain-client` 是 **客户端应用**（Web + Desktop）的**领域层**实现，包含：

- ✅ **聚合根（Aggregates）**: 业务实体的根对象
- ✅ **实体（Entities）**: 具有唯一标识的领域对象
- ✅ **值对象（Value Objects）**: 不可变的领域概念
- ❌ **不包含**: 应用服务、基础设施、展示层代码

### 架构定位

在 DDD 分层架构中的位置：

```
Web/Desktop Application
├── Presentation Layer        → apps/web/src/modules/*/presentation/
├── Application Layer         → apps/web/src/modules/*/application/
├── Domain Layer              → @dailyuse/domain-client ⭐ THIS
├── Infrastructure Layer      → apps/web/src/modules/*/infrastructure/
└── Initialization Layer      → apps/web/src/modules/*/initialization/
```

**关键特性**：
- 🔒 **无外部依赖**: Domain 层不依赖外层（Application/Infrastructure）
- 🔄 **可复用**: Web 和 Desktop 共享同一领域逻辑
- 📦 **独立包**: 作为独立 npm 包，可单独构建和测试
- 🎯 **纯粹性**: 只包含业务规则和领域模型

---

## 🏗️ 目录结构

```
packages/domain-client/
├── src/
│   ├── account/               # 账户领域
│   │   ├── aggregates/       # 聚合根
│   │   │   └── Account.ts    # ⚠️ 当前: AccountClient.ts
│   │   ├── entities/         # 实体
│   │   ├── value-objects/    # 值对象
│   │   ├── types.ts          # 类型定义
│   │   └── index.ts          # 导出
│   │
│   ├── goal/                  # 目标领域
│   │   ├── aggregates/
│   │   │   ├── Goal.ts       # ⚠️ 当前: GoalClient.ts
│   │   │   ├── GoalFolder.ts # ⚠️ 当前: GoalFolderClient.ts
│   │   │   └── GoalStatistics.ts
│   │   ├── entities/
│   │   │   ├── KeyResult.ts  # ⚠️ 当前: KeyResultClient.ts
│   │   │   ├── GoalReview.ts
│   │   │   └── GoalRecord.ts
│   │   ├── value-objects/
│   │   │   ├── GoalMetadata.ts
│   │   │   ├── GoalTimeRange.ts
│   │   │   └── GoalReminderConfig.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── task/                  # 任务领域
│   ├── schedule/              # 调度领域
│   ├── reminder/              # 提醒领域
│   └── ...                    # 其他领域模块
│
├── package.json
└── tsconfig.json

⚠️ **命名规范建议**：
当前所有实体都带有 Client 后缀（如 GoalClient），建议重构为：
- GoalClient.ts → Goal.ts（导出 Goal）
- 包路径已经表明了上下文（domain-client/goal/）
```

---

## 🎯 核心概念

### 1. 聚合根（Aggregate Root）

**定义**：领域模型的入口点，负责维护业务不变性。

**基类**：`AggregateRoot`（来自 `@dailyuse/utils`）

**特征**：
- ✅ 拥有全局唯一标识（UUID）
- ✅ 管理子实体生命周期
- ✅ 强制业务规则
- ✅ 发布领域事件

**示例**：Goal 聚合根

```typescript
// domain-client/src/goal/aggregates/Goal.ts（建议命名）
import { AggregateRoot } from '@dailyuse/utils';
import { GoalContracts } from '@dailyuse/contracts';

export class Goal extends AggregateRoot {
  private _accountUuid: string;
  private _title: string;
  private _status: GoalStatus;
  private _keyResults: KeyResult[];  // 子实体
  
  // 构造函数私有，通过工厂方法创建
  private constructor(params: GoalParams) {
    super(params.uuid);
    // 初始化...
  }
  
  // 工厂方法
  public static create(params: CreateGoalParams): Goal {
    // 业务规则验证
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    return new Goal({ ...params, status: GoalStatus.DRAFT });
  }
  
  public static forCreate(): Goal {
    // 用于前端表单初始化
    return new Goal({
      uuid: crypto.randomUUID(),
      accountUuid: '', // 保存时注入
      title: '',
      status: GoalStatus.DRAFT,
      // ...
    });
  }
  
  // 业务方法
  public activate(): void {
    if (!this.canActivate()) {
      throw new Error('Goal cannot be activated');
    }
    this._status = GoalStatus.ACTIVE;
    this._updatedAt = Date.now();
  }
  
  public addKeyResult(kr: KeyResult): void {
    this._keyResults.push(kr);
    this._updatedAt = Date.now();
  }
  
  // DTO 转换
  public toClientDTO(): GoalClientDTO {
    return {
      uuid: this._uuid,
      title: this._title,
      status: this._status,
      keyResults: this._keyResults.map(kr => kr.toClientDTO()),
      // 计算属性
      overallProgress: this.overallProgress,
      isOverdue: this.isOverdue,
    };
  }
  
  public static fromServerDTO(dto: GoalServerDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      title: dto.title,
      // ...
    });
  }
}
```

### 2. 实体（Entity）

**定义**：拥有唯一标识但不是聚合根的领域对象。

**生命周期**：由聚合根管理。

**示例**：KeyResult 实体

```typescript
// domain-client/src/goal/entities/KeyResult.ts（建议命名）
export class KeyResult {
  private _uuid: string;
  private _goalUuid: string;  // 父聚合根 ID
  private _title: string;
  private _currentValue: number;
  private _targetValue: number;
  
  private constructor(params: KeyResultParams) {
    this._uuid = params.uuid;
    this._goalUuid = params.goalUuid;
    // ...
  }
  
  public static forCreate(goalUuid: string): KeyResult {
    return new KeyResult({
      uuid: crypto.randomUUID(),
      goalUuid,
      title: '',
      currentValue: 0,
      targetValue: 100,
      // ...
    });
  }
  
  // 计算属性
  public get progressPercentage(): number {
    return Math.round((this._currentValue / this._targetValue) * 100);
  }
  
  public get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }
  
  // 业务方法
  public updateProgress(value: number): void {
    if (value < 0 || value > this._targetValue) {
      throw new Error('Invalid progress value');
    }
    this._currentValue = value;
  }
}
```

### 3. 值对象（Value Object）

**定义**：不可变的领域概念，通过值比较相等性。

**特征**：
- 🔒 不可变（Immutable）
- 📊 通过值比较相等性
- 🎯 表达领域概念

**示例**：GoalTimeRange 值对象

```typescript
// domain-client/src/goal/value-objects/GoalTimeRange.ts
export class GoalTimeRange {
  private readonly _startDate: number | null;
  private readonly _targetDate: number | null;
  
  private constructor(startDate: number | null, targetDate: number | null) {
    if (startDate && targetDate && startDate > targetDate) {
      throw new Error('Start date cannot be after target date');
    }
    this._startDate = startDate;
    this._targetDate = targetDate;
  }
  
  public static create(startDate: number | null, targetDate: number | null): GoalTimeRange {
    return new GoalTimeRange(startDate, targetDate);
  }
  
  // 计算属性
  public get durationDays(): number | null {
    if (!this._startDate || !this._targetDate) return null;
    return Math.ceil((this._targetDate - this._startDate) / (1000 * 60 * 60 * 24));
  }
  
  public get isOverdue(): boolean {
    if (!this._targetDate) return false;
    return Date.now() > this._targetDate;
  }
  
  // 值对象相等性比较
  public equals(other: GoalTimeRange): boolean {
    return this._startDate === other._startDate && 
           this._targetDate === other._targetDate;
  }
  
  // 不可变更新（返回新实例）
  public withNewTargetDate(targetDate: number): GoalTimeRange {
    return new GoalTimeRange(this._startDate, targetDate);
  }
}
```

---

## 🔄 DTO 转换策略

### 转换流程

```
Server → Domain → Client
  ↓       ↓       ↓
ServerDTO → Entity → ClientDTO
```

### 三种 DTO 类型

| DTO 类型 | 来源 | 用途 | 包含内容 |
|---------|------|------|----------|
| **ServerDTO** | `@dailyuse/contracts` | API 响应 | 数据库字段 |
| **ClientDTO** | `@dailyuse/contracts` | UI 展示 | 数据库字段 + 计算属性 |
| **Domain Entity** | `@dailyuse/domain-client` | 业务逻辑 | 封装 + 方法 |

### 转换示例

```typescript
// 1. 从 API 接收 ServerDTO
const serverDTO: GoalServerDTO = await api.getGoal(id);

// 2. 转换为 Domain Entity
const goal = Goal.fromServerDTO(serverDTO);

// 3. 执行业务操作
goal.activate();
goal.addKeyResult(keyResult);

// 4. 转换为 ClientDTO（给 UI 使用）
const clientDTO: GoalClientDTO = goal.toClientDTO();

// 5. 保存时转换回 ServerDTO
const updatedServerDTO: GoalServerDTO = goal.toServerDTO();
await api.updateGoal(id, updatedServerDTO);
```

### ClientDTO 增强

ClientDTO 包含所有计算属性，供 UI 直接使用：

```typescript
interface GoalClientDTO extends GoalServerDTO {
  // 基础字段（继承自 ServerDTO）
  uuid: string;
  title: string;
  status: GoalStatus;
  
  // 计算属性（仅在 ClientDTO）
  overallProgress: number;
  isDeleted: boolean;
  isCompleted: boolean;
  isOverdue: boolean;
  daysRemaining: number | null;
  statusText: string;
  priorityScore: number;
  keyResultCount: number;
  completedKeyResultCount: number;
}
```

---

## �� 设计模式

### 1. 工厂方法模式

**用途**：创建领域对象，强制业务规则。

```typescript
export class Goal extends AggregateRoot {
  // 私有构造函数
  private constructor(params: GoalParams) { }
  
  // 工厂方法 1: 标准创建
  public static create(params: CreateGoalParams): Goal {
    // 验证业务规则
    if (!params.title) throw new Error('Title required');
    return new Goal({ ...params, status: GoalStatus.DRAFT });
  }
  
  // 工厂方法 2: 前端表单初始化
  public static forCreate(): Goal {
    return new Goal({
      uuid: crypto.randomUUID(),
      accountUuid: '',  // 保存时注入
      title: '',
      status: GoalStatus.DRAFT,
      createdAt: Date.now(),
    });
  }
  
  // 工厂方法 3: 从 DTO 重建
  public static fromServerDTO(dto: GoalServerDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      // ...
    });
  }
}
```

### 2. 聚合模式

**原则**：
- ✅ 通过聚合根访问子实体
- ✅ 保证业务不变性
- ✅ 事务边界

```typescript
export class Goal extends AggregateRoot {
  private _keyResults: KeyResult[] = [];
  
  // ✅ 通过聚合根添加子实体
  public addKeyResult(kr: KeyResult): void {
    // 业务规则检查
    if (!this.canAddKeyResult()) {
      throw new Error('Cannot add key result in current status');
    }
    this._keyResults.push(kr);
    this._updatedAt = Date.now();
  }
  
  // ✅ 通过聚合根访问子实体
  public getKeyResult(uuid: string): KeyResult | null {
    return this._keyResults.find(kr => kr.uuid === uuid) ?? null;
  }
  
  // ✅ 批量操作保证一致性
  public reorderKeyResults(uuids: string[]): void {
    const reordered = uuids
      .map(uuid => this._keyResults.find(kr => kr.uuid === uuid))
      .filter((kr): kr is KeyResult => !!kr);
    this._keyResults = reordered;
  }
}
```

### 3. 不可变值对象模式

```typescript
export class GoalMetadata {
  private readonly _color: string | null;
  private readonly _category: string | null;
  private readonly _tags: ReadonlyArray<string>;
  
  private constructor(params: MetadataParams) {
    this._color = params.color;
    this._category = params.category;
    this._tags = Object.freeze([...params.tags]);
  }
  
  // 更新操作返回新实例
  public withColor(color: string): GoalMetadata {
    return new GoalMetadata({
      color,
      category: this._category,
      tags: [...this._tags],
    });
  }
  
  public addTag(tag: string): GoalMetadata {
    return new GoalMetadata({
      color: this._color,
      category: this._category,
      tags: [...this._tags, tag],
    });
  }
}
```

---

## �� 模块导出规范

### 模块导出结构

```typescript
// domain-client/src/goal/index.ts
export { Goal } from './aggregates/Goal';  // ⚠️ 当前: GoalClient
export { GoalFolder } from './aggregates/GoalFolder';
export { GoalStatistics } from './aggregates/GoalStatistics';

export { KeyResult } from './entities/KeyResult';
export { GoalReview } from './entities/GoalReview';
export { GoalRecord } from './entities/GoalRecord';

export { GoalMetadata } from './value-objects/GoalMetadata';
export { GoalTimeRange } from './value-objects/GoalTimeRange';
export { GoalReminderConfig } from './value-objects/GoalReminderConfig';

export * from './types';
```

### 包级导出

```typescript
// domain-client/src/index.ts
export * from './goal';
export * from './task';
export * from './account';
// ...
```

### 使用示例

```typescript
// Web Application 中使用
import { Goal, KeyResult, GoalMetadata } from '@dailyuse/domain-client';

// 创建目标
const goal = Goal.forCreate();
goal.updateTitle('Learn DDD');

// 添加 KR
const kr = KeyResult.forCreate(goal.uuid);
kr.updateTitle('Read 3 books');
goal.addKeyResult(kr);

// 转换为 DTO
const dto = goal.toClientDTO();
```

---

## 🧪 测试策略

### 单元测试

测试领域逻辑，不依赖外部服务：

```typescript
// domain-client/src/goal/__tests__/Goal.test.ts
describe('Goal', () => {
  describe('创建目标', () => {
    it('应该创建草稿状态的目标', () => {
      const goal = Goal.create({
        accountUuid: 'user-1',
        title: 'Test Goal',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });
      
      expect(goal.status).toBe(GoalStatus.DRAFT);
      expect(goal.title).toBe('Test Goal');
    });
    
    it('标题为空时应该抛出错误', () => {
      expect(() => {
        Goal.create({
          accountUuid: 'user-1',
          title: '',
          importance: ImportanceLevel.Important,
          urgency: UrgencyLevel.High,
        });
      }).toThrow('Title cannot be empty');
    });
  });
  
  describe('状态转换', () => {
    it('草稿状态可以激活', () => {
      const goal = Goal.create({ /* ... */ });
      goal.activate();
      expect(goal.status).toBe(GoalStatus.ACTIVE);
    });
    
    it('已完成状态不能激活', () => {
      const goal = Goal.create({ /* ... */ });
      goal.activate();
      goal.complete();
      
      expect(() => goal.activate()).toThrow('Cannot activate completed goal');
    });
  });
});
```

---

## ⚠️ 当前命名问题与重构建议

### 问题

当前所有实体类都带有 `Client` 后缀：
- `GoalClient.ts` → 导出 `GoalClient`
- `KeyResultClient.ts` → 导出 `KeyResultClient`

### 为什么需要重构

1. **冗余**: 包名 `domain-client` 已经表明了上下文
2. **不符合 DDD**: 领域模型应该使用业务语言（Ubiquitous Language）
3. **命名污染**: `GoalClient` 听起来像"目标客户端"而非"目标"

### 重构方案

```typescript
// ❌ 当前
import { GoalClient } from '@dailyuse/domain-client';
const goal = GoalClient.create({ /* ... */ });

// ✅ 建议
import { Goal } from '@dailyuse/domain-client';
const goal = Goal.create({ /* ... */ });
```

### 重构步骤

1. **重命名文件**:
   ```bash
   # 聚合根
   mv GoalClient.ts Goal.ts
   mv GoalFolderClient.ts GoalFolder.ts
   
   # 实体
   mv KeyResultClient.ts KeyResult.ts
   mv GoalReviewClient.ts GoalReview.ts
   
   # 值对象
   mv GoalMetadataClient.ts GoalMetadata.ts
   ```

2. **更新类名和导出**:
   ```typescript
   // Goal.ts
   - export class GoalClient extends AggregateRoot {
   + export class Goal extends AggregateRoot {
   ```

3. **更新所有导入**:
   ```typescript
   - import { GoalClient } from '@dailyuse/domain-client';
   + import { Goal } from '@dailyuse/domain-client';
   ```

4. **更新类型定义**（contracts 包）:
   ```typescript
   // @dailyuse/contracts
   - export interface GoalClient { }
   + export interface Goal { }
   ```

---

## 📚 相关文档

- [项目概览](../../project-overview.md)
- [Web Application 架构](../../architecture-web.md)
- [集成架构](../../integration-architecture.md)
- [@dailyuse/contracts 包文档](./packages-contracts.md)
- [@dailyuse/domain-server 包文档](./packages-domain-server.md)

---

**文档维护**: BMAD v6 Analyst  
**最后更新**: 2025-10-28
