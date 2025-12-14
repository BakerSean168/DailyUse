# Story 11.4: Reminder 模块完整迁移

Status: ready-for-dev

## Story

作为一名**用户**，
我想要**在 Desktop 应用中使用完整的提醒管理功能**，
以便**创建提醒模板、管理提醒分组、查看提醒历史**。

## 业务背景

Reminder 模块管理提醒模板和分组。Web 端有 12+ 组件，Desktop 端完全缺失。需要完整迁移：
- Cards: ReminderGroupCard, ReminderTemplateCard
- Dialogs: ReminderGroupDialog, ReminderTemplateDialog, TemplateMoveDialog
- Components: ReminderInstanceSidebar
- Hooks: useReminder, useReminderGroup
- Views: ReminderDesktopView

## Acceptance Criteria

### AC 11.4.1: Reminder Cards 组件
```gherkin
Given 用户需要查看提醒分组和模板
When 渲染提醒卡片组件
Then ReminderGroupCard.tsx 显示分组信息（名称、模板数量、启用状态）
And ReminderTemplateCard.tsx 显示模板信息（标题、触发规则、下次触发时间）
```

### AC 11.4.2: Reminder Dialogs 组件
```gherkin
Given 用户需要创建和编辑提醒
When 打开相应的对话框
Then ReminderGroupDialog.tsx 支持创建/编辑分组
And ReminderTemplateDialog.tsx 支持创建/编辑模板
And TemplateMoveDialog.tsx 支持移动模板到其他分组
```

### AC 11.4.3: Reminder 其他组件
```gherkin
Given 用户需要查看提醒实例
When 渲染提醒侧边栏
Then ReminderInstanceSidebar.tsx 显示即将触发的提醒列表
```

### AC 11.4.4: Reminder Hooks & Store
```gherkin
Given 组件需要访问提醒数据
When 使用 Reminder 相关 Hooks
Then reminderStore.ts 管理提醒状态
And useReminder.ts 提供模板操作
And useReminderGroup.ts 提供分组操作
```

### AC 11.4.5: Reminder Views
```gherkin
Given 用户需要管理提醒
When 访问提醒页面
Then ReminderDesktopView.tsx 显示完整提醒管理界面
And 支持分组树、模板列表、筛选搜索
```

## Tasks / Subtasks

### Task 1: Reminder Cards 组件 (AC: 11.4.1)
- [ ] T4.1.1: 创建 ReminderGroupCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/cards/ReminderGroupCard.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/cards/GroupDesktopCard.vue`
  - 显示: 分组名称、图标、模板数量、启用/禁用状态
- [ ] T4.1.2: 创建 ReminderTemplateCard.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/cards/ReminderTemplateCard.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/cards/TemplateDesktopCard.vue`
  - 显示: 标题、触发规则描述、下次触发时间、启用开关

### Task 2: Reminder Dialogs 组件 (AC: 11.4.2)
- [ ] T4.1.3: 创建 ReminderGroupDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/dialogs/ReminderGroupDialog.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/dialogs/GroupDialog.vue`
  - 功能: 创建/编辑分组、设置图标颜色
- [ ] T4.1.4: 创建 ReminderTemplateDialog.tsx (2.5h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/dialogs/ReminderTemplateDialog.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/dialogs/TemplateDialog.vue`
  - 功能: 创建/编辑模板、设置触发规则、选择分组
- [ ] T4.1.5: 创建 TemplateMoveDialog.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/dialogs/TemplateMoveDialog.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/dialogs/TemplateMoveDialog.vue`

### Task 3: Reminder 其他组件 (AC: 11.4.3)
- [ ] T4.1.6: 创建 ReminderInstanceSidebar.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/components/ReminderInstanceSidebar.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/components/ReminderInstanceSidebar.vue`
  - 功能: 显示即将触发的提醒、快速确认/推迟

### Task 4: Reminder Hooks & Store (AC: 11.4.4)
- [ ] T4.2.1: 创建 reminderStore.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/stores/reminderStore.ts`
  - 状态: 模板列表、分组列表、即将触发的提醒、选中项
- [ ] T4.2.2: 创建 useReminder.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/hooks/useReminder.ts`
  - 功能: 模板 CRUD、启用/禁用模板
- [ ] T4.2.3: 创建 useReminderGroup.ts (1h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/hooks/useReminderGroup.ts`
  - 功能: 分组 CRUD、启用/禁用分组

### Task 5: Reminder Views (AC: 11.4.5)
- [ ] T4.3.1: 创建 ReminderDesktopView.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/reminder/presentation/views/ReminderDesktopView.tsx`
  - 参考: `apps/web/src/modules/reminder/presentation/views/ReminderDesktopView.vue`
  - 功能: 左侧分组树、右侧模板列表、顶部工具栏

## Dev Notes

### 目录结构

```
apps/desktop/src/renderer/modules/reminder/presentation/
├── components/
│   ├── cards/
│   │   ├── ReminderGroupCard.tsx
│   │   ├── ReminderTemplateCard.tsx
│   │   └── index.ts
│   ├── dialogs/
│   │   ├── ReminderGroupDialog.tsx
│   │   ├── ReminderTemplateDialog.tsx
│   │   ├── TemplateMoveDialog.tsx
│   │   └── index.ts
│   ├── ReminderInstanceSidebar.tsx
│   └── index.ts
├── hooks/
│   ├── useReminder.ts
│   ├── useReminderGroup.ts
│   └── index.ts
├── stores/
│   └── reminderStore.ts
├── views/
│   ├── ReminderDesktopView.tsx
│   └── index.ts
└── index.ts
```

### 提醒模型说明

```typescript
// ReminderTemplate - 提醒模板
interface ReminderTemplate {
  uuid: string;
  title: string;
  description?: string;
  groupUuid: string;
  triggerRule: TriggerRule;  // 触发规则（时间、重复等）
  selfEnabled: boolean;
  effectiveEnabled: boolean; // 受分组影响的最终启用状态
  nextTriggerTime?: Date;
}

// ReminderGroup - 提醒分组
interface ReminderGroup {
  uuid: string;
  name: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  templateCount: number;
}
```

### 提醒触发规则

```typescript
interface TriggerRule {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
  time?: string;        // HH:mm 格式
  daysOfWeek?: number[]; // 0-6 (周日-周六)
  dayOfMonth?: number;
  cronExpression?: string;
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施) 必须完成
- **依赖**: date-fns (日期处理)、cronstrue (cron 表达式解析)

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web Reminder 模块](../../../apps/web/src/modules/reminder/)
- [Reminder DTO 定义](../../../packages/contracts/src/modules/reminder/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Reminder Cards 组件 | 4h |
| Reminder Dialogs 组件 | 6h |
| Reminder 其他组件 | 2h |
| Reminder Hooks & Store | 4.5h |
| Reminder Views | 3h |
| **总计** | **19.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

