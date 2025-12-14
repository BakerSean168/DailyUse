# Story 11.3: Schedule 模块完整迁移

Status: ready-for-dev

## Story

作为一名**用户**，
我想要**在 Desktop 应用中使用完整的日程管理功能**，
以便**查看周历、管理日程安排、处理时间冲突**。

## 业务背景

Schedule 模块提供日程视图和日程管理。Web 端有 12+ 组件，Desktop 端仅有 1 个。需要完整迁移：
- Components: WeekViewCalendar, ScheduleEventList, ScheduleCard, ConflictAlert
- Dialogs: CreateScheduleDialog, ScheduleTaskDetailDialog
- Hooks: useSchedule
- Views: ScheduleWeekView

## Acceptance Criteria

### AC 11.3.1: Schedule 核心组件
```gherkin
Given 用户需要查看和管理日程
When 渲染日程相关组件
Then WeekViewCalendar.tsx 显示周历视图（7天 x 24小时）
And ScheduleEventList.tsx 显示当日事件列表
And ScheduleCard.tsx 显示单个日程卡片
And ConflictAlert.tsx 提示时间冲突
```

### AC 11.3.2: Schedule Dialogs 组件
```gherkin
Given 用户需要创建和查看日程
When 打开相应的对话框
Then CreateScheduleDialog.tsx 支持创建新日程
And ScheduleTaskDetailDialog.tsx 显示日程详情
```

### AC 11.3.3: Schedule Hooks & Store
```gherkin
Given 组件需要访问日程数据
When 使用 Schedule 相关 Hooks
Then scheduleStore.ts 管理日程状态
And useSchedule.ts 提供日程查询和操作
```

### AC 11.3.4: Schedule Views
```gherkin
Given 用户需要浏览日程
When 访问日程页面
Then ScheduleWeekView.tsx 显示完整周历视图
And 支持周切换、日期选择、事件拖拽
```

## Tasks / Subtasks

### Task 1: Schedule 核心组件 (AC: 11.3.1)
- [ ] T3.1.1: 创建 WeekViewCalendar.tsx (4h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/WeekViewCalendar.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/WeekViewCalendar.vue`
  - 功能: 7天周视图、24小时时间轴、事件块显示、拖拽调整
- [ ] T3.1.2: 创建 ScheduleEventList.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/ScheduleEventList.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/ScheduleEventList.vue`
  - 功能: 当日事件列表、时间排序、快速操作
- [ ] T3.1.3: 创建 ScheduleCard.tsx (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/cards/ScheduleCard.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/cards/`
- [ ] T3.1.4: 创建 ConflictAlert.tsx (1h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/ConflictAlert.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/ConflictAlert.vue`
  - 功能: 时间冲突警告、建议解决方案

### Task 2: Schedule Dialogs 组件 (AC: 11.3.2)
- [ ] T3.1.5: 创建 CreateScheduleDialog.tsx (2.5h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/dialogs/CreateScheduleDialog.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/CreateScheduleDialog.vue`
  - 功能: 选择时间、设置提醒、关联任务
- [ ] T3.1.6: 创建 ScheduleTaskDetailDialog.tsx (2h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/components/dialogs/ScheduleTaskDetailDialog.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/components/ScheduleTaskDetailDialog.vue`

### Task 3: Schedule Hooks & Store (AC: 11.3.3)
- [ ] T3.2.1: 创建 scheduleStore.ts (2h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/stores/scheduleStore.ts`
  - 状态: 日程列表、当前周、选中日期、冲突信息
- [ ] T3.2.2: 创建 useSchedule.ts (1.5h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/hooks/useSchedule.ts`
  - 功能: 获取周日程、创建/更新/删除日程、冲突检测

### Task 4: Schedule Views (AC: 11.3.4)
- [ ] T3.3.1: 完善 ScheduleWeekView.tsx (3h)
  - 路径: `apps/desktop/src/renderer/modules/schedule/presentation/views/ScheduleWeekView.tsx`
  - 参考: `apps/web/src/modules/schedule/presentation/views/ScheduleWeekView.vue`
  - 功能: 周历主视图、导航栏、侧边栏事件列表

## Dev Notes

### 目录结构

```
apps/desktop/src/renderer/modules/schedule/presentation/
├── components/
│   ├── cards/
│   │   ├── ScheduleCard.tsx
│   │   └── index.ts
│   ├── dialogs/
│   │   ├── CreateScheduleDialog.tsx
│   │   ├── ScheduleTaskDetailDialog.tsx
│   │   └── index.ts
│   ├── WeekViewCalendar.tsx
│   ├── ScheduleEventList.tsx
│   ├── ConflictAlert.tsx
│   └── index.ts
├── hooks/
│   ├── useSchedule.ts
│   └── index.ts
├── stores/
│   └── scheduleStore.ts
├── views/
│   ├── ScheduleWeekView.tsx
│   └── index.ts
└── index.ts
```

### 周历组件实现要点

```tsx
// WeekViewCalendar.tsx 核心结构
interface WeekViewCalendarProps {
  currentWeek: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onEventDrag?: (event: ScheduleEvent, newStart: Date) => void;
}

function WeekViewCalendar({ currentWeek, events, ... }: WeekViewCalendarProps) {
  // 生成 7 天的日期数组
  const weekDays = getWeekDays(currentWeek);
  
  // 24 小时时间轴
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="grid grid-cols-8">
      {/* 时间轴列 */}
      <div className="col-span-1">
        {hours.map(hour => (
          <div key={hour} className="h-12 border-b">
            {formatHour(hour)}
          </div>
        ))}
      </div>
      
      {/* 7 天的列 */}
      {weekDays.map(day => (
        <DayColumn 
          key={day.toISOString()} 
          date={day} 
          events={getEventsForDay(events, day)} 
        />
      ))}
    </div>
  );
}
```

### 时间冲突检测

```typescript
// useSchedule.ts
function checkConflicts(newEvent: ScheduleEvent, existingEvents: ScheduleEvent[]) {
  return existingEvents.filter(existing => {
    const newStart = new Date(newEvent.startTime);
    const newEnd = new Date(newEvent.endTime);
    const existingStart = new Date(existing.startTime);
    const existingEnd = new Date(existing.endTime);
    
    // 检查时间重叠
    return newStart < existingEnd && newEnd > existingStart;
  });
}
```

### 依赖关系

- **前置依赖**: Story 11.0 (基础设施) 必须完成
- **可选依赖**: date-fns (日期处理)、@dnd-kit/core (拖拽)

### References

- [EPIC-011: Desktop Renderer 完整 React + shadcn/ui + Zustand 迁移](./EPIC-011-DESKTOP-RENDERER-REACT-MIGRATION.md)
- [Web Schedule 模块](../../../apps/web/src/modules/schedule/)
- [Schedule DTO 定义](../../../packages/contracts/src/modules/schedule/)

## Estimated Effort

| Task | 预估工时 |
|------|---------|
| Schedule 核心组件 | 8.5h |
| Schedule Dialogs | 4.5h |
| Schedule Hooks & Store | 3.5h |
| Schedule Views | 3h |
| **总计** | **19.5h** |

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

