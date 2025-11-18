# 目标聚合视图端点修复

## 问题

前端请求 `/api/goals/{goalUuid}/aggregate` 端点获取目标的权重分布图数据，但后端返回 404 错误，因为这个端点还未实现。

**错误信息**:
```
GET http://localhost:3888/api/v1/goals/2988f69c-851c-4008-9463-838df63d0f9f/aggregate
Status Code: 404 Not Found
```

## 解决方案

### 1. 后端实现

#### ✅ GoalController.ts
新增方法 `getGoalAggregateView()`:
```typescript
static async getGoalAggregateView(req: AuthenticatedRequest, res: Response): Promise<Response> {
  // 获取目标信息
  // 获取权重分布
  // 计算统计信息（总 KR 数、完成 KR 数、总记录数、总体进度）
  // 返回聚合视图
}
```

**功能**:
- 验证用户认证和目标归属权限
- 调用 `WeightSnapshotApplicationService.getWeightSumInfo()` 获取权重分布
- 计算目标的聚合统计信息
- 使用正确的权重计算公式（权重比例而非百分比）

#### ✅ 导入依赖
```typescript
import { WeightSnapshotApplicationService } from '../../application/services/WeightSnapshotApplicationService';
import { PrismaGoalRepository } from '../../infrastructure/repositories/PrismaGoalRepository';
import { PrismaWeightSnapshotRepository } from '../../infrastructure/repositories/PrismaWeightSnapshotRepository';
import prisma from '../../../../shared/db/prisma';
import type { GoalContracts } from '@dailyuse/contracts';
```

#### ✅ 添加服务初始化
```typescript
private static weightSnapshotService: WeightSnapshotApplicationService | null = null;

private static async getWeightSnapshotService(): Promise<WeightSnapshotApplicationService> {
  if (!GoalController.weightSnapshotService) {
    const goalRepo = new PrismaGoalRepository(prisma);
    const snapshotRepo = new PrismaWeightSnapshotRepository(prisma);
    GoalController.weightSnapshotService = WeightSnapshotApplicationService.getInstance(
      goalRepo,
      snapshotRepo,
    );
  }
  return GoalController.weightSnapshotService;
}
```

#### ✅ goalRoutes.ts
添加路由:
```typescript
router.get('/:uuid/aggregate', GoalController.getGoalAggregateView);
```

**重要**: 此路由必须在 `/:uuid` 路由之前，因为路由按顺序匹配。

### 2. 返回数据格式

**Response**:
```json
{
  "success": true,
  "data": {
    "goal": {
      "uuid": "goal-123",
      "accountUuid": "account-456",
      "title": "Q4 Growth Target",
      ...
    },
    "keyResults": [
      {
        "uuid": "kr-1",
        "title": "User Growth",
        "weight": 5,
        "weightPercentage": 35.71,
        "progress": {
          "currentValue": 150,
          "targetValue": 200,
          ...
        },
        ...
      },
      {
        "uuid": "kr-2",
        "title": "Revenue Growth",
        "weight": 5,
        "weightPercentage": 35.71,
        ...
      },
      {
        "uuid": "kr-3",
        "title": "Retention Rate",
        "weight": 4,
        "weightPercentage": 28.57,
        ...
      }
    ],
    "statistics": {
      "totalKeyResults": 3,
      "completedKeyResults": 1,
      "totalRecords": 12,
      "totalReviews": 0,
      "overallProgress": 67  // 使用新的权重计算公式
    }
  },
  "message": "Goal aggregate view retrieved successfully"
}
```

### 3. 权重计算

#### 总体进度计算
```typescript
const totalWeight = weightInfo.totalWeight;  // 5 + 5 + 4 = 14
const overallProgress = Math.round(
  keyResults.reduce((sum, kr) => {
    const progressPercentage = (kr.progress.currentValue / kr.progress.targetValue) * 100;
    return sum + (progressPercentage * (kr.weight / totalWeight));
  }, 0)
);
```

#### 权重占比显示
```typescript
const weightPercentage = (kr.weight / totalWeight) * 100;
// KR1: (5/14) * 100 = 35.71%
// KR2: (5/14) * 100 = 35.71%
// KR3: (4/14) * 100 = 28.57%
```

## 前端使用

前端现在可以正常调用:
```typescript
const response = await goalApiClient.getGoalAggregateView(goalUuid);
```

获得的数据可以用于:
1. **权重分布图**: 显示每个 KR 的权重占比
2. **总体进度**: 使用加权平均计算的目标总体进度
3. **统计信息**: KR 总数、完成数、记录数等

## 修改文件清单

- ✅ `apps/api/src/modules/goal/interface/http/GoalController.ts`
  - 添加导入
  - 添加 `weightSnapshotService` 属性
  - 添加 `getWeightSnapshotService()` 初始化方法
  - 新增 `getGoalAggregateView()` 方法

- ✅ `apps/api/src/modules/goal/interface/http/goalRoutes.ts`
  - 添加 `/:uuid/aggregate` 路由

## 验证

✅ 编译通过（无 Goal/Aggregate 相关错误）

## 下一步

1. 测试前端权重分布图的显示
2. 验证权重计算的正确性
3. 检查数据格式是否与前端期望一致
