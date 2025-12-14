# Story 11.1: Goal 模块完整迁移

Status: ready-for-dev

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
- [ ] T1.1.1: 完善 GoalCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/cards/GoalCard.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/cards/GoalCard.vue`
  - 显示: 标题、描述、状态徽章、进度条、创建时间
  - 交互: 点击打开详情、右键菜单
- [ ] T1.1.2: 创建 GoalInfoCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/cards/GoalInfoCard.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/cards/GoalInfoShowCard.vue`
  - 显示: 完整目标信息展示卡片
- [ ] T1.1.3: 创建 GoalRecordCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/cards/GoalRecordCard.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/cards/GoalRecordCard.vue`
- [ ] T1.1.4: 创建 KeyResultCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/cards/KeyResultCard.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/cards/KeyResultCard.vue`
  - 显示: KR 标题、当前值/目标值、进度
- [ ] T1.1.5: 创建 GoalReviewCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/cards/GoalReviewCard.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/cards/GoalReviewListCard.vue`

### Task 2: Goal Dialogs 组件 (AC: 11.1.2)
- [ ] T1.2.1: 完善 GoalDialog.tsx（创建/编辑） (3h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/dialogs/GoalDialog.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/dialogs/GoalDialog.vue`
  - 功能: 表单验证、文件夹选择、重要度/紧急度设置
  - 使用 react-hook-form + zod
- [ ] T1.2.2: 完善 GoalDetailDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/dialogs/GoalDetailDialog.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/views/GoalDetailView.vue`
  - 显示: 完整目标信息、关键结果列表、操作按钮
- [ ] T1.2.3: 创建 KeyResultDialog.tsx (2.5h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/dialogs/KeyResultDialog.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/dialogs/KeyResultDialog.vue`
  - 功能: 创建/编辑关键结果、设置目标值
- [ ] T1.2.4: 创建 GoalRecordDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/dialogs/GoalRecordDialog.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/dialogs/GoalRecordDialog.vue`
- [ ] T1.2.5: 创建 GoalFolderDialog.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/components/dialogs/GoalFolderDialog.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/components/dialogs/GoalFolderDialog.vue`

### Task 3: Goal Hooks (AC: 11.1.3)
- [ ] T1.3.1: 创建 useGoal.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoal.ts`
  - 参考: `apps/web/src/modules/goal/presentation/composables/useGoal.ts`
  - 功能: 获取目标列表、单个目标、按状态筛选
- [ ] T1.3.2: 创建 useGoalManagement.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoalManagement.ts`
  - 参考: `apps/web/src/modules/goal/presentation/composables/useGoalManagement.ts`
  - 功能: 创建、更新、删除、完成、归档目标
- [ ] T1.3.3: 创建 useKeyResult.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/hooks/useKeyResult.ts`
  - 参考: `apps/web/src/modules/goal/presentation/composables/useKeyResult.ts`
  - 功能: 关键结果 CRUD、进度更新
- [ ] T1.3.4: 创建 useGoalFolder.ts (1h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoalFolder.ts`
  - 参考: `apps/web/src/modules/goal/presentation/composables/useGoalFolder.ts`

### Task 4: Goal Views (AC: 11.1.4)
- [ ] T1.4.1: 完善 GoalListView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/views/GoalListView.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/views/GoalListView.vue`
  - 功能: 目标列表、文件夹导航、筛选、搜索、排序
- [ ] T1.4.2: 创建 GoalDetailView.tsx（独立页面） (3h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/views/GoalDetailView.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/views/GoalDetailView.vue`
  - 功能: 完整目标详情页、KR 列表、进度图表
- [ ] T1.4.3: 创建 KeyResultDetailView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/goal/presentation/views/KeyResultDetailView.tsx`
  - 参考: `apps/web/src/modules/goal/presentation/views/KeyResultDetailView.vue`

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

### Debug Log References

### Completion Notes List

### File List

