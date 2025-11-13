import { widgetRegistry } from './WidgetRegistry';
import type { WidgetMetadata } from './types/WidgetMetadata';
import { WidgetSize } from '@dailyuse/contracts';
import { defineAsyncComponent } from 'vue';

// Widget 组件懒加载 (按需导入) - 使用 defineAsyncComponent 包装
const TaskStatsWidget = defineAsyncComponent(
  () => import('../presentation/components/TaskStatsWidget.vue'),
);
const GoalStatsWidget = defineAsyncComponent(
  () => import('../presentation/components/GoalStatsWidget.vue'),
);
const ReminderStatsWidget = defineAsyncComponent(
  () => import('../presentation/components/ReminderStatsWidget.vue'),
);
const ScheduleStatsWidget = defineAsyncComponent(
  () => import('../presentation/components/ScheduleStatsWidget.vue'),
);
const TodayTasksWidget = defineAsyncComponent(
  () => import('@/modules/task/presentation/components/widgets/TodayTasksWidget.vue'),
);
const GoalTimelineWidget = defineAsyncComponent(
  () => import('@/modules/goal/presentation/components/widgets/GoalTimelineWidget.vue'),
);

/**
 * 注册所有 Dashboard Widgets
 *
 * 此函数应在应用启动时调用一次
 * 建议在 main.ts 或 App.vue 的 setup 中调用
 *
 * 注册顺序：
 * 1. TaskStatsWidget (任务统计)
 * 2. GoalStatsWidget (目标统计)
 * 3. ReminderStatsWidget (提醒统计)
 * 4. ScheduleStatsWidget (日程统计)
 *
 * @example
 * ```typescript
 * // main.ts
 * import { registerDashboardWidgets } from '@/modules/dashboard/infrastructure/registerWidgets';
 *
 * registerDashboardWidgets();
 * ```
 */
export function registerDashboardWidgets(): void {
  console.log('[Dashboard] Registering widgets...');

  // TASK-2.2.1 - 任务统计 Widget ✅
  widgetRegistry.registerWidget({
    id: 'task-stats',
    name: '任务统计',
    description: '显示待办任务、进行中任务和已完成任务的统计信息',
    component: TaskStatsWidget,
    defaultVisible: true,
    defaultOrder: 1,
    defaultSize: WidgetSize.MEDIUM,
    icon: 'i-heroicons-clipboard-document-check',
    category: 'statistics',
  } as WidgetMetadata);

  // TASK-2.2.2 - 目标统计 Widget ✅
  widgetRegistry.registerWidget({
    id: 'goal-stats',
    name: '目标统计',
    description: '显示进行中目标和已完成目标的统计信息',
    component: GoalStatsWidget,
    defaultVisible: true,
    defaultOrder: 2,
    defaultSize: WidgetSize.MEDIUM,
    icon: 'i-heroicons-trophy',
    category: 'statistics',
  } as WidgetMetadata);

  // TASK-2.2.3 - 提醒统计 Widget ✅
  widgetRegistry.registerWidget({
    id: 'reminder-stats',
    name: '提醒统计',
    description: '显示今日提醒和未读提醒的统计信息',
    component: ReminderStatsWidget,
    defaultVisible: true,
    defaultOrder: 3,
    defaultSize: WidgetSize.SMALL,
    icon: 'i-heroicons-bell',
    category: 'statistics',
  } as WidgetMetadata);

  // TASK-2.2.4 - 日程统计 Widget ✅
  widgetRegistry.registerWidget({
    id: 'schedule-stats',
    name: '日程统计',
    description: '显示今日日程和本周日程的统计信息',
    component: ScheduleStatsWidget,
    defaultVisible: true,
    defaultOrder: 4,
    defaultSize: WidgetSize.SMALL,
    icon: 'i-heroicons-calendar',
    category: 'statistics',
  } as WidgetMetadata);

  // 今日待办 Widget ✅
  widgetRegistry.registerWidget({
    id: 'today-tasks',
    name: '今日待办',
    description: '显示今天需要完成的任务',
    component: TodayTasksWidget,
    defaultVisible: true,
    defaultOrder: 5,
    defaultSize: WidgetSize.MEDIUM,
    icon: 'i-heroicons-clipboard-document-list',
    category: 'tasks',
  } as WidgetMetadata);

  // 目标进度 Widget ✅
  widgetRegistry.registerWidget({
    id: 'goal-timeline',
    name: '目标进度',
    description: '显示目标的时间进度和完成情况',
    component: GoalTimelineWidget,
    defaultVisible: true,
    defaultOrder: 6,
    defaultSize: WidgetSize.LARGE,
    icon: 'i-heroicons-chart-bar',
    category: 'goals',
  } as WidgetMetadata);

  console.log(`[Dashboard] ${widgetRegistry.count} widget(s) registered successfully`);
} /**
 * 动态注册单个 Widget (高级用法)
 *
 * 用于运行时动态添加 Widget，例如插件系统
 *
 * @param metadata Widget 元数据
 * @returns 是否注册成功
 *
 * @example
 * ```typescript
 * const success = registerCustomWidget({
 *   id: 'custom-widget',
 *   name: '自定义 Widget',
 *   component: CustomWidget,
 *   defaultVisible: false,
 *   defaultOrder: 100,
 *   defaultSize: 'large'
 * });
 * ```
 */
export function registerCustomWidget(metadata: WidgetMetadata): boolean {
  try {
    widgetRegistry.registerWidget(metadata);
    return true;
  } catch (error) {
    console.error('[Dashboard] Failed to register custom widget:', error);
    return false;
  }
}
