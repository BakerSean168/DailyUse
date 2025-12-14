# Story 11.5: Dashboard 模块迁移

Status: ready-for-dev

## Story

作为一名**用户**，
我想要**在 Desktop 应用中看到仪表板概览**，
以便**快速了解今日任务、目标进度、即将到来的提醒等关键信息**。

## 业务背景

Dashboard 模块提供应用首页仪表板。需要创建可配置的 Widget 系统：
- Widget 基类和各类具体 Widget
- Dashboard 布局和配置
- 统计数据展示

## Acceptance Criteria

### AC 11.5.1: Dashboard Widget 组件
```gherkin
Given 用户需要在仪表板查看各模块摘要
When 渲染 Widget 组件
Then DashboardWidget.tsx 提供 Widget 基础框架
And GoalWidget.tsx 显示目标进度摘要
And TaskWidget.tsx 显示今日任务列表
And ReminderWidget.tsx 显示即将到来的提醒
And StatisticsWidget.tsx 显示统计数据图表
```

### AC 11.5.2: Dashboard View
```gherkin
Given 用户访问仪表板页面
When 渲染 Dashboard 视图
Then DashboardView.tsx 显示可配置的 Widget 网格布局
And 支持 Widget 拖拽排序（可选）
And 支持 Widget 显示/隐藏配置
```

## Tasks / Subtasks

### Task 1: Dashboard Widget 组件 (AC: 11.5.1)
- [ ] T5.1.1: 创建 DashboardWidget.tsx（基类） (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/components/DashboardWidget.tsx`
  - 功能: Widget 容器、标题、刷新按钮、展开/收起
- [ ] T5.1.2: 创建 GoalWidget.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/components/widgets/GoalWidget.tsx`
  - 显示: 活跃目标数量、总体进度、最近更新的目标
- [ ] T5.1.3: 创建 TaskWidget.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/components/widgets/TaskWidget.tsx`
  - 显示: 今日任务列表、完成进度、快速完成操作
- [ ] T5.1.4: 创建 ReminderWidget.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/components/widgets/ReminderWidget.tsx`
  - 显示: 即将触发的提醒、快速确认
- [ ] T5.1.5: 创建 StatisticsWidget.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/components/widgets/StatisticsWidget.tsx`
  - 显示: 周/月完成统计、趋势图表

### Task 2: Dashboard View (AC: 11.5.2)
- [ ] T5.2.1: 完善 DashboardView.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/dashboard/presentation/views/DashboardView.tsx`
  - 功能: Widget 网格布局、响应式设计

## Dev Notes

### 目录结构

```
apps/desktop/src/renderer/modules/dashboard/presentation/
├── components/
│   ├── widgets/
│   │   ├── GoalWidget.tsx
│   │   ├── TaskWidget.tsx
│   │   ├── ReminderWidget.tsx
│   │   ├── StatisticsWidget.tsx
│   │   └── index.ts
│   ├── DashboardWidget.tsx
│   └── index.ts
├── views/
│   ├── DashboardView.tsx
│   └── index.ts
└── index.ts
```

### Widget 基类实现

```tsx
// DashboardWidget.tsx
interface DashboardWidgetProps {
  title: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export function DashboardWidget({ title, icon, onRefresh, loading, children }: DashboardWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-32" /> : children}
      </CardContent>
    </Card>
  );
}
```

### Dashboard 网格布局

```tsx
// DashboardView.tsx
function DashboardView() {
  return (
    <PageContainer title="仪表板">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GoalWidget />
        <TaskWidget />
        <ReminderWidget />
        <StatisticsWidget className="md:col-span-2" />
      </div>
    </PageContainer>
  );
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施)
- **数据依赖**: Goal、Task、Reminder 模块的 Store

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web Dashboard 模块](../../../apps/web/src/modules/dashboard/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Dashboard Widget 组件 | 10h |
| Dashboard View | 2h |
| **总计** | **12h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

