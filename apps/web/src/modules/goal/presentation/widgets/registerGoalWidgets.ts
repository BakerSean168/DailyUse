/**
 * Goal 模块 Widget 注册
 * 
 * 职责：
 * - 注册 Goal 模块的所有 Dashboard Widgets
 * - 由 GoalInitializationManager 在模块初始化时调用
 */

import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { defineAsyncComponent } from 'vue';
import { DashboardContracts } from '@dailyuse/contracts';

/**
 * 注册 Goal 模块的所有 Widgets
 */
export function registerGoalWidgets(): void {
  console.log('[Goal] Registering Goal widgets...');

  // Goal 统计 Widget
  widgetRegistry.registerWidget({
    id: 'goal-stats',
    name: '目标统计',
    description: '展示目标总览统计数据',
    component: defineAsyncComponent(() => import('./GoalStatsWidget.vue')),
    defaultVisible: true,
    defaultOrder: 1,
    defaultSize: DashboardContracts.WidgetSize.MEDIUM,
    icon: 'i-heroicons-flag',
    category: 'goal',
  });

  // Goal 时间线 Widget
  widgetRegistry.registerWidget({
    id: 'goal-timeline',
    name: '目标时间线',
    description: '展示目标的时间线视图',
    component: defineAsyncComponent(() => import('./GoalTimelineWidget.vue')),
    defaultVisible: true,
    defaultOrder: 5,
    defaultSize: DashboardContracts.WidgetSize.LARGE,
    icon: 'i-heroicons-calendar',
    category: 'goal',
  });

  console.log('[Goal] Goal widgets registered successfully');
}
