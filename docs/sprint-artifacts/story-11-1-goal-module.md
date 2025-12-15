# Story 11.1: Goal 模块完整迁移

Status: done

## Story

作为一名**用户**，
我想要**在 Desktop 应用中使用完整的目标管理功能**，
以便**创建、查看、编辑和跟踪我的目标及关键结果**。

## 业务背景

Goal 模块是 DailyUse 的核心模块，Web 端有 35+ 组件，Desktop 端仅有 5 个。需要完整迁移：
- Cards: GoalCard, GoalInfoCard, GoalRecordCard, KeyResultCard, GoalReviewCard
- Dialogs: GoalDialog, GoalDetailDialog, KeyResultDialog, GoalRecordDialog, GoalFolderDialog
- Hooks: useGoal, useGoalManagement, useKeyResult, useGoalFolder
- Views: GoalListView, GoalDetailView, KeyResultDetailView

## Acceptance Criteria

### AC 11.1.1: Goal Cards 组件
```gherkin
Given 用户需要在列表中查看目标信息
When 渲染目标卡片组件
Then GoalCard.tsx 显示目标标题、状态、进度
And GoalInfoCard.tsx 显示目标详细信息
And GoalRecordCard.tsx 显示目标记录卡片
And KeyResultCard.tsx 显示关键结果卡片
And GoalReviewCard.tsx 显示目标复盘卡片
And 所有卡片支持点击交互和状态反馈
```

### AC 11.1.2: Goal Dialogs 组件
```gherkin
Given 用户需要创建、编辑、查看目标
When 打开相应的对话框
Then GoalDialog.tsx 支持创建和编辑目标
And GoalDetailDialog.tsx 显示目标完整详情
And KeyResultDialog.tsx 支持创建和编辑关键结果
And GoalRecordDialog.tsx 支持添加目标记录
And GoalFolderDialog.tsx 支持管理目标文件夹
And 所有对话框支持表单验证和错误提示
```

### AC 11.1.3: Goal Hooks
```gherkin
Given 组件需要访问目标数据和操作
When 使用 Goal 相关 Hooks
Then useGoal.ts 提供目标数据查询和选择
And useGoalManagement.ts 提供目标 CRUD 操作
And useKeyResult.ts 提供关键结果操作
And useGoalFolder.ts 提供文件夹操作
And 所有 Hooks 正确更新 Zustand Store
```

### AC 11.1.4: Goal Views
```gherkin
Given 用户需要浏览和管理目标
When 访问目标相关页面
Then GoalListView.tsx 显示目标列表，支持筛选和搜索
And GoalDetailView.tsx 显示目标完整详情页
And KeyResultDetailView.tsx 显示关键结果详情页
And 页面支持路由导航和状态保持
```

## Tasks / Subtasks

### Task 1: Goal Cards 组件 (AC: 11.1.1)
- [x] T1.1.1: 完善 GoalCard.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalCard.tsx` (227 lines)
  - 显示: 标题、描述、状态徽章、进度条、创建时间
  - 交互: 点击打开详情、状态操作
- [x] T1.1.2: 创建 GoalInfoCard.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalInfoCard.tsx` (162 lines)
- [x] T1.1.3: 创建 GoalRecordCard.tsx (1.5h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalRecordCard.tsx` (110 lines)
- [x] T1.1.4: 创建 KeyResultCard.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/KeyResultCard.tsx` (196 lines)
- [x] T1.1.5: 创建 GoalReviewCard.tsx (1.5h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalReviewCard.tsx` (187 lines)

### Task 2: Goal Dialogs 组件 (AC: 11.1.2)
- [x] T1.2.1: 完善 GoalDialog.tsx（创建/编辑） (3h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalCreateDialog.tsx` (180 lines)
- [x] T1.2.2: 完善 GoalDetailDialog.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalDetailDialog.tsx` (278 lines)
- [x] T1.2.3: 创建 KeyResultDialog.tsx (2.5h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/KeyResultDialog.tsx` (377 lines)
- [x] T1.2.4: 创建 GoalRecordDialog.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/components/GoalRecordDialog.tsx` (224 lines)
- [x] T1.2.5: 创建 GoalFolderDialog.tsx (1.5h) ✅
  - 功能已合并到 `GoalFolderManager.tsx` (289 lines)

### Task 3: Goal Hooks (AC: 11.1.3)
- [x] T1.3.1: 创建 useGoal.ts (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoal.ts` (244 lines)
  - 功能: 获取目标列表、单个目标、按状态筛选
- [x] T1.3.2: 创建 useGoalManagement.ts (2h) ✅
  - 功能已合并到 `useGoal.ts` - 包含完整 CRUD 操作
- [x] T1.3.3: 创建 useKeyResult.ts (1.5h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/hooks/useKeyResult.ts` (204 lines)
- [x] T1.3.4: 创建 useGoalFolder.ts (1h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoalFolder.ts` (133 lines)

### Task 4: Goal Views (AC: 11.1.4)
- [x] T1.4.1: 完善 GoalListView.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/views/GoalListView.tsx` (251 lines)
  - 功能: 目标列表、文件夹导航、筛选、搜索、虚拟滚动
- [x] T1.4.2: 创建 GoalDetailView.tsx（独立页面） (3h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/views/GoalDetailView.tsx` (586 lines)
- [x] T1.4.3: 创建 KeyResultDetailView.tsx (2h) ✅
  - `apps/desktop/src/renderer/modules/goal/presentation/views/KeyResultDetailView.tsx` (417 lines)

## Dev Notes

### 目录结构

```
apps/desktop/src/renderer/modules/goal/presentation/
├── components/
│   ├── cards/
│   │   ├── GoalCard.tsx
│   │   ├── GoalInfoCard.tsx
│   │   ├── GoalRecordCard.tsx
│   │   ├── KeyResultCard.tsx
│   │   ├── GoalReviewCard.tsx
│   │   └── index.ts
│   ├── dialogs/
│   │   ├── GoalDialog.tsx
│   │   ├── GoalDetailDialog.tsx
│   │   ├── KeyResultDialog.tsx
│   │   ├── GoalRecordDialog.tsx
│   │   ├── GoalFolderDialog.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useGoal.ts
│   ├── useGoalManagement.ts
│   ├── useKeyResult.ts
│   ├── useGoalFolder.ts
│   └── index.ts
├── stores/
│   └── goalStore.ts  (已在 Story 11.0 创建)
├── views/
│   ├── GoalListView.tsx
│   ├── GoalDetailView.tsx
│   ├── KeyResultDetailView.tsx
│   └── index.ts
└── index.ts
```

### Vue → React 组件转换示例

```vue
<!-- Vue: GoalCard.vue -->
<template>
  <v-card @click="handleClick">
    <v-card-title>{{ goal.title }}</v-card-title>
    <v-progress-linear :value="goal.progress" />
  </v-card>
</template>
```

```tsx
// React: GoalCard.tsx
import { Card, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md">
      <CardHeader>
        <CardTitle>{goal.title}</CardTitle>
      </CardHeader>
      <Progress value={goal.progress} />
    </Card>
  );
}
```

### Hook 与 Store 集成示例

```typescript
// useGoalManagement.ts
import { useGoalStore } from '../stores/goalStore';
import { goalIpcClient } from '@/modules/goal/application/services/goalIpcClient';
import { toast } from 'sonner';

export function useGoalManagement() {
  const { addGoal, updateGoal, removeGoal, setLoading, setError } = useGoalStore();

  const createGoal = async (data: CreateGoalRequest) => {
    try {
      setLoading(true);
      const goal = await goalIpcClient.createGoal(data);
      addGoal(goal);
      toast.success('目标创建成功');
      return goal;
    } catch (error) {
      setError(error.message);
      toast.error('创建失败: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ... 其他操作

  return { createGoal, ... };
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施) 必须完成
- **依赖 goalStore.ts**: 所有 Hooks 和组件依赖
- **依赖 shadcn/ui**: Card, Dialog, Button, Progress 等组件
- **依赖 IPC Client**: `@dailyuse/infrastructure-client` 或本地 IPC 封装

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web Goal 模块](../../../apps/web/src/modules/goal/)
- [Goal DTO 定义](../../../packages/contracts/src/modules/goal/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Goal Cards 组件 | 9h |
| Goal Dialogs 组件 | 11h |
| Goal Hooks | 6.5h |
| Goal Views | 7h |
| **总计** | **33.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used
Claude Opus 4.5 (Preview)

### Debug Log References
N/A - 所有组件已预先实现

### Completion Notes List
1. **Goal 模块已完整实现**: 所有 Cards、Dialogs、Hooks、Views 组件都已存在
2. **代码行数统计**:
   - Components: 3,413 行 (14个文件)
   - Views: 1,254 行 (3个文件)
   - Hooks: 789 行 (4个文件)
3. **设计决策**:
   - `useGoalManagement.ts` 功能合并到 `useGoal.ts`
   - `GoalFolderDialog.tsx` 功能合并到 `GoalFolderManager.tsx`
   - `GoalDialog.tsx` 重命名为 `GoalCreateDialog.tsx`
4. **额外组件**: GoalDAG(491 lines), GoalTimeline(373 lines), GoalReviewDialog(320 lines)

### File List
**已存在的组件文件:**
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalCard.tsx` (227 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalCreateDialog.tsx` (180 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalDetailDialog.tsx` (278 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalInfoCard.tsx` (162 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalRecordCard.tsx` (110 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalRecordDialog.tsx` (224 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalReviewCard.tsx` (187 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalReviewDialog.tsx` (320 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalFolderManager.tsx` (289 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/KeyResultCard.tsx` (196 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/KeyResultDialog.tsx` (377 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalDAG.tsx` (491 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/components/GoalTimeline.tsx` (373 lines)

**已存在的 Hooks 文件:**
- `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoal.ts` (244 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/hooks/useKeyResult.ts` (204 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoalFolder.ts` (133 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoalReview.ts` (187 lines)

**已存在的 Views 文件:**
- `apps/desktop/src/renderer/modules/goal/presentation/views/GoalListView.tsx` (251 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/views/GoalDetailView.tsx` (586 lines)
- `apps/desktop/src/renderer/modules/goal/presentation/views/KeyResultDetailView.tsx` (417 lines)