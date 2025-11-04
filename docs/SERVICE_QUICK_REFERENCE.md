# 📚 Goal 应用服务快速参考

## 🎯 一句话服务对应表

| 需求 | 使用服务 | 方法 |
|------|---------|------|
| 创建/查询/更新/删除 Goal | `goalManagementApplicationService` | `createGoal/getGoals/updateGoal/deleteGoal` |
| 激活/暂停/完成/归档 Goal | `goalManagementApplicationService` | `activateGoal/pauseGoal/completeGoal/archiveGoal` |
| 创建/更新/删除 KeyResult | `keyResultApplicationService` | `createKeyResultForGoal/updateKeyResultForGoal/deleteKeyResultForGoal` |
| 查看 KeyResult 列表 | `keyResultApplicationService` | `getKeyResultsByGoal` |
| 批量更新 KeyResult 权重 | `keyResultApplicationService` | `batchUpdateKeyResultWeights` |
| 创建/查询/更新/删除 Record | `goalRecordApplicationService` | `createGoalRecord/getGoalRecordsByKeyResult/getGoalRecordsByGoal` |
| 创建/查询/更新/删除 Review | `goalReviewApplicationService` | `createGoalReview/getGoalReviewsByGoal/updateGoalReview/deleteGoalReview` |
| 创建/查询/更新/删除 Folder | `goalFolderApplicationService` | `createGoalFolder/getGoalFolders/updateGoalFolder/deleteGoalFolder` |
| 应用初始化加载所有数据 | `goalSyncApplicationService` | `syncAllGoalsAndFolders` |
| 刷新所有数据 | `goalSyncApplicationService` | `refreshAll` |

---

## 💻 代码示例

### ✅ Goal 操作
```typescript
import { goalManagementApplicationService } from '@/modules/goal';

// 创建
const newGoal = await goalManagementApplicationService.createGoal({
  title: 'Q1 目标',
  description: '...'
});

// 查询列表（自动获取 KeyResults）
const goals = await goalManagementApplicationService.getGoals();

// 查询单个
const goal = await goalManagementApplicationService.getGoalById(goalId);

// 更新
await goalManagementApplicationService.updateGoal(goalId, { title: '新标题' });

// 删除
await goalManagementApplicationService.deleteGoal(goalId);

// 状态管理
await goalManagementApplicationService.activateGoal(goalId);
await goalManagementApplicationService.pauseGoal(goalId);
await goalManagementApplicationService.completeGoal(goalId);
await goalManagementApplicationService.archiveGoal(goalId);
```

### ✅ KeyResult 操作
```typescript
import { keyResultApplicationService } from '@/modules/goal';

// 创建
const kr = await keyResultApplicationService.createKeyResultForGoal(goalId, {
  title: 'KR1',
  targetValue: 100
});

// 查询
const krs = await keyResultApplicationService.getKeyResultsByGoal(goalId);

// 更新
await keyResultApplicationService.updateKeyResultForGoal(goalId, krId, {
  title: '新 KR'
});

// 删除
await keyResultApplicationService.deleteKeyResultForGoal(goalId, krId);

// 批量更新权重
await keyResultApplicationService.batchUpdateKeyResultWeights(goalId, {
  updates: [
    { keyResultUuid: krId1, weight: 0.4 },
    { keyResultUuid: krId2, weight: 0.6 }
  ]
});
```

### ✅ Record 操作
```typescript
import { goalRecordApplicationService } from '@/modules/goal';

// 创建记录
const record = await goalRecordApplicationService.createGoalRecord(
  goalId,
  keyResultId,
  { value: 50, note: '完成了 50%' }
);

// 查询 KeyResult 的记录
const records = await goalRecordApplicationService.getGoalRecordsByKeyResult(
  goalId,
  keyResultId,
  { page: 1, limit: 10 }
);

// 查询 Goal 的所有记录
const allRecords = await goalRecordApplicationService.getGoalRecordsByGoal(
  goalId,
  { dateRange: { start: '2025-01-01', end: '2025-12-31' } }
);
```

### ✅ Review 操作
```typescript
import { goalReviewApplicationService } from '@/modules/goal';

// 创建复盘
const review = await goalReviewApplicationService.createGoalReview(goalId, {
  title: 'Q1 复盘',
  content: '完成度 80%，下季度继续...'
});

// 查询复盘
const reviews = await goalReviewApplicationService.getGoalReviewsByGoal(goalId);

// 更新复盘
await goalReviewApplicationService.updateGoalReview(goalId, reviewId, {
  content: '更新的复盘内容'
});

// 删除复盘
await goalReviewApplicationService.deleteGoalReview(goalId, reviewId);
```

### ✅ 应用初始化
```typescript
import { goalSyncApplicationService } from '@/modules/goal';

// 在应用启动时调用
const result = await goalSyncApplicationService.syncAllGoalsAndFolders();
console.log(`加载了 ${result.goalsCount} 个目标，${result.foldersCount} 个文件夹`);

// 手动刷新
await goalSyncApplicationService.refreshAll();
```

---

## 🔍 服务定位速查

**问：我要操作 Goal，用哪个服务？**
→ 答：`goalManagementApplicationService`

**问：我要操作 KeyResult，用哪个服务？**
→ 答：`keyResultApplicationService`

**问：我要添加记录，用哪个服务？**
→ 答：`goalRecordApplicationService`

**问：我要写复盘，用哪个服务？**
→ 答：`goalReviewApplicationService`

**问：我要管理文件夹，用哪个服务？**
→ 答：`goalFolderApplicationService`

**问：应用启动要加载数据，用哪个服务？**
→ 答：`goalSyncApplicationService`

---

## ⚡ 最常用的 3 个服务

```typescript
// 1. Goal 管理（90% 的场景）
import { goalManagementApplicationService } from '@/modules/goal';

// 2. KeyResult 管理（8% 的场景）
import { keyResultApplicationService } from '@/modules/goal';

// 3. Record 管理（2% 的场景）
import { goalRecordApplicationService } from '@/modules/goal';
```

---

## 📌 重要注意事项

✅ **自动同步**：所有服务都会自动同步到 Pinia store  
✅ **自动提示**：所有成功/失败都有 Snackbar 提示  
✅ **自动加载状态**：操作时自动设置加载状态  
✅ **自动刷新**：KeyResult/Record/Review 操作后自动刷新关联 Goal  

❌ **不要混用**：不要在同一功能中混用多个服务  
❌ **不要重复调用**：系统会自动同步，不需要手动调用多次  
❌ **不要忽视错误**：所有操作都可能失败，都有 try-catch  

---

## 🚀 迁移指南（如果还在用旧服务）

### 旧方式 ❌
```typescript
import { goalWebApplicationService } from '@/modules/goal';
const kr = await goalWebApplicationService.createKeyResultForGoal(...);
```

### 新方式 ✅
```typescript
import { keyResultApplicationService } from '@/modules/goal';
const kr = await keyResultApplicationService.createKeyResultForGoal(...);
```

