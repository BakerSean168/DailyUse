# Epic 2: Goal Module - 技术上下文文档

> **Epic ID**: EPIC-GOAL-001  
> **Epic 标题**: Goal Module (目标管理)  
> **生成时间**: 2025-10-28  
> **文档版本**: v1.0  
> **状态**: Contexted

---

## 1. 概述与范围

### 1.1 Epic 概述

Epic 2 实现基于 OKR 的目标管理系统，支持目标层级、关键结果追踪、权重快照、进度自动计算等核心功能。本模块帮助用户设定和跟踪个人/团队目标，通过 Key Results (KR) 量化评估目标达成情况。

### 1.2 目标与范围

**In-Scope (包含范围)**:
- ✅ 目标 CRUD (创建、查看、更新、删除)
- ✅ Key Result 管理
- ✅ KR 权重快照机制
- ✅ 目标进度自动计算
- ✅ 专注周期聚焦模式
- ✅ 目标层级关系
- ✅ 时间周期管理 (季度、年度)

**Out-of-Scope (不包含范围)**:
- ❌ 团队目标协作 - Phase 2 (P1)
- ❌ 目标模板库 - Phase 2 (P1)
- ❌ 目标数据分析报表 - Phase 2 (P2)
- ❌ AI 智能目标建议 - 未来功能

### 1.3 系统架构对齐

**架构约束**:
- 采用 DDD 架构模式
- 目标聚合根 (Goal Aggregate)
- KR 作为实体 (KeyResult Entity)
- 权重快照作为值对象 (WeightSnapshot Value Object)

**依赖组件**:
- Epic 1 (Account & Authentication): 用户身份认证
- `@dailyuse/domain-server`: Goal 领域模型
- `@dailyuse/domain-client`: Goal Pinia Store

---

## 2. 详细设计

### 2.1 服务/模块划分

| 服务/类 | 职责 | 输入 | 输出 | 所有者 |
|---------|------|------|------|--------|
| `GoalApplicationService` | 目标业务流程编排 | `CreateGoalRequest` | `GoalDTO` | Backend Team |
| `GoalProgressCalculator` | 进度计算领域服务 | `Goal + KRs` | `progress: number` | Backend Team |
| `Goal` (聚合根) | 目标核心业务逻辑 | - | - | Backend Team |
| `KeyResult` (实体) | 关键结果实体 | - | - | Backend Team |
| `KRWeightSnapshot` (值对象) | 权重快照值对象 | - | - | Backend Team |
| `IGoalRepository` | 目标仓储接口 | - | - | Backend Team |

### 2.2 数据模型

#### 2.2.1 Goal 表 (PostgreSQL)

```sql
CREATE TABLE "Goal" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "accountUuid" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, ARCHIVED
  "goalType" TEXT NOT NULL DEFAULT 'OBJECTIVE', -- OBJECTIVE, KEY_RESULT
  "parentGoalUuid" TEXT, -- 支持目标层级
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "period" TEXT, -- QUARTERLY, YEARLY, CUSTOM
  "progress" DECIMAL(5,2) DEFAULT 0, -- 自动计算
  "focusPeriodStart" TIMESTAMP, -- 专注周期开始
  "focusPeriodEnd" TIMESTAMP,   -- 专注周期结束
  "isFocused" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "Goal_accountUuid_fkey" 
    FOREIGN KEY ("accountUuid") REFERENCES "Account"("uuid") ON DELETE CASCADE,
  CONSTRAINT "Goal_parentGoalUuid_fkey"
    FOREIGN KEY ("parentGoalUuid") REFERENCES "Goal"("uuid") ON DELETE SET NULL
);

CREATE INDEX "Goal_accountUuid_idx" ON "Goal"("accountUuid");
CREATE INDEX "Goal_status_idx" ON "Goal"("status");
CREATE INDEX "Goal_parentGoalUuid_idx" ON "Goal"("parentGoalUuid");
```

#### 2.2.2 KeyResult 表 (PostgreSQL)

```sql
CREATE TABLE "KeyResult" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "goalUuid" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "initialValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "targetValue" DECIMAL(10,2) NOT NULL,
  "currentValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "unit" TEXT, -- %, 个, 次
  "weight" DECIMAL(5,2) NOT NULL DEFAULT 33.33, -- 权重百分比
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "progress" DECIMAL(5,2) DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  CONSTRAINT "KeyResult_goalUuid_fkey" 
    FOREIGN KEY ("goalUuid") REFERENCES "Goal"("uuid") ON DELETE CASCADE,
  CONSTRAINT "KeyResult_weight_check" CHECK ("weight" >= 0 AND "weight" <= 100)
);

CREATE INDEX "KeyResult_goalUuid_idx" ON "KeyResult"("goalUuid");
```

#### 2.2.3 KRWeightSnapshot 表 (PostgreSQL)

```sql
CREATE TABLE "KRWeightSnapshot" (
  "uuid" TEXT NOT NULL PRIMARY KEY,
  "goalUuid" TEXT NOT NULL,
  "snapshotData" JSONB NOT NULL, -- [{krUuid, weight, title}]
  "reason" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "KRWeightSnapshot_goalUuid_fkey" 
    FOREIGN KEY ("goalUuid") REFERENCES "Goal"("uuid") ON DELETE CASCADE,
  CONSTRAINT "KRWeightSnapshot_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "Account"("uuid")
);

CREATE INDEX "KRWeightSnapshot_goalUuid_idx" ON "KRWeightSnapshot"("goalUuid");
```

### 2.3 API 接口规范

#### 2.3.1 创建目标

**Endpoint**: `POST /api/goals`

**Request**:
```typescript
{
  title: string;
  description?: string;
  startDate?: string; // ISO 8601
  endDate?: string;
  period?: "QUARTERLY" | "YEARLY" | "CUSTOM";
  parentGoalUuid?: string;
  keyResults: Array<{
    title: string;
    description?: string;
    initialValue: number;
    targetValue: number;
    unit?: string;
    weight: number; // 权重必须总和为 100
  }>;
}
```

**Response (201 Created)**:
```typescript
{
  success: true,
  data: {
    goal: {
      uuid: string;
      title: string;
      status: "ACTIVE";
      progress: 0;
      keyResults: Array<{
        uuid: string;
        title: string;
        weight: number;
        progress: 0;
      }>;
      weightSnapshot: {
        uuid: string;
        snapshotData: Array<{krUuid, weight, title}>;
        createdAt: string;
      };
    }
  }
}
```

#### 2.3.2 更新 KR 进度

**Endpoint**: `PUT /api/goals/:goalUuid/key-results/:krUuid/progress`

**Request**:
```typescript
{
  currentValue: number;
}
```

**Response (200 OK)**:
```typescript
{
  success: true,
  data: {
    keyResult: {
      uuid: string;
      currentValue: number;
      progress: number; // 自动计算: (currentValue - initialValue) / (targetValue - initialValue) * 100
    },
    goal: {
      uuid: string;
      progress: number; // 自动重新计算目标进度
    }
  }
}
```

#### 2.3.3 调整 KR 权重（自动创建快照）

**Endpoint**: `PUT /api/goals/:goalUuid/key-results/weights`

**Request**:
```typescript
{
  weights: Array<{
    krUuid: string;
    weight: number;
  }>;
  reason: string; // 调整原因
}
```

**Response (200 OK)**:
```typescript
{
  success: true,
  data: {
    goal: {
      uuid: string;
      keyResults: Array<{
        uuid: string;
        weight: number;
      }>;
      progress: number; // 基于新权重重新计算
    },
    newSnapshot: {
      uuid: string;
      snapshotData: [...];
      reason: string;
      createdAt: string;
    }
  }
}
```

### 2.4 业务流程与时序

#### 2.4.1 创建目标并生成权重快照

```
Client                  API                Application Service         Domain Layer            Database
  |                      |                          |                         |                      |
  |--POST /goals-------->|                          |                         |                      |
  |                      |---validateInput--------->|                         |                      |
  |                      |                          |---createGoalAggregate-->|                      |
  |                      |                          |<---goal-----------------|                      |
  |                      |                          |---calculateTotalWeight->|                      |
  |                      |                          |<---100% confirmed-------|                      |
  |                      |                          |---createWeightSnapshot->|                      |
  |                      |                          |---beginTransaction----->|                      |
  |                      |                          |                         |---insertGoal------->|
  |                      |                          |                         |---insertKRs-------->|
  |                      |                          |                         |---insertSnapshot--->|
  |                      |                          |                         |---commit----------->|
  |                      |<---GoalDTO---------------|                         |                      |
  |<---201 Created-------|                          |                         |                      |
```

---

## 3. 非功能需求 (NFR)

### 3.1 性能要求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 目标列表加载 | < 200ms | 包含所有 KR 和进度计算 |
| 进度计算时间 | < 50ms | 单个目标的进度重新计算 |
| 权重快照创建 | < 100ms | 包含验证和持久化 |

### 3.2 安全要求

- ✅ 目标数据隔离：用户只能访问自己的目标
- ✅ 权重验证：所有 KR 权重总和必须为 100%
- ✅ 数据完整性：目标删除时级联删除 KR 和快照

### 3.3 可靠性要求

- 目标进度计算失败时使用缓存值
- 权重快照创建失败不影响主流程

---

## 4. 依赖与集成

### 4.1 技术依赖

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@prisma/client": "^5.20.0",
    "decimal.js": "^10.4.0"
  }
}
```

### 4.2 内部模块依赖

- Epic 1 (Account): 用户认证
- Epic 3 (Task): 目标可关联任务 (未来)

---

## 5. 验收标准与可追溯性

### 5.1 验收标准

#### AC-1: 创建 OKR 目标
```gherkin
Given 已登录用户
When 创建目标"Q4 增长目标"并添加 3 个 KR (权重 40%, 30%, 30%)
Then 目标创建成功
And 自动创建权重快照
And 快照包含 3 个 KR 的权重记录
```

#### AC-2: KR 权重调整自动快照
```gherkin
Given 目标已有 3 个 KR (权重 40%, 30%, 30%)
When 调整权重为 (50%, 30%, 20%) 并输入原因"调整优先级"
Then 自动创建新快照
And 快照记录包含调整原因和时间
And 目标进度基于新权重重新计算
```

#### AC-3: 目标进度自动计算
```gherkin
Given 目标有 3 个 KR (权重 40%, 30%, 30%)
When KR1 完成 50%, KR2 完成 80%, KR3 完成 100%
Then 目标进度 = 50%*40% + 80%*30% + 100%*30% = 74%
```

---

## 6. 测试策略

### 6.1 单元测试

```typescript
describe('GoalProgressCalculator', () => {
  it('should calculate weighted progress correctly', () => {
    const krs = [
      { progress: 50, weight: 40 },
      { progress: 80, weight: 30 },
      { progress: 100, weight: 30 }
    ];
    const result = calculator.calculateWeightedProgress(krs);
    expect(result).toBe(74);
  });
});
```

---

## 7. 实施计划

**Sprint 2-3** (4 周):
- STORY-2.1: 目标 CRUD (5 SP)
- STORY-2.2: Key Result 管理 (5 SP)
- STORY-2.3: KR 权重快照 (8 SP)
- STORY-2.4: 进度自动计算 (5 SP)
- STORY-2.5: 专注周期模式 (8 SP)

---

**文档维护**: Backend Team  
**最后更新**: 2025-10-28  
**Epic 状态**: Contexted
