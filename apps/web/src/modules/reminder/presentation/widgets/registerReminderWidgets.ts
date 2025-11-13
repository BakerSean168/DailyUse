/**
 * Reminder 模块 Widget 注册
 * 
 * 职责：
 * - 注册 Reminder 模块的所有 Dashboard Widgets
 * - 由 ReminderInitializationManager 在模块初始化时调用
 */

import { widgetRegistry } from '@/modules/dashboard/infrastructure/WidgetRegistry';
import { defineAsyncComponent } from 'vue';
import { DashboardContracts } from '@dailyuse/contracts';

/**
 * 注册 Reminder 模块的所有 Widgets
 */
export function registerReminderWidgets(): void {
  console.log('[Reminder] Registering Reminder widgets...');

  // Reminder 统计 Widget
  widgetRegistry.registerWidget({
    id: 'reminder-stats',
    name: '提醒统计',
    description: '展示提醒总览统计数据',
    component: defineAsyncComponent(() => import('./ReminderStatsWidget.vue')),
    defaultVisible: true,
    defaultOrder: 3,
    defaultSize: DashboardContracts.WidgetSize.SMALL,
    icon: 'i-heroicons-bell',
    category: 'reminder',
  });

  console.log('[Reminder] Reminder widgets registered successfully');
}
