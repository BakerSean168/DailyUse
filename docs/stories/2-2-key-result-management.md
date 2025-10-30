# Story 2.2: Key Result Management
# 关键结果管理

> **Story ID**: 2.2  
> **Epic**: Epic 2 - Goal Module (目标管理)  
> **优先级**: High  
> **预估工作量**: 5 SP  
> **状态**: In Progress  
> **创建日期**: 2025-10-29

---

## 📋 Story 概述

**作为** 目标管理用户  
**我希望** 能够为目标创建和管理关键结果（Key Results）  
**以便** 量化评估目标达成情况，并通过多个可衡量的指标追踪目标进度

---

## 🎯 业务价值

### 核心价值
- ✅ **量化目标评估**：通过 KR 将抽象目标转化为可衡量的指标
- ✅ **进度可视化**：每个 KR 的进度清晰展示，便于追踪
- ✅ **灵活权重分配**：不同 KR 可赋予不同权重，反映优先级
- ✅ **实时进度更新**：支持随时更新 KR 当前值，自动计算进度

### 用户场景
1. **创建目标时定义 KR**：用户创建"Q4 增长目标"，添加 3 个 KR（用户增长、收入增长、留存率）
2. **独立添加 KR**：目标创建后，用户可以追加新的 KR
3. **更新 KR 进度**：每周更新"用户增长"KR 的当前值，系统自动计算进度
4. **编辑 KR 信息**：调整 KR 的目标值、描述或单位
5. **删除无效 KR**：移除不再适用的 KR

---

## ✅ 验收标准

### AC-1: 创建 Key Result
```gherkin
Given 已登录用户，且存在目标"Q4 增长目标"
When 用户点击"添加关键结果"并输入：
  - 标题: "用户增长"
  - 初始值: 10000
  - 目标值: 15000
  - 单位: "人"
  - 权重: 40%
Then 系统创建 KR 成功
And KR 显示在目标详情页
And 当前进度显示为 0%
```

### AC-2: 更新 KR 当前值
```gherkin
Given KR "用户增长"（初始值 10000，目标值 15000，当前值 10000）
When 用户更新当前值为 12500
Then KR 进度自动计算为 50%（(12500-10000)/(15000-10000)*100）
And 目标总进度自动重新计算（基于所有 KR 加权进度）
```

### AC-3: 编辑 Key Result
```gherkin
Given 已存在 KR "用户增长"
When 用户修改：
  - 标题改为 "月活用户增长"
  - 目标值改为 20000
Then 系统更新 KR 成功
And 进度基于新目标值重新计算
And 目标总进度自动更新
```

### AC-4: 删除 Key Result
```gherkin
Given 目标"Q4 增长目标"有 3 个 KR
When 用户删除其中 1 个 KR
Then KR 删除成功
And 目标总进度基于剩余 KR 重新计算
And 如果删除后无 KR，目标进度显示为 0%
```

### AC-5: KR 权重验证
```gherkin
Given 目标已有 2 个 KR（权重 60%, 40%）
When 用户添加第 3 个 KR 时设置权重 30%
Then 系统提示"权重总和超过 100%，请调整权重分配"
And KR 创建失败
```

---

## 🔧 技术实现

### 后端实现

#### 1. API 端点

##### 1.1 创建 Key Result
```typescript
POST /api/goals/:goalUuid/key-results
Authorization: Bearer <token>

Request Body:
{
  "title": "用户增长",
  "description": "月活用户数达到 15000",
  "initialValue": 10000,
  "targetValue": 15000,
  "currentValue": 10000,
  "unit": "人",
  "weight": 40
}

Response (201 Created):
{
  "success": true,
  "data": {
    "keyResult": {
      "uuid": "kr-uuid-123",
      "goalUuid": "goal-uuid-456",
      "title": "用户增长",
      "description": "月活用户数达到 15000",
      "initialValue": 10000,
      "targetValue": 15000,
      "currentValue": 10000,
      "unit": "人",
      "weight": 40,
      "progress": 0,
      "status": "IN_PROGRESS",
      "createdAt": "2025-10-29T10:00:00Z",
      "updatedAt": "2025-10-29T10:00:00Z"
    }
  }
}
```

##### 1.2 获取目标的所有 KR
```typescript
GET /api/goals/:goalUuid/key-results
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "keyResults": [
      {
        "uuid": "kr-uuid-123",
        "title": "用户增长",
        "initialValue": 10000,
        "targetValue": 15000,
        "currentValue": 12500,
        "unit": "人",
        "weight": 40,
        "progress": 50,
        "status": "IN_PROGRESS"
      }
      // ... more KRs
    ],
    "total": 3
  }
}
```

##### 1.3 更新 KR 当前值
```typescript
PATCH /api/goals/:goalUuid/key-results/:krUuid/progress
Authorization: Bearer <token>

Request Body:
{
  "currentValue": 12500
}

Response (200 OK):
{
  "success": true,
  "data": {
    "keyResult": {
      "uuid": "kr-uuid-123",
      "currentValue": 12500,
      "progress": 50  // 自动计算
    },
    "goal": {
      "uuid": "goal-uuid-456",
      "progress": 45  // 自动重新计算目标总进度
    }
  }
}
```

##### 1.4 更新 KR 信息
```typescript
PATCH /api/goals/:goalUuid/key-results/:krUuid
Authorization: Bearer <token>

Request Body:
{
  "title": "月活用户增长",
  "targetValue": 20000,
  "description": "更新描述"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "keyResult": {
      "uuid": "kr-uuid-123",
      "title": "月活用户增长",
      "targetValue": 20000,
      "progress": 25  // 基于新目标值重新计算
    }
  }
}
```

##### 1.5 删除 Key Result
```typescript
DELETE /api/goals/:goalUuid/key-results/:krUuid
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Key Result deleted successfully",
    "goal": {
      "uuid": "goal-uuid-456",
      "progress": 60  // 基于剩余 KR 重新计算
    }
  }
}
```

#### 2. 业务逻辑

##### 2.1 KR 进度计算公式
```typescript
// domain-server/src/modules/goal/domain/services/ProgressCalculator.ts
export class ProgressCalculator {
  /**
   * 计算单个 KR 的进度
   */
  static calculateKRProgress(
    initialValue: number,
    targetValue: number,
    currentValue: number
  ): number {
    if (targetValue === initialValue) {
      return currentValue >= targetValue ? 100 : 0;
    }
    
    const progress = ((currentValue - initialValue) / (targetValue - initialValue)) * 100;
    
    // 限制在 0-100 之间
    return Math.max(0, Math.min(100, progress));
  }
  
  /**
   * 计算目标加权进度（基于所有 KR）
   */
  static calculateGoalProgress(keyResults: Array<{progress: number; weight: number}>): number {
    if (keyResults.length === 0) return 0;
    
    const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = keyResults.reduce(
      (sum, kr) => sum + (kr.progress * kr.weight / 100),
      0
    );
    
    return Math.round(weightedSum * 100) / 100; // 保留 2 位小数
  }
}
```

##### 2.2 权重验证
```typescript
// domain-server/src/modules/goal/domain/services/WeightValidator.ts
export class WeightValidator {
  /**
   * 验证 KR 权重总和不超过 100%
   */
  static validateTotalWeight(
    existingKRs: Array<{uuid: string; weight: number}>,
    newWeight: number,
    excludeKrUuid?: string
  ): {valid: boolean; message?: string} {
    const existingTotal = existingKRs
      .filter(kr => kr.uuid !== excludeKrUuid)
      .reduce((sum, kr) => sum + kr.weight, 0);
    
    const total = existingTotal + newWeight;
    
    if (total > 100) {
      return {
        valid: false,
        message: `Total weight exceeds 100% (current: ${total}%). Please adjust weights.`
      };
    }
    
    return {valid: true};
  }
}
```

#### 3. 数据库模型

KeyResult 表已在 Epic 2 Context 中定义，包含以下字段：
- `uuid`, `goalUuid`, `title`, `description`
- `initialValue`, `targetValue`, `currentValue`, `unit`
- `weight`, `status`, `progress`
- `createdAt`, `updatedAt`

---

### 前端实现

#### 1. 需要检查的组件

基于 Story 2.1 的发现，需要检查以下前端代码是否已实现：

##### 1.1 API Client
- `goalApiClient.ts` 中的 KR 相关方法：
  - `createKeyResultForGoal()`
  - `getKeyResultsByGoal()`
  - `updateKeyResult()`
  - `updateKeyResultProgress()`
  - `deleteKeyResult()`

##### 1.2 状态管理
- `goalStore.ts` 中的 KR Actions

##### 1.3 UI 组件
- KR 列表展示组件
- KR 创建/编辑表单
- KR 进度更新组件
- KR 卡片组件

##### 1.4 视图
- `GoalDetailView.vue` 中的 KR 展示区域
- `KeyResultInfo.vue` (已发现此文件存在)

#### 2. 前端发现计划

在实施前，先检查前端代码完成度：
1. 读取 `goalApiClient.ts` 中的 KR 方法
2. 读取 `KeyResultInfo.vue` 组件
3. 检查 `GoalDetailView.vue` 中的 KR 集成
4. 评估是否需要额外开发

---

## 🧪 测试计划

### 后端 API 测试

#### 测试用例 1: 创建 KR
```bash
# 1. 创建 KR
curl -X POST http://localhost:3888/api/goals/{goalUuid}/key-results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "用户增长",
    "initialValue": 10000,
    "targetValue": 15000,
    "currentValue": 10000,
    "unit": "人",
    "weight": 40
  }'

# 预期: HTTP 201, 返回 KR 对象，progress = 0
```

#### 测试用例 2: 更新 KR 进度
```bash
# 2. 更新当前值
curl -X PATCH http://localhost:3888/api/goals/{goalUuid}/key-results/{krUuid}/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentValue": 12500}'

# 预期: HTTP 200, KR progress = 50, 目标 progress 自动更新
```

#### 测试用例 3: 权重验证
```bash
# 3. 创建超重 KR（总和 > 100%）
# 假设已有 2 个 KR（60% + 40%）
curl -X POST http://localhost:3888/api/goals/{goalUuid}/key-results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新 KR",
    "weight": 30
  }'

# 预期: HTTP 400, 错误提示"Total weight exceeds 100%"
```

### 前端 E2E 测试

#### 测试场景 1: 创建 KR
1. 访问目标详情页
2. 点击"添加关键结果"按钮
3. 填写表单（标题、初始值、目标值、单位、权重）
4. 点击"保存"
5. 验证 KR 出现在列表中，进度显示为 0%

#### 测试场景 2: 更新 KR 进度
1. 在 KR 卡片中点击"更新进度"
2. 输入新的当前值
3. 保存
4. 验证 KR 进度条更新
5. 验证目标总进度自动更新

---

## 📊 进度计划

### 实施步骤

#### Phase 1: 后端发现与验证（1 小时）
- [ ] 检查 `GoalApplicationService` 中的 KR 方法是否已实现
- [ ] 检查 `KeyResult` 领域实体
- [ ] 检查 `ProgressCalculator` 领域服务
- [ ] 评估后端完成度

#### Phase 2: 后端实施（2-3 小时，如需）
- [ ] 实现/增强 KR CRUD API 端点
- [ ] 实现进度计算逻辑
- [ ] 实现权重验证逻辑
- [ ] API 集成测试

#### Phase 3: 前端发现与验证（1 小时）
- [ ] 检查 `goalApiClient` 中的 KR 方法
- [ ] 检查 `KeyResultInfo.vue` 组件
- [ ] 检查 `GoalDetailView` 中的 KR 展示
- [ ] 评估前端完成度

#### Phase 4: 前端实施（2-3 小时，如需）
- [ ] 实现/增强 KR 表单组件
- [ ] 实现 KR 列表展示
- [ ] 实现进度更新 UI
- [ ] 集成到 GoalDetailView

#### Phase 5: 测试与验证（1-2 小时）
- [ ] 后端 API 测试（5 个测试用例）
- [ ] 前端 E2E 测试（2 个测试场景）
- [ ] Bug 修复
- [ ] 文档更新

**预计总时间**: 7-10 小时（1.5-2 天）

---

## 📝 依赖与风险

### 依赖
- ✅ Story 2.1: Goal CRUD Basics（已完成）
- ✅ Epic 1: 用户认证（已完成）
- ✅ PostgreSQL 数据库（已配置）

### 技术风险
- **低风险**: KR 管理是标准 CRUD 操作
- **中风险**: 进度计算逻辑需确保准确性
- **低风险**: 权重验证逻辑相对简单

### 假设
- KeyResult 表已在数据库 schema 中定义
- 前端可能已有部分 KR 相关代码（类似 Story 2.1 发现）

---

## 🎯 Definition of Done

- [ ] ✅ 所有 5 个 API 端点实现并测试通过
- [ ] ✅ KR 进度计算准确性验证（单元测试 + 手动测试）
- [ ] ✅ 权重验证逻辑测试通过
- [ ] ✅ 前端 UI 完整（创建、编辑、更新进度、删除）
- [ ] ✅ 目标进度自动更新功能验证
- [ ] ✅ API 测试报告完成
- [ ] ✅ 实施报告更新
- [ ] ✅ sprint-status.yaml 更新为 `done`

---

**创建人**: weiwei  
**审核人**: BMad Master  
**Story 状态**: In Progress  
**最后更新**: 2025-10-29
