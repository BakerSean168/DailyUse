/**
 * Schedule 模块 Widget 注册
 * 
 * 职责：
 * - 注册 Schedule 模块的所有 Dashboard Widgets
 * - 由 ScheduleInitializationManager 在模块初始化时调用
 */

import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { defineAsyncComponent } from 'vue';
import type { WidgetConfig, WidgetType } from '@dailyuse/contracts/dashboard';

/**
 * 注册 Schedule 模块的所有 Widgets
 */
export function registerScheduleWidgets(): void {
  console.log('[Schedule] Registering Schedule widgets...');

  // Schedule 统计 Widget
  widgetRegistry.registerWidget({
    id: 'schedule-stats',
    name: '日程统计',
    description: '展示日程任务统计数据',
    component: defineAsyncComponent(() => import('./ScheduleStatsWidget.vue')),
    defaultVisible: true,
    defaultOrder: 4,
    defaultSize: WidgetSize.SMALL,
    icon: 'i-heroicons-calendar-days',
    category: 'schedule',
  });

  console.log('[Schedule] Schedule widgets registered successfully');
}

