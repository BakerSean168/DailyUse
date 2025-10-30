# Story 2.4: Goal Progress Auto-Calculation
# 目标进度自动计算

> **Story ID**: 2.4  
> **Epic**: Epic 2 - Goal Module (目标管理)  
> **优先级**: High  
> **预估工作量**: 5 SP  
> **状态**: In Progress  
> **创建日期**: 2025-10-30  
> **依赖**: Story 2.2 (Key Result Management)

---

## 📋 Story 概述

**作为** 目标管理用户  
**我希望** 系统根据关键结果（KR）的进度自动计算目标的整体进度  
**以便** 无需手动更新目标进度，确保数据实时准确，节省管理时间

---

## 🎯 业务价值

### 核心价值
- ✅ **自动化进度追踪**：KR 进度更新后自动计算目标进度
- ✅ **数据一致性**：目标进度始终与 KR 保持同步
- ✅ **透明计算**：提供进度分解详情，用户可查看每个 KR 的贡献度
- ✅ **权重加权**：考虑不同 KR 的重要性，使用加权平均算法

### 用户场景
1. **场景 1**: 用户更新某个 KR 的进度，系统自动重新计算目标进度
2. **场景 2**: 用户调整 KR 的权重，系统自动重新计算目标进度
3. **场景 3**: 用户查看目标详情，可以看到进度分解（每个 KR 的贡献度）
4. **场景 4**: 用户添加或删除 KR，系统自动重新计算目标进度

---

## ✅ 验收标准

### AC-1: 自动计算目标进度（加权平均）
```gherkin
Given 目标"Q4 增长目标"有 3 个 KR：
  | KR 标题 | 进度 | 权重 |
  | 用户增长 | 70% | 40% |
  | 收入增长 | 60% | 30% |
  | 留存率   | 50% | 30% |
When 系统计算目标进度
Then 目标进度 = (70%×40% + 60%×30% + 50%×30%) / 100% = 61%
And 目标详情页显示进度为 61%
```

### AC-2: KR 进度更新触发重算
```gherkin
Given 目标当前进度为 61%
And KR"用户增长"当前进度为 70%
When 用户将"用户增长"进度更新为 80%
Then 系统自动触发进度重算
And 新的目标进度 = (80%×40% + 60%×30% + 50%×30%) = 65%
And 目标详情页实时更新为 65%
And 进度变化被记录到历史
```

### AC-3: KR 权重调整触发重算
```gherkin
Given 目标当前进度为 61%
And KR 权重分别为：40%, 30%, 30%
When 用户将"用户增长"权重从 40% 调整为 50%
And 将"收入增长"权重从 30% 调整为 25%
And 将"留存率"权重从 30% 调整为 25%
Then 系统自动触发进度重算
And 新的目标进度 = (70%×50% + 60%×25% + 50%×25%) = 62.5%
```

### AC-4: 查看进度分解详情
```gherkin
Given 目标当前进度为 61%
When 用户点击目标进度旁的"查看详情"图标
Then 系统显示进度分解面板
And 面板包含以下信息：
  - 总进度：61%
  - 计算模式：加权平均
  - 各 KR 贡献度列表：
    | KR 标题 | 进度 | 权重 | 贡献度 |
    | 用户增长 | 70% | 40% | 28% |
    | 收入增长 | 60% | 30% | 18% |
    | 留存率   | 50% | 30% | 15% |
  - 计算公式：(70%×40% + 60%×30% + 50%×30%) = 61%
```

### AC-5: 添加/删除 KR 触发重算
```gherkin
Given 目标有 3 个 KR，当前进度为 61%
When 用户添加第 4 个 KR"新功能上线"（进度 0%，权重 20%）
And 其他 KR 权重自动调整为：40%, 24%, 16%
Then 系统自动触发进度重算
And 新的目标进度 = (70%×40% + 60%×24% + 50%×16% + 0%×20%) = 50.4%
```

---

## 🔧 技术实现

### MVP 范围（当前 Story）

#### 1. 后端实现

##### 1.1 领域层改造

**文件**: `packages/domain-server/src/modules/goal/aggregates/Goal.ts`

需要添加的方法：
```typescript
/**
 * 自动计算目标进度
 * 
 * 公式：Progress = Σ(KR.progress × KR.weight) / Σ(KR.weight)
 */
calculateProgress(): void {
  if (this.keyResults.length === 0) {
    this.progress = 0;
    return;
  }

  const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  if (totalWeight === 0) {
    this.progress = 0;
    return;
  }

  const weightedSum = this.keyResults.reduce(
    (sum, kr) => sum + (kr.progress * kr.weight),
    0
  );

  this.progress = Math.round((weightedSum / totalWeight) * 100) / 100;
  this.lastProgressUpdateTime = Date.now();
  
  // 发布进度更新事件
  this.addDomainEvent({
    eventType: 'GoalProgressUpdatedEvent',
    aggregateId: this.uuid,
    payload: {
      goalUuid: this.uuid,
      oldProgress: this.progress,
      newProgress: this.progress,
      trigger: 'auto_calculation',
    },
  });
}

/**
 * 获取进度分解详情
 */
getProgressBreakdown(): ProgressBreakdown {
  const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  
  return {
    totalProgress: this.progress,
    calculationMode: 'weighted_average',
    krContributions: this.keyResults.map(kr => ({
      keyResultUuid: kr.uuid,
      keyResultName: kr.title,
      progress: kr.progress,
      weight: kr.weight,
      contribution: (kr.progress * kr.weight / totalWeight),
    })),
    lastUpdateTime: this.lastProgressUpdateTime,
    updateTrigger: '自动计算',
  };
}
```

##### 1.2 在 KR 相关方法中触发重算

需要修改以下方法，在 KR 变化后调用 `calculateProgress()`:

- `addKeyResult()` - 添加 KR 后
- `updateKeyResult()` - 更新 KR 后
- `updateKeyResultProgress()` - 更新 KR 进度后
- `removeKeyResult()` - 删除 KR 后

##### 1.3 Application Service

**文件**: `apps/api/src/modules/goal/application/services/GoalApplicationService.ts`

添加方法：
```typescript
/**
 * 获取目标进度分解详情
 */
async getGoalProgressBreakdown(
  goalUuid: string
): Promise<GoalContracts.ProgressBreakdown> {
  const goal = await this.goalRepository.findByUuid(goalUuid);
  if (!goal) {
    throw new Error('Goal not found');
  }

  return goal.getProgressBreakdown();
}
```

##### 1.4 API 端点

**文件**: `apps/api/src/modules/goal/interface/http/GoalController.ts`

添加端点：
```typescript
/**
 * GET /api/goals/:uuid/progress-breakdown
 * 获取目标进度分解详情
 */
static async getProgressBreakdown(req: AuthenticatedRequest, res: Response) {
  try {
    const { uuid } = req.params;
    const accountUuid = req.user?.accountUuid;

    if (!accountUuid) {
      return GoalController.responseBuilder.sendError(res, {
        code: ResponseCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    // 验证所有权
    const { error } = await GoalController.verifyGoalOwnership(uuid, accountUuid);
    if (error) {
      return GoalController.responseBuilder.sendError(res, error);
    }

    const service = await GoalController.getGoalService();
    const breakdown = await service.getGoalProgressBreakdown(uuid);

    return GoalController.responseBuilder.sendSuccess(
      res,
      breakdown,
      'Progress breakdown retrieved'
    );
  } catch (error) {
    logger.error('Error getting progress breakdown', { error, goalUuid: req.params.uuid });
    return GoalController.responseBuilder.sendError(res, {
      code: ResponseCode.INTERNAL_SERVER_ERROR,
      message: 'Failed to get progress breakdown',
    });
  }
}
```

##### 1.5 路由注册

**文件**: `apps/api/src/modules/goal/interface/http/goalRoutes.ts`

```typescript
// 获取进度分解详情
router.get('/:uuid/progress-breakdown', authenticate, GoalController.getProgressBreakdown);
```

#### 2. 合约层（Contracts）

**文件**: `packages/contracts/src/modules/goal/api-responses.ts`

添加类型定义：
```typescript
/**
 * 进度分解详情
 */
export interface ProgressBreakdown {
  totalProgress: number;
  calculationMode: 'weighted_average';
  krContributions: Array<{
    keyResultUuid: string;
    keyResultName: string;
    progress: number;
    weight: number;
    contribution: number;
  }>;
  lastUpdateTime: number;
  updateTrigger: string;
}

/**
 * 进度分解响应
 */
export interface ProgressBreakdownResponse {
  breakdown: ProgressBreakdown;
}
```

#### 3. 前端实现

##### 3.1 API Client

**文件**: `apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts`

添加方法：
```typescript
/**
 * 获取目标进度分解详情
 */
async getProgressBreakdown(
  goalUuid: string
): Promise<GoalContracts.ProgressBreakdown> {
  const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/progress-breakdown`);
  return data;
}
```

##### 3.2 Composable

**文件**: `apps/web/src/modules/goal/presentation/composables/useGoal.ts`

添加方法：
```typescript
/**
 * 获取进度分解详情
 */
const fetchProgressBreakdown = async (goalUuid: string) => {
  try {
    const breakdown = await goalManagementApplicationService.getProgressBreakdown(goalUuid);
    return breakdown;
  } catch (error) {
    snackbar.showError('获取进度详情失败');
    throw error;
  }
};
```

##### 3.3 UI 组件

**文件**: `apps/web/src/modules/goal/presentation/components/ProgressBreakdownPanel.vue`

创建进度分解面板组件：
- 显示总进度
- 显示计算模式
- 显示 KR 贡献度列表（表格形式）
- 显示计算公式
- 支持折叠/展开

#### 4. 集成点

- ✅ KR 进度更新后自动触发（已在 `updateKeyResultProgress` 中）
- ✅ KR 权重更新后自动触发（已在 `updateKeyResult` 中）
- ✅ 添加 KR 后自动触发（已在 `addKeyResult` 中）
- ✅ 删除 KR 后自动触发（已在 `removeKeyResult` 中）

---

## 🧪 测试计划

### 后端单元测试

**文件**: `packages/domain-server/src/modules/goal/aggregates/Goal.spec.ts`

```typescript
describe('Goal.calculateProgress()', () => {
  it('should calculate progress correctly with weighted average', () => {
    const goal = Goal.create({...});
    
    goal.addKeyResult({ title: 'KR1', progress: 70, weight: 40 });
    goal.addKeyResult({ title: 'KR2', progress: 60, weight: 30 });
    goal.addKeyResult({ title: 'KR3', progress: 50, weight: 30 });
    
    goal.calculateProgress();
    
    expect(goal.progress).toBe(61); // (70*40 + 60*30 + 50*30) / 100
  });
  
  it('should return 0 when no KRs exist', () => {
    const goal = Goal.create({...});
    goal.calculateProgress();
    expect(goal.progress).toBe(0);
  });
});
```

### 后端集成测试

**文件**: `apps/api/src/modules/goal/tests/progress-calculation.integration.test.ts`

测试场景：
1. 创建目标并添加 KR，验证进度自动计算
2. 更新 KR 进度，验证目标进度自动更新
3. 调整 KR 权重，验证目标进度重新计算
4. 获取进度分解详情，验证返回正确数据

### 前端 E2E 测试（可选）

**文件**: `apps/web/e2e/goal/goal-progress.spec.ts`

测试场景：
1. 创建目标并添加 KR，验证进度显示
2. 更新 KR 进度，验证目标进度实时更新
3. 查看进度分解详情，验证数据正确展示

---

## 📊 进度计划

### Phase 1: 后端实现（2-3 小时）
- [x] 分析现有代码结构
- [x] 在 Goal 聚合根中实现 `calculateProgress()` 方法（加权平均）
- [x] 在 KR 相关方法中添加自动触发逻辑（4 个触发点）
- [x] 实现 `getProgressBreakdown()` 方法
- [x] 添加 Application Service 方法
- [x] 添加 API 端点和路由
- [ ] 单元测试 + 集成测试

### Phase 2: 合约层更新（30 分钟）
- [x] 定义 `ProgressBreakdown` 类型
- [x] 添加相关响应类型
- [x] 验证类型一致性

### Phase 3: 前端实现（2-3 小时）
- [x] 更新 API Client
- [x] 更新 Composable（useGoal 和 GoalWebApplicationService）
- [x] 创建 `ProgressBreakdownPanel` 组件
- [x] 集成到 GoalDetailView（添加触发按钮和对话框）
- [ ] 测试 UI 交互（需启动服务器手动测试）

### Phase 4: 测试与验证（1-2 小时）
- [ ] 后端单元测试
- [ ] 后端集成测试
- [ ] 手动功能测试
- [ ] E2E 测试（可选）
- [ ] Bug 修复

**预计总时间**: 6-9 小时（1-1.5 天）

---

## �� 依赖与风险

### 依赖
- ✅ Story 2.2: Key Result Management（已完成）
- ✅ Goal 聚合根已实现
- ✅ KR 实体已实现

### 技术风险
- **低风险**: 加权平均算法简单直接
- **低风险**: 触发点明确（KR 变化时）
- **低风险**: 前端展示逻辑简单

### 假设
- Goal 聚合根已有 `progress` 字段
- KR 实体已有 `progress` 和 `weight` 字段
- 前端已有基础的目标详情页

---

## 🎯 Definition of Done

- [x] ✅ Goal 聚合根实现 `calculateProgress()` 方法
- [x] ✅ KR 变化时自动触发进度重算（4 个触发点）
- [x] ✅ API 端点 `GET /api/goals/:uuid/progress-breakdown` 实现
- [x] ✅ 前端显示实时计算的进度（目标详情页）
- [x] ✅ 前端可查看进度分解详情（ProgressBreakdownPanel 组件）
- [ ] ✅ 后端单元测试通过（>=80% 覆盖率）
- [ ] ✅ 后端集成测试通过
- [ ] ✅ 手动功能测试验证
- [ ] ✅ sprint-status.yaml 更新为 `done`

---

**创建人**: weiwei  
**审核人**: BMad Master  
**Story 状态**: In Progress  
**最后更新**: 2025-10-30
