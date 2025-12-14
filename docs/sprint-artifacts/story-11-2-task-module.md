# Story 11.2: Task 模块完整迁移

Status: ready-for-dev

## Story

作为一名**用户**，
我想要**在 Desktop 应用中使用完整的任务管理功能**，
以便**创建、管理任务模板和任务实例，并追踪任务完成情况**。

## 业务背景

Task 模块管理任务模板（TaskTemplate）和任务实例（TaskInstance）。Web 端有 25+ 组件，Desktop 端仅有 5 个。需要完整迁移：
- Cards: TaskCard, TaskInstanceCard, TaskInfoCard, DraggableTaskCard
- Dialogs: TaskTemplateDialog, TaskDetailDialog, TaskCompleteDialog, TemplateSelectionDialog
- Hooks: useTaskTemplate, useTaskInstance, useTaskDependency
- Views: TaskListView, TaskManagementView

## Acceptance Criteria

### AC 11.2.1: Task Cards 组件
```gherkin
Given 用户需要在列表中查看任务信息
When 渲染任务卡片组件
Then TaskCard.tsx 显示任务模板信息（标题、描述、重复规则）
And TaskInstanceCard.tsx 显示任务实例（状态、计划时间、实际完成）
And TaskInfoCard.tsx 显示任务详细信息
And DraggableTaskCard.tsx 支持拖拽排序
```

### AC 11.2.2: Task Dialogs 组件
```gherkin
Given 用户需要创建、编辑、完成任务
When 打开相应的对话框
Then TaskTemplateDialog.tsx 支持创建和编辑任务模板
And TaskDetailDialog.tsx 显示任务详情
And TaskCompleteDialog.tsx 支持记录任务完成情况
And TemplateSelectionDialog.tsx 支持选择任务模板
```

### AC 11.2.3: Task Hooks
```gherkin
Given 组件需要访问任务数据和操作
When 使用 Task 相关 Hooks
Then useTaskTemplate.ts 提供任务模板 CRUD
And useTaskInstance.ts 提供任务实例操作
And useTaskDependency.ts 提供任务依赖管理
```

### AC 11.2.4: Task Views
```gherkin
Given 用户需要浏览和管理任务
When 访问任务相关页面
Then TaskListView.tsx 显示任务列表（今日任务、全部任务）
And TaskManagementView.tsx 支持任务模板管理
```

## Tasks / Subtasks

### Task 1: Task Cards 组件 (AC: 11.2.1)
- [ ] T2.1.1: 完善 TaskCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskCard.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/cards/TaskTemplateCard.vue`
  - 显示: 标题、描述、重复规则、优先级、标签
- [ ] T2.1.2: 创建 TaskInstanceCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInstanceCard.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/cards/TaskInstanceCard.vue`
  - 显示: 状态、计划时间、实际完成时间、完成按钮
- [ ] T2.1.3: 创建 TaskInfoCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/cards/TaskInfoCard.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/cards/TaskInfoShowCard.vue`
- [ ] T2.1.4: 创建 DraggableTaskCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/cards/DraggableTaskCard.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/cards/DraggableTaskCard.vue`
  - 使用 @dnd-kit/core 实现拖拽

### Task 2: Task Dialogs 组件 (AC: 11.2.2)
- [ ] T2.2.1: 完善 TaskTemplateDialog.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TaskTemplateDialog.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/dialogs/TaskTemplateDialog.vue`
  - 功能: 创建/编辑模板、设置重复规则、关联目标
- [ ] T2.2.2: 完善 TaskDetailDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TaskDetailDialog.tsx`
  - 参考: `apps/web/src/modules/task/presentation/views/TaskDetailView.vue`
- [ ] T2.2.3: 创建 TaskCompleteDialog.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TaskCompleteDialog.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/dialogs/TaskCompleteDialog.vue`
  - 功能: 确认完成、添加备注、记录实际用时
- [ ] T2.2.4: 创建 TemplateSelectionDialog.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/components/dialogs/TemplateSelectionDialog.tsx`
  - 参考: `apps/web/src/modules/task/presentation/components/dialogs/TemplateSelectionDialog.vue`

### Task 3: Task Hooks (AC: 11.2.3)
- [ ] T2.3.1: 创建 useTaskTemplate.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts`
  - 功能: 获取模板列表、创建/更新/删除模板
- [ ] T2.3.2: 创建 useTaskInstance.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskInstance.ts`
  - 功能: 获取实例列表、完成/跳过实例、更新状态
- [ ] T2.3.3: 创建 useTaskDependency.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskDependency.ts`
  - 功能: 管理任务依赖关系

### Task 4: Task Views (AC: 11.2.4)
- [ ] T2.4.1: 完善 TaskListView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/views/TaskListView.tsx`
  - 参考: `apps/web/src/modules/task/presentation/views/TaskListView.vue`
  - 功能: 今日任务、待办任务、已完成任务视图切换
- [ ] T2.4.2: 创建 TaskManagementView.tsx (2.5h)
  - 路径: `apps/desktop/src/renderer/modules/task/presentation/views/TaskManagementView.tsx`
  - 参考: `apps/web/src/modules/task/presentation/views/TaskManagementView.vue`
  - 功能: 任务模板管理、批量操作

## Dev Notes

### 目录结构

```
apps/desktop/src/renderer/modules/task/presentation/
├── components/
│   ├── cards/
│   │   ├── TaskCard.tsx
│   │   ├── TaskInstanceCard.tsx
│   │   ├── TaskInfoCard.tsx
│   │   ├── DraggableTaskCard.tsx
│   │   └── index.ts
│   ├── dialogs/
│   │   ├── TaskTemplateDialog.tsx
│   │   ├── TaskDetailDialog.tsx
│   │   ├── TaskCompleteDialog.tsx
│   │   ├── TemplateSelectionDialog.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useTaskTemplate.ts
│   ├── useTaskInstance.ts
│   ├── useTaskDependency.ts
│   └── index.ts
├── stores/
│   └── taskStore.ts  (已在 Story 11.0 创建)
├── views/
│   ├── TaskListView.tsx
│   ├── TaskManagementView.tsx
│   └── index.ts
└── index.ts
```

### 任务模型说明

```typescript
// TaskTemplate - 任务模板（定义任务规则）
interface TaskTemplate {
  uuid: string;
  title: string;
  description?: string;
  repeatRule?: RepeatRule;  // 重复规则
  goalUuid?: string;        // 关联目标
  priority: Priority;
  tags: string[];
  estimatedMinutes?: number;
}

// TaskInstance - 任务实例（具体执行记录）
interface TaskInstance {
  uuid: string;
  templateUuid: string;
  scheduledDate: Date;
  status: TaskInstanceStatus;  // PENDING, COMPLETED, SKIPPED
  completedAt?: Date;
  actualMinutes?: number;
  notes?: string;
}
```

### 拖拽功能实现

```tsx
// 使用 @dnd-kit/core
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function TaskList({ tasks }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // 重新排序逻辑
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.uuid)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <DraggableTaskCard key={task.uuid} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施) 必须完成
- **依赖 taskStore.ts**: 所有 Hooks 和组件依赖
- **可选依赖**: @dnd-kit/core (拖拽功能)

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web Task 模块](../../../apps/web/src/modules/task/)
- [Task DTO 定义](../../../packages/contracts/src/modules/task/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Task Cards 组件 | 7.5h |
| Task Dialogs 组件 | 8h |
| Task Hooks | 5.5h |
| Task Views | 4.5h |
| **总计** | **25.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

